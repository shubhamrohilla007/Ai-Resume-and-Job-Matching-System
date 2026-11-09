
const ResumeBuilder = require("../models/ResumeBuilder");

const {
    improveResumeText,
} = require("../services/ai/geminiService");

const ALLOWED_SECTIONS = ["summary", "experience", "project"];

module.exports.improveSection = async (req, res) => {
    try {
        const { section, text, technologies = "" } = req.body;

        if (!ALLOWED_SECTIONS.includes(section)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume section.",
            });
        }

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter text to improve.",
            });
        }

        if (text.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Text must not exceed 5,000 characters.",
            });
        }

        if (
            typeof technologies !== "string" ||
            technologies.length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid technologies field.",
            });
        }

        const resume = await ResumeBuilder.findOne({
            user: req.user._id,
        }).select("skills");

        const improvedText = await improveResumeText({
            section,
            text: text.trim(),
            skills: resume?.skills || [],
            technologies,
        });

        return res.json({
            success: true,
            improvedText,
        });
    } catch (err) {
        console.error("Resume AI improvement error:", err);

        return res.status(500).json({
            success: false,
            message:
                "Unable to improve this text right now. Please try again.",
        });
    }
};
