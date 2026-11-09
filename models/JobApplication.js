const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
            index: true,
        },

        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            default: "",
            trim: true,
        },

        location: {
            type: String,
            default: "",
            trim: true,
        },

        skills: {
            type: [String],
            default: [],
        },

        coverNote: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: ["applied", "reviewed", "shortlisted", "rejected"],
            default: "applied",
            index: true,
        },

        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate applications from the same user to the same job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
