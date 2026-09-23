const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "اسم المستخدم وكلمة المرور مطلوبة / Username and password are required",
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({
        success: false,
        error: "بيانات الدخول غير صحيحة / Invalid username or password",
      });
    }

    const token = user.generateToken();
    await user.save();

    return res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح / Logged in successfully",
      token,
      username: user.username,
    });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    return res.status(500).json({
      success: false,
      error: "حدث خطأ في الخادم / Server error during login",
    });
  }
});

/**
 * GET /api/auth/check
 * Header: Authorization: Bearer <token>
 */
router.get("/check", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"].trim();
    } else if (req.query.token) {
      token = req.query.token.toString().trim();
    }

    if (!token) {
      return res.json({ authenticated: false });
    }

    const user = await User.findOne({
      token,
      tokenExpires: { $gt: new Date() },
    }).lean();

    if (!user) {
      return res.json({ authenticated: false });
    }

    return res.json({
      authenticated: true,
      username: user.username,
    });
  } catch (err) {
    console.error("[AUTH] Check error:", err);
    return res.json({ authenticated: false });
  }
});

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"].trim();
    }

    if (token) {
      await User.updateOne({ token }, { $set: { token: null, tokenExpires: null } });
    }

    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("[AUTH] Logout error:", err);
    return res.json({ success: true });
  }
});

module.exports = router;
