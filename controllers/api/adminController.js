const mongoose = require("mongoose");
const User = require("../../models/User");
const Job = require("../../models/Job");
const JobApplication = require("../../models/JobApplication");
const Resume = require("../../models/Resume");
const ResumeBuilder = require("../../models/ResumeBuilder");
const Profile = require("../../models/Profile");
const AuditLog = require("../../models/AuditLog");

/**
 * Helper to record administrative actions into MongoDB Atlas audit logs.
 */
async function logAdminActivity(req, actionType, targetEntity, targetId = "", details = "") {
    try {
        if (!req.user) return;
        await AuditLog.create({
            admin: req.user._id,
            adminName: req.user.fullName || "Administrator",
            adminEmail: req.user.email || "",
            actionType,
            targetEntity,
            targetId: String(targetId),
            details: String(details),
            ipAddress: req.ip || req.connection?.remoteAddress || "",
        });
    } catch (err) {
        console.warn("[Admin AuditLog Warning] Failed to persist audit log:", err.message);
    }
}

/**
 * 1. Admin Overview & Comprehensive Platform Metrics
 */
module.exports.getOverview = async (req, res) => {
    try {
        const [
            totalUsers,
            roleCounts,
            activeUsersCount,
            totalJobs,
            activeJobs,
            trustCounts,
            totalResumes,
            totalApplications,
            atsStats,
            recentUsers,
            recentApplications,
        ] = await Promise.all([
            User.countDocuments(),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            User.countDocuments({ isActive: { $ne: false } }),
            Job.countDocuments(),
            Job.countDocuments({ isActive: true }),
            Job.aggregate([{ $group: { _id: "$trustStatus", count: { $sum: 1 } } }]),
            Resume.countDocuments(),
            JobApplication.countDocuments(),
            Resume.aggregate([
                { $match: { atsScore: { $ne: null, $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        avgScore: { $avg: "$atsScore" },
                        maxScore: { $max: "$atsScore" },
                        minScore: { $min: "$atsScore" },
                        count: { $sum: 1 },
                    },
                },
            ]),
            // Recent user registrations (last 7 days grouped by date)
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Recent applications (last 7 days grouped by date)
            JobApplication.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const usersByRole = {
            job_seeker: 0,
            recruiter: 0,
            admin: 0,
        };
        roleCounts.forEach((r) => {
            if (r._id && usersByRole.hasOwnProperty(r._id)) {
                usersByRole[r._id] = r.count;
            }
        });

        const jobsByTrustStatus = {
            approved: 0,
            "needs-review": 0,
            blocked: 0,
        };
        trustCounts.forEach((t) => {
            if (t._id && jobsByTrustStatus.hasOwnProperty(t._id)) {
                jobsByTrustStatus[t._id] = t.count;
            }
        });

        const atsSummary = atsStats[0] || {
            avgScore: 0,
            maxScore: 0,
            minScore: 0,
            count: 0,
        };

        return res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsersCount,
                inactiveUsersCount: totalUsers - activeUsersCount,
                usersByRole,
                totalJobs,
                activeJobs,
                inactiveJobs: totalJobs - activeJobs,
                jobsByTrustStatus,
                totalResumes,
                totalApplications,
                atsScoreStats: {
                    average: Math.round(atsSummary.avgScore || 0),
                    max: atsSummary.maxScore || 0,
                    min: atsSummary.minScore || 0,
                    evaluatedCount: atsSummary.count || 0,
                },
                trends: {
                    userRegistrations: recentUsers,
                    jobApplications: recentApplications,
                },
            },
        });
    } catch (err) {
        console.error("Admin getOverview error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve admin dashboard metrics.",
        });
    }
};

/**
 * 2. Admin: List Users (Paginated, Searchable, Filterable by role and status)
 */
module.exports.getUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.role && ["job_seeker", "recruiter", "admin"].includes(req.query.role)) {
            query.role = req.query.role;
        }
        if (req.query.status === "active") {
            query.isActive = { $ne: false };
        } else if (req.query.status === "inactive") {
            query.isActive = false;
        }
        if (req.query.authProvider && ["local", "google"].includes(req.query.authProvider)) {
            query.authProvider = req.query.authProvider;
        }
        if (req.query.search && String(req.query.search).trim()) {
            const regex = new RegExp(String(req.query.search).trim(), "i");
            query.$or = [{ fullName: regex }, { email: regex }];
        }

        const [rawUsers, total] = await Promise.all([
            User.find(query)
                .select("-salt -hash -passwordResetTokenHash")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        // Enrich users with resume counts and application counts
        const userIds = rawUsers.map((u) => u._id);
        const [resumesByUser, appsByUser] = await Promise.all([
            Resume.aggregate([
                { $match: { user: { $in: userIds } } },
                { $group: { _id: "$user", count: { $sum: 1 }, latestScore: { $last: "$atsScore" } } },
            ]),
            JobApplication.aggregate([
                { $match: { applicant: { $in: userIds } } },
                { $group: { _id: "$applicant", count: { $sum: 1 } } },
            ]),
        ]);

        const resumeMap = new Map();
        resumesByUser.forEach((r) => resumeMap.set(String(r._id), r));

        const appMap = new Map();
        appsByUser.forEach((a) => appMap.set(String(a._id), a.count));

        const users = rawUsers.map((u) => {
            const rData = resumeMap.get(String(u._id));
            return {
                ...u,
                isActive: u.isActive !== false,
                resumeCount: rData ? rData.count : 0,
                latestAtsScore: rData ? rData.latestScore : null,
                applicationCount: appMap.get(String(u._id)) || 0,
            };
        });

        return res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getUsers error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve users.",
        });
    }
};

/**
 * 3. Admin: Update User Role (with Self-Demotion & Last-Admin Protection)
 */
module.exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !["job_seeker", "recruiter", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Valid role is required ('job_seeker', 'recruiter', 'admin').",
            });
        }

        if (String(id) === String(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: "Admins cannot modify their own role.",
            });
        }

        const user = await User.findById(id).select("-salt -hash -passwordResetTokenHash");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Prevent demoting the last active administrator
        if (user.role === "admin" && role !== "admin") {
            const adminCount = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot demote the last remaining administrator.",
                });
            }
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        await logAdminActivity(
            req,
            "USER_ROLE_CHANGE",
            "User",
            user._id,
            `Changed role of ${user.fullName} (${user.email}) from ${oldRole} to ${role}`
        );

        return res.json({
            success: true,
            message: `User role changed from ${oldRole} to ${role} successfully.`,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive !== false,
            },
        });
    } catch (err) {
        console.error("Admin updateUserRole error:", err);
        return res.status(500).json({ success: false, message: "Unable to update user role." });
    }
};

/**
 * 4. Admin: Toggle User Account Status (Activate / Suspend)
 */
module.exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be a boolean (true or false).",
            });
        }

        if (String(id) === String(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: "Admins cannot deactivate their own account.",
            });
        }

        const user = await User.findById(id).select("-salt -hash -passwordResetTokenHash");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === "admin" && !isActive) {
            const adminCount = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot deactivate the last active administrator.",
                });
            }
        }

        user.isActive = isActive;
        await user.save();

        await logAdminActivity(
            req,
            "USER_STATUS_CHANGE",
            "User",
            user._id,
            `${isActive ? "Activated" : "Suspended"} account for ${user.fullName} (${user.email})`
        );

        return res.json({
            success: true,
            message: `Account has been ${isActive ? "activated" : "suspended"} successfully.`,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error("Admin updateUserStatus error:", err);
        return res.status(500).json({ success: false, message: "Unable to update user status." });
    }
};

/**
 * 5. Admin: Delete User (with Self-Deletion & Last-Admin Guards, Cascade Cleanup)
 */
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(id) === String(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: "Admins cannot delete their own account.",
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === "admin") {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete the last remaining administrator.",
                });
            }
        }

        await User.findByIdAndDelete(id);

        // Cascade cleanup
        await Promise.all([
            Resume.deleteMany({ user: id }),
            ResumeBuilder.deleteMany({ user: id }),
            Profile.deleteMany({ user: id }),
            JobApplication.deleteMany({ applicant: id }),
            (async () => {
                const recruiterJobs = await Job.find({ recruiter: id }).select("_id").lean();
                const jobIds = recruiterJobs.map((j) => j._id);
                if (jobIds.length > 0) {
                    await JobApplication.deleteMany({ job: { $in: jobIds } });
                    await Job.deleteMany({ recruiter: id });
                }
            })(),
        ]);

        await logAdminActivity(
            req,
            "USER_DELETED",
            "User",
            id,
            `Permanently deleted user ${user.fullName} (${user.email}, ${user.role}) and associated records`
        );

        return res.json({
            success: true,
            message: "User and all associated data deleted successfully.",
        });
    } catch (err) {
        console.error("Admin deleteUser error:", err);
        return res.status(500).json({ success: false, message: "Unable to delete user." });
    }
};

/**
 * 6. Admin: Recruiter Directory with Job and Applicant Counts
 */
module.exports.getRecruiters = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const query = { role: "recruiter" };
        if (req.query.search && String(req.query.search).trim()) {
            const regex = new RegExp(String(req.query.search).trim(), "i");
            query.$or = [{ fullName: regex }, { email: regex }];
        }

        const [recruiters, total] = await Promise.all([
            User.find(query)
                .select("-salt -hash -passwordResetTokenHash")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        const recruiterIds = recruiters.map((r) => r._id);

        // Aggregate jobs and applicants for these recruiters
        const [jobsByRecruiter, appsByRecruiter] = await Promise.all([
            Job.aggregate([
                { $match: { recruiter: { $in: recruiterIds } } },
                {
                    $group: {
                        _id: "$recruiter",
                        totalJobs: { $sum: 1 },
                        activeJobs: { $sum: { $cond: ["$isActive", 1, 0] } },
                    },
                },
            ]),
            JobApplication.aggregate([
                {
                    $lookup: {
                        from: "jobs",
                        localField: "job",
                        foreignField: "_id",
                        as: "jobDoc",
                    },
                },
                { $unwind: "$jobDoc" },
                { $match: { "jobDoc.recruiter": { $in: recruiterIds } } },
                {
                    $group: {
                        _id: "$jobDoc.recruiter",
                        totalApplicants: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const jobStatsMap = new Map();
        jobsByRecruiter.forEach((j) => jobStatsMap.set(String(j._id), j));

        const appStatsMap = new Map();
        appsByRecruiter.forEach((a) => appStatsMap.set(String(a._id), a.totalApplicants));

        const enriched = recruiters.map((r) => {
            const j = jobStatsMap.get(String(r._id)) || { totalJobs: 0, activeJobs: 0 };
            return {
                ...r,
                isActive: r.isActive !== false,
                totalJobs: j.totalJobs,
                activeJobs: j.activeJobs,
                totalApplicants: appStatsMap.get(String(r._id)) || 0,
            };
        });

        return res.json({
            success: true,
            recruiters: enriched,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getRecruiters error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve recruiters." });
    }
};

/**
 * 7. Admin: Platform Jobs Moderation List
 */
module.exports.getJobs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.trustStatus && ["approved", "needs-review", "blocked"].includes(req.query.trustStatus)) {
            query.trustStatus = req.query.trustStatus;
        }
        if (typeof req.query.isActive !== "undefined") {
            query.isActive = req.query.isActive === "true" || req.query.isActive === true;
        }
        if (req.query.search && String(req.query.search).trim()) {
            const regex = new RegExp(String(req.query.search).trim(), "i");
            query.$or = [{ title: regex }, { company: regex }, { location: regex }];
        }

        const [rawJobs, total] = await Promise.all([
            Job.find(query)
                .populate("recruiter", "fullName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Job.countDocuments(query),
        ]);

        // Count applicants for each job
        const jobIds = rawJobs.map((j) => j._id);
        const applicantCounts = await JobApplication.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: "$job", count: { $sum: 1 } } },
        ]);

        const countMap = new Map();
        applicantCounts.forEach((c) => countMap.set(String(c._id), c.count));

        const jobs = rawJobs.map((j) => ({
            ...j,
            applicantCount: countMap.get(String(j._id)) || 0,
        }));

        return res.json({
            success: true,
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getJobs error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve platform jobs." });
    }
};

/**
 * 8. Admin: Moderate Job (Active Status / Trust Status Override)
 */
module.exports.updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, trustStatus, trustStatusLabel } = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        const changes = [];
        if (typeof isActive === "boolean") {
            changes.push(`isActive: ${job.isActive} -> ${isActive}`);
            job.isActive = isActive;
        }
        if (trustStatus && ["approved", "needs-review", "blocked"].includes(trustStatus)) {
            changes.push(`trustStatus: ${job.trustStatus} -> ${trustStatus}`);
            job.trustStatus = trustStatus;
            if (trustStatus === "blocked") {
                job.isActive = false;
            }
        }
        if (trustStatusLabel && typeof trustStatusLabel === "string") {
            job.trustStatusLabel = trustStatusLabel.trim();
        }

        await job.save();

        await logAdminActivity(
            req,
            "JOB_STATUS_CHANGE",
            "Job",
            job._id,
            `Moderated job "${job.title}" at ${job.company}: ${changes.join(", ")}`
        );

        return res.json({
            success: true,
            message: "Job status updated successfully.",
            job,
        });
    } catch (err) {
        console.error("Admin updateJobStatus error:", err);
        return res.status(500).json({ success: false, message: "Unable to update job status." });
    }
};

/**
 * 9. Admin: Delete Job
 */
module.exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findByIdAndDelete(id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found." });
        }

        await JobApplication.deleteMany({ job: id });

        await logAdminActivity(
            req,
            "JOB_DELETED",
            "Job",
            id,
            `Deleted job "${job.title}" at ${job.company} and associated applications`
        );

        return res.json({
            success: true,
            message: "Job and its applications removed by administrator.",
        });
    } catch (err) {
        console.error("Admin deleteJob error:", err);
        return res.status(500).json({ success: false, message: "Unable to delete job." });
    }
};

/**
 * 10. Admin: Resume & ATS Metadata Management
 */
module.exports.getResumes = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [rawResumes, total] = await Promise.all([
            Resume.find()
                .populate("user", "fullName email role isActive")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Resume.countDocuments(),
        ]);

        const resumes = rawResumes.map((r) => ({
            id: r._id,
            candidateName: r.user?.fullName || "Unknown",
            candidateEmail: r.user?.email || "Unknown",
            originalName: r.originalName,
            fileType: r.fileType,
            fileSize: r.fileSize,
            storageProvider: r.storageProvider,
            atsScore: r.atsScore,
            summary: r.summary,
            extractedSkillsCount: Array.isArray(r.extractedSkills) ? r.extractedSkills.length : 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));

        return res.json({
            success: true,
            resumes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getResumes error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve resumes." });
    }
};

/**
 * 11. Admin: Platform Job Applications Monitoring
 */
module.exports.getApplications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status && ["applied", "reviewed", "shortlisted", "rejected"].includes(req.query.status)) {
            query.status = req.query.status;
        }

        const [rawApps, total] = await Promise.all([
            JobApplication.find(query)
                .populate("job", "title company location salary jobType recruiter")
                .populate("applicant", "fullName email")
                .sort({ appliedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobApplication.countDocuments(query),
        ]);

        const applications = rawApps.map((a) => ({
            id: a._id,
            jobTitle: a.job?.title || "Unknown Job",
            company: a.job?.company || "Unknown Company",
            candidateName: a.fullName || a.applicant?.fullName || "Candidate",
            candidateEmail: a.email || a.applicant?.email || "",
            status: a.status,
            coverNote: a.coverNote,
            skills: a.skills,
            appliedAt: a.appliedAt || a.createdAt,
        }));

        return res.json({
            success: true,
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getApplications error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve applications." });
    }
};

/**
 * 12. Admin: Activity & Audit Logs with CSV Export Support
 */
module.exports.getActivityLogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.actionType) {
            query.actionType = req.query.actionType;
        }
        if (req.query.search && String(req.query.search).trim()) {
            const regex = new RegExp(String(req.query.search).trim(), "i");
            query.$or = [{ adminName: regex }, { details: regex }, { targetEntity: regex }];
        }

        // CSV export
        if (req.query.format === "csv") {
            const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();
            const header = "Timestamp,Admin Name,Admin Email,Action,Target Entity,Target ID,Details\n";
            const rows = logs
                .map((l) =>
                    [
                        `"${new Date(l.createdAt).toISOString()}"`,
                        `"${l.adminName.replace(/"/g, '""')}"`,
                        `"${l.adminEmail.replace(/"/g, '""')}"`,
                        `"${l.actionType}"`,
                        `"${l.targetEntity}"`,
                        `"${l.targetId}"`,
                        `"${l.details.replace(/"/g, '""')}"`,
                    ].join(",")
                )
                .join("\n");

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", 'attachment; filename="admin_audit_logs.csv"');
            return res.status(200).send(header + rows);
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AuditLog.countDocuments(query),
        ]);

        return res.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("Admin getActivityLogs error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve activity logs." });
    }
};

/**
 * 13. Admin: System Health Diagnostics
 */
module.exports.getSystemHealth = async (req, res) => {
    try {
        const dbConnected = mongoose.connection.readyState === 1;
        const memoryUsage = process.memoryUsage();

        return res.json({
            success: true,
            system: {
                status: dbConnected ? "healthy" : "degraded",
                uptimeSeconds: Math.floor(process.uptime()),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || "development",
                database: {
                    status: dbConnected ? "connected" : "disconnected",
                    clusterHost: mongoose.connection.host || "MongoDB Atlas",
                    databaseName: mongoose.connection.name || "ai_resume_system",
                },
                services: {
                    cloudinary: Boolean(process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME),
                    geminiAI: Boolean(process.env.GEMINI_API_KEY),
                    smtpEmail: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
                    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
                },
                memory: {
                    heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
                },
            },
        });
    } catch (err) {
        console.error("Admin getSystemHealth error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve system health." });
    }
};

/**
 * 23. Trigger Storage Cleanup for Expired / Unlinked Trial Resumes
 */
module.exports.runStorageCleanup = async (req, res) => {
    try {
        const { cleanupExpiredOrphanedResumes } = require("../../services/storageCleanupService");
        const retentionDays = parseInt(req.body?.retentionDays || req.query?.retentionDays || "30", 10);

        const result = await cleanupExpiredOrphanedResumes({ retentionDays });

        await logAdminActivity(
            req,
            "STORAGE_CLEANUP",
            "Resume",
            "",
            `Purged ${result.purgedCount} orphaned resumes (${Math.round(result.bytesFreed / 1024)} KB freed, ${result.preservedCount} preserved)`
        );

        return res.status(200).json({
            success: true,
            message: `Storage cleanup completed: ${result.purgedCount} unlinked trial resumes purged, ${result.preservedCount} applied resumes preserved.`,
            stats: result,
        });
    } catch (err) {
        console.error("Admin runStorageCleanup error:", err);
        return res.status(500).json({ success: false, message: "Failed to execute storage cleanup." });
    }
};
