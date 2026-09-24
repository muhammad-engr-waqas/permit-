const User = require("../models/User");

async function requireAuth(req, res, next) {
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
      return res.status(401).json({
        error: "غير مصرح / Unauthorized. Please log in first.",
      });
    }

    const user = await User.findOne({
      token,
      tokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({
        error: "الجلسة منتهية / Session expired or invalid. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[AUTH] Middleware error:", err);
    return res.status(500).json({ error: "Authentication error" });
  }
}

module.exports = { requireAuth };
