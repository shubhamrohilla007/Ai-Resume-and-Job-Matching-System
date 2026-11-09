const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema(
{
    fullName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    role: {
        type: String,
        enum: ["job_seeker", "recruiter", "admin"],
        default: "job_seeker",
    },

    // Administrative account status (active/suspended)
    isActive: {
        type: Boolean,
        default: true,
    },

    // Google OAuth 2.0 Identifier
    googleId: {
        type: String,
        default: null,
        sparse: true,
        index: true,
    },

    // User Avatar URL (from Google profile or uploaded)
    avatarUrl: {
        type: String,
        default: "",
    },

    // Registration / Authentication source
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },

    // Cryptographic hash of the password reset token (SHA-256)
    passwordResetTokenHash: {
        type: String,
        default: null,
        index: true,
    },

    // Token expiration timestamp (15 minutes from issue)
    passwordResetExpires: {
        type: Date,
        default: null,
    },

    // Single-use enforcement flag
    passwordResetUsed: {
        type: Boolean,
        default: false,
    },
},
{
    timestamps: true,
}
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
