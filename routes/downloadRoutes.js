const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

/**
 * GET /api/orders/:orderId/persons/:personIndex/permit
 * Returns the permitId for a specific person in a paid order.
 * Frontend then navigates to /print/:permitId to generate the PDF.
 *
 * Security: Only works if order.paymentStatus === 'PAID' and person PDF is READY.
 */
router.get("/:orderId/persons/:personIndex/permit", async (req, res) => {
  try {
    const { orderId, personIndex } = req.params;
    const idx = parseInt(personIndex, 10);

    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ── Security checks ────────────────────────────────────────────────────
    if (order.paymentStatus !== "PAID") {
      return res.status(403).json({
        error: "Access denied — payment not verified",
        paymentStatus: order.paymentStatus,
      });
    }

    if (isNaN(idx) || idx < 0 || idx >= order.persons.length) {
      return res.status(400).json({ error: "Invalid person index" });
    }

    const person = order.persons[idx];
    if (person.pdfStatus !== "READY" || !person.permitId) {
      return res.status(202).json({
        message: "PDF is not ready yet",
        pdfStatus: person.pdfStatus,
      });
    }

    // Return permit ID — frontend opens /print/:permitId
    res.json({
      orderId,
      personNumber: person.personNumber,
      permitId: person.permitId.toString(),
      printUrl: `/print/${person.permitId.toString()}`,
    });
  } catch (err) {
    console.error("[Download] Person permit error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/:orderId/download-all
 * Returns all permit IDs for a paid order.
 * Frontend opens each /print/:permitId for batch download.
 *
 * Also supports ?format=zip to attempt server-side ZIP generation if
 * server-side PDFs are available (future feature placeholder).
 */
router.get("/:orderId/download-all", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentStatus !== "PAID") {
      return res.status(403).json({
        error: "Access denied — payment not verified",
        paymentStatus: order.paymentStatus,
      });
    }

    const permits = order.persons.map((p, i) => ({
      personNumber: p.personNumber,
      name: (p.formData?.laborerNameEn || `Person ${i + 1}`).toUpperCase(),
      pdfStatus: p.pdfStatus,
      permitId: p.permitId ? p.permitId.toString() : null,
      printUrl: p.permitId ? `/print/${p.permitId.toString()}` : null,
    }));

    const allReady = permits.every((p) => p.pdfStatus === "READY");

    res.json({
      orderId,
      numberOfPersons: order.numberOfPersons,
      allReady,
      permits,
    });
  } catch (err) {
    console.error("[Download] Download-all error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
