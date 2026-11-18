const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        userName: {
            type: String,
            required: true,
            trim: true,
        },

        userEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        userRole: {
            type: String,
            enum: ["job_seeker", "recruiter"],
            required: true,
            index: true,
        },

        category: {
            type: String,
            enum: ["bug", "feature_request", "job_quality", "ui_ux", "general"],
            default: "general",
            index: true,
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved"],
            default: "pending",
            index: true,
        },

        adminNote: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
