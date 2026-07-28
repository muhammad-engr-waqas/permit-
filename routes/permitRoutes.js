const express = require("express");
const router  = express.Router();
const Permit  = require("../models/Permit");

/**
 * POST /api/permits
 * Saves permit to MongoDB, returns { id }
 */
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/permits - body:", JSON.stringify(req.body));

    // Validate required fields manually and return clear errors
    const required = [
      "laborerNameEn", "occupationEn", "nationalityEn", "idNumber",
      "providerNameEn", "providerEstablishmentNumber",
      "beneficiaryNameEn", "beneficiaryEstablishmentNumber",
      "permitStartDate", "permitEndDate"
    ];

    const missing = required.filter(f => !req.body[f] || req.body[f].toString().trim() === "");
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    const permit = await Permit.create(req.body);
    console.log("Permit created:", permit._id);
    res.json({ id: permit._id });

  } catch (err) {
    console.error("Create permit error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/permits/:id
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

module.exports = router;
