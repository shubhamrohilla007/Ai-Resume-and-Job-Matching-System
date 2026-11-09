const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        // User Reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Uploaded File Details
        originalName: {
            type: String,
            required: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        filePath: {
            type: String,
            default: "",
        },

        fileType: {
            type: String,
            required: true,
        },

        fileSize: {
            type: Number,
            required: true,
        },

        // Cloud Storage (Cloudinary) Metadata
        storageProvider: {
            type: String,
            enum: ["local", "cloudinary"],
            default: "local",
        },

        cloudinaryAssetId: {
            type: String,
            default: null,
        },

        cloudinaryPublicId: {
            type: String,
            default: null,
            index: true,
        },

        resourceType: {
            type: String,
            default: "raw",
        },

        fileFormat: {
            type: String,
            default: null,
        },

        secureUrl: {
            type: String,
            default: "",
        },

        // Parsed Resume Text
        parsedText: {
            type: String,
            default: "",
        },

        // Associated editable ResumeBuilder document
        resumeBuilderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ResumeBuilder",
            default: null,
        },

        // Structured extracted data mapped from the uploaded document
        extractedData: {
            personal: {
                fullName: { type: String, default: "" },
                email: { type: String, default: "" },
                phone: { type: String, default: "" },
                location: { type: String, default: "" },
                linkedin: { type: String, default: "" },
                github: { type: String, default: "" },
                portfolioUrl: { type: String, default: "" },
            },
            targetRole: { type: String, default: "" },
            summary: { type: String, default: "" },
            skills: [{ type: String }],
            experience: [
                {
                    company: { type: String, default: "" },
                    role: { type: String, default: "" },
                    duration: { type: String, default: "" },
                    description: { type: String, default: "" },
                },
            ],
            projects: [
                {
                    name: { type: String, default: "" },
                    technologies: { type: String, default: "" },
                    description: { type: String, default: "" },
                    link: { type: String, default: "" },
                },
            ],
            education: [
                {
                    degree: { type: String, default: "" },
                    college: { type: String, default: "" },
                    year: { type: String, default: "" },
                    cgpa: { type: String, default: "" },
                },
            ],
            certifications: [
                {
                    name: { type: String, default: "" },
                    issuer: { type: String, default: "" },
                    year: { type: String, default: "" },
                },
            ],
            customSections: [
                {
                    title: { type: String, default: "" },
                    content: { type: String, default: "" },
                    items: [{ type: String }],
                },
            ],
        },

        // =========================
        // AI Analysis
        // =========================

        atsScore: {
            type: Number,
            default: 0,
        },

        aiFeedback: {
            type: String,
            default: "",
        },

        extractedSkills: {
            type: [String],
            default: [],
        },

        missingSkills: {
            type: [String],
            default: [],
        },

        recommendedJobs: {
            type: [String],
            default: [],
        },

        strengths: {
            type: [String],
            default: [],
        },

        weaknesses: {
            type: [String],
            default: [],
        },

        summary: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Resume", resumeSchema);
