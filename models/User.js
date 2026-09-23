const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    salt: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      default: null,
    },
    tokenExpires: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to set password
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
};

// Helper method to validate password
userSchema.methods.validatePassword = function (password) {
  if (!this.salt || !this.passwordHash) return false;
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
  return this.passwordHash === hash;
};

// Helper method to generate session token
userSchema.methods.generateToken = function () {
  this.token = crypto.randomBytes(32).toString("hex");
  // Token valid for 7 days
  this.tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  this.lastLogin = new Date();
  return this.token;
};

module.exports = mongoose.model("User", userSchema);
