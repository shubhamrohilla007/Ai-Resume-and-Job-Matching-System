#!/usr/bin/env node
/**
 * Local Files to Cloudinary Migration Utility
 *
 * Scans local uploads/ directory and matches records in MongoDB (Resume and ResumeBuilder).
 * In dry-run mode, audits files and models without making network or DB changes.
 * In execute mode, streams files to Cloudinary, stores cloud metadata in MongoDB,
 * and preserves local files safely on disk.
 *
 * Usage:
 *   node scripts/migrate_local_files_to_cloudinary.js --dry-run
 *   node scripts/migrate_local_files_to_cloudinary.js --execute
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Resume = require("../models/Resume");
const ResumeBuilder = require("../models/ResumeBuilder");
const cloudinaryService = require("../services/cloudinaryService");

const args = process.argv.slice(2);
const isExecute = args.includes("--execute");
const isDryRun = args.includes("--dry-run") || !isExecute;
const isLocal = args.includes("--local");

const RESUMES_DIR = path.resolve(__dirname, "../uploads/resumes");
const PHOTOS_DIR = path.resolve(__dirname, "../uploads/photos");

async function migrateFiles() {
    console.log("==================================================================");
    console.log("       AI Resume System: Local Files -> Cloudinary Migration      ");
    console.log("==================================================================");
    console.log(`Mode:                 ${isExecute ? "EXECUTE (Live Cloud Upload)" : "DRY-RUN (Audit Only)"}`);
    console.log(`Target Database:      ${isLocal ? "Local MongoDB (127.0.0.1:27017)" : "Cloud Database (from .env)"}`);
    console.log(`Cloudinary Configured:${cloudinaryService.isCloudinaryConfigured() ? " YES" : " NO (fallback mode active)"}`);
    console.log("------------------------------------------------------------------");

    if (isExecute && !cloudinaryService.isCloudinaryConfigured()) {
        console.error("ERROR: Cannot execute Cloudinary migration without CLOUDINARY credentials in .env!");
        console.error("Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
        process.exit(1);
    }

    const customUri = isLocal ? "mongodb://127.0.0.1:27017/ai_resume_system" : null;
    await connectDB(customUri);

    const summary = [];

    try {
        // ==========================================
        // 1. Audit and Migrate Resumes
        // ==========================================
        console.log("\n[1/2] Auditing Candidate Resumes in MongoDB...");
        const resumes = await Resume.find({
            $or: [
                { storageProvider: { $ne: "cloudinary" } },
                { cloudinaryPublicId: null },
                { cloudinaryPublicId: { $exists: false } },
            ],
        });

        console.log(`      Found ${resumes.length} resumes requiring cloud migration.`);

        for (const resume of resumes) {
            let localPath = null;
            if (resume.filePath && fs.existsSync(path.resolve(resume.filePath))) {
                localPath = path.resolve(resume.filePath);
            } else if (resume.fileName && fs.existsSync(path.join(RESUMES_DIR, resume.fileName))) {
                localPath = path.join(RESUMES_DIR, resume.fileName);
            }

            if (!localPath || !fs.existsSync(localPath)) {
                summary.push({
                    type: "Resume",
                    id: String(resume._id),
                    fileName: resume.fileName || resume.originalName,
                    status: "SKIPPED: Local file missing",
                    cloudUrl: "N/A",
                });
                continue;
            }

            const stat = fs.statSync(localPath);

            if (isDryRun) {
                summary.push({
                    type: "Resume",
                    id: String(resume._id),
                    fileName: resume.fileName || resume.originalName,
                    size: `${Math.round(stat.size / 1024)} KB`,
                    status: "DRY-RUN: Ready to upload",
                    cloudUrl: "Pending",
                });
                continue;
            }

            // Execute migration
            try {
                const buffer = await fs.promises.readFile(localPath);
                const cloudResult = await cloudinaryService.uploadResumeStream(
                    buffer,
                    resume.originalName || path.basename(localPath),
                    resume.user
                );

                resume.storageProvider = "cloudinary";
                resume.cloudinaryAssetId = cloudResult.asset_id;
                resume.cloudinaryPublicId = cloudResult.public_id;
                resume.resourceType = cloudResult.resource_type;
                resume.fileFormat = cloudResult.format;
                resume.secureUrl = cloudResult.secure_url;
                await resume.save();

                summary.push({
                    type: "Resume",
                    id: String(resume._id),
                    fileName: resume.originalName || resume.fileName,
                    size: `${Math.round(stat.size / 1024)} KB`,
                    status: "SUCCESS: Migrated",
                    cloudUrl: cloudResult.secure_url,
                });
            } catch (err) {
                summary.push({
                    type: "Resume",
                    id: String(resume._id),
                    fileName: resume.originalName || resume.fileName,
                    status: `ERROR: ${err.message}`,
                    cloudUrl: "Failed",
                });
            }
        }

        // ==========================================
        // 2. Audit and Migrate Profile Photos
        // ==========================================
        console.log("\n[2/2] Auditing Profile Photos in ResumeBuilder...");
        const builders = await ResumeBuilder.find({
            "personal.photoUrl": { $regex: /^\/?uploads\/photos\// },
        });

        console.log(`      Found ${builders.length} profile photos requiring cloud migration.`);

        for (const doc of builders) {
            const rawUrl = doc.personal?.photoUrl || "";
            const photoFileName = path.basename(rawUrl);
            const localPath = path.join(PHOTOS_DIR, photoFileName);

            if (!fs.existsSync(localPath)) {
                summary.push({
                    type: "Profile Photo",
                    id: String(doc._id),
                    fileName: photoFileName,
                    status: "SKIPPED: Local file missing",
                    cloudUrl: "N/A",
                });
                continue;
            }

            const stat = fs.statSync(localPath);

            if (isDryRun) {
                summary.push({
                    type: "Profile Photo",
                    id: String(doc._id),
                    fileName: photoFileName,
                    size: `${Math.round(stat.size / 1024)} KB`,
                    status: "DRY-RUN: Ready to upload",
                    cloudUrl: "Pending",
                });
                continue;
            }

            // Execute migration
            try {
                const buffer = await fs.promises.readFile(localPath);
                const cloudResult = await cloudinaryService.uploadProfilePhotoStream(
                    buffer,
                    photoFileName,
                    doc.user
                );

                doc.personal.photoUrl = cloudResult.secure_url;
                doc.personal.photoPublicId = cloudResult.public_id;
                doc.personal.photoStorageProvider = "cloudinary";
                await doc.save();

                summary.push({
                    type: "Profile Photo",
                    id: String(doc._id),
                    fileName: photoFileName,
                    size: `${Math.round(stat.size / 1024)} KB`,
                    status: "SUCCESS: Migrated",
                    cloudUrl: cloudResult.secure_url,
                });
            } catch (err) {
                summary.push({
                    type: "Profile Photo",
                    id: String(doc._id),
                    fileName: photoFileName,
                    status: `ERROR: ${err.message}`,
                    cloudUrl: "Failed",
                });
            }
        }

        console.log("\n==================================================================");
        console.log("                     MIGRATION AUDIT SUMMARY                      ");
        console.log("==================================================================");
        console.table(summary);
        console.log("------------------------------------------------------------------");
        console.log(`Local files on disk preserved: 100% (No local files were deleted).`);

        if (isDryRun) {
            console.log("Dry-run audit completed safely. To execute live migration:");
            console.log("node scripts/migrate_local_files_to_cloudinary.js --execute");
        } else {
            console.log("Live migration completed successfully.");
        }
        console.log("==================================================================");
    } catch (err) {
        console.error("Migration execution failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    migrateFiles();
}

module.exports = migrateFiles;
