const mongoose = require("mongoose");
const Job = require("../../models/Job");
const ResumeBuilder = require("../../models/ResumeBuilder");
const Resume = require("../../models/Resume");
const Profile = require("../../models/Profile");
const JobApplication = require("../../models/JobApplication");
const User = require("../../models/User");
const { rankJobs, calculateJobMatch } = require("../../services/jobMatchingService");
const { auditJobListing } = require("../../services/trustBridge/trustScore");
const { getSignedResumeInlineUrl, getSignedResumeDownloadUrl } = require("../../services/cloudinaryService");
const emailService = require("../../services/emailService");

function parseSkills(value) {
    let rawList = [];
    if (Array.isArray(value)) {
        rawList = value.flatMap((item) => String(item).split(/[,;\n]|\.\s+/));
    } else {
        rawList = String(value || "").split(/[,;\n]|\.\s+/);
    }
    return rawList
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => (skill.length > 45 ? skill.slice(0, 42) + "..." : skill));
}

function validateJobData(data) {
    if (!data.title || !String(data.title).trim()) {
        return "Job title is required.";
    }
    if (!data.company || !String(data.company).trim()) {
        return "Company name is required.";
    }
    if (!data.description || !String(data.description).trim()) {
        return "Job description is required.";
    }

    const validLevels = ["Fresher", "Entry Level", "Mid Level", "Senior Level"];
    const validTypes = ["Full-time", "Part-time", "Internship", "Contract"];

    if (data.experienceLevel && !validLevels.includes(data.experienceLevel)) {
        return "Select a valid experience level.";
    }
    if (data.jobType && !validTypes.includes(data.jobType)) {
        return "Select a valid job type.";
    }
    if (data.applicationUrl && !/^https?:\/\/\S+$/i.test(data.applicationUrl.trim())) {
        return "Application URL must start with http:// or https://";
    }

    return null;
}

// Job Seeker: Recommended Jobs matching resume skills & project evidence
module.exports.getRecommendedJobs = async (req, res) => {
    try {
        let resume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 }).lean();

        // Fallback: If no ResumeBuilder entry yet, check parsed Resume model
        if (!resume || !resume.skills || resume.skills.length === 0) {
            const uploadedResume = await Resume.findOne({ user: req.user._id, isProcessed: true }).sort({ createdAt: -1 }).lean();
            if (uploadedResume && uploadedResume.extractedSkills?.length > 0) {
                resume = {
                    skills: uploadedResume.extractedSkills,
                    projects: [],
                    summary: uploadedResume.summary || "",
                };
            }
        }

        if (!resume) {
            return res.json({
                success: true,
                hasResume: false,
                message: "Create your resume in the Resume Builder to get personalized job recommendations.",
                recommendations: [],
            });
        }

        const activeJobs = await Job.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        if (activeJobs.length === 0) {
            return res.json({
                success: true,
                hasResume: true,
                recommendations: [],
                hasResumeSkills: Array.isArray(resume.skills) && resume.skills.length > 0,
                message: "No active job listings are currently available.",
            });
        }

        const recommendations = await rankJobs(resume, activeJobs);

        // Aggregate unique missing required skills to power learning recommendations
        const missingSkillSet = new Set();
        recommendations.forEach((rec) => {
            (rec.missingRequired || []).forEach((skill) => {
                const clean = String(skill || "").trim();
                if (clean && clean.length <= 40) {
                    missingSkillSet.add(clean);
                } else if (clean && clean.length > 40) {
                    missingSkillSet.add(clean.slice(0, 35) + "...");
                }
            });
        });

        // Also get IDs and exact applied scores of jobs already applied to by this user
        const appliedApplications = await JobApplication.find({ applicant: req.user._id })
            .select("job matchScore matchingSkills missingSkills")
            .lean();
        const appMap = new Map(appliedApplications.map((a) => [String(a.job), a]));
        const appliedJobIds = appliedApplications.map((a) => String(a.job));

        // Synchronize recommendations with submitted applications so scores match 100%
        recommendations.forEach((rec) => {
            const app = appMap.get(String(rec._id));
            if (app && typeof app.matchScore === "number") {
                rec.matchScore = app.matchScore;
                if (Array.isArray(app.matchingSkills) && app.matchingSkills.length > 0) {
                    rec.matchedRequired = app.matchingSkills;
                }
                if (Array.isArray(app.missingSkills)) {
                    rec.missingRequired = app.missingSkills;
                }
            }
        });

        return res.json({
            success: true,
            hasResume: true,
            recommendations,
            appliedJobIds,
            hasResumeSkills: Array.isArray(resume.skills) && resume.skills.length > 0,
            aggregateMissingSkills: Array.from(missingSkillSet).slice(0, 10),
        });
    } catch (err) {
        console.error("API getRecommendedJobs error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to calculate job recommendations.",
        });
    }
};

// Public Active Jobs list (Search & Explore)
module.exports.getPublicJobs = async (req, res) => {
    try {
        const { search, location, jobType, experienceLevel } = req.query;
        const query = { isActive: true };

        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim(), "i");
            query.$or = [{ title: regex }, { company: regex }, { requiredSkills: regex }];
        }
        if (location && String(location).trim()) {
            query.location = new RegExp(String(location).trim(), "i");
        }
        if (jobType && String(jobType).trim()) {
            query.jobType = String(jobType).trim();
        }
        if (experienceLevel && String(experienceLevel).trim()) {
            query.experienceLevel = String(experienceLevel).trim();
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(50).lean();

        let appliedJobIds = [];
        if (req.user) {
            const applied = await JobApplication.find({ applicant: req.user._id }).select("job").lean();
            appliedJobIds = applied.map((a) => String(a.job));
        }

        return res.json({
            success: true,
            total: jobs.length,
            jobs,
            appliedJobIds,
        });
    } catch (err) {
        console.error("API getPublicJobs error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve jobs.",
        });
    }
};

// Single Job Details
module.exports.getJobById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }
        const job = await Job.findById(req.params.id).populate("recruiter", "fullName email").lean();
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        let hasApplied = false;
        if (req.user) {
            const existing = await JobApplication.findOne({ job: job._id, applicant: req.user._id });
            hasApplied = !!existing;
        }

        return res.json({
            success: true,
            job,
            hasApplied,
        });
    } catch (err) {
        console.error("API getJobById error:", err);
        return res.status(500).json({ success: false, message: "Unable to load job details." });
    }
};

// Recruiter: View jobs created by this recruiter, with count of applied candidates
module.exports.getRecruiterJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean();

        // Count applicants for each job
        const jobIds = jobs.map((j) => j._id);
        const applicationCounts = await JobApplication.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: "$job", count: { $sum: 1 } } },
        ]);

        const countMap = new Map();
        applicationCounts.forEach((item) => countMap.set(String(item._id), item.count));

        const jobsWithCounts = jobs.map((j) => ({
            ...j,
            applicantCount: countMap.get(String(j._id)) || 0,
        }));

        return res.json({
            success: true,
            jobs: jobsWithCounts,
        });
    } catch (err) {
        console.error("API getRecruiterJobs error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve your jobs." });
    }
};

// Recruiter: Trust Audit Preview before posting or editing
module.exports.auditPreview = async (req, res) => {
    try {
        const data = {
            title: String(req.body.title || "").trim(),
            company: String(req.body.company || "").trim(),
            description: String(req.body.description || "").trim(),
            requiredSkills: parseSkills(req.body.requiredSkills),
            preferredSkills: parseSkills(req.body.preferredSkills),
            experienceLevel: req.body.experienceLevel || "Fresher",
            location: String(req.body.location || "Remote").trim(),
            jobType: req.body.jobType || "Full-time",
            salary: String(req.body.salary || "Not specified").trim(),
            applicationUrl: String(req.body.applicationUrl || "").trim(),
        };

        const audit = await auditJobListing(data);

        return res.json({
            success: true,
            audit,
        });
    } catch (err) {
        console.error("API auditPreview error:", err);
        return res.status(500).json({ success: false, message: "Failed to audit job." });
    }
};

// Recruiter: Create Job with automated TrustBridge Audit
module.exports.createJob = async (req, res) => {
    try {
        const data = {
            title: String(req.body.title || "").trim(),
            company: String(req.body.company || "").trim(),
            description: String(req.body.description || "").trim(),
            requiredSkills: parseSkills(req.body.requiredSkills),
            preferredSkills: parseSkills(req.body.preferredSkills),
            experienceLevel: req.body.experienceLevel || "Fresher",
            location: String(req.body.location || "Remote").trim(),
            jobType: req.body.jobType || "Full-time",
            salary: String(req.body.salary || "Not specified").trim(),
            applicationUrl: String(req.body.applicationUrl || "").trim(),
        };

        const error = validateJobData(data);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        // Run TrustBridge audit
        const audit = await auditJobListing(data);

        const newJob = await Job.create({
            ...data,
            recruiter: req.user._id,
            isActive: audit.trustStatus !== "blocked", // automatically hold blocked scams
            trustScore: audit.trustScore,
            trustStatus: audit.trustStatus,
            trustStatusLabel: audit.trustStatusLabel,
            trustSignals: audit.signals,
            completenessScore: audit.completenessScore,
            auditedAt: audit.auditedAt,
        });

        return res.status(201).json({
            success: true,
            message: audit.trustStatus === "blocked"
                ? "Job submitted but held in review due to trust signals."
                : "Job posted successfully!",
            job: newJob,
            audit,
        });
    } catch (err) {
        console.error("API createJob error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to create job posting.",
        });
    }
};

// Recruiter: Edit an Existing Job Post
module.exports.editJob = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }
        const job = await Job.findOne({
            _id: req.params.id,
            recruiter: req.user._id, // Enforce recruiter ownership
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }

        const data = {
            title: String(req.body.title || "").trim(),
            company: String(req.body.company || "").trim(),
            description: String(req.body.description || "").trim(),
            requiredSkills: parseSkills(req.body.requiredSkills),
            preferredSkills: parseSkills(req.body.preferredSkills),
            experienceLevel: req.body.experienceLevel || job.experienceLevel,
            location: String(req.body.location || "Remote").trim(),
            jobType: req.body.jobType || job.jobType,
            salary: String(req.body.salary || "Not specified").trim(),
            applicationUrl: String(req.body.applicationUrl || "").trim(),
        };

        const error = validateJobData(data);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        // Re-run TrustBridge audit on the updated content
        const audit = await auditJobListing(data);

        job.title = data.title;
        job.company = data.company;
        job.description = data.description;
        job.requiredSkills = data.requiredSkills;
        job.preferredSkills = data.preferredSkills;
        job.experienceLevel = data.experienceLevel;
        job.location = data.location;
        job.jobType = data.jobType;
        job.salary = data.salary;
        job.applicationUrl = data.applicationUrl;

        job.trustScore = audit.trustScore;
        job.trustStatus = audit.trustStatus;
        job.trustStatusLabel = audit.trustStatusLabel;
        job.trustSignals = audit.signals;
        job.completenessScore = audit.completenessScore;
        job.auditedAt = audit.auditedAt;

        if (audit.trustStatus === "blocked") {
            job.isActive = false;
        }

        await job.save();

        return res.json({
            success: true,
            message: "Job posting updated successfully!",
            job,
            audit,
        });
    } catch (err) {
        console.error("API editJob error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to update job.",
        });
    }
};

// Recruiter: Toggle Job Status (active/inactive)
module.exports.toggleJobStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }
        const job = await Job.findOne({
            _id: req.params.id,
            recruiter: req.user._id, // Enforce recruiter ownership
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }

        job.isActive = !job.isActive;
        await job.save();

        return res.json({
            success: true,
            isActive: job.isActive,
            message: job.isActive ? "Job activated." : "Job closed.",
        });
    } catch (err) {
        console.error("API toggleJobStatus error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to update job status.",
        });
    }
};

// Recruiter: Delete Job
module.exports.deleteJob = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }
        const job = await Job.findOneAndDelete({
            _id: req.params.id,
            recruiter: req.user._id,
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }

        // Clean up applications for this job
        await JobApplication.deleteMany({ job: req.params.id });

        return res.json({
            success: true,
            message: "Job deleted successfully.",
        });
    } catch (err) {
        console.error("API deleteJob error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to delete job.",
        });
    }
};

// ==========================================
// Applicant Tracking & Applications
// ==========================================

// Job Seeker: Apply to a Job
module.exports.applyToJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(404).json({
                success: false,
                message: "This job opening is either closed or no longer available.",
            });
        }
        const job = await Job.findById(jobId);

        if (!job || !job.isActive) {
            return res.status(404).json({
                success: false,
                message: "This job opening is either closed or no longer available.",
            });
        }

        const {
            coverNote = "",
            tailoredMatchScore = null,
            tailoredSkills = null,
            tailoredSummary = "",
        } = req.body;

        // Check if candidate already applied
        const existing = await JobApplication.findOne({
            job: jobId,
            applicant: req.user._id,
        });

        if (existing) {
            // If candidate is submitting with AI-tailored improvements, upgrade their existing application with boosted match score & skills
            if (tailoredMatchScore || (Array.isArray(tailoredSkills) && tailoredSkills.length > 0)) {
                if (typeof tailoredMatchScore === "number" && tailoredMatchScore > 0) {
                    existing.matchScore = Math.max(existing.matchScore || 0, Math.min(100, Math.round(tailoredMatchScore)));
                }
                if (Array.isArray(tailoredSkills) && tailoredSkills.length > 0) {
                    existing.skills = Array.from(new Set([...(existing.skills || []), ...tailoredSkills]));
                    const tailoredLower = new Set(tailoredSkills.map((s) => String(s).toLowerCase().trim()));
                    const newMatches = (job.requiredSkills || []).filter((req) => tailoredLower.has(String(req).toLowerCase().trim()));
                    existing.matchingSkills = Array.from(new Set([...(existing.matchingSkills || []), ...newMatches]));
                    existing.missingSkills = (existing.missingSkills || []).filter((m) => !tailoredLower.has(String(m).toLowerCase().trim()));
                }
                if (coverNote && String(coverNote).trim()) {
                    existing.coverNote = String(coverNote).trim();
                }
                await existing.save();

                return res.status(200).json({
                    success: true,
                    message: "Your application has been successfully updated with your AI-tailored resume!",
                    application: existing,
                    updated: true,
                });
            }

            return res.status(409).json({
                success: false,
                message: "You have already applied for this job.",
            });
        }

        // Gather candidate data from ResumeBuilder, uploaded Resume, and Profile
        const builderResume = await ResumeBuilder.findOne({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
        const uploadedResume = await Resume.findOne({ user: req.user._id, isProcessed: true }).sort({ createdAt: -1 }).lean();
        const profile = await Profile.findOne({ user: req.user._id }).lean();

        // Calculate candidate-to-job ATS match score & missing skills
        const candidateResumeSource = builderResume || uploadedResume || profile || {};
        const matchResult = calculateJobMatch(candidateResumeSource, job);
        let matchScore = typeof matchResult?.matchScore === "number" ? matchResult.matchScore : 0;
        let matchingSkills = [
            ...(Array.isArray(matchResult?.matchedRequired) ? matchResult.matchedRequired.map((s) => s.original || s.normalized || s) : []),
            ...(Array.isArray(matchResult?.matchedPreferred) ? matchResult.matchedPreferred.map((s) => s.original || s.normalized || s) : []),
        ];
        let missingSkills = [
            ...(Array.isArray(matchResult?.missingRequired) ? matchResult.missingRequired.map((s) => s.original || s.normalized || s) : []),
            ...(Array.isArray(matchResult?.missingPreferred) ? matchResult.missingPreferred.map((s) => s.original || s.normalized || s) : []),
        ];

        // If candidate submitted with AI role tailoring, harmonize score and skills so recruiter sees the exact boosted score
        if (typeof tailoredMatchScore === "number" && tailoredMatchScore > 0) {
            matchScore = Math.max(matchScore, Math.min(100, Math.round(tailoredMatchScore)));
        }

        if (Array.isArray(tailoredSkills) && tailoredSkills.length > 0) {
            const tailoredLower = new Set(tailoredSkills.map((s) => String(s).toLowerCase().trim()));
            const newMatches = (job.requiredSkills || []).filter((req) => tailoredLower.has(String(req).toLowerCase().trim()));
            matchingSkills = Array.from(new Set([...matchingSkills, ...newMatches]));
            missingSkills = missingSkills.filter((m) => !tailoredLower.has(String(m).toLowerCase().trim()));
        }

        const candidateName = builderResume?.personal?.fullName || profile?.fullName || req.user.fullName;
        const candidateEmail = builderResume?.personal?.email || req.user.email;
        const candidatePhone = builderResume?.personal?.phone || profile?.phone || "";
        const candidateLocation = builderResume?.personal?.location || profile?.location || "";
        const candidateSkills = Array.isArray(tailoredSkills) && tailoredSkills.length > 0
            ? tailoredSkills
            : (Array.isArray(builderResume?.skills) && builderResume.skills.length > 0
                ? builderResume.skills
                : (Array.isArray(profile?.skills) ? profile.skills : []));

        const resumeUrl = uploadedResume?.fileUrl || "";
        const resumeId = uploadedResume?._id || builderResume?._id || null;

        const application = await JobApplication.create({
            job: jobId,
            applicant: req.user._id,
            fullName: candidateName,
            email: candidateEmail,
            phone: candidatePhone,
            location: candidateLocation,
            skills: candidateSkills,
            resumeUrl,
            resumeId,
            matchScore,
            matchingSkills,
            missingSkills,
            coverNote: String(coverNote).trim(),
            status: "applied",
        });

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully!",
            application,
        });
    } catch (err) {
        console.error("API applyToJob error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to submit application.",
        });
    }
};

// Recruiter: Get All Applicants for a Specific Job (Sorted with highest match first)
module.exports.getJobApplications = async (req, res) => {
    try {
        const jobId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }

        // Verify recruiter owns this job
        const job = await Job.findOne({
            _id: jobId,
            recruiter: req.user._id,
        }).lean();

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found or access denied.",
            });
        }

        const applications = await JobApplication.find({ job: jobId })
            .sort({ matchScore: -1, appliedAt: -1 })
            .lean();

        return res.json({
            success: true,
            jobTitle: job.title,
            company: job.company,
            totalApplicants: applications.length,
            applications,
        });
    } catch (err) {
        console.error("API getJobApplications error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load applicant list.",
        });
    }
};

// Recruiter: Get Deep Candidate Profile & Signed Resume Link for Inspection
module.exports.getCandidateProfileForRecruiter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        const application = await JobApplication.findById(id).lean();
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        const job = await Job.findOne({ _id: application.job, recruiter: req.user._id }).lean();
        if (!job) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        // Fetch candidate details
        const candidateUser = await User.findById(application.applicant).select("-password").lean();
        const candidateProfile = await Profile.findOne({ user: application.applicant }).lean();
        const resumeBuilder = await ResumeBuilder.findOne({ user: application.applicant }).sort({ updatedAt: -1 }).lean();
        const uploadedResume = application.resumeId
            ? await Resume.findById(application.resumeId).lean()
            : await Resume.findOne({ user: application.applicant, isProcessed: true }).sort({ createdAt: -1 }).lean();

        // Generate signed URL if Cloudinary asset exists
        let signedResumeUrl = null;
        if (uploadedResume?.cloudinaryPublicId) {
            signedResumeUrl = getSignedResumeInlineUrl(uploadedResume.cloudinaryPublicId, "raw", "resume.pdf", 900);
        } else if (uploadedResume?.fileUrl) {
            signedResumeUrl = uploadedResume.fileUrl;
        } else if (application.resumeUrl) {
            signedResumeUrl = application.resumeUrl;
        }

        return res.json({
            success: true,
            application,
            candidate: {
                _id: candidateUser?._id,
                fullName: candidateUser?.fullName || application.fullName,
                email: candidateUser?.email || application.email,
                avatar: candidateUser?.avatar,
            },
            candidateProfile: candidateProfile || null,
            resumeBuilder: resumeBuilder || null,
            resumeUrl: signedResumeUrl,
            job: {
                id: job._id,
                title: job.title,
                company: job.company,
                requiredSkills: job.requiredSkills || [],
                preferredSkills: job.preferredSkills || [],
            },
        });
    } catch (err) {
        console.error("API getCandidateProfileForRecruiter error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch candidate profile details.",
        });
    }
};

// Recruiter: Update Candidate Application Status (reviewed / shortlisted / rejected) with Feedback & Email Dispatch
module.exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        const validStatuses = ["applied", "reviewed", "shortlisted", "rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid application status." });
        }

        const application = await JobApplication.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        // Verify the job belongs to the logged in recruiter
        const job = await Job.findOne({ _id: application.job, recruiter: req.user._id });
        if (!job) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        application.status = status;
        if (typeof feedback === "string") {
            application.recruiterFeedback = feedback.trim();
        }
        application.reviewedAt = new Date();
        await application.save();

        // Dispatch transactional status update email alert to candidate (resilient to SMTP offline)
        let emailDispatched = false;
        let recipientEmail = null;
        try {
            const candidateUser = await User.findById(application.applicant).lean();
            recipientEmail = application.email || candidateUser?.email;
            if (recipientEmail) {
                const info = await emailService.sendApplicationStatusUpdateEmail({
                    to: recipientEmail,
                    candidateName: application.fullName || candidateUser?.fullName || "Candidate",
                    jobTitle: job.title,
                    company: job.company,
                    status,
                    recruiterFeedback: application.recruiterFeedback,
                });
                emailDispatched = Boolean(info && (info.messageId || info.accepted?.length > 0));
            }
        } catch (emailErr) {
            console.warn("[JobApplication Email Alert] Notice:", emailErr.message);
        }

        return res.json({
            success: true,
            message: `Candidate status updated to ${status}.`,
            application,
            emailDispatched,
            recipientEmail,
        });
    } catch (err) {
        console.error("API updateApplicationStatus error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update application status.",
        });
    }
};

// Job Seeker: Withdraw Application
module.exports.withdrawApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        const application = await JobApplication.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        if (!application.applicant.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You can only withdraw your own applications.",
            });
        }

        await JobApplication.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Application withdrawn successfully.",
        });
    } catch (err) {
        console.error("API withdrawApplication error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to withdraw application.",
        });
    }
};

// Job Seeker: Get all applications submitted by the logged in job seeker
module.exports.getMyApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find({ applicant: req.user._id })
            .populate({
                path: "job",
                select: "title company location jobType salary experienceLevel trustScore trustStatus applicationUrl isActive requiredSkills",
            })
            .sort({ appliedAt: -1 })
            .lean();

        const stats = {
            total: applications.length,
            applied: applications.filter((a) => a.status === "applied").length,
            reviewed: applications.filter((a) => a.status === "reviewed").length,
            shortlisted: applications.filter((a) => a.status === "shortlisted").length,
            rejected: applications.filter((a) => a.status === "rejected").length,
        };

        return res.json({
            success: true,
            stats,
            applications,
        });
    } catch (err) {
        console.error("API getMyApplications error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your applications.",
        });
    }
};
