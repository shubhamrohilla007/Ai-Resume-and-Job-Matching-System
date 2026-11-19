const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const upload = require("../config/multer");
const photoUpload = require("../config/photoMulter");

const { requireAuth, requireRole, requireAnyRole } = require("../middleware/apiAuth");
const { passwordResetRateLimiter } = require("../middleware/passwordResetLimiter");

const authController = require("../controllers/api/authController");
const profileController = require("../controllers/api/profileController");
const resumeController = require("../controllers/api/resumeController");
const resumeBuilderController = require("../controllers/api/resumeBuilderController");
const jobController = require("../controllers/api/jobController");
const courseController = require("../controllers/api/courseController");
const adminController = require("../controllers/api/adminController");
const feedbackController = require("../controllers/api/feedbackController");

// ==========================================
// Health & Diagnostic Check
// ==========================================
router.get("/health", (req, res) => {
    return res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        },
    });
});

// ==========================================
// Authentication Endpoints
// ==========================================
router.post("/auth/signup", authController.signup);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", authController.getCurrentUser);
router.post("/auth/forgot-password", passwordResetRateLimiter, authController.forgotPassword);
router.get("/auth/verify-reset-token", authController.verifyResetToken);
router.post("/auth/verify-reset-token", authController.verifyResetToken);
router.post("/auth/reset-password", authController.resetPassword);
router.get("/auth/email-status", authController.getEmailStatus);
router.post("/auth/verify-smtp", authController.verifySmtp);
router.get("/auth/google", authController.googleAuth);
router.get("/auth/google/callback", authController.googleCallback);
router.get("/auth/google/status", authController.getGoogleAuthStatus);

// ==========================================
// Candidate Profile Endpoints
// ==========================================
router.get("/profile", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), profileController.getProfile);
router.post("/profile", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), profileController.saveProfile);
router.put("/profile", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), profileController.saveProfile);

// ==========================================
// Resume Upload & ATS Analysis Endpoints
// ==========================================
router.post("/resume/upload", requireAuth, requireRole("job_seeker"), upload.single("resume"), resumeController.uploadResume);
router.post("/resume/analyze-only", requireAuth, requireRole("job_seeker"), upload.single("resume"), (req, res, next) => {
    req.query.mode = "preview";
    return resumeController.uploadResume(req, res, next);
});
router.get("/resume/analysis", requireAuth, requireRole("job_seeker"), resumeController.getAnalysis);
router.get("/resume/list", requireAuth, requireRole("job_seeker"), resumeController.getResumesList);
router.get("/resume/file", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), resumeController.serveResumeFile);
router.get("/resume/download", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), resumeController.downloadResumeFile);
router.delete("/resume/:id", requireAuth, requireRole("job_seeker"), resumeController.deleteResume);
router.post("/resume/clean-old", requireAuth, requireRole("job_seeker"), resumeController.cleanOldResumes);

// ==========================================
// Resume Builder & AI Generator Endpoints
// ==========================================
router.get("/resume-builder", requireAuth, requireRole("job_seeker"), resumeBuilderController.getResume);
router.post("/resume-builder", requireAuth, requireRole("job_seeker"), resumeBuilderController.saveResume);
router.post("/resume-builder/ai-generate", requireAuth, requireRole("job_seeker"), resumeBuilderController.generateAIResume);
router.post("/resume-builder/ai-improve", requireAuth, requireRole("job_seeker"), resumeBuilderController.improveSection);
router.post("/resume-builder/photo", requireAuth, requireRole("job_seeker"), photoUpload.single("photo"), resumeBuilderController.uploadPhoto);
router.delete("/resume-builder/photo", requireAuth, requireRole("job_seeker"), resumeBuilderController.deletePhoto);
router.post("/resume-builder/optimize-one-page", requireAuth, requireRole("job_seeker"), resumeBuilderController.optimizeOnePage);
router.post("/resume-builder/ai-tailor", requireAuth, requireRole("job_seeker"), resumeBuilderController.tailorResumeForJob);

// ==========================================
// Job Matching & Application Endpoints
// ==========================================
router.get("/jobs/recommended", requireAuth, requireRole("job_seeker"), jobController.getRecommendedJobs);
router.get("/jobs/my-applications", requireAuth, requireRole("job_seeker"), jobController.getMyApplications);
router.post("/jobs/:id/apply", requireAuth, requireRole("job_seeker"), jobController.applyToJob);
router.delete("/jobs/applications/:id/withdraw", requireAuth, requireRole("job_seeker"), jobController.withdrawApplication);
router.get("/jobs/public", jobController.getPublicJobs);
router.get("/jobs/:id", jobController.getJobById);

// ==========================================
// Recruiter Job Management & Applicant Tracking
// ==========================================
router.get("/recruiter/jobs", requireAuth, requireRole("recruiter"), jobController.getRecruiterJobs);
router.post("/recruiter/jobs", requireAuth, requireRole("recruiter"), jobController.createJob);
router.put("/recruiter/jobs/:id", requireAuth, requireRole("recruiter"), jobController.editJob);
router.post("/recruiter/jobs/audit-preview", requireAuth, requireRole("recruiter"), jobController.auditPreview);
router.patch("/recruiter/jobs/:id/toggle", requireAuth, requireRole("recruiter"), jobController.toggleJobStatus);
router.delete("/recruiter/jobs/:id", requireAuth, requireRole("recruiter"), jobController.deleteJob);
router.get("/recruiter/jobs/:id/applications", requireAuth, requireRole("recruiter"), jobController.getJobApplications);
router.patch("/recruiter/applications/:id/status", requireAuth, requireRole("recruiter"), jobController.updateApplicationStatus);
router.get("/recruiter/applications/:id/candidate-profile", requireAuth, requireRole("recruiter"), jobController.getCandidateProfileForRecruiter);

// ==========================================
// Universal Platform Feedback Endpoints
// ==========================================
router.post("/feedback", requireAuth, feedbackController.submitFeedback);
router.get("/feedback/my", requireAuth, feedbackController.getMyFeedback);
router.get("/admin/feedback", requireAuth, requireRole("admin"), feedbackController.getAdminFeedback);
router.patch("/admin/feedback/:id", requireAuth, requireRole("admin"), feedbackController.updateFeedbackStatus);
router.delete("/admin/feedback/:id", requireAuth, requireRole("admin"), feedbackController.deleteFeedback);

// ==========================================
// TrustBridge Verified Free Courses Endpoints
// ==========================================
router.get("/courses", courseController.getCourses);
router.get("/courses/recommendations", courseController.getRecommendations);

// ==========================================
// Admin Management Endpoints
// ==========================================
router.get("/admin/overview", requireAuth, requireRole("admin"), adminController.getOverview);
router.get("/admin/users", requireAuth, requireRole("admin"), adminController.getUsers);
router.patch("/admin/users/:id/role", requireAuth, requireRole("admin"), adminController.updateUserRole);
router.patch("/admin/users/:id/status", requireAuth, requireRole("admin"), adminController.updateUserStatus);
router.delete("/admin/users/:id", requireAuth, requireRole("admin"), adminController.deleteUser);
router.get("/admin/recruiters", requireAuth, requireRole("admin"), adminController.getRecruiters);
router.get("/admin/jobs", requireAuth, requireRole("admin"), adminController.getJobs);
router.patch("/admin/jobs/:id/status", requireAuth, requireRole("admin"), adminController.updateJobStatus);
router.delete("/admin/jobs/:id", requireAuth, requireRole("admin"), adminController.deleteJob);
router.get("/admin/resumes", requireAuth, requireRole("admin"), adminController.getResumes);
router.get("/admin/applications", requireAuth, requireRole("admin"), adminController.getApplications);
router.get("/admin/logs", requireAuth, requireRole("admin"), adminController.getActivityLogs);
router.get("/admin/system-health", requireAuth, requireRole("admin"), adminController.getSystemHealth);
router.post("/admin/storage/cleanup", requireAuth, requireRole("admin"), adminController.runStorageCleanup);

module.exports = router;
