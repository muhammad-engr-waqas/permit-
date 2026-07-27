const express = require("express");
const router = express.Router();
const Permit = require("../models/Permit");
const { generatePermitPdf } = require("../utils/pdfGenerator");

/**
 * POST /api/permits
 * Body: form fields (see models/Permit.js)
 * Saves the record to MongoDB, generates the PDF, and streams it back
 * as a download (so the browser form can save/open it immediately).
 */
router.post("/", async (req, res) => {
  try {
    const permit = await Permit.create(req.body);
    const pdfBuffer = await generatePermitPdf(permit.toObject());

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="permit-${permit._id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/permits/:id
 * Returns the raw permit data as JSON (used by the /verify/:id page).
 */
router.get("/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) return res.status(404).json({ error: "Permit not found" });
    res.json(permit);
  } catch (err) {
    res.status(400).json({ error: "Invalid permit ID" });
  }
});

/**
 * GET /api/permits/:id/pdf
 * Re-downloads the PDF for an existing permit (without creating a new record).
 */
router.get("/:id/pdf", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) return res.status(404).json({ error: "Permit not found" });

    const pdfBuffer = await generatePermitPdf(permit.toObject());
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="permit-${permit._id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
