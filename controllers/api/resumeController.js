const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Resume = require("../../models/Resume");
const ResumeBuilder = require("../../models/ResumeBuilder");
const Job = require("../../models/Job");
const JobApplication = require("../../models/JobApplication");
const extractResumeText = require("../../services/parser/resumeParser");
const analyzeResume = require("../../services/ai/geminiService");
const extractStructuredResume = require("../../services/parser/resumeStructuredExtractor");
const cloudinaryService = require("../../services/cloudinaryService");
const { purgeObsoleteUserResumes } = require("../../services/storageCleanupService");

const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/resumes");

/**
 * Resolves a resume document only if the requesting user has verified authorization:
 * - Admin: Full access.
 * - Job Seeker: Strict access to their own resume only.
 * - Recruiter: Access ONLY if the candidate applied to an active/existing job posted by this recruiter.
 */
async function getAuthorizedResume(queryId, user) {
    if (!user) return null;

    if (!queryId) {
        if (user.role === "job_seeker") {
            return await Resume.findOne({ user: user._id }).sort({ createdAt: -1 });
        }
        return null;
    }

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
        return null;
    }

    if (user.role === "admin") {
        return await Resume.findById(queryId);
    }

    if (user.role === "job_seeker") {
        return await Resume.findOne({ _id: queryId, user: user._id });
    }

    if (user.role === "recruiter") {
        const candidateResume = await Resume.findById(queryId);
        if (!candidateResume) return null;

        const recruiterJobs = await Job.find({ recruiter: user._id }).select("_id").lean();
        const jobIds = recruiterJobs.map((j) => j._id);
        if (jobIds.length === 0) return null;

        const hasApplication = await JobApplication.exists({
            applicant: candidateResume.user,
            job: { $in: jobIds },
        });

        if (hasApplication) {
            return candidateResume;
        }

        return null;
    }

    return null;
}

// Upload and analyze resume
module.exports.uploadResume = async (req, res) => {
    try {
        if (!req.file || (!req.file.buffer && !req.file.path)) {
            return res.status(400).json({
                success: false,
                message: "Please select a resume file (PDF or DOCX, max 5MB).",
            });
        }

        const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
        if (!fileBuffer || fileBuffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Uploaded file is empty.",
            });
        }

        // 1. Extract text from uploaded document (memory buffer or path)
        let parsedText = "";
        try {
            parsedText = await extractResumeText(fileBuffer, req.file.mimetype);
        } catch (parseErr) {
            console.error("Resume text extraction failed:", parseErr);
            return res.status(422).json({
                success: false,
                message: `Failed to extract text from file: ${parseErr.message}`,
            });
        }

        if (!parsedText || !parsedText.trim()) {
            return res.status(422).json({
                success: false,
                message: "The uploaded file contains no readable text. Ensure it is not an image-only scan.",
            });
        }

        // 2. Perform ATS Analysis (Gemini with rule-based fallback)
        const aiResult = await analyzeResume(parsedText);

        // 3. Extract structured resume data for Resume Builder synchronization
        const structuredData = await extractStructuredResume(parsedText, aiResult, req.file.originalname);

        // 4. Ephemeral / Quick ATS Check Mode: If mode=preview, return score without saving to Cloud or DB
        const isPreviewMode = req.query.mode === "preview" || req.body.mode === "preview";
        if (isPreviewMode) {
            return res.status(200).json({
                success: true,
                previewOnly: true,
                message: "ATS analysis completed in ephemeral mode (0 cloud storage used).",
                analysis: {
                    atsScore: aiResult.atsScore || 0,
                    aiFeedback: aiResult.feedback || "",
                    summary: aiResult.summary || "",
                    extractedSkills: aiResult.skills || [],
                    missingSkills: aiResult.missingSkills || [],
                    strengths: aiResult.strengths || [],
                    weaknesses: aiResult.weaknesses || [],
                    recommendedJobs: aiResult.recommendedJobs || [],
                    extractedData: structuredData,
                },
            });
        }

        // 5. Pre-Upload Purge: Clean up obsolete prior resumes for this user, strictly protecting any linked to active JobApplications
        await purgeObsoleteUserResumes(req.user._id, { keepRecentCount: 0 });

        // 6. Upload file to Cloudinary (or local fallback if Cloudinary credentials unset)
        const cloudUpload = await cloudinaryService.uploadResumeStream(
            fileBuffer,
            req.file.originalname,
            req.user._id
        );

        // 7. Create new Resume record
        const resume = new Resume({
            user: req.user._id,
            originalName: req.file.originalname,
            fileName: cloudUpload.public_id || req.file.filename || `${Date.now()}_resume.pdf`,
            filePath: cloudUpload.secure_url || req.file.path || "",
            fileType: req.file.mimetype,
            fileSize: req.file.size || fileBuffer.length,
            storageProvider: cloudUpload.storageProvider || "local",
            cloudinaryAssetId: cloudUpload.asset_id || null,
            cloudinaryPublicId: cloudUpload.public_id || null,
            resourceType: cloudUpload.resource_type || "raw",
            fileFormat: cloudUpload.format || "",
            secureUrl: cloudUpload.secure_url || "",
            parsedText,
            atsScore: aiResult.atsScore || 0,
            aiFeedback: aiResult.feedback || "",
            summary: aiResult.summary || "",
            extractedSkills: aiResult.skills || [],
            missingSkills: aiResult.missingSkills || [],
            strengths: aiResult.strengths || [],
            weaknesses: aiResult.weaknesses || [],
            recommendedJobs: aiResult.recommendedJobs || [],
            extractedData: structuredData,
        });

        await resume.save();

        // 8. Update or synchronize associated ResumeBuilder document (prevents duplicate orphaned docs)
        const candidatePersonal = {
            fullName: structuredData.personal?.fullName || req.user.fullName || "",
            email: structuredData.personal?.email || req.user.email || "",
            phone: structuredData.personal?.phone || "",
            location: structuredData.personal?.location || "",
            linkedin: structuredData.personal?.linkedin || "",
            github: structuredData.personal?.github || "",
            portfolioUrl: structuredData.personal?.portfolioUrl || "",
            photoUrl: "",
        };

        let resumeBuilderDoc = await ResumeBuilder.findOne({ user: req.user._id });
        if (resumeBuilderDoc) {
            resumeBuilderDoc.sourceResume = resume._id;
            resumeBuilderDoc.sourceOriginalName = req.file.originalname;
            resumeBuilderDoc.targetRole = structuredData.targetRole || (Array.isArray(aiResult.recommendedJobs) ? aiResult.recommendedJobs[0] : "") || resumeBuilderDoc.targetRole || "";
            resumeBuilderDoc.personal = candidatePersonal;
            resumeBuilderDoc.summary = structuredData.summary || aiResult.summary || resumeBuilderDoc.summary || "";
            resumeBuilderDoc.skills = Array.isArray(structuredData.skills) && structuredData.skills.length > 0 ? structuredData.skills : resumeBuilderDoc.skills;
            resumeBuilderDoc.experience = Array.isArray(structuredData.experience) && structuredData.experience.length > 0 ? structuredData.experience : resumeBuilderDoc.experience;
            resumeBuilderDoc.projects = Array.isArray(structuredData.projects) && structuredData.projects.length > 0 ? structuredData.projects : resumeBuilderDoc.projects;
            resumeBuilderDoc.education = Array.isArray(structuredData.education) && structuredData.education.length > 0 ? structuredData.education : resumeBuilderDoc.education;
            resumeBuilderDoc.certifications = Array.isArray(structuredData.certifications) && structuredData.certifications.length > 0 ? structuredData.certifications : resumeBuilderDoc.certifications;
            resumeBuilderDoc.customSections = Array.isArray(structuredData.customSections) && structuredData.customSections.length > 0 ? structuredData.customSections : resumeBuilderDoc.customSections;
            await resumeBuilderDoc.save();
        } else {
            resumeBuilderDoc = new ResumeBuilder({
                user: req.user._id,
                sourceResume: resume._id,
                sourceOriginalName: req.file.originalname,
                templateId: "ats-classic",
                careerCategory: "tech",
                targetRole: structuredData.targetRole || (Array.isArray(aiResult.recommendedJobs) ? aiResult.recommendedJobs[0] : "") || "",
                pageMode: "multi-page",
                personal: candidatePersonal,
                summary: structuredData.summary || aiResult.summary || "",
                skills: Array.isArray(structuredData.skills) ? structuredData.skills : [],
                experience: Array.isArray(structuredData.experience) ? structuredData.experience : [],
                projects: Array.isArray(structuredData.projects) ? structuredData.projects : [],
                education: Array.isArray(structuredData.education) ? structuredData.education : [],
                certifications: Array.isArray(structuredData.certifications) ? structuredData.certifications : [],
                customSections: Array.isArray(structuredData.customSections) ? structuredData.customSections : [],
            });
            await resumeBuilderDoc.save();
        }

        // Link back to Resume document
        resume.resumeBuilderId = resumeBuilderDoc._id;
        await resume.save();

        return res.status(200).json({
            success: true,
            message: "Resume uploaded, analyzed, and synchronized with builder successfully!",
            resume: {
                id: resume._id,
                resumeBuilderId: resumeBuilderDoc._id,
                originalName: resume.originalName,
                fileSize: resume.fileSize,
                fileType: resume.fileType,
                storageProvider: resume.storageProvider,
                secureUrl: resume.secureUrl,
                atsScore: resume.atsScore,
                summary: resume.summary,
                extractedSkills: resume.extractedSkills,
                missingSkills: resume.missingSkills,
                strengths: resume.strengths,
                weaknesses: resume.weaknesses,
                recommendedJobs: resume.recommendedJobs,
                aiFeedback: resume.aiFeedback,
                analysisMode: aiResult.analysisMode || "ai-assisted",
                updatedAt: resume.updatedAt,
            },
        });
    } catch (err) {
        console.error("API uploadResume error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to upload and analyze resume.",
        });
    }
};

// Retrieve ATS analysis for logged in user (by ID or latest)
module.exports.getAnalysis = async (req, res) => {
    try {
        const queryId = req.query.id || req.query.resumeId;
        let resume = null;

        if (queryId) {
            if (!mongoose.Types.ObjectId.isValid(queryId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resume ID provided.",
                });
            }
            resume = await Resume.findOne({ _id: queryId, user: req.user._id });
            if (!resume) {
                return res.status(404).json({
                    success: false,
                    message: "Resume not found or access denied.",
                });
            }
        } else {
            // Retrieve latest uploaded resume
            resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        }

        if (!resume) {
            return res.json({
                success: true,
                hasResume: false,
                message: "No resume uploaded yet.",
            });
        }

        return res.json({
            success: true,
            hasResume: true,
            resume: {
                id: resume._id,
                resumeBuilderId: resume.resumeBuilderId,
                originalName: resume.originalName,
                fileSize: resume.fileSize,
                fileType: resume.fileType,
                storageProvider: resume.storageProvider,
                atsScore: resume.atsScore,
                summary: resume.summary,
                extractedSkills: resume.extractedSkills,
                missingSkills: resume.missingSkills,
                strengths: resume.strengths,
                weaknesses: resume.weaknesses,
                recommendedJobs: resume.recommendedJobs,
                aiFeedback: resume.aiFeedback,
                updatedAt: resume.updatedAt,
            },
        });
    } catch (err) {
        console.error("API getAnalysis error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve ATS analysis.",
        });
    }
};

// Retrieve list of all uploaded resumes for current user
module.exports.getResumesList = async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select("originalName fileName fileSize fileType atsScore resumeBuilderId storageProvider secureUrl createdAt updatedAt");

        return res.json({
            success: true,
            count: resumes.length,
            resumes: resumes.map((r) => ({
                id: r._id,
                resumeBuilderId: r.resumeBuilderId,
                originalName: r.originalName,
                fileSize: r.fileSize,
                fileType: r.fileType,
                storageProvider: r.storageProvider,
                atsScore: r.atsScore,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
        });
    } catch (err) {
        console.error("API getResumesList error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve resumes list.",
        });
    }
};

// Serve resume file securely (ownership and recruiter-application authorization enforced)
module.exports.serveResumeFile = async (req, res) => {
    try {
        const queryId = req.query.id || req.query.resumeId;
        const resume = await getAuthorizedResume(queryId, req.user);

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied.",
            });
        }

        // 1. Cloudinary storage: redirect to signed short-lived URL
        if (resume.storageProvider === "cloudinary" && resume.cloudinaryPublicId) {
            const signedUrl = cloudinaryService.getSignedResumeInlineUrl(
                resume.cloudinaryPublicId,
                resume.resourceType || "raw",
                resume.originalName,
                900
            );
            if (signedUrl) {
                res.setHeader("Cache-Control", "private, no-store");
                return res.redirect(signedUrl);
            }
        }

        // 2. Local fallback storage
        if (resume.filePath) {
            const filePath = path.resolve(resume.filePath);
            const allowedPrefix = UPLOAD_DIR + path.sep;

            if (filePath.startsWith(allowedPrefix) && fs.existsSync(filePath)) {
                res.setHeader("Cache-Control", "private, no-store");
                return res.sendFile(filePath);
            }
        }

        if (resume.cloudinarySecureUrl || resume.secureUrl) {
            return res.redirect(resume.cloudinarySecureUrl || resume.secureUrl);
        }

        return res.status(404).json({ success: false, message: "Resume file not found on server or storage." });
    } catch (err) {
        console.error("API serveResumeFile error:", err);
        return res.status(500).json({ success: false, message: "Unable to open file." });
    }
};

// Download resume file securely
module.exports.downloadResumeFile = async (req, res) => {
    try {
        const queryId = req.query.id || req.query.resumeId;
        const resume = await getAuthorizedResume(queryId, req.user);

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied.",
            });
        }

        // 1. Cloudinary storage: redirect to signed short-lived download URL with attachment flag
        if (resume.storageProvider === "cloudinary" && resume.cloudinaryPublicId) {
            const signedDownloadUrl = cloudinaryService.getSignedResumeDownloadUrl(
                resume.cloudinaryPublicId,
                resume.resourceType || "raw",
                resume.originalName,
                900
            );
            if (signedDownloadUrl) {
                res.setHeader("Cache-Control", "private, no-store");
                return res.redirect(signedDownloadUrl);
            }
        }

        // 2. Local fallback storage
        if (resume.filePath) {
            const filePath = path.resolve(resume.filePath);
            const allowedPrefix = UPLOAD_DIR + path.sep;

            if (filePath.startsWith(allowedPrefix) && fs.existsSync(filePath)) {
                res.setHeader("Cache-Control", "private, no-store");
                return res.download(filePath, path.basename(resume.originalName || resume.fileName));
            }
        }

        if (resume.cloudinarySecureUrl || resume.secureUrl) {
            return res.redirect(resume.cloudinarySecureUrl || resume.secureUrl);
        }

        return res.status(404).json({ success: false, message: "Resume file not found on server or storage." });
    } catch (err) {
        console.error("API downloadResumeFile error:", err);
        return res.status(500).json({ success: false, message: "Unable to download file." });
    }
};

// Delete uploaded resume and associated cloud asset
module.exports.deleteResume = async (req, res) => {
    try {
        const queryId = req.params.id || req.query.id;
        if (!queryId || !mongoose.Types.ObjectId.isValid(queryId)) {
            return res.status(400).json({ success: false, message: "Invalid resume ID." });
        }

        const resume = await Resume.findOne({ _id: queryId, user: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: "Resume not found or access denied." });
        }

        // 1. Delete Cloudinary asset if present
        if (resume.cloudinaryPublicId) {
            await cloudinaryService.deleteCloudinaryAsset(resume.cloudinaryPublicId, resume.resourceType || "raw");
        }

        // 2. Delete local file if present
        if (resume.filePath) {
            const filePath = path.resolve(resume.filePath);
            if (filePath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.warn("Failed to unlink local resume file:", e.message);
                }
            }
        }

        // 3. Remove document from DB
        await Resume.deleteOne({ _id: resume._id });

        return res.json({
            success: true,
            message: "Resume deleted successfully.",
        });
    } catch (err) {
        console.error("API deleteResume error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to delete resume.",
        });
    }
};

// Purge older unlinked resumes for current user, keeping only the 1 latest active resume
module.exports.cleanOldResumes = async (req, res) => {
    try {
        const result = await purgeObsoleteUserResumes(req.user._id, { keepRecentCount: 1 });
        return res.json({
            success: true,
            message: `Cleanup completed: ${result.purgedCount} older resume version(s) purged.`,
            stats: result,
        });
    } catch (err) {
        console.error("cleanOldResumes error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to purge older resumes.",
        });
    }
};
