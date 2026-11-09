const mongoose = require("mongoose");

const resumeBuilderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Reference to uploaded ATS Resume document if created from an upload
        sourceResume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            default: null,
            index: true,
        },

        // Original file name if created from an uploaded document
        sourceOriginalName: {
            type: String,
            default: "",
        },

        templateId: {
            type: String,
            default: "ats-classic",
        },

        careerCategory: {
            type: String,
            default: "tech",
        },

        targetRole: {
            type: String,
            default: "",
        },

        pageMode: {
            type: String,
            enum: ["one-page", "multi-page"],
            default: "multi-page",
        },

        personal: {
            fullName: {
                type: String,
                default: "",
            },
            email: {
                type: String,
                default: "",
            },
            phone: {
                type: String,
                default: "",
            },
            location: {
                type: String,
                default: "",
            },
            linkedin: {
                type: String,
                default: "",
            },
            github: {
                type: String,
                default: "",
            },
            portfolioUrl: {
                type: String,
                default: "",
            },
            photoUrl: {
                type: String,
                default: "",
            },
            photoPublicId: {
                type: String,
                default: null,
            },
            photoStorageProvider: {
                type: String,
                enum: ["local", "cloudinary"],
                default: "local",
            },
        },

        summary: {
            type: String,
            default: "",
        },

        education: [
            {
                degree: String,
                college: String,
                year: String,
                cgpa: String,
            },
        ],

        skills: [
            {
                type: String,
            },
        ],

        experience: [
            {
                company: String,
                role: String,
                duration: String,
                description: String,
            },
        ],

        projects: [
            {
                name: String,
                technologies: String,
                description: String,
                link: String,
            },
        ],

        certifications: [
            {
                name: String,
                issuer: String,
                year: String,
            },
        ],

        customSections: [
            {
                title: String,
                content: String,
                items: [String],
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "ResumeBuilder",
    resumeBuilderSchema
);
