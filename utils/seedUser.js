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
      // If user exists, update password if ADMIN_RESET_PASSWORD=true or if it doesn't match the current ADMIN_PASSWORD
      if (process.env.ADMIN_RESET_PASSWORD === "true" || !user.validatePassword(adminPassword)) {
        user.setPassword(adminPassword);
        await user.save();
        console.log(`[AUTH] Admin password updated successfully for: "${adminUsername}"`);
      }
    }
  } catch (err) {
    console.error("[AUTH] Error seeding admin user:", err.message);
  }
}

module.exports = { seedAdminUser };
