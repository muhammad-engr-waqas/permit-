require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// ── Existing routes ──────────────────────────────────────────────────────────
const permitRoutes = require("./routes/permitRoutes");
const Permit = require("./models/Permit");

// ── New routes ───────────────────────────────────────────────────────────────
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const downloadRoutes = require("./routes/downloadRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// ── Existing API ─────────────────────────────────────────────────────────────
app.use("/api/permits", permitRoutes);

// ── New API ───────────────────────────────────────────────────────────────────
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
// Download routes are mounted under /api/orders (shares path prefix)
app.use("/api/orders", downloadRoutes);

// ── Existing page routes (unchanged) ─────────────────────────────────────────

// Print page — serves print.html which uses html2pdf.js client-side
app.get("/print/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).lean();
    if (!permit) return res.status(404).send("<h2>Permit not found</h2>");
    res.sendFile(path.join(__dirname, "public", "print.html"));
  } catch (err) {
    res.status(400).send("<h2>Invalid permit link</h2>");
  }
});

// Verify page — opened when QR code is scanned
app.get("/verify/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).lean();
    if (!permit) {
      return res.status(404).send("<h2>Permit not found / التصريح غير موجود</h2>");
    }
    res.sendFile(path.join(__dirname, "public", "verify.html"));
  } catch (err) {
    res.status(400).send("<h2>Invalid permit link</h2>");
  }
});

// ── New page routes ───────────────────────────────────────────────────────────

// Payment processing page
app.get("/payment-processing.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment-processing.html"));
});

// Payment success page
app.get("/payment-success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment-success.html"));
});

// Payment checkout page (Card details form)
app.get("/payment-checkout.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment-checkout.html"));
});

// Payment failed page
app.get("/payment-failed.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment-failed.html"));
});

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
