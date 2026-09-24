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
const authRoutes = require("./routes/authRoutes");
const { seedAdminUser } = require("./utils/seedUser");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database Connection Helper (Serverless-optimized) ───────────────────────
let cachedPromise = null;
let seeded = false;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    if (!seeded) {
      seeded = true;
      seedAdminUser().catch((err) => console.error("[AUTH] Seed error:", err.message));
    }
    return;
  }

  if (!cachedPromise) {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string is missing. Please configure MONGO_URI (or MONGODB_URI) in your environment variables."
      );
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cachedPromise = mongoose.connect(mongoUri, opts);
  }

  try {
    await cachedPromise;
    if (!seeded) {
      seeded = true;
      seedAdminUser().catch((err) => console.error("[AUTH] Seed error:", err.message));
    }
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Ensure database is connected BEFORE handling API and page requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    if (req.path.startsWith("/api/")) {
      return res.status(500).json({
        error: "Database Connection Error",
        message: err.message,
        hint: "Please ensure MONGO_URI is properly configured in your Vercel Environment Variables and that MongoDB Atlas allows IP access (0.0.0.0/0)."
      });
    }
    return res.status(500).send(`<h2>500 - Database Connection Error</h2><p>${err.message}</p><p>Please ensure MONGO_URI is set in Vercel Environment Variables and Network Access allows 0.0.0.0/0.</p>`);
  }
});

// ── Auth API ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Existing API ─────────────────────────────────────────────────────────────
app.use("/api/permits", permitRoutes);

// ── New API ───────────────────────────────────────────────────────────────────
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
// Download routes are mounted under /api/orders (shares path prefix)
app.use("/api/orders", downloadRoutes);

// ── Existing page routes ─────────────────────────────────────────────────────

// Print page — injects BASE_URL so QR code works on any network/device
app.get("/print/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).lean();
    if (!permit) return res.status(404).send("<h2>Permit not found</h2>");

    const fs = require("fs");
    const printPath = path.join(__dirname, "public", "print.html");
    let html = fs.readFileSync(printPath, "utf8");

    // Replace window.location.origin with actual BASE_URL from env
    const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "") || ("http://localhost:" + (process.env.PORT || 3000));
    html = html.replace(
      'var verifyUrl   = window.location.origin + "/verify/" + permitId;',
      'var verifyUrl   = "' + baseUrl + '/verify/" + permitId;'
    );

    res.send(html);
  } catch (err) {
    res.status(400).send("<h2>Invalid permit link</h2>");
  }
});

// Verify page — opened when QR code is scanned, shows permit details
app.get("/verify/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).lean();
    if (!permit) return res.status(404).send("<h2>Permit not found</h2>");
    res.sendFile(path.join(__dirname, "public", "verify.html"));
  } catch (err) {
    res.status(400).send("<h2>Invalid permit link</h2>");
  }
});

// ── New page routes ───────────────────────────────────────────────────────────

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

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

// ── Start (Local vs Serverless) ───────────────────────────────────────────────
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to start local server:", err.message);
    });
}

module.exports = app;

