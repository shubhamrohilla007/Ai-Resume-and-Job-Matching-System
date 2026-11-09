/**
 * External Client (Postman / Hoppscotch / curl) Security Verification Suite
 *
 * Simulates external unauthenticated & unauthorized HTTP requests:
 * 1. Zero-auth external requests to candidate, recruiter, and admin routes -> 401 UNAUTHORIZED.
 * 2. Forged / tampered session cookies in Postman -> 401 UNAUTHORIZED.
 * 3. Direct static file traversal / access to /uploads/resumes/ -> 403 FORBIDDEN.
 * 4. Cross-role boundary defense:
 *    - Job Seeker calling recruiter endpoints -> 403 FORBIDDEN.
 *    - Job Seeker calling admin endpoints -> 403 FORBIDDEN.
 *    - Recruiter calling job seeker upload/builder -> 403 FORBIDDEN.
 *    - Recruiter calling admin endpoints -> 403 FORBIDDEN.
 * 5. Insecure Direct Object Reference (IDOR) defense:
 *    - Candidate A accessing Candidate B's resume -> 404 NOT FOUND / ACCESS DENIED.
 *    - Candidate A accessing Candidate B's ATS analysis -> 404 NOT FOUND / ACCESS DENIED.
 *    - Recruiter accessing arbitrary candidate resume who never applied -> 404 NOT FOUND / ACCESS DENIED.
 *    - Recruiter A attempting to edit Recruiter B's job -> 404 NOT FOUND / ACCESS DENIED.
 *    - Recruiter A attempting to delete Recruiter B's job -> 404 NOT FOUND / ACCESS DENIED.
 * 6. Privilege escalation defense against body tampering:
 *    - Signup payload tampering (role: "admin") -> safely defaulted to "job_seeker".
 *    - Profile payload tampering (role: "admin") -> ignored, user remains "job_seeker".
 *    - Application payload tampering (applicant: "<victim_id>") -> bound to req.user._id.
 * 7. Verified public endpoints (health, public jobs, courses, auth status).
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Resume = require("../models/Resume");

describe("External Client (Postman / Hoppscotch) Security Audit", () => {
    let server = null;
    let baseUrl = "";

    // Test accounts
    let seekerA = null;
    let seekerACookie = "";
    let seekerB = null;
    let seekerBCookie = "";
    let recruiterA = null;
    let recruiterACookie = "";
    let recruiterB = null;
    let recruiterBCookie = "";

    let seekerBResumeId = null;
    let recruiterAJobId = null;

    before(async () => {
        await connectDB();

        server = http.createServer(app);
        await new Promise((resolve) => {
            server.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });

        // Register Seeker A
        const resSA = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Seeker A",
                email: `postman_seeker_a_${Date.now()}@example.com`,
                password: "Password123!",
                role: "job_seeker",
            }),
        });
        const dataSA = await resSA.json();
        seekerA = dataSA.user;
        seekerACookie = resSA.headers.get("set-cookie").split(";")[0];

        // Register Seeker B
        const resSB = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Seeker B",
                email: `postman_seeker_b_${Date.now()}@example.com`,
                password: "Password123!",
                role: "job_seeker",
            }),
        });
        const dataSB = await resSB.json();
        seekerB = dataSB.user;
        seekerBCookie = resSB.headers.get("set-cookie").split(";")[0];

        // Seed a resume for Seeker B
        const resumeB = await Resume.create({
            user: seekerB.id,
            originalName: "seeker_b_confidential.pdf",
            fileName: "seeker_b_confidential.pdf",
            fileType: "application/pdf",
            fileSize: 2048,
            storageProvider: "cloudinary",
            cloudinaryPublicId: "ai-resume-system/resumes/confidential_seeker_b",
            cloudinarySecureUrl: "https://res.cloudinary.com/demo/image/upload/confidential_b.pdf",
            extractedSkills: ["Python", "Machine Learning"],
            rawText: "Confidential resume details of Seeker B",
        });
        seekerBResumeId = String(resumeB._id);

        // Register Recruiter A
        const resRA = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Recruiter A",
                email: `postman_recruiter_a_${Date.now()}@example.com`,
                password: "Password123!",
                role: "recruiter",
            }),
        });
        const dataRA = await resRA.json();
        recruiterA = dataRA.user;
        recruiterACookie = resRA.headers.get("set-cookie").split(";")[0];

        // Create a job for Recruiter A
        const resJob = await fetch(`${baseUrl}/api/recruiter/jobs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: recruiterACookie,
            },
            body: JSON.stringify({
                title: "Software Engineer",
                company: "Tech Corp A",
                description: "Engineering position",
                requiredSkills: "Node.js, Express",
                experienceLevel: "Mid Level",
                location: "Remote",
                jobType: "Full-time",
            }),
        });
        const jobData = await resJob.json();
        recruiterAJobId = String(jobData.job._id);

        // Register Recruiter B
        const resRB = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Recruiter B",
                email: `postman_recruiter_b_${Date.now()}@example.com`,
                password: "Password123!",
                role: "recruiter",
            }),
        });
        const dataRB = await resRB.json();
        recruiterB = dataRB.user;
        recruiterBCookie = resRB.headers.get("set-cookie").split(";")[0];
    });

    after(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        const ids = [seekerA?.id, seekerB?.id, recruiterA?.id, recruiterB?.id].filter(Boolean);
        if (ids.length > 0) {
            await User.deleteMany({ _id: { $in: ids } });
            await Resume.deleteMany({ user: { $in: ids } });
            await Job.deleteMany({ recruiter: { $in: ids } });
            await JobApplication.deleteMany({ applicant: { $in: ids } });
        }

        await mongoose.disconnect();
    });

    // --------------------------------------------------------------------------
    // 1. UNPROTECTED EXTERNAL REQUESTS (POSTMAN WITHOUT COOKIE)
    // --------------------------------------------------------------------------
    describe("Unauthenticated External Requests (Postman / Hoppscotch)", () => {
        const protectedGetEndpoints = [
            "/api/profile",
            "/api/resume/analysis",
            "/api/resume/list",
            "/api/resume/file",
            "/api/resume/download",
            "/resume/file",
            "/resume/download",
            "/api/resume-builder",
            "/api/jobs/recommended",
            "/api/jobs/my-applications",
            "/api/recruiter/jobs",
            "/api/admin/overview",
            "/api/admin/users",
            "/api/admin/jobs",
        ];

        for (const ep of protectedGetEndpoints) {
            test(`GET ${ep} without authorization returns 401 Unauthorized`, async () => {
                const res = await fetch(`${baseUrl}${ep}`);
                assert.strictEqual(res.status, 401, `Expected 401 for ${ep}, got ${res.status}`);
                const data = await res.json();
                assert.strictEqual(data.code, "UNAUTHORIZED");
            });
        }

        const protectedPostEndpoints = [
            { path: "/api/profile", body: { fullName: "Hacker" } },
            { path: "/api/resume/upload", body: {} },
            { path: "/api/resume-builder", body: { targetRole: "Dev" } },
            { path: "/api/resume-builder/ai-generate", body: { targetRole: "Dev" } },
            { path: "/api/resume-builder/photo", body: {} },
            { path: "/api/jobs/some_id/apply", body: { fullName: "Hacker" } },
            { path: "/api/recruiter/jobs", body: { title: "Rogue Job" } },
        ];

        for (const ep of protectedPostEndpoints) {
            test(`POST ${ep.path} without authorization returns 401 Unauthorized`, async () => {
                const res = await fetch(`${baseUrl}${ep.path}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ep.body),
                });
                assert.strictEqual(res.status, 401, `Expected 401 for POST ${ep.path}, got ${res.status}`);
            });
        }
    });

    // --------------------------------------------------------------------------
    // 2. FORGED / TAMPERED SESSION COOKIES
    // --------------------------------------------------------------------------
    describe("Forged Session Cookie Defense", () => {
        test("Postman sending forged connect.sid cookie is rejected with 401", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs`, {
                headers: {
                    Cookie: "connect.sid=s%3Aforged_tampered_attacker_session_token_12345",
                },
            });
            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.code, "UNAUTHORIZED");
        });

        test("Postman sending malformed session cookie is rejected with 401", async () => {
            const res = await fetch(`${baseUrl}/api/profile`, {
                headers: {
                    Cookie: "connect.sid=malformed-no-signature",
                },
            });
            assert.strictEqual(res.status, 401);
        });
    });

    // --------------------------------------------------------------------------
    // 3. DIRECT STATIC FILE ACCESS DEFENSE
    // --------------------------------------------------------------------------
    describe("Direct Static File Access Defense (/uploads/resumes/)", () => {
        test("Direct GET /uploads/resumes/some_file.pdf returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/uploads/resumes/some_file.pdf`);
            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /forbidden/i);
        });

        test("Path traversal attempt in /uploads/resumes/ is blocked with 403", async () => {
            const res = await fetch(`${baseUrl}/uploads/resumes/..%2f..%2fpackage.json`);
            assert.strictEqual(res.status, 403);
        });
    });

    // --------------------------------------------------------------------------
    // 4. CROSS-ROLE PRIVILEGE SEPARATION
    // --------------------------------------------------------------------------
    describe("Cross-Role Privilege Separation (Postman client with authenticated session)", () => {
        test("Job Seeker attempting recruiter endpoint returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs`, {
                headers: { Cookie: seekerACookie },
            });
            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("Job Seeker attempting admin endpoint returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/admin/overview`, {
                headers: { Cookie: seekerACookie },
            });
            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("Recruiter attempting job seeker resume builder returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/resume-builder`, {
                headers: { Cookie: recruiterACookie },
            });
            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("Recruiter attempting admin endpoint returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/admin/overview`, {
                headers: { Cookie: recruiterACookie },
            });
            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.code, "FORBIDDEN");
        });
    });

    // --------------------------------------------------------------------------
    // 5. INSECURE DIRECT OBJECT REFERENCE (IDOR) DEFENSE
    // --------------------------------------------------------------------------
    describe("Insecure Direct Object Reference (IDOR) Defense", () => {
        test("Seeker A cannot download Seeker B's resume by ID in Postman (404/access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seekerBResumeId}`, {
                headers: { Cookie: seekerACookie },
                redirect: "manual",
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("Seeker A cannot view Seeker B's ATS analysis by ID in Postman (404/access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/analysis?id=${seekerBResumeId}`, {
                headers: { Cookie: seekerACookie },
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("Recruiter A cannot view Seeker B's resume before Seeker B applies (404/access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seekerBResumeId}`, {
                headers: { Cookie: recruiterACookie },
                redirect: "manual",
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("Recruiter B cannot edit Recruiter A's job posting (404/access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs/${recruiterAJobId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: recruiterBCookie,
                },
                body: JSON.stringify({
                    title: "Tampered Job Title",
                    company: "Hacked Company",
                    description: "Malicious override attempt",
                }),
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("Recruiter B cannot delete Recruiter A's job posting (404/access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs/${recruiterAJobId}`, {
                method: "DELETE",
                headers: { Cookie: recruiterBCookie },
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });
    });

    // --------------------------------------------------------------------------
    // 6. PRIVILEGE ESCALATION & BODY TAMPERING DEFENSE
    // --------------------------------------------------------------------------
    describe("Privilege Escalation & Body Tampering Defense", () => {
        test("Postman signup with role='admin' is safely neutralized to 'job_seeker'", async () => {
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Privilege Escalator",
                    email: `escalate_${Date.now()}@example.com`,
                    password: "Password123!",
                    role: "admin",
                }),
            });
            assert.strictEqual(res.status, 201);
            const data = await res.json();
            assert.strictEqual(data.user.role, "job_seeker");
            await User.deleteOne({ _id: data.user.id });
        });

        test("Postman PUT /api/profile with role='admin' does not escalate role", async () => {
            const res = await fetch(`${baseUrl}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: seekerACookie,
                },
                body: JSON.stringify({
                    fullName: "Seeker A Updated",
                    role: "admin",
                }),
            });
            assert.strictEqual(res.status, 200);
            const userInDb = await User.findById(seekerA.id);
            assert.strictEqual(userInDb.role, "job_seeker");
        });

        test("Postman job application with spoofed applicant ID binds to authenticated user", async () => {
            const res = await fetch(`${baseUrl}/api/jobs/${recruiterAJobId}/apply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: seekerACookie,
                },
                body: JSON.stringify({
                    applicant: seekerB.id, // Attacker attempts to spoof candidate B!
                    fullName: "Seeker A",
                    email: seekerA.email,
                }),
            });
            assert.strictEqual(res.status, 201);
            const data = await res.json();
            // The saved application MUST be assigned to seekerA, not seekerB
            assert.strictEqual(String(data.application.applicant), String(seekerA.id));
        });
    });

    // --------------------------------------------------------------------------
    // 7. PUBLIC ENDPOINTS (Intended public endpoints respond properly)
    // --------------------------------------------------------------------------
    describe("Public Endpoints Response Validity", () => {
        test("GET /health returns healthy status (200)", async () => {
            const res = await fetch(`${baseUrl}/health`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.status, "healthy");
        });

        test("GET /api/health returns ok status (200)", async () => {
            const res = await fetch(`${baseUrl}/api/health`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.status, "ok");
        });

        test("GET /api/jobs/public returns public job listings (200)", async () => {
            const res = await fetch(`${baseUrl}/api/jobs/public`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(Array.isArray(data.jobs));
        });

        test("GET /api/courses returns free verified courses (200)", async () => {
            const res = await fetch(`${baseUrl}/api/courses`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(Array.isArray(data.courses));
        });

        test("GET /api/auth/google/status returns OAuth diagnostic status (200)", async () => {
            const res = await fetch(`${baseUrl}/api/auth/google/status`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(typeof data.configured, "boolean");
        });
    });
});
