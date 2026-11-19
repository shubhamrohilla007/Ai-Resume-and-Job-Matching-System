const fs = require("fs");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const JobApplication = require("../models/JobApplication");
const cloudinaryService = require("./cloudinaryService");

/**
 * Storage Cleanup & Lifecycle Management Service
 *
 * Prevents Cloudinary storage leaks and DB bloat by:
 * 1. Purging obsolete previous standalone resumes when a user uploads a newer version.
 * 2. Protecting any resume linked to an existing JobApplication (for recruiter auditing).
 * 3. Providing periodic / on-demand batch cleanup of unlinked trial resumes.
 */

/**
 * Purges obsolete unlinked resumes for a specific user before/after a new upload.
 * Keeps at most `keepRecentCount` unlinked resumes (default 0, meaning only the newest will stay).
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Object} [options]
 * @param {number} [options.keepRecentCount=0] Number of older unlinked resumes to retain.
 * @returns {Promise<{ purgedCount: number, bytesFreed: number, preservedCount: number }>}
 */
async function purgeObsoleteUserResumes(userId, options = {}) {
    if (!userId) return { purgedCount: 0, bytesFreed: 0, preservedCount: 0 };
    if (mongoose.connection.readyState !== 1) {
        return { purgedCount: 0, bytesFreed: 0, preservedCount: 0, skipped: "Database not connected" };
    }

    const { keepRecentCount = 0 } = options;

    try {
        // 1. Identify all resume IDs associated with submitted job applications by this candidate
        const appliedResumeIds = await JobApplication.distinct("resume", { applicant: userId });
        const appliedIdSet = new Set(appliedResumeIds.filter(Boolean).map((id) => id.toString()));

        // 2. Fetch all resumes belonging to this user, ordered by creation date descending (newest first)
        const userResumes = await Resume.find({ user: userId }).sort({ createdAt: -1 });

        let unlinkedSeen = 0;
        let purgedCount = 0;
        let bytesFreed = 0;
        let preservedCount = 0;

        for (const oldRes of userResumes) {
            const isApplied = appliedIdSet.has(oldRes._id.toString());

            // If the resume was used to apply for a job, NEVER delete it!
            if (isApplied) {
                preservedCount++;
                continue;
            }

            // If this is an unlinked resume, check if it's within the allowed keep window
            if (unlinkedSeen < keepRecentCount) {
                unlinkedSeen++;
                preservedCount++;
                continue;
            }

            // Exceeded allowed retention: purge Cloudinary asset
            if (oldRes.cloudinaryPublicId) {
                try {
                    await cloudinaryService.deleteCloudinaryAsset(
                        oldRes.cloudinaryPublicId,
                        oldRes.resourceType || "raw"
                    );
                } catch (cloudErr) {
                    console.warn(`[Storage Purge] Cloudinary delete warning for ${oldRes.cloudinaryPublicId}:`, cloudErr.message);
                }
            }

            // Remove local fallback file if present on disk
            if (oldRes.storageProvider === "local" && oldRes.filePath && fs.existsSync(oldRes.filePath)) {
                try {
                    fs.unlinkSync(oldRes.filePath);
                } catch (fsErr) {
                    console.warn(`[Storage Purge] Local unlink warning for ${oldRes.filePath}:`, fsErr.message);
                }
            }

            bytesFreed += Number(oldRes.fileSize || 0);
            purgedCount++;

            // Delete MongoDB record
            await Resume.deleteOne({ _id: oldRes._id });
        }

        return { purgedCount, bytesFreed, preservedCount };
    } catch (err) {
        console.error("[Storage Purge Error] purgeObsoleteUserResumes:", err.message);
        return { purgedCount: 0, bytesFreed: 0, preservedCount: 0, error: err.message };
    }
}

/**
 * Batch cleanup of trial/orphaned resumes older than `retentionDays`.
 * Safe against active recruiter workflows: strictly skips resumes referenced in JobApplications.
 *
 * @param {Object} [options]
 * @param {number} [options.retentionDays=30]
 * @returns {Promise<{ scanned: number, purgedCount: number, bytesFreed: number, preservedCount: number }>}
 */
async function cleanupExpiredOrphanedResumes(options = {}) {
    if (mongoose.connection.readyState !== 1) {
        return { scanned: 0, purgedCount: 0, bytesFreed: 0, preservedCount: 0, skipped: "Database not connected" };
    }
    const { retentionDays = 30 } = options;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
        // Distinct set of all applied resumes across the entire platform
        const appliedResumeIds = await JobApplication.distinct("resume");
        const appliedIdSet = new Set(appliedResumeIds.filter(Boolean).map((id) => id.toString()));

        // Find candidate resumes created before cutoff date
        const expiredResumes = await Resume.find({ createdAt: { $lt: cutoffDate } });

        let purgedCount = 0;
        let bytesFreed = 0;
        let preservedCount = 0;

        for (const oldRes of expiredResumes) {
            if (appliedIdSet.has(oldRes._id.toString())) {
                preservedCount++;
                continue;
            }

            if (oldRes.cloudinaryPublicId) {
                try {
                    await cloudinaryService.deleteCloudinaryAsset(
                        oldRes.cloudinaryPublicId,
                        oldRes.resourceType || "raw"
                    );
                } catch (cloudErr) {
                    console.warn(`[Batch Purge] Cloudinary delete warning for ${oldRes.cloudinaryPublicId}:`, cloudErr.message);
                }
            }

            if (oldRes.storageProvider === "local" && oldRes.filePath && fs.existsSync(oldRes.filePath)) {
                try {
                    fs.unlinkSync(oldRes.filePath);
                } catch (fsErr) {
                    console.warn(`[Batch Purge] Local unlink warning for ${oldRes.filePath}:`, fsErr.message);
                }
            }

            bytesFreed += Number(oldRes.fileSize || 0);
            purgedCount++;
            await Resume.deleteOne({ _id: oldRes._id });
        }

        return {
            scanned: expiredResumes.length,
            purgedCount,
            bytesFreed,
            preservedCount,
        };
    } catch (err) {
        console.error("[Batch Purge Error] cleanupExpiredOrphanedResumes:", err.message);
        return { scanned: 0, purgedCount: 0, bytesFreed: 0, preservedCount: 0, error: err.message };
    }
}

module.exports = {
    purgeObsoleteUserResumes,
    cleanupExpiredOrphanedResumes,
};
