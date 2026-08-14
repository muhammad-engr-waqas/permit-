const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Order = require("../models/Order");
const { calculateOrderAmount } = require("../services/payment/paymentService");

// Required permit fields for validation
const REQUIRED_FIELDS = [
  "laborerNameEn",
  "occupationEn",
  "nationalityEn",
  "idNumber",
  "providerNameAr",
  "providerEstablishmentNumber",
  "beneficiaryNameAr",
  "beneficiaryEstablishmentNumber",
  "permitStartDate",
  "permitEndDate",
];

/**
 * Generate a human-readable Order ID.
 * Format: ORD-YYYYMMDD-XXXXX
 */
function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = uuidv4().split("-")[0].toUpperCase().slice(0, 6);
  return `ORD-${date}-${random}`;
}

/**
 * POST /api/orders
 * Creates a new order with one or more persons.
 * Backend calculates the total amount — never trusts frontend amount.
 *
 * Body: {
 *   persons: [{ personNumber, formData }],
 *   customerEmail?: string,
 *   customerPhone?: string
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { persons, customerEmail, customerPhone } = req.body;

    // ── Validate persons array ──────────────────────────────────────────────
    if (!Array.isArray(persons) || persons.length === 0) {
      return res.status(400).json({ error: "At least one person is required" });
    }
    if (persons.length > 100) {
      return res.status(400).json({ error: "Maximum 100 persons per order" });
    }

    // ── Validate each person's form data ────────────────────────────────────
    const personErrors = [];
    const idNumbers = new Set();

    for (let i = 0; i < persons.length; i++) {
      const { formData } = persons[i];
      if (!formData || typeof formData !== "object") {
        personErrors.push(`Person ${i + 1}: missing formData`);
        continue;
      }

      const missing = REQUIRED_FIELDS.filter(
        (f) => !formData[f] || formData[f].toString().trim() === ""
      );
      if (missing.length > 0) {
        personErrors.push(`Person ${i + 1}: missing fields: ${missing.join(", ")}`);
      }

      // Check for duplicate ID numbers within the same order
      const idNum = formData.idNumber ? formData.idNumber.trim() : "";
      if (idNum) {
        if (idNumbers.has(idNum)) {
          personErrors.push(`Person ${i + 1}: duplicate ID number ${idNum} in this order`);
        } else {
          idNumbers.add(idNum);
        }
      }
    }

    if (personErrors.length > 0) {
      return res.status(400).json({ errors: personErrors, error: personErrors.join("; ") });
    }

    // ── Backend price calculation ────────────────────────────────────────────
    const { totalAmount, pricePerPerson, currency } = calculateOrderAmount(persons.length);

    // ── Build order document ────────────────────────────────────────────────
    const orderId = generateOrderId();
    const orderPersons = persons.map((p, i) => ({
      personNumber: i + 1,
      formData: p.formData,
      permitId: null,
      pdfStatus: "LOCKED",
    }));

    const order = await Order.create({
      orderId,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      persons: orderPersons,
      numberOfPersons: persons.length,
      pricePerPerson,
      totalAmount,
      currency,
      paymentGateway: (process.env.PAYMENT_GATEWAY || "UBL").toUpperCase(),
      paymentStatus: "PENDING",
      pdfStatus: "LOCKED",
    });

    console.log(`[Order] Created: ${orderId}, ${persons.length} persons, ${totalAmount} ${currency}`);

    res.status(201).json({
      success: true,
      orderId: order.orderId,
      numberOfPersons: order.numberOfPersons,
      pricePerPerson: order.pricePerPerson,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    console.error("[Order] Create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/:orderId
 * Returns order status, payment status, and PDF download availability.
 */
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Build safe response (exclude internal details, keep download links)
    const personsOut = order.persons.map((p, i) => ({
      personNumber: p.personNumber,
      pdfStatus: p.pdfStatus,
      permitId: p.permitId ? p.permitId.toString() : null,
      name: p.formData?.laborerNameEn || `Person ${i + 1}`,
    }));

    res.json({
      orderId: order.orderId,
      numberOfPersons: order.numberOfPersons,
      pricePerPerson: order.pricePerPerson,
      totalAmount: order.totalAmount,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      pdfStatus: order.pdfStatus,
      persons: personsOut,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error("[Order] Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
