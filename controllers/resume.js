const Resume = require("../models/Resume");
const fs = require("fs");
const path = require("path");

const extractResumeText = require("../services/parser/resumeParser");
const analyzeResume = require("../services/ai/geminiService");


// =========================
// Render Upload Page
// =========================

module.exports.renderUploadForm = (req, res) => {

    res.render("resume/upload");

};


// =========================
// Upload / Replace Resume
// =========================

module.exports.uploadResume = async (req, res) => {

    try {

        if (!req.file) {

            req.flash("error", "Please select a resume.");

            return res.redirect("/resume/upload");
        }


        // =========================
        // Extract Resume Text
        // =========================

        const parsedText = await extractResumeText(
            req.file.path,
            req.file.mimetype
        );


        // =========================
        // Analyze Resume using Gemini
        // =========================

        const aiResult = await analyzeResume(parsedText);


        // =========================
        // Check Existing Resume
        // =========================

        const existingResume = await Resume.findOne({
            user: req.user._id,
        });


        // =========================
        // Update Existing Resume
        // =========================

        if (existingResume) {

            // Delete old resume file
            if (
                existingResume.filePath &&
                fs.existsSync(existingResume.filePath)
            ) {

                fs.unlinkSync(existingResume.filePath);

            }


            // File Information
            existingResume.originalName = req.file.originalname;
            existingResume.fileName = req.file.filename;
            existingResume.filePath = req.file.path;
            existingResume.fileType = req.file.mimetype;
            existingResume.fileSize = req.file.size;


            // Parsed Resume Text
            existingResume.parsedText = parsedText;


            // AI Analysis
            existingResume.atsScore = aiResult.atsScore;
            existingResume.aiFeedback = aiResult.feedback;
            existingResume.summary = aiResult.summary;

            existingResume.extractedSkills =
                aiResult.skills || [];

            existingResume.missingSkills =
                aiResult.missingSkills || [];

            existingResume.recommendedJobs =
                aiResult.recommendedJobs || [];

            existingResume.strengths =
                aiResult.strengths || [];

            existingResume.weaknesses =
                aiResult.weaknesses || [];


            await existingResume.save();


            req.flash(
                "success",
                "Resume updated and analyzed successfully!"
            );

            return res.redirect("/dashboard/jobseeker");
        }


        // =========================
        // Create New Resume
        // =========================

        const resume = new Resume({

            user: req.user._id,

            originalName: req.file.originalname,

            fileName: req.file.filename,

            filePath: req.file.path,

            fileType: req.file.mimetype,

            fileSize: req.file.size,


            // Parsed Text
            parsedText: parsedText,


            // AI Analysis
            atsScore: aiResult.atsScore,

            aiFeedback: aiResult.feedback,

            summary: aiResult.summary,

            extractedSkills:
                aiResult.skills || [],

            missingSkills:
                aiResult.missingSkills || [],

            strengths:
                aiResult.strengths || [],

            weaknesses:
                aiResult.weaknesses || [],

            recommendedJobs:
                aiResult.recommendedJobs || [],

        });


        await resume.save();


        req.flash(
            "success",
            "Resume uploaded and analyzed successfully!"
        );


        res.redirect("/dashboard/jobseeker");

    }

    catch (err) {

        console.log(err);

        req.flash(
            "error",
            err.message
        );

        res.redirect("/resume/upload");

    }

};


// =========================
// Show Resume Analysis
// =========================

module.exports.showAnalysis = async (req, res) => {

    try {

        const resume = await Resume.findOne({
            user: req.user._id,
        });


        if (!resume) {

            req.flash(
                "error",
                "Please upload your resume first."
            );

            return res.redirect("/resume/upload");

        }


        res.render("resume/analysis", {
            resume,
        });

    }

    catch (err) {

        console.log(err);

        req.flash(
            "error",
            err.message
        );

        res.redirect("/dashboard/jobseeker");

    }

};


// =========================
// View Uploaded Resume
// =========================

module.exports.viewResume = async (req, res) => {

    try {

        const resume = await Resume.findOne({
            user: req.user._id,
        });


        if (!resume) {

            req.flash(
                "error",
                "No resume uploaded yet."
            );

            return res.redirect("/resume/upload");

        }


        res.render("resume/view", {
            resume,
        });

    }

    catch (err) {

        console.log(err);

        req.flash(
            "error",
            "Unable to load your resume."
        );

        res.redirect("/dashboard/jobseeker");

    }

};

// Render Resume Builder

module.exports.renderCreateResume = async (req, res) =>{
    try{
        res.render("resume/create");
    } catch(err){
        console.log(err);
        req.flash("error", "Unable to open resume builder.");
        req.redirect("/dashboard/jobseeker");
    }
};


const UPLOAD_DIR = path.resolve(
    __dirname,
    "../uploads/resumes"
);

// Serve only the logged-in user's own resume.
module.exports.serveResumeFile = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            user: req.user._id,
        });

        if (!resume || !resume.filePath) {
            req.flash("error", "No uploaded resume was found.");
            return res.redirect("/resume/upload");
        }

        const filePath = path.resolve(resume.filePath);
        const allowedPrefix = UPLOAD_DIR + path.sep;

        // Ensure the stored path points inside the resume folder.
        if (!filePath.startsWith(allowedPrefix)) {
            console.error("Blocked unexpected resume file path.");
            return res.status(403).send("Access denied.");
        }

        if (!fs.existsSync(filePath)) {
            req.flash("error", "The resume file could not be found.");
            return res.redirect("/resume/upload");
        }

        res.setHeader("Cache-Control", "private, no-store");

        return res.sendFile(filePath, (err) => {
            if (err && !res.headersSent) {
                console.error("Resume file serving error:", err);
                res.status(err.statusCode || 500).send(
                    "Unable to open the resume file."
                );
            }
        });
    } catch (err) {
        console.error("Resume file access error:", err);
        return res.status(500).send("Unable to open the resume file.");
    }
};

// Download only the logged-in user's own resume.
module.exports.downloadResumeFile = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            user: req.user._id,
        });

        if (!resume || !resume.filePath) {
            req.flash("error", "No uploaded resume was found.");
            return res.redirect("/resume/upload");
        }

        const filePath = path.resolve(resume.filePath);
        const allowedPrefix = UPLOAD_DIR + path.sep;

        if (!filePath.startsWith(allowedPrefix)) {
            return res.status(403).send("Access denied.");
        }

        if (!fs.existsSync(filePath)) {
            req.flash("error", "The resume file could not be found.");
            return res.redirect("/resume/upload");
        }

        res.setHeader("Cache-Control", "private, no-store");

        return res.download(
            filePath,
            path.basename(resume.originalName || resume.fileName),
            (err) => {
                if (err && !res.headersSent) {
                    console.error("Resume download error:", err);
                    res.status(err.statusCode || 500).send(
                        "Unable to download the resume."
                    );
                }
            }
        );
    } catch (err) {
        console.error("Resume download error:", err);
        return res.status(500).send("Unable to download the resume.");
    }
};
