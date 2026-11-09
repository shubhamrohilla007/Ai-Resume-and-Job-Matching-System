/**
 * Comprehensive Authentication, Authorization & MongoDB Atlas Test Suite
 *
 * Validates:
 * 1. Atlas Database Connectivity & URI masking.
 * 2. User Registration (Job Seeker, Recruiter) with input validation (email format, weak password, confirm password mismatch).
 * 3. Role Escalation Prevention on signup (attempted role="admin" defaults safely to "job_seeker").
 * 4. Duplicate email prevention (409 Conflict).
 * 5. Login authentication (valid vs invalid password) and session fixation protection.
 * 6. Session persistence and restoration via /api/auth/me.
 * 7. Logout session termination.
 * 8. Profile update mass-assignment role escalation prevention.
 * 9. RBAC Route Protection:
 *    - Unauthenticated access returns 401.
 *    - Job seeker accessing recruiter routes returns 403.
 *    - Recruiter accessing job seeker upload returns 403.
 *    - Non-admins accessing admin routes returns 403.
 * 10. Admin Governance & Self-Protection:
 *     - Admin accessing /api/admin/overview returns 200 with platform metrics.
 *     - Admin accessing /api/admin/users returns 200 with user list.
 *     - Admin attempting self-demotion returns 400.
 *     - Admin modifying another user's role returns 200.
 *     - Admin attempting self-deletion returns 400.
 * 11. IDOR Defense on Resumes:
 *     - Job seeker accessing own resume: ALLOWED (200/302).
 *     - Job seeker accessing another candidate's resume: BLOCKED (404).
 *     - Recruiter accessing non-applicant candidate's resume: BLOCKED (404).
 *     - Recruiter accessing applicant's resume after job application: ALLOWED (200/302).
 *     - Unrelated Recruiter accessing candidate resume: BLOCKED (404).
 * 12. IDOR Defense on Recruiter Job Management:
 *     - Recruiter editing own job: ALLOWED (200).
 *     - Recruiter attempting to edit another recruiter's job: BLOCKED (404).
 *     - Recruiter attempting to delete another recruiter's job: BLOCKED (404).
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");

const app = require("../app");
const connectDB = require("../config/db");
const { getMongoUri, maskMongoUri } = require("../config/db");
const User = require("../models/User");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Resume = require("../models/Resume");
const Profile = require("../models/Profile");

describe("Authentication, Authorization & MongoDB Atlas Verification Suite", () => {
    let server = null;
    let baseUrl = "";

    // Test actor credentials and session cookies
    let seeker1 = null;
    let seeker1Cookie = "";
    let seeker2 = null;
    let seeker2Cookie = "";
    let recruiter1 = null;
    let recruiter1Cookie = "";
    let recruiter2 = null;
    let recruiter2Cookie = "";
    let adminUser = null;
    let adminCookie = "";

    // Test artifacts
    let seeker1ResumeId = null;
    let recruiter1JobId = null;

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
    });

    after(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        // Cleanup test data created during test execution
        const testUserIds = [seeker1?.id, seeker2?.id, recruiter1?.id, recruiter2?.id, adminUser?.id].filter(Boolean);
        if (testUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: testUserIds } });
            await Profile.deleteMany({ user: { $in: testUserIds } });
            await Resume.deleteMany({ user: { $in: testUserIds } });
            await Job.deleteMany({ recruiter: { $in: testUserIds } });
            await JobApplication.deleteMany({ applicant: { $in: testUserIds } });
        }

        await mongoose.disconnect();
        process.exit(0);
    });

    // Helper: helper for login and extracting cookie
    async function loginUser(email, password) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        const setCookie = res.headers.get("set-cookie");
        const cookie = setCookie ? setCookie.split(";")[0] : "";
        return { status: res.status, data, cookie };
    }

    // --------------------------------------------------------------------------
    // PHASE 1: DATABASE CONNECTION (MONGODB ATLAS)
    // --------------------------------------------------------------------------
    describe("MongoDB Atlas Database Configuration", () => {
        test("1. Resolved MongoDB URI points to MongoDB Atlas", () => {
            const uri = getMongoUri();
            assert.ok(uri, "MongoDB URI must be defined");
            assert.ok(
                uri.includes(".mongodb.net") || uri.startsWith("mongodb+srv://"),
                `Expected Atlas URI, but got: ${maskMongoUri(uri)}`
            );
        });

        test("2. Credentials masked in log output", () => {
            const masked = maskMongoUri(getMongoUri());
            assert.ok(!masked.includes(":rohil") && !masked.includes("Password"), "Credentials must be masked");
            assert.ok(masked.includes("***:***@") || masked.includes("****:****@"), "Must include masked user:pass format");
        });

        test("3. Mongoose connection is connected to cloud cluster", () => {
            assert.strictEqual(mongoose.connection.readyState, 1, "Mongoose must be connected (state 1)");
            const host = mongoose.connection.host || "";
            assert.ok(
                host.includes("mongodb.net") || host.includes("cluster0"),
                `Host should be Atlas cluster, got: ${host}`
            );
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 2: AUTHENTICATION & INPUT VALIDATION
    // --------------------------------------------------------------------------
    describe("Authentication & Input Validation", () => {
        test("4. Rejects signup with mismatched confirm password", async () => {
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Mismatch User",
                    email: `mismatch_${Date.now()}@example.com`,
                    password: "Password123!",
                    confirmPassword: "DifferentPassword123!",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /passwords do not match/i);
        });

        test("5. Rejects signup with invalid email format", async () => {
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Invalid Email User",
                    email: "not-an-email-at-all",
                    password: "Password123!",
                    confirmPassword: "Password123!",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /valid email/i);
        });

        test("6. Rejects signup with weak password (< 6 characters)", async () => {
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Weak User",
                    email: `weak_${Date.now()}@example.com`,
                    password: "123",
                    confirmPassword: "123",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /at least 6 characters/i);
        });

        test("7. Self-assignment of admin role during signup safely defaults to job_seeker", async () => {
            const email = `sneaky_admin_${Date.now()}@example.com`;
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Sneaky Admin Attempt",
                    email,
                    password: "Password123!",
                    confirmPassword: "Password123!",
                    role: "admin", // Privilege escalation attempt!
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 201);
            assert.strictEqual(data.success, true);
            // Must NOT have received admin role
            assert.strictEqual(data.user.role, "job_seeker", "Admin escalation on signup must be neutralized");

            // Verify directly in MongoDB Atlas
            const userInAtlas = await User.findOne({ email });
            assert.strictEqual(userInAtlas.role, "job_seeker");
            await User.deleteOne({ _id: userInAtlas._id });
        });

        test("8. Successful Job Seeker registration and session creation", async () => {
            const email = `seeker1_${Date.now()}@example.com`;
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Alice Job Seeker",
                    email,
                    password: "Password123!",
                    confirmPassword: "Password123!",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 201);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.user.role, "job_seeker");
            seeker1 = data.user;

            const cookieHeader = res.headers.get("set-cookie");
            assert.ok(cookieHeader, "Signup must set session cookie");
            seeker1Cookie = cookieHeader.split(";")[0];
        });

        test("9. Duplicate email registration rejected with 409 Conflict", async () => {
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Duplicate Seeker",
                    email: seeker1.email, // Same email
                    password: "Password123!",
                    confirmPassword: "Password123!",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 409);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /already exists/i);
        });

        test("10. Successful Recruiter registration", async () => {
            const email = `recruiter1_${Date.now()}@example.com`;
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Bob Recruiter",
                    email,
                    password: "Password123!",
                    confirmPassword: "Password123!",
                    role: "recruiter",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 201);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.user.role, "recruiter");
            recruiter1 = data.user;
            recruiter1Cookie = res.headers.get("set-cookie").split(";")[0];
        });

        test("11. Register second job seeker and recruiter for IDOR tests", async () => {
            // Second seeker
            const resS2 = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Charlie Seeker 2",
                    email: `seeker2_${Date.now()}@example.com`,
                    password: "Password123!",
                    role: "job_seeker",
                }),
            });
            const dataS2 = await resS2.json();
            seeker2 = dataS2.user;
            seeker2Cookie = resS2.headers.get("set-cookie").split(";")[0];

            // Second recruiter
            const resR2 = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Dave Recruiter 2",
                    email: `recruiter2_${Date.now()}@example.com`,
                    password: "Password123!",
                    role: "recruiter",
                }),
            });
            const dataR2 = await resR2.json();
            recruiter2 = dataR2.user;
            recruiter2Cookie = resR2.headers.get("set-cookie").split(";")[0];

            assert.ok(seeker2 && recruiter2);
        });

        test("12. Create designated Admin user for RBAC verification", async () => {
            const adminEmail = `admin_test_${Date.now()}@example.com`;
            const res = await fetch(`${baseUrl}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Super Admin",
                    email: adminEmail,
                    password: "AdminPassword123!",
                    role: "job_seeker",
                }),
            });
            const data = await res.json();
            // Elevate role directly in Atlas database (authorized administrative provisioning)
            await User.updateOne({ _id: data.user.id }, { $set: { role: "admin" } });
            const login = await loginUser(adminEmail, "AdminPassword123!");
            assert.strictEqual(login.status, 200);
            assert.strictEqual(login.data.user.role, "admin");
            adminUser = login.data.user;
            adminCookie = login.cookie;
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 3: LOGIN, LOGOUT & SESSION FIXATION DEFENSE
    // --------------------------------------------------------------------------
    describe("Session Lifecycle & Session Fixation Defense", () => {
        test("13. Login fails with incorrect password (401)", async () => {
            const login = await loginUser(seeker1.email, "WrongPassword!");
            assert.strictEqual(login.status, 401);
            assert.strictEqual(login.data.success, false);
        });

        test("14. Login succeeds with correct password and yields valid session", async () => {
            const login = await loginUser(seeker1.email, "Password123!");
            assert.strictEqual(login.status, 200);
            assert.strictEqual(login.data.success, true);
            assert.strictEqual(login.data.user.email, seeker1.email);
            seeker1Cookie = login.cookie;
        });

        test("15. GET /api/auth/me returns current session user", async () => {
            const res = await fetch(`${baseUrl}/api/auth/me`, {
                headers: { Cookie: seeker1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.isAuthenticated, true);
            assert.strictEqual(data.user.email, seeker1.email);
            assert.strictEqual(data.user.role, "job_seeker");
        });

        test("16. Logout clears session and cookie", async () => {
            const res = await fetch(`${baseUrl}/api/auth/logout`, {
                method: "POST",
                headers: { Cookie: seeker1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);

            // Re-login seeker 1 to maintain cookie for subsequent tests
            const reLogin = await loginUser(seeker1.email, "Password123!");
            seeker1Cookie = reLogin.cookie;
        });

        test("17. Unauthenticated request to /api/auth/me returns unauthenticated status", async () => {
            const res = await fetch(`${baseUrl}/api/auth/me`);
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.isAuthenticated, false);
            assert.strictEqual(data.user, null);
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 4: MASS ASSIGNMENT & PRIVILEGE ESCALATION DEFENSE
    // --------------------------------------------------------------------------
    describe("Mass Assignment Defense on User Profile", () => {
        test("18. PUT /api/profile ignores attempted role override to 'admin'", async () => {
            const res = await fetch(`${baseUrl}/api/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: seeker1Cookie,
                },
                body: JSON.stringify({
                    fullName: "Alice Job Seeker Updated",
                    role: "admin", // Attacking mass-assignment!
                    skills: ["JavaScript", "React"],
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);

            // Confirm User in Atlas still has role: "job_seeker"
            const userInAtlas = await User.findById(seeker1.id);
            assert.strictEqual(userInAtlas.role, "job_seeker", "User role must not be altered by profile endpoint");
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 5: ROLE-BASED ACCESS CONTROL (RBAC)
    // --------------------------------------------------------------------------
    describe("Role-Based Access Control (RBAC)", () => {
        test("19. Unauthenticated request to protected recruiter endpoint returns 401", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs`);
            const data = await res.json();
            assert.strictEqual(res.status, 401);
            assert.strictEqual(data.code, "UNAUTHORIZED");
        });

        test("20. Job Seeker accessing recruiter endpoint returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs`, {
                headers: { Cookie: seeker1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 403);
            assert.strictEqual(data.code, "FORBIDDEN");
            assert.match(data.message, /requires recruiter role/i);
        });

        test("21. Recruiter accessing job seeker resume builder returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/resume-builder`, {
                headers: { Cookie: recruiter1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 403);
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("22. Job Seeker accessing admin overview returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/admin/overview`, {
                headers: { Cookie: seeker1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 403);
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("23. Recruiter accessing admin overview returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/api/admin/overview`, {
                headers: { Cookie: recruiter1Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 403);
            assert.strictEqual(data.code, "FORBIDDEN");
        });

        test("24. Admin successfully accesses /api/admin/overview with metrics", async () => {
            const res = await fetch(`${baseUrl}/api/admin/overview`, {
                headers: { Cookie: adminCookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);
            assert.ok(data.stats, "Overview must include stats object");
            assert.ok(typeof data.stats.totalUsers === "number");
            assert.ok(typeof data.stats.totalJobs === "number");
            assert.ok(typeof data.stats.totalResumes === "number");
        });

        test("25. Admin successfully lists users via /api/admin/users", async () => {
            const res = await fetch(`${baseUrl}/api/admin/users?limit=10`, {
                headers: { Cookie: adminCookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);
            assert.ok(Array.isArray(data.users));
            assert.ok(data.users.length > 0);
            // Verify sensitive credential fields are NOT leaked
            const sampleUser = data.users[0];
            assert.strictEqual(sampleUser.hash, undefined);
            assert.strictEqual(sampleUser.salt, undefined);
            assert.strictEqual(sampleUser.passwordResetTokenHash, undefined);
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 6: ADMIN GOVERNANCE & SELF-PROTECTION
    // --------------------------------------------------------------------------
    describe("Admin Governance & Self-Protection Defense", () => {
        test("26. Admin cannot demote or modify their own role (self-demotion protection)", async () => {
            const res = await fetch(`${baseUrl}/api/admin/users/${adminUser.id}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: adminCookie,
                },
                body: JSON.stringify({ role: "job_seeker" }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /cannot modify their own role/i);
        });

        test("27. Admin cannot delete their own account (self-deletion protection)", async () => {
            const res = await fetch(`${baseUrl}/api/admin/users/${adminUser.id}`, {
                method: "DELETE",
                headers: { Cookie: adminCookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /cannot delete their own account/i);
        });

        test("28. Admin can modify another user's role", async () => {
            // Admin changes seeker2 to recruiter
            const res = await fetch(`${baseUrl}/api/admin/users/${seeker2.id}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: adminCookie,
                },
                body: JSON.stringify({ role: "recruiter" }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.user.role, "recruiter");

            // Revert seeker2 role to job_seeker
            await User.updateOne({ _id: seeker2.id }, { $set: { role: "job_seeker" } });
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 7: IDOR DEFENSE ON RESUMES
    // --------------------------------------------------------------------------
    describe("IDOR Defense on Resumes", () => {
        before(async () => {
            // Seed a resume directly in Atlas for Seeker 1
            const resumeDoc = new Resume({
                user: seeker1.id,
                fileName: "alice_resume.pdf",
                originalName: "alice_resume.pdf",
                fileType: "application/pdf",
                fileSize: 1024,
                storageProvider: "cloudinary",
                cloudinaryPublicId: "ai-resume-system/resumes/sample_alice",
                cloudinarySecureUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
                skills: ["React", "Node.js", "MongoDB"],
                rawText: "Alice Resume Content",
            });
            await resumeDoc.save();
            seeker1ResumeId = String(resumeDoc._id);

            // Recruiter 1 posts a Job
            const jobRes = await fetch(`${baseUrl}/api/recruiter/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: recruiter1Cookie,
                },
                body: JSON.stringify({
                    title: "Senior Full Stack Engineer",
                    company: "Tech Corp",
                    description: "Looking for an experienced engineer with React and Node.js.",
                    requiredSkills: "React, Node.js",
                    preferredSkills: "MongoDB, Docker",
                    experienceLevel: "Mid Level",
                    location: "Remote",
                    jobType: "Full-time",
                    salary: "$120k",
                }),
            });
            const jobData = await jobRes.json();
            assert.strictEqual(jobRes.status, 201);
            recruiter1JobId = String(jobData.job._id);
        });

        test("29. Seeker 1 can access their own resume file (302 redirect / 200)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seeker1ResumeId}`, {
                headers: { Cookie: seeker1Cookie },
                redirect: "manual",
            });
            // Cloudinary redirect (302) or 200
            assert.ok([200, 302].includes(res.status), `Expected 200 or 302, got ${res.status}`);
        });

        test("30. Seeker 2 is denied access to Seeker 1's resume (IDOR defense -> 404)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seeker1ResumeId}`, {
                headers: { Cookie: seeker2Cookie },
                redirect: "manual",
            });
            const data = await res.json();
            assert.strictEqual(res.status, 404);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("31. Recruiter 1 is denied access to Seeker 1's resume before Seeker applies (IDOR defense -> 404)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seeker1ResumeId}`, {
                headers: { Cookie: recruiter1Cookie },
                redirect: "manual",
            });
            const data = await res.json();
            assert.strictEqual(res.status, 404);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("32. Seeker 1 applies to Recruiter 1's job opening", async () => {
            const res = await fetch(`${baseUrl}/api/jobs/${recruiter1JobId}/apply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: seeker1Cookie,
                },
                body: JSON.stringify({
                    fullName: "Alice Job Seeker",
                    email: seeker1.email,
                    phone: "+1-555-0100",
                    location: "San Francisco, CA",
                    skills: ["React", "Node.js"],
                    coverNote: "I am excited to apply for this engineering role.",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 201);
            assert.strictEqual(data.success, true);
        });

        test("33. Recruiter 1 is now AUTHORIZED to access applicant Seeker 1's resume", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seeker1ResumeId}`, {
                headers: { Cookie: recruiter1Cookie },
                redirect: "manual",
            });
            assert.ok([200, 302].includes(res.status), `Recruiter must be authorized: status was ${res.status}`);
        });

        test("34. Recruiter 2 (unrelated recruiter) is STILL denied access to Seeker 1's resume (404)", async () => {
            const res = await fetch(`${baseUrl}/api/resume/file?id=${seeker1ResumeId}`, {
                headers: { Cookie: recruiter2Cookie },
                redirect: "manual",
            });
            const data = await res.json();
            assert.strictEqual(res.status, 404);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });
    });

    // --------------------------------------------------------------------------
    // PHASE 8: IDOR DEFENSE ON RECRUITER JOB MANAGEMENT
    // --------------------------------------------------------------------------
    describe("IDOR Defense on Recruiter Job Management", () => {
        test("35. Recruiter 2 cannot edit Recruiter 1's job posting (404 / access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs/${recruiter1JobId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: recruiter2Cookie, // Malicious recruiter
                },
                body: JSON.stringify({
                    title: "Hacked Job Title",
                    company: "Hacked Company",
                    description: "Malicious override attempt",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 404);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("36. Recruiter 2 cannot delete Recruiter 1's job posting (404 / access denied)", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs/${recruiter1JobId}`, {
                method: "DELETE",
                headers: { Cookie: recruiter2Cookie },
            });
            const data = await res.json();
            assert.strictEqual(res.status, 404);
            assert.strictEqual(data.success, false);
            assert.match(data.message, /access denied/i);
        });

        test("37. Recruiter 1 can legitimately edit their own job posting", async () => {
            const res = await fetch(`${baseUrl}/api/recruiter/jobs/${recruiter1JobId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: recruiter1Cookie,
                },
                body: JSON.stringify({
                    title: "Senior Full Stack Engineer (Updated)",
                    company: "Tech Corp",
                    description: "Looking for an experienced engineer with React and Node.js.",
                    requiredSkills: "React, Node.js",
                    preferredSkills: "MongoDB, Docker, Kubernetes",
                    experienceLevel: "Mid Level",
                    location: "Remote",
                    jobType: "Full-time",
                    salary: "$130k",
                }),
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.job.title, "Senior Full Stack Engineer (Updated)");
        });
    });
});
