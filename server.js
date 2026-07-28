require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const permitRoutes = require("./routes/permitRoutes");
const Permit = require("./models/Permit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the form + verify pages from /public
app.use(express.static(path.join(__dirname, "public")));

// API
app.use("/api/permits", permitRoutes);

// Print page — renders full permit HTML, auto-triggers browser print dialog
app.get("/print/:id", async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id).lean();
    if (!permit) return res.status(404).send("<h2>Permit not found</h2>");
    res.sendFile(path.join(__dirname, "public", "print.html"));
  } catch (err) {
    res.status(400).send("<h2>Invalid permit link</h2>");
  }
});

// The page that opens when the QR code is scanned.
// It shows the permit's own static HTML (server-rendered) so it works
// even without JavaScript on the visitor's phone.
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
