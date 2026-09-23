const User = require("../models/User");

/**
 * Seeds the default single user account if not already present.
 */
async function seedAdminUser() {
  try {
    const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    let user = await User.findOne({ username: adminUsername });

    if (!user) {
      user = new User({ username: adminUsername });
      user.setPassword(adminPassword);
      await user.save();
      console.log(`[AUTH] Default admin user seeded successfully: "${adminUsername}"`);
    } else {
      // If user exists and ADMIN_RESET_PASSWORD is set, update password
      if (process.env.ADMIN_RESET_PASSWORD === "true") {
        user.setPassword(adminPassword);
        await user.save();
        console.log(`[AUTH] Admin password updated for: "${adminUsername}"`);
      }
    }
  } catch (err) {
    console.error("[AUTH] Error seeding admin user:", err.message);
  }
}

module.exports = { seedAdminUser };
