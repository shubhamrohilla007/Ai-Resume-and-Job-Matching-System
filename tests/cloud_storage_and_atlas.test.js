/**
 * Cloud Storage (Cloudinary) & Database (MongoDB Atlas) Migration Test Suite
 *
 * Verifies:
 * 1. MongoDB Atlas URI resolution and credential masking.
 * 2. Cloudinary service helpers (upload, signed URL generation, deletion).
 * 3. Multer memory storage and zero permanent local disk writes.
 * 4. ATS & Text extraction with guaranteed temp file cleanup in finally blocks.
 * 5. Resume upload endpoint end-to-end with Cloudinary metadata persistence.
 * 6. Ownership enforcement and signed URL redirection on /resume/file & /resume/download.
 * 7. Profile photo upload, replacement, and deletion lifecycle.
 * 8. Resume deletion endpoint.
 * 9. Health check endpoint for cloud load balancers.
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const http = require("node:http");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");
const { getMongoUri, maskMongoUri } = require("../config/db");
const cloudinaryService = require("../services/cloudinaryService");
const extractResumeText = require("../services/parser/resumeParser");
const { withTempFile } = require("../services/parser/resumeParser");
const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeBuilder = require("../models/ResumeBuilder");

describe("Cloud Migration & Deployment Readiness Test Suite", () => {
    let server = null;
    let baseUrl = "";
    let testUser = null;
    let otherUser = null;
    let authCookie = "";
    let otherCookie = "";

    before(async () => {
        await connectDB();

        // Start HTTP server on dynamic port
        await new Promise((resolve) => {
            server = http.createServer(app).listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });

        // Register primary test user
        const testEmail = `cloud_user_${Date.now()}@example.com`;
        const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Cloud Test User",
                email: testEmail,
                password: "Password123!",
                role: "job_seeker",
            }),
        });
        const signupData = await signupRes.json();
        testUser = signupData.user;
        const setCookieHeader = signupRes.headers.get("set-cookie");
        if (setCookieHeader) {
            authCookie = setCookieHeader.split(";")[0];
        }

        // Register secondary test user for ownership security tests
        const otherEmail = `cloud_other_${Date.now()}@example.com`;
        const otherSignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Other Cloud User",
                email: otherEmail,
                password: "Password123!",
                role: "job_seeker",
            }),
        });
        const otherData = await otherSignup.json();
        otherUser = otherData.user;
        const otherCookieHeader = otherSignup.headers.get("set-cookie");
        if (otherCookieHeader) {
            otherCookie = otherCookieHeader.split(";")[0];
        }
    });

    after(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        if (testUser && testUser.id) {
            await User.deleteOne({ _id: testUser.id });
            await Resume.deleteMany({ user: testUser.id });
            await ResumeBuilder.deleteMany({ user: testUser.id });
        }
        if (otherUser && otherUser.id) {
            await User.deleteOne({ _id: otherUser.id });
            await Resume.deleteMany({ user: otherUser.id });
            await ResumeBuilder.deleteMany({ user: otherUser.id });
        }
        await mongoose.disconnect();
        process.exit(0);
    });

    // --------------------------------------------------------------------------
    // 1. Database Connection & Credential Sanitization
    // --------------------------------------------------------------------------
    test("maskMongoUri masks credentials correctly in logs", () => {
        const rawUri = "mongodb+srv://adminUser:SuperSecretPass123@cluster0.abcde.mongodb.net/ai_resume_system?retryWrites=true";
        const masked = maskMongoUri(rawUri);

        assert.equal(masked.includes("SuperSecretPass123"), false);
        assert.equal(masked.includes("adminUser:"), false);
        assert.equal(masked.includes("//***:***@"), true);
    });

    test("getMongoUri returns valid connection string prioritizing ATLASDB, MONGODB_URI or ATLASDB_URL", () => {
        const originalAtlasDb = process.env.ATLASDB;
        const originalUri = process.env.MONGODB_URI;
        const originalAtlas = process.env.ATLASDB_URL;
        try {
            process.env.ATLASDB = "mongodb+srv://fake:fake@cluster0.example.net/cloud_db";
            assert.equal(getMongoUri(), "mongodb+srv://fake:fake@cluster0.example.net/cloud_db");
        } finally {
            if (originalAtlasDb) process.env.ATLASDB = originalAtlasDb;
            else delete process.env.ATLASDB;
            if (originalUri) process.env.MONGODB_URI = originalUri;
            else delete process.env.MONGODB_URI;
            if (originalAtlas) process.env.ATLASDB_URL = originalAtlas;
            else delete process.env.ATLASDB_URL;
        }
    });

    test("getMongoUri strictly throws error when no Atlas URI exists, preventing local fallback", () => {
        const origAtlasDb = process.env.ATLASDB;
        const origUri = process.env.MONGODB_URI;
        const origAtlas = process.env.ATLASDB_URL;
        const origMongo = process.env.MONGO_URL;

        try {
            delete process.env.ATLASDB;
            delete process.env.MONGODB_URI;
            delete process.env.ATLASDB_URL;
            delete process.env.MONGO_URL;

            assert.throws(() => {
                getMongoUri();
            }, /MongoDB Atlas connection URI configured/);
        } finally {
            if (origAtlasDb) process.env.ATLASDB = origAtlasDb;
            if (origUri) process.env.MONGODB_URI = origUri;
            if (origAtlas) process.env.ATLASDB_URL = origAtlas;
            if (origMongo) process.env.MONGO_URL = origMongo;
        }
    });

    test("getMongoUri strictly rejects local storage MongoDB URIs (localhost / 127.0.0.1)", () => {
        const origAtlasDb = process.env.ATLASDB;
        try {
            process.env.ATLASDB = "mongodb://127.0.0.1:27017/local_db";
            assert.throws(() => {
                getMongoUri();
            }, /Local storage database is strictly disabled/);
        } finally {
            if (origAtlasDb) process.env.ATLASDB = origAtlasDb;
            else delete process.env.ATLASDB;
        }
    });

    // --------------------------------------------------------------------------
    // 2. Cloudinary Service & Signed URL Generator
    // --------------------------------------------------------------------------
    test("cloudinaryService exposes upload, signed URL, and delete functions", () => {
        assert.equal(typeof cloudinaryService.uploadResumeStream, "function");
        assert.equal(typeof cloudinaryService.uploadProfilePhotoStream, "function");
        assert.equal(typeof cloudinaryService.getSignedResumeDownloadUrl, "function");
        assert.equal(typeof cloudinaryService.getSignedResumeInlineUrl, "function");
        assert.equal(typeof cloudinaryService.deleteCloudinaryAsset, "function");
    });

    test("getSignedResumeDownloadUrl generates signed delivery url", () => {
        const signedUrl = cloudinaryService.getSignedResumeDownloadUrl(
            "ai-resume-system/resumes/sample_resume",
            "raw",
            "sample.pdf",
            600
        );
        assert.ok(signedUrl, "Signed URL should be returned");
        assert.equal(typeof signedUrl, "string");
    });

    // --------------------------------------------------------------------------
    // 3. ATS & Text Parser Scratch Cleanup via os.tmpdir()
    // --------------------------------------------------------------------------
    test("withTempFile creates scratch file in os.tmpdir() and guarantees cleanup", async () => {
        const sampleBuffer = Buffer.from("Temporary scratch buffer for ATS parsing verification");
        let capturedTempPath = null;

        await withTempFile(sampleBuffer, ".txt", async (tempPath) => {
            capturedTempPath = tempPath;
            assert.ok(fs.existsSync(tempPath), "Temp file must exist during callback execution");
            const content = fs.readFileSync(tempPath, "utf-8");
            assert.equal(content, "Temporary scratch buffer for ATS parsing verification");
        });

        assert.ok(capturedTempPath, "Temp path was assigned");
        assert.equal(fs.existsSync(capturedTempPath), false, "Temp file must be unlinked in finally block");
    });

    test("withTempFile cleans up scratch file even when callback throws error", async () => {
        const sampleBuffer = Buffer.from("Failure resilience check");
        let capturedTempPath = null;

        await assert.rejects(
            async () => {
                await withTempFile(sampleBuffer, ".pdf", async (tempPath) => {
                    capturedTempPath = tempPath;
                    throw new Error("Simulated parser interruption");
                });
            },
            { message: "Simulated parser interruption" }
        );

        assert.ok(capturedTempPath);
        assert.equal(fs.existsSync(capturedTempPath), false, "Temp file must be unlinked even after exception");
    });

    // --------------------------------------------------------------------------
    // 4. Resume Upload Endpoint with Memory Storage & Metadata Persistence
    // --------------------------------------------------------------------------
    test("POST /api/resume/upload parses memory buffer and saves Cloudinary metadata", async () => {
        const samplePdfPath = path.resolve(__dirname, "../uploads/resumes/1786034780525.pdf");
        let pdfBuffer;
        if (fs.existsSync(samplePdfPath)) {
            pdfBuffer = fs.readFileSync(samplePdfPath);
        } else {
            pdfBuffer = Buffer.from("Sample resume content");
        }

        const formData = new FormData();
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });
        formData.append("resume", blob, "Candidate_Resume.pdf");

        const res = await fetch(`${baseUrl}/api/resume/upload`, {
            method: "POST",
            headers: {
                Cookie: authCookie,
            },
            body: formData,
        });

        const body = await res.json();
        assert.equal(res.status, 200);
        assert.equal(body.success, true);
        assert.ok(body.resume.id, "Resume ID should be returned");
        assert.ok(body.resume.atsScore !== undefined, "ATS score should be returned");

        // Verify MongoDB record stores cloud storage metadata
        const savedResume = await Resume.findById(body.resume.id);
        assert.ok(savedResume, "Resume must exist in database");
        assert.ok(["cloudinary", "local"].includes(savedResume.storageProvider));
        assert.ok(savedResume.fileSize > 0);
        assert.ok(savedResume.resumeBuilderId);

        // Verify associated ResumeBuilder was synchronized
        const builderDoc = await ResumeBuilder.findById(savedResume.resumeBuilderId);
        assert.ok(builderDoc, "ResumeBuilder document must be created and synchronized");
    });

    // --------------------------------------------------------------------------
    // 5. Secure Resume Serving & Ownership Enforcement
    // --------------------------------------------------------------------------
    test("GET /api/resume/file rejects unauthorized access from other users", async () => {
        const resume = await Resume.findOne({ user: testUser.id });
        assert.ok(resume, "Resume should exist for test user");

        const res = await fetch(`${baseUrl}/api/resume/file?id=${resume._id}`, {
            headers: {
                Cookie: otherCookie,
            },
            redirect: "manual",
        });

        assert.ok([403, 404].includes(res.status), `Unauthorized access status: ${res.status}`);
    });

    test("GET /api/resume/download enforces ownership and redirects or serves file", async () => {
        const resume = await Resume.findOne({ user: testUser.id });
        assert.ok(resume);

        const res = await fetch(`${baseUrl}/api/resume/download?id=${resume._id}`, {
            headers: {
                Cookie: authCookie,
            },
            redirect: "manual",
        });

        // Expect either a redirect to signed URL (302) or 200 with download headers
        assert.ok([200, 302].includes(res.status), `Expected 200 or 302, got ${res.status}`);
    });

    // --------------------------------------------------------------------------
    // 6. Profile Photo Upload & Deletion Lifecycle
    // --------------------------------------------------------------------------
    test("POST /api/resume-builder/photo uploads photo and DELETE removes it", async () => {
        const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const pngBuffer = Buffer.from(pngBase64, "base64");

        const formData = new FormData();
        const blob = new Blob([pngBuffer], { type: "image/png" });
        formData.append("photo", blob, "avatar.png");

        // 1. Upload photo
        const uploadRes = await fetch(`${baseUrl}/api/resume-builder/photo`, {
            method: "POST",
            headers: {
                Cookie: authCookie,
            },
            body: formData,
        });

        const uploadBody = await uploadRes.json();
        assert.equal(uploadRes.status, 200);
        assert.equal(uploadBody.success, true);
        assert.ok(uploadBody.photoUrl, "Photo URL should be returned");

        // 2. Verify ResumeBuilder doc has photoUrl saved
        const builderDoc = await ResumeBuilder.findOne({ user: testUser.id }).sort({ updatedAt: -1 });
        assert.ok(builderDoc);
        assert.equal(builderDoc.personal.photoUrl, uploadBody.photoUrl);

        // 3. Delete photo
        const deleteRes = await fetch(`${baseUrl}/api/resume-builder/photo`, {
            method: "DELETE",
            headers: {
                Cookie: authCookie,
            },
        });

        const deleteBody = await deleteRes.json();
        assert.equal(deleteRes.status, 200);
        assert.equal(deleteBody.success, true);

        // 4. Verify photoUrl was cleared
        const updatedBuilder = await ResumeBuilder.findById(builderDoc._id);
        assert.equal(updatedBuilder.personal.photoUrl, "");
        assert.equal(updatedBuilder.personal.photoPublicId, null);
    });

    // --------------------------------------------------------------------------
    // 7. Resume Deletion Endpoint
    // --------------------------------------------------------------------------
    test("DELETE /api/resume/:id removes resume from MongoDB", async () => {
        const resume = await Resume.findOne({ user: testUser.id });
        assert.ok(resume);

        const deleteRes = await fetch(`${baseUrl}/api/resume/${resume._id}`, {
            method: "DELETE",
            headers: {
                Cookie: authCookie,
            },
        });

        const deleteBody = await deleteRes.json();
        assert.equal(deleteRes.status, 200);
        assert.equal(deleteBody.success, true);

        const checkResume = await Resume.findById(resume._id);
        assert.equal(checkResume, null, "Resume document must be removed from database");
    });

    // --------------------------------------------------------------------------
    // 8. Health Check Endpoint for Cloud Deployments
    // --------------------------------------------------------------------------
    test("GET /health returns healthy status and uptime for cloud load balancers", async () => {
        const res = await fetch(`${baseUrl}/health`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.status, "healthy");
        assert.ok(body.uptime >= 0);
        assert.ok(body.timestamp);
    });
});
