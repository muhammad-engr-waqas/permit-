const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Permit = require("../models/Permit");
const PaymentTransaction = require("../models/PaymentTransaction");
const { getPaymentGateway, calculateOrderAmount } = require("../services/payment/paymentService");

// ── Helper: Create Permit documents for all persons in a paid order ──────────
async function createPermitsForOrder(order) {
  console.log(`[Payment] Creating permits for order ${order.orderId}, ${order.persons.length} persons`);
  const Permit = require("../models/Permit");

  // Generate a unique permit code
  async function generateUniqueCode() {
    let isUnique = false;
    let code;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
      code = "TW" + randomDigits;
      const existing = await Permit.findOne({ permitCode: code });
      if (!existing) isUnique = true;
      attempts++;
    }
    return code;
  }

  for (let i = 0; i < order.persons.length; i++) {
    const person = order.persons[i];
    if (person.pdfStatus === "READY" && person.permitId) {
      // Already created — idempotency
      console.log(`[Payment] Person ${i + 1} permit already exists, skipping.`);
      continue;
    }

    try {
      const formData = person.formData || {};

      // Check if permit for this ID already exists (from a previous duplicate order attempt)
      let existingPermit = null;
      if (formData.idNumber) {
        existingPermit = await Permit.findOne({ idNumber: formData.idNumber.trim() });
      }

      let permit;
      if (existingPermit) {
        console.log(`[Payment] Permit already exists for idNumber ${formData.idNumber}, reusing.`);
        permit = existingPermit;
      } else {
        const permitCode = await generateUniqueCode();
        permit = await Permit.create({ ...formData, permitCode });
        console.log(`[Payment] Permit created for Person ${i + 1}: ${permit._id}`);
      }

      order.persons[i].permitId = permit._id;
      order.persons[i].pdfStatus = "READY";
    } catch (err) {
      console.error(`[Payment] Failed to create permit for Person ${i + 1}:`, err.message);
      order.persons[i].pdfStatus = "FAILED";
    }
  }

  // Update order in DB with new permit IDs and statuses
  const allReady = order.persons.every((p) => p.pdfStatus === "READY");
  const anyFailed = order.persons.some((p) => p.pdfStatus === "FAILED");
  order.pdfStatus = allReady ? "READY" : anyFailed ? "FAILED" : "GENERATING";

  await Order.findOneAndUpdate(
    { orderId: order.orderId },
    {
      persons: order.persons,
      pdfStatus: order.pdfStatus,
    }
  );

  console.log(`[Payment] Permits done for order ${order.orderId}. PDF Status: ${order.pdfStatus}`);
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/create
 * Creates a payment session for an existing PENDING order.
 * Recalculates amount on backend to prevent price manipulation.
 */
router.post("/create", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If order is already paid, redirect to success page
    if (order.paymentStatus === "PAID") {
      return res.json({
        success: true,
        orderId,
        alreadyPaid: true,
        paymentUrl: `/payment-success.html?orderId=${orderId}`,
      });
    }

    // Only allow payment creation for PENDING, PROCESSING or FAILED orders
    if (!["PENDING", "PROCESSING", "FAILED"].includes(order.paymentStatus)) {
      return res.status(400).json({ error: `Order cannot be paid in status: ${order.paymentStatus}` });
    }

    // Backend price recalculation — never trust frontend
    const { totalAmount, currency } = calculateOrderAmount(order.numberOfPersons);
    if (Math.abs(totalAmount - order.totalAmount) > 0.01) {
      console.warn(`[Payment] Amount mismatch for ${orderId}: stored ${order.totalAmount}, recalculated ${totalAmount}`);
      order.totalAmount = totalAmount;
      order.currency = currency;
      await order.save();
    }

    // Mark order as PROCESSING
    order.paymentStatus = "PROCESSING";
    await order.save();

    const gateway = getPaymentGateway(order.paymentGateway);
    const { paymentUrl, sessionId } = await gateway.createPayment(order);

    // Store session ID for later verification
    order.gatewaySessionId = sessionId;
    await order.save();

    console.log(`[Payment] Session created for ${orderId}: ${sessionId}`);

    res.json({
      success: true,
      orderId,
      paymentUrl,
      amount: order.totalAmount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("[Payment] Create session error:", err.message);

    // Reset to PENDING on failure so user can retry
    if (req.body.orderId) {
      await Order.findOneAndUpdate(
        { orderId: req.body.orderId, paymentStatus: "PROCESSING" },
        { paymentStatus: "PENDING" }
      ).catch(() => {});
    }

    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/payments/status/:orderId
 * Poll payment and PDF status for an order.
 */
router.get("/status/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    const personsOut = order.persons.map((p, i) => ({
      personNumber: p.personNumber,
      name: p.formData?.laborerNameEn || `Person ${i + 1}`,
      pdfStatus: p.pdfStatus,
      permitId: p.permitId ? p.permitId.toString() : null,
    }));

    res.json({
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      pdfStatus: order.pdfStatus,
      numberOfPersons: order.numberOfPersons,
      totalAmount: order.totalAmount,
      currency: order.currency,
      persons: personsOut,
      paidAt: order.paidAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payments/ubl/callback
 * Server-to-server callback (webhook) from UBL after payment.
 * This endpoint MUST verify the payment server-side before marking as paid.
 * Always returns HTTP 200 to acknowledge receipt.
 */
router.post("/ubl/callback", async (req, res) => {
  const payload = req.body;
  console.log("[UBL Callback] Received:", JSON.stringify(payload));

  // Always acknowledge immediately to the gateway
  res.status(200).json({ received: true });

  // Process asynchronously to avoid timeout
  setImmediate(async () => {
    try {
      const gateway = getPaymentGateway("UBL");
      const callbackData = await gateway.handleCallback(payload);
      const { orderId, transactionId, status, amount, currency, raw } = callbackData;

      // Sanitize raw response — remove any card/sensitive fields before storing
      const sanitized = { ...raw };
      delete sanitized.cardNumber;
      delete sanitized.cvv;
      delete sanitized.pan;
      delete sanitized.expiryDate;

      // Record the transaction event (audit trail)
      await PaymentTransaction.create({
        orderId,
        gateway: "UBL",
        transactionId,
        amount,
        currency,
        status,
        gatewayResponse: sanitized,
        source: "callback",
      });

      const order = await Order.findOne({ orderId });
      if (!order) {
        console.error(`[UBL Callback] Order not found: ${orderId}`);
        return;
      }

      // ── Idempotency check ─────────────────────────────────────────────────
      if (order.paymentStatus === "PAID") {
        console.log(`[UBL Callback] Order ${orderId} already PAID — ignoring duplicate callback`);
        return;
      }

      if (status !== "SUCCESS") {
        order.paymentStatus = "FAILED";
        order.paymentTransactionId = transactionId;
        await order.save();
        console.log(`[UBL Callback] Payment FAILED for order ${orderId}`);
        return;
      }

      // ── Server-side verification ──────────────────────────────────────────
      const verification = await gateway.verifyPayment(transactionId, order);

      if (!verification.verified) {
        console.error(`[UBL Callback] Verification FAILED for order ${orderId} — amount/currency/status mismatch`);
        order.paymentStatus = "FAILED";
        await order.save();
        return;
      }

      // ── Additional checks ─────────────────────────────────────────────────
      if (Math.abs(verification.amount - order.totalAmount) > 0.01) {
        console.error(`[UBL Callback] Amount mismatch: paid ${verification.amount}, expected ${order.totalAmount}`);
        order.paymentStatus = "FAILED";
        await order.save();
        return;
      }

      // ── Mark as PAID ──────────────────────────────────────────────────────
      order.paymentStatus = "PAID";
      order.paymentTransactionId = transactionId;
      order.paidAt = new Date();
      order.pdfStatus = "GENERATING";
      await order.save();
      console.log(`[UBL Callback] Payment VERIFIED for order ${orderId}`);

      // ── Generate permits (PDFs) ────────────────────────────────────────────
      await createPermitsForOrder(order);
    } catch (err) {
      console.error("[UBL Callback] Processing error:", err.message);
    }
  });
});

/**
 * GET /api/payments/ubl/return
 * Browser return URL — customer lands here after completing/cancelling payment.
 * Does NOT mark order as paid — only redirects to appropriate page.
 */
router.get("/ubl/return", async (req, res) => {
  // UBL will append query params per their docs. Common params might include orderId, status, etc.
  // STUB: Adjust query param names to match real UBL return URL format from docs
  const orderId = req.query.orderId || req.query.order_id || req.query.OrderId;
  const status = req.query.status || req.query.Status || "";

  console.log(`[UBL Return] orderId: ${orderId}, status: ${status}`);

  if (!orderId) {
    return res.redirect("/payment/failed.html?error=missing_order");
  }

  try {
    const order = await Order.findOne({ orderId });
    if (!order) return res.redirect("/payment/failed.html?error=order_not_found");

    if (order.paymentStatus === "PAID") {
      return res.redirect(`/payment-success.html?orderId=${orderId}`);
    }

    // Payment may still be being verified (callback might arrive after return)
    // Show processing page which polls for status
    res.redirect(`/payment-success.html?orderId=${orderId}&waiting=true`);
  } catch (err) {
    console.error("[UBL Return] Error:", err.message);
    res.redirect(`/payment-failed.html?orderId=${orderId}&error=server_error`);
  }
});

/**
 * GET /api/payments/ubl/sandbox-redirect
 * SANDBOX ONLY — simulates UBL gateway completing payment.
 */
router.get("/ubl/sandbox-redirect", async (req, res) => {
  if (process.env.UBL_ENVIRONMENT !== "sandbox") {
    return res.status(403).json({ error: "Sandbox redirect is only available in sandbox mode" });
  }

  const { orderId, sessionId, amount } = req.query;
  console.log(`[UBL Sandbox] Simulating payment completion for ${orderId}`);

  try {
    const order = await Order.findOne({ orderId });
    if (!order) return res.redirect(`/payment-failed.html?orderId=${orderId}&error=order_not_found`);

    if (order.paymentStatus !== "PAID") {
      const transactionId = "SANDBOX-TXN-" + Date.now();

      // Record transaction
      await PaymentTransaction.create({
        orderId,
        gateway: "UBL",
        transactionId,
        amount: parseFloat(amount || order.totalAmount),
        currency: order.currency || "SAR",
        status: "SUCCESS",
        gatewayResponse: { sandbox: true, sessionId, orderId },
        source: "sandbox",
      });

      // Mark order PAID
      order.paymentStatus = "PAID";
      order.paymentTransactionId = transactionId;
      order.paidAt = new Date();
      order.pdfStatus = "GENERATING";
      await order.save();

      // Generate permits
      await createPermitsForOrder(order);
      console.log(`[UBL Sandbox] Order ${orderId} successfully marked PAID & permits generated`);
    }

    res.redirect(`/payment-success.html?orderId=${orderId}`);
  } catch (err) {
    console.error("[UBL Sandbox] Error processing sandbox payment:", err.message);
    res.redirect(`/payment-failed.html?orderId=${orderId}&error=server_error`);
  }
});

module.exports = router;
module.exports.createPermitsForOrder = createPermitsForOrder;
