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
      "providerNameAr", "providerEstablishmentNumber",
      "beneficiaryNameAr", "beneficiaryEstablishmentNumber",
      "permitStartDate", "permitEndDate"
    ];

    const missing = required.filter(f => !req.body[f] || req.body[f].toString().trim() === "");
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    // FIX 4: Duplicate idNumber (Iqama) check — reject if same ID already has an active permit
    const existingId = await Permit.findOne({ idNumber: req.body.idNumber.trim() });
    if (existingId) {
      return res.status(400).json({
        error: `تصريح موجود مسبقاً لهذا الرقم / A permit already exists for this ID number: ${req.body.idNumber}`
      });
    }

    const permitData = { ...req.body };

    // FIX 4: Generate a truly unique permitCode — loop until DB confirms no duplicate
    if (!permitData.permitCode || permitData.permitCode.trim() === "") {
      let isUnique = false;
      let candidateCode;
      let attempts = 0;
      while (!isUnique && attempts < 20) {
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
        candidateCode = "TW" + randomDigits;
        const existing = await Permit.findOne({ permitCode: candidateCode });
        if (!existing) isUnique = true;
        attempts++;
      }
      permitData.permitCode = candidateCode;
    } else {
      // If caller supplied a custom permitCode, verify it's not already used
      const existingCode = await Permit.findOne({ permitCode: permitData.permitCode.trim() });
      if (existingCode) {
        return res.status(400).json({
          error: `رقم التصريح مستخدم مسبقاً / Permit code already in use: ${permitData.permitCode}`
        });
      }
    }

    const permit = await Permit.create(permitData);
    console.log("Permit created:", permit._id, "permitCode:", permit.permitCode);
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
