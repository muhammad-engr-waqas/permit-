const express = require("express");
const router  = express.Router();
const Permit  = require("../models/Permit");

/**
 * POST /api/permits
 * Saves permit to MongoDB, returns { id } — client opens /print/:id for PDF.
 */
router.post("/", async (req, res) => {
  try {
    const permit = await Permit.create(req.body);
    res.json({ id: permit._id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/permits/:id
 * Returns permit JSON (used by verify + print pages).
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
