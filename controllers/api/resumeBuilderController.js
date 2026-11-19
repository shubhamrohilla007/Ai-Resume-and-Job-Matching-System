const mongoose = require("mongoose");
const fs = require("fs");
const ResumeBuilder = require("../../models/ResumeBuilder");
const Resume = require("../../models/Resume");
const User = require("../../models/User");
const aiService = require("../../services/ai/geminiService");
const extractStructuredResume = require("../../services/parser/resumeStructuredExtractor");
const cloudinaryService = require("../../services/cloudinaryService");

// Get Resume Builder data for current user (by resumeId or latest active)
module.exports.getResume = async (req, res) => {
    try {
        const queryResumeId = req.query.resumeId || req.query.id;
        let resume = null;

        if (queryResumeId) {
            // Validate MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(queryResumeId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resume ID provided.",
                });
            }

            // 1. Try finding ResumeBuilder directly by _id for current user
            resume = await ResumeBuilder.findOne({
                _id: queryResumeId,
                user: req.user._id,
            });

            // 2. Try finding ResumeBuilder linked via sourceResume
            if (!resume) {
                resume = await ResumeBuilder.findOne({
                    sourceResume: queryResumeId,
                    user: req.user._id,
                });
            }

            // 3. If still not found, check if queryResumeId refers to an uploaded ATS Resume document
            if (!resume) {
                const uploadedDoc = await Resume.findById(queryResumeId);

                if (!uploadedDoc) {
                    return res.status(404).json({
                        success: false,
                        message: "Requested resume was not found.",
                    });
                }

                // Ownership check
                if (!uploadedDoc.user.equals(req.user._id)) {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied. This resume does not belong to your account.",
                    });
                }

                // Check if a ResumeBuilder was already linked to this uploadedDoc
                if (uploadedDoc.resumeBuilderId) {
                    resume = await ResumeBuilder.findOne({
                        _id: uploadedDoc.resumeBuilderId,
                        user: req.user._id,
                    });
                }

                // If still not found, extract structured data from uploadedDoc and synthesize the builder doc
                if (!resume) {
                    let structuredData = uploadedDoc.extractedData;
                    if (!structuredData || !structuredData.personal || !structuredData.personal.fullName) {
                        structuredData = await extractStructuredResume(
                            uploadedDoc.parsedText,
                            uploadedDoc,
                            uploadedDoc.originalName
                        );
                        uploadedDoc.extractedData = structuredData;
                        await uploadedDoc.save();
                    }

                    resume = new ResumeBuilder({
                        user: req.user._id,
                        sourceResume: uploadedDoc._id,
                        sourceOriginalName: uploadedDoc.originalName,
                        templateId: "ats-classic",
                        careerCategory: "tech",
                        targetRole:
                            structuredData.targetRole ||
                            (Array.isArray(uploadedDoc.recommendedJobs) ? uploadedDoc.recommendedJobs[0] : "") ||
                            "",
                        pageMode: "multi-page",
                        personal: {
                            fullName: structuredData.personal?.fullName || req.user.fullName || "",
                            email: structuredData.personal?.email || req.user.email || "",
                            phone: structuredData.personal?.phone || "",
                            location: structuredData.personal?.location || "",
                            linkedin: structuredData.personal?.linkedin || "",
                            github: structuredData.personal?.github || "",
                            portfolioUrl: structuredData.personal?.portfolioUrl || "",
                            photoUrl: "",
                        },
                        summary: structuredData.summary || uploadedDoc.summary || "",
                        skills: Array.isArray(structuredData.skills) ? structuredData.skills : (uploadedDoc.extractedSkills || []),
                        experience: Array.isArray(structuredData.experience) ? structuredData.experience : [],
                        projects: Array.isArray(structuredData.projects) ? structuredData.projects : [],
                        education: Array.isArray(structuredData.education) ? structuredData.education : [],
                        certifications: Array.isArray(structuredData.certifications) ? structuredData.certifications : [],
                        customSections: [],
                    });

                    await resume.save();

                    uploadedDoc.resumeBuilderId = resume._id;
                    await uploadedDoc.save();
                }
            }
        } else {
            // No resumeId provided: retrieve the latest active ResumeBuilder for this user
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });

            if (!resume) {
                // If no builder document exists, check if user has an uploaded ATS resume to initialize from
                const latestUploaded = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
                if (latestUploaded) {
                    let structuredData = latestUploaded.extractedData;
                    if (!structuredData || !structuredData.personal || !structuredData.personal.fullName) {
                        structuredData = await extractStructuredResume(
                            latestUploaded.parsedText,
                            latestUploaded,
                            latestUploaded.originalName
                        );
                        latestUploaded.extractedData = structuredData;
                        await latestUploaded.save();
                    }

                    resume = new ResumeBuilder({
                        user: req.user._id,
                        sourceResume: latestUploaded._id,
                        sourceOriginalName: latestUploaded.originalName,
                        templateId: "ats-classic",
                        careerCategory: "tech",
                        targetRole: structuredData.targetRole || (Array.isArray(latestUploaded.recommendedJobs) ? latestUploaded.recommendedJobs[0] : "") || "",
                        pageMode: "multi-page",
                        personal: {
                            fullName: structuredData.personal?.fullName || req.user.fullName || "",
                            email: structuredData.personal?.email || req.user.email || "",
                            phone: structuredData.personal?.phone || "",
                            location: structuredData.personal?.location || "",
                            linkedin: structuredData.personal?.linkedin || "",
                            github: structuredData.personal?.github || "",
                            portfolioUrl: structuredData.personal?.portfolioUrl || "",
                            photoUrl: "",
                        },
                        summary: structuredData.summary || latestUploaded.summary || "",
                        skills: Array.isArray(structuredData.skills) ? structuredData.skills : (latestUploaded.extractedSkills || []),
                        experience: Array.isArray(structuredData.experience) ? structuredData.experience : [],
                        projects: Array.isArray(structuredData.projects) ? structuredData.projects : [],
                        education: Array.isArray(structuredData.education) ? structuredData.education : [],
                        certifications: Array.isArray(structuredData.certifications) ? structuredData.certifications : [],
                        customSections: [],
                    });

                    await resume.save();

                    latestUploaded.resumeBuilderId = resume._id;
                    await latestUploaded.save();
                } else {
                    // Clean new resume initialization (no hardcoded demo text)
                    resume = new ResumeBuilder({
                        user: req.user._id,
                        personal: {
                            fullName: req.user.fullName || "",
                            email: req.user.email || "",
                            phone: "",
                            location: "",
                            linkedin: "",
                            github: "",
                            portfolioUrl: "",
                            photoUrl: "",
                        },
                        templateId: "ats-classic",
                        careerCategory: "tech",
                        targetRole: "",
                        summary: "",
                        skills: [],
                        experience: [],
                        projects: [],
                        education: [],
                        certifications: [],
                        customSections: [],
                    });
                    await resume.save();
                }
            }
        }

        return res.json({
            success: true,
            resume,
        });
    } catch (err) {
        console.error("API getResume error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve resume data.",
        });
    }
};

// Save / Update Resume Builder data
module.exports.saveResume = async (req, res) => {
    try {
        const {
            _id,
            resumeId,
            sourceResume,
            sourceOriginalName,
            templateId,
            careerCategory,
            targetRole,
            personal,
            summary,
            education,
            skills,
            experience,
            projects,
            certifications,
            customSections,
        } = req.body;

        const targetResumeId = _id || resumeId || req.query.resumeId || req.query.id;
        let resume = null;

        // 1. Locate specific ResumeBuilder if target ID provided
        if (targetResumeId && mongoose.Types.ObjectId.isValid(targetResumeId)) {
            resume = await ResumeBuilder.findOne({ _id: targetResumeId, user: req.user._id });
            if (!resume) {
                resume = await ResumeBuilder.findOne({ sourceResume: targetResumeId, user: req.user._id });
            }
        }

        // 2. If sourceResume given, try finding by sourceResume
        if (!resume && sourceResume && mongoose.Types.ObjectId.isValid(sourceResume)) {
            resume = await ResumeBuilder.findOne({ sourceResume, user: req.user._id });
        }

        // 3. Fallback: find latest for this user
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        }

        // 4. Create new if none exists
        if (!resume) {
            resume = new ResumeBuilder({
                user: req.user._id,
                sourceResume: sourceResume && mongoose.Types.ObjectId.isValid(sourceResume) ? sourceResume : null,
                sourceOriginalName: sourceOriginalName || "",
            });
        }

        if (sourceResume && mongoose.Types.ObjectId.isValid(sourceResume)) {
            resume.sourceResume = sourceResume;
        }
        if (sourceOriginalName) {
            resume.sourceOriginalName = String(sourceOriginalName);
        }

        if (templateId) resume.templateId = String(templateId);
        if (careerCategory) resume.careerCategory = String(careerCategory);
        if (targetRole !== undefined) resume.targetRole = String(targetRole || "");
        if (req.body.pageMode) resume.pageMode = String(req.body.pageMode);

        // Personal
        resume.personal = {
            fullName: personal?.fullName ? String(personal.fullName).trim() : (resume.personal?.fullName || req.user.fullName || ""),
            email: personal?.email ? String(personal.email).trim() : (resume.personal?.email || req.user.email || ""),
            phone: personal?.phone !== undefined ? String(personal.phone).trim() : (resume.personal?.phone || ""),
            location: personal?.location !== undefined ? String(personal.location).trim() : (resume.personal?.location || ""),
            linkedin: personal?.linkedin !== undefined ? String(personal.linkedin).trim() : (resume.personal?.linkedin || ""),
            github: personal?.github !== undefined ? String(personal.github).trim() : (resume.personal?.github || ""),
            portfolioUrl: personal?.portfolioUrl !== undefined ? String(personal.portfolioUrl).trim() : (resume.personal?.portfolioUrl || ""),
            photoUrl: personal?.photoUrl !== undefined ? String(personal.photoUrl).trim() : (resume.personal?.photoUrl || ""),
        };

        // Summary
        resume.summary = summary !== undefined ? String(summary).trim() : (resume.summary || "");

        // Education
        if (Array.isArray(education)) {
            resume.education = education
                .filter((item) => item && (item.degree || item.college || item.year))
                .map((item) => ({
                    degree: String(item.degree || "").trim(),
                    college: String(item.college || "").trim(),
                    year: String(item.year || "").trim(),
                    cgpa: String(item.cgpa || "").trim(),
                }));
        }

        // Skills (normalize to string array)
        if (Array.isArray(skills)) {
            resume.skills = skills.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof skills === "string") {
            resume.skills = skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        }

        // Experience
        if (Array.isArray(experience)) {
            resume.experience = experience
                .filter((item) => item && (item.company || item.role))
                .map((item) => ({
                    company: String(item.company || "").trim(),
                    role: String(item.role || "").trim(),
                    duration: String(item.duration || "").trim(),
                    description: String(item.description || "").trim(),
                }));
        }

        // Projects
        if (Array.isArray(projects)) {
            resume.projects = projects
                .filter((item) => item && item.name)
                .map((item) => ({
                    name: String(item.name || "").trim(),
                    technologies: String(item.technologies || "").trim(),
                    description: String(item.description || "").trim(),
                    link: String(item.link || "").trim(),
                }));
        }

        // Certifications
        if (Array.isArray(certifications)) {
            resume.certifications = certifications
                .filter((item) => item && item.name)
                .map((item) => ({
                    name: String(item.name || "").trim(),
                    issuer: String(item.issuer || "").trim(),
                    year: String(item.year || "").trim(),
                }));
        }

        // Custom Sections
        if (Array.isArray(customSections)) {
            resume.customSections = customSections
                .filter((sec) => sec && sec.title)
                .map((sec) => ({
                    title: String(sec.title || "").trim(),
                    content: String(sec.content || "").trim(),
                    items: Array.isArray(sec.items) ? sec.items.map((i) => String(i).trim()).filter(Boolean) : [],
                }));
        }

        await resume.save();

        return res.json({
            success: true,
            message: "Resume saved successfully!",
            resume,
        });
    } catch (err) {
        console.error("API saveResume error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to save resume.",
        });
    }
};

// Full AI Resume Generator
module.exports.generateAIResume = async (req, res) => {
    try {
        const targetRole = String(
            req.body.targetRole || req.body.aiRole || ""
        ).trim();

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: "Target job role is required for AI generation.",
            });
        }

        const targetResumeId = req.body._id || req.body.resumeId || req.query.resumeId;
        let resume = null;

        if (targetResumeId && mongoose.Types.ObjectId.isValid(targetResumeId)) {
            resume = await ResumeBuilder.findOne({ _id: targetResumeId, user: req.user._id });
            if (!resume) {
                resume = await ResumeBuilder.findOne({ sourceResume: targetResumeId, user: req.user._id });
            }
        }
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        }
        if (!resume) {
            resume = new ResumeBuilder({ user: req.user._id });
        }

        // Resolve personal details with high preservation priority
        const existingPersonal = resume.personal || {};
        const bodyPersonal = req.body.personal || {};

        const fullName = String(
            bodyPersonal.fullName || req.body.fullName || existingPersonal.fullName || req.user.fullName || "Candidate Name"
        ).trim();

        const email = String(
            bodyPersonal.email || req.body.email || existingPersonal.email || req.user.email || "candidate@example.com"
        ).trim();

        const phone = String(
            bodyPersonal.phone || req.body.phone || existingPersonal.phone || ""
        ).trim();

        const location = String(
            bodyPersonal.location || req.body.location || existingPersonal.location || ""
        ).trim();

        const linkedin = String(
            bodyPersonal.linkedin || req.body.linkedin || existingPersonal.linkedin || ""
        ).trim();

        const github = String(
            bodyPersonal.github || req.body.github || existingPersonal.github || ""
        ).trim();

        const portfolioUrl = String(
            bodyPersonal.portfolioUrl || req.body.portfolioUrl || existingPersonal.portfolioUrl || ""
        ).trim();

        const photoUrl = String(
            bodyPersonal.photoUrl || req.body.photoUrl || existingPersonal.photoUrl || ""
        ).trim();

        // Extract input sections to refine or enhance
        const skillsInput = req.body.skills || resume.skills || [];
        const skillList = Array.isArray(skillsInput)
            ? skillsInput.map((s) => String(s).trim()).filter(Boolean)
            : String(skillsInput || "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

        const educationInput = Array.isArray(req.body.education) && req.body.education.length > 0
            ? req.body.education
            : (Array.isArray(resume.education) ? resume.education : []);

        const projectsInput = Array.isArray(req.body.projects) && req.body.projects.length > 0
            ? req.body.projects
            : (Array.isArray(resume.projects) ? resume.projects : []);

        const experienceInput = Array.isArray(req.body.experience) && req.body.experience.length > 0
            ? req.body.experience
            : (Array.isArray(resume.experience) ? resume.experience : []);

        const certificationsInput = Array.isArray(req.body.certifications) && req.body.certifications.length > 0
            ? req.body.certifications
            : (Array.isArray(resume.certifications) ? resume.certifications : []);

        // Call AI Service (with automatic role synthesis fallback)
        const generated = await aiService.generateFullResume({
            targetRole,
            education: educationInput,
            skills: skillList,
            projects: projectsInput,
            experience: experienceInput,
            certifications: certificationsInput,
        });

        // Format categorized skills cleanly
        const finalSkills = [];
        if (Array.isArray(generated.skillGroups) && generated.skillGroups.length > 0) {
            for (const grp of generated.skillGroups) {
                if (grp?.category && Array.isArray(grp.skills) && grp.skills.length > 0) {
                    finalSkills.push(`${grp.category}: ${grp.skills.join(", ")}`);
                }
            }
        }
        if (finalSkills.length === 0 && Array.isArray(generated.skills) && generated.skills.length > 0) {
            finalSkills.push(...generated.skills);
        } else if (finalSkills.length === 0 && skillList.length > 0) {
            finalSkills.push(...skillList);
        }

        // Format projects ensuring clean descriptions
        const finalProjects = (generated.projects || []).map((p) => ({
            name: String(p.name || "Project").trim(),
            technologies: String(p.technologies || "").trim(),
            description: String(p.description || "").trim(),
            link: String(p.link || "").trim(),
        }));

        // Format experience ensuring clean descriptions
        const finalExperience = (generated.experience || []).map((exp) => ({
            company: String(exp.company || "Company").trim(),
            role: String(exp.role || targetRole).trim(),
            duration: String(exp.duration || "2022 - Present").trim(),
            description: String(exp.description || "").trim(),
        }));

        // Format education
        const finalEducation = (generated.education || []).map((ed) => ({
            degree: String(ed.degree || "").trim(),
            college: String(ed.college || "").trim(),
            year: String(ed.year || "").trim(),
            cgpa: String(ed.cgpa || "").trim(),
        }));

        // Format certifications
        const finalCertifications = (generated.certifications || []).map((c) => ({
            name: String(c.name || "").trim(),
            issuer: String(c.issuer || "").trim(),
            year: String(c.year || "").trim(),
        }));

        // Persist to Resume document
        resume.personal = {
            fullName,
            email,
            phone,
            location,
            linkedin,
            github,
            portfolioUrl,
            photoUrl,
        };
        resume.targetRole = targetRole;
        resume.summary = String(generated.summary || "").trim();
        resume.skills = finalSkills;
        resume.projects = finalProjects;
        resume.experience = finalExperience;
        resume.education = finalEducation;
        resume.certifications = finalCertifications;

        if (req.body.templateId) {
            resume.templateId = String(req.body.templateId);
        }
        if (req.body.careerCategory) {
            resume.careerCategory = String(req.body.careerCategory);
        }
        if (req.body.pageMode) {
            resume.pageMode = String(req.body.pageMode);
        }

        await resume.save();

        const isFallback = Boolean(generated.isFallback);
        const message = isFallback
            ? "Role-tailored resume draft generated (AI quota exceeded / fallback used)."
            : "Full AI resume synthesized and applied successfully!";

        return res.json({
            success: true,
            isFallback,
            message,
            resume,
            suggestedSkills: generated.suggestedSkills || [],
        });
    } catch (err) {
        console.error("API generateAIResume error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to generate AI resume.",
        });
    }
};

// AI Section Polish / Improvement
module.exports.improveSection = async (req, res) => {
    try {
        const { section, text, technologies = "" } = req.body;

        const allowed = ["summary", "experience", "project"];
        if (!allowed.includes(section)) {
            return res.status(400).json({ success: false, message: "Invalid section." });
        }

        if (!text || !String(text).trim()) {
            return res.status(400).json({ success: false, message: "Please enter text to improve." });
        }

        const targetResumeId = req.body._id || req.body.resumeId || req.query.resumeId;
        let resume = null;
        if (targetResumeId && mongoose.Types.ObjectId.isValid(targetResumeId)) {
            resume = await ResumeBuilder.findOne({ _id: targetResumeId, user: req.user._id }).select("skills");
        }
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 }).select("skills");
        }

        const improvedText = await aiService.improveResumeText({
            section,
            text: text.trim(),
            skills: resume?.skills || [],
            technologies: String(technologies || ""),
        });

        return res.json({
            success: true,
            improvedText,
        });
    } catch (err) {
        console.error("API improveSection error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Unable to improve text at this time.",
        });
    }
};

// Upload Profile Photo
module.exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file || (!req.file.buffer && !req.file.path)) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }

        const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
        if (!fileBuffer || fileBuffer.length === 0) {
            return res.status(400).json({ success: false, message: "Uploaded photo is empty." });
        }

        const targetResumeId = req.query?.resumeId || req.body?.resumeId;
        let resume = null;

        if (targetResumeId && mongoose.Types.ObjectId.isValid(targetResumeId)) {
            resume = await ResumeBuilder.findOne({ _id: targetResumeId, user: req.user._id });
            if (!resume) {
                resume = await ResumeBuilder.findOne({ sourceResume: targetResumeId, user: req.user._id });
            }
        }
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        }
        if (!resume) {
            resume = new ResumeBuilder({ user: req.user._id });
        }
        if (!resume.personal) {
            resume.personal = {};
        }

        // Delete previous Cloudinary asset if one existed
        if (resume.personal.photoPublicId) {
            await cloudinaryService.deleteCloudinaryAsset(resume.personal.photoPublicId, "image");
        }

        // Upload to Cloudinary (or local fallback)
        const cloudPhoto = await cloudinaryService.uploadProfilePhotoStream(
            fileBuffer,
            req.file.originalname,
            req.user._id
        );

        resume.personal.photoUrl = cloudPhoto.secure_url;
        resume.personal.photoPublicId = cloudPhoto.public_id;
        resume.personal.photoStorageProvider = cloudPhoto.storageProvider;
        await resume.save();

        // Keep User.avatarUrl synchronized if user wishes
        if (req.user?._id) {
            await User.findByIdAndUpdate(req.user._id, { avatarUrl: cloudPhoto.secure_url }).catch(() => {});
        }

        return res.json({
            success: true,
            message: "Profile photo uploaded successfully!",
            photoUrl: cloudPhoto.secure_url,
            storageProvider: cloudPhoto.storageProvider,
        });
    } catch (err) {
        console.error("API uploadPhoto error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to upload photo.",
        });
    }
};

// Delete Profile Photo
module.exports.deletePhoto = async (req, res) => {
    try {
        const targetResumeId = req.query?.resumeId || req.body?.resumeId;
        let resume = null;

        if (targetResumeId && mongoose.Types.ObjectId.isValid(targetResumeId)) {
            resume = await ResumeBuilder.findOne({ _id: targetResumeId, user: req.user._id });
            if (!resume) {
                resume = await ResumeBuilder.findOne({ sourceResume: targetResumeId, user: req.user._id });
            }
        }
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        }

        if (resume && resume.personal) {
            // Delete Cloudinary asset if present
            if (resume.personal.photoPublicId) {
                await cloudinaryService.deleteCloudinaryAsset(resume.personal.photoPublicId, "image");
            }

            resume.personal.photoUrl = "";
            resume.personal.photoPublicId = null;
            resume.personal.photoStorageProvider = "local";
            await resume.save();
        }

        return res.json({
            success: true,
            message: "Profile photo removed.",
        });
    } catch (err) {
        console.error("API deletePhoto error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to remove photo.",
        });
    }
};

// Optimize Resume for One-Page Mode
module.exports.optimizeOnePage = async (req, res) => {
    try {
        const { summary = "", experience = [], projects = [], customSections = [], skills = [], targetRole = "" } = req.body;

        const result = await aiService.optimizeResumeForOnePage({
            summary,
            experience,
            projects,
            customSections,
            skills,
            targetRole,
        });

        return res.json({
            success: true,
            message: "Concise one-page content generated successfully.",
            conciseContent: result,
        });
    } catch (err) {
        console.error("API optimizeOnePage error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to generate concise one-page content.",
        });
    }
};

// AI Resume Role-Tailoring Assistant
module.exports.tailorResumeForJob = async (req, res) => {
    try {
        const {
            jobId,
            title = "",
            company = "",
            description = "",
            requiredSkills = [],
            preferredSkills = [],
            resumeData = null,
        } = req.body;

        let resume = resumeData;

        // If no explicit resume snapshot was passed, retrieve the candidate's active ResumeBuilder
        if (!resume) {
            resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
        }

        // If still not found, construct a baseline structure from User profile
        if (!resume) {
            resume = {
                summary: req.user.profile?.bio || "",
                skills: req.user.profile?.skills || [],
                experience: req.user.profile?.experience || [],
                projects: req.user.profile?.projects || [],
            };
        }

        const job = {
            id: jobId,
            title,
            company,
            description,
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
            preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
        };

        const tailoring = await aiService.tailorResumeForJobWithAi({ resume, job });

        return res.json({
            success: true,
            message: "Resume successfully tailored for target role.",
            tailoring,
        });
    } catch (err) {
        console.error("API tailorResumeForJob error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to tailor resume for the target role.",
        });
    }
};
