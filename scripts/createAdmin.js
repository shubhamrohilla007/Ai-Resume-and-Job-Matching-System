require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function createOrPromoteAdmin() {
    // Command line args or env vars or defaults
    const args = process.argv.slice(2);
    const email = (args[0] || process.env.ADMIN_EMAIL || "admin@resumesystem.com").trim().toLowerCase();
    const password = args[1] || process.env.ADMIN_PASSWORD || "AdminPassword123!";
    const fullName = args[2] || process.env.ADMIN_NAME || "System Administrator";

    try {
        console.log(" Connecting to MongoDB Atlas cloud database...");
        await connectDB();
        console.log(" Connected to MongoDB Atlas successfully.");

        let existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`ℹ️ User found with email: ${email}`);
            existingUser.role = "admin";
            existingUser.isActive = true;
            existingUser.fullName = fullName || existingUser.fullName;

            if (args[1] || process.env.ADMIN_PASSWORD) {
                // Update password if explicitly provided
                await existingUser.setPassword(password);
                console.log(" Password updated.");
            }

            await existingUser.save();
            console.log(` Successfully promoted "${existingUser.fullName}" (${existingUser.email}) to Admin!`);
        } else {
            console.log(` Creating new Administrator account for ${email}...`);
            const adminUser = new User({
                username: email,
                email: email,
                fullName: fullName,
                role: "admin",
                isActive: true,
                authProvider: "local",
            });

            await User.register(adminUser, password);
            console.log(` Admin account created successfully!`);
        }

        console.log("\n=======================================================");
        console.log("           ADMIN ACCOUNT CREDENTIALS");
        console.log("=======================================================");
        console.log(` Email:     ${email}`);
        console.log(` Password:  ${password}`);
        console.log(` Role:      admin`);
        console.log("-------------------------------------------------------");
        console.log(" HOW TO ACCESS THE ADMIN DASHBOARD:");
        console.log(" 1. Start backend: npm run dev (or npm start)");
        console.log(" 2. Open browser:  http://localhost:8080/login");
        console.log(" 3. Sign in with the credentials above.");
        console.log(" 4. You will be automatically redirected to: /admin");
        console.log("    (Or click 'Admin Panel' in the top navigation bar)");
        console.log("=======================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create/promote admin account:", err.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

createOrPromoteAdmin();
