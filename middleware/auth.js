const User = require("../models/User");

async function requireAuth(req, res, next) {
  // Auth disabled — all requests pass through
  req.user = { username: "admin" };
  next();
}

module.exports = { requireAuth };
