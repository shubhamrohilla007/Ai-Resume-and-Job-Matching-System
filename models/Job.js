const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        requiredSkills: {
            type: [String],
            default: [],
        },

        preferredSkills: {
            type: [String],
            default: [],
        },

        experienceLevel: {
            type: String,
            enum: [
                "Fresher",
                "Entry Level",
                "Mid Level",
                "Senior Level",
            ],
            default: "Fresher",
        },

        location: {
            type: String,
            default: "Remote",
            trim: true,
        },

        jobType: {
            type: String,
            enum: [
                "Full-time",
                "Part-time",
                "Internship",
                "Contract",
            ],
            default: "Full-time",
        },

        salary: {
            type: String,
            default: "Not specified",
        },

        applicationUrl: {
            type: String,
            default: "",
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // ==========================================
        // TrustBridge Job Trust Assessment Fields
        // (Kept completely independent from candidate match score)
        // ==========================================
        trustScore: {
            type: Number,
            default: null,
        },

        trustStatus: {
            type: String,
            enum: ["approved", "needs-review", "blocked"],
            default: "approved",
        },

        trustStatusLabel: {
            type: String,
            default: "No major warning signals detected",
        },

        trustSignals: {
            type: [String],
            default: [],
        },

        completenessScore: {
            type: Number,
            default: 100,
        },

        auditedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Job", jobSchema);
