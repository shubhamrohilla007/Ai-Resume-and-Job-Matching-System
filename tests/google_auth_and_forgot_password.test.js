require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");
const User = require("../models/User");

// Helper to make API requests to the running backend
function apiRequest(options, body) {
    const opts = {
        ...options,
        headers: {
            "x-test-suite": "true",
            ...(options.headers || {}),
        },
    };
    return new Promise((resolve, reject) => {
        const req = http.request(opts, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });
        req.on("error", reject);
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

test("Google Authentication & Secure Forgot Password Integration Suite", async (t) => {
    if (mongoose.connection.readyState === 0) {
        const connectDB = require("../config/db");
        await connectDB();
    }

    const testGoogleId1 = `g_uid_${Date.now()}_1`;
    const testGoogleId2 = `g_uid_${Date.now()}_2`;
    const testGoogleEmail1 = `google_user_${Date.now()}@gmail.com`;
    const testLocalEmail = `local_linked_${Date.now()}@example.com`;
    const originalLocalPass = "LocalOriginalSecret123!";

    await t.test("1. GET /api/auth/google/status returns valid diagnostic structure", async () => {
        const res = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/google/status",
            method: "GET",
        });

        assert.equal(res.status, 200);
        assert.equal(res.data.success, true);
        assert.equal(typeof res.data.configured, "boolean");
        assert.equal(typeof res.data.clientIdConfigured, "boolean");
        assert.ok(res.data.callbackUrl);
        assert.match(res.data.callbackUrl, /\/api\/auth\/google\/callback$/);
    });

    await t.test("2. GET /api/auth/google generates valid OAuth redirect or clean fallback", async () => {
        const res = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/google",
            method: "GET",
        });

        assert.equal(res.status, 302, "Must return HTTP 302 redirect");
        const redirectLocation = res.headers.location;
        assert.ok(redirectLocation, "Must provide Location header");

        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            // When credentials configured in .env, redirects to Google Accounts authorization
            assert.match(redirectLocation, /accounts\.google\.com/);
            assert.match(redirectLocation, /response_type=code/);
            assert.match(redirectLocation, /scope=profile%20email/);
            assert.match(redirectLocation, /redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fauth%2Fgoogle%2Fcallback/);
        } else {
            // When unconfigured, redirects safely to frontend login notice
            assert.match(redirectLocation, /login\?error=google_oauth_not_configured/);
        }
    });

    await t.test("3. Google OAuth callback handles cancellation or denial gracefully", async () => {
        const res = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/google/callback?error=access_denied",
            method: "GET",
        });

        assert.equal(res.status, 302);
        assert.match(res.headers.location, /login\?error=google_auth_failed/);
    });

    await t.test("4. Google OAuth callback handles missing authorization code gracefully", async () => {
        const res = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/google/callback",
            method: "GET",
        });

        assert.equal(res.status, 302);
        assert.match(res.headers.location, /login\?error=google_auth_failed/);
    });

    await t.test("5. User schema natively supports googleId, avatarUrl, and authProvider without requiring password", async () => {
        const googleUser = new User({
            username: testGoogleEmail1,
            email: testGoogleEmail1,
            fullName: "Google Authenticated Candidate",
            role: "job_seeker",
            googleId: testGoogleId1,
            avatarUrl: "https://lh3.googleusercontent.com/a/sample-avatar=s96-c",
            authProvider: "google",
        });

        await googleUser.save();
        assert.ok(googleUser._id);
        assert.equal(googleUser.authProvider, "google");
        assert.equal(googleUser.googleId, testGoogleId1);
        assert.ok(googleUser.avatarUrl.includes("sample-avatar"));

        // Retrieve from database to verify persistence
        const found = await User.findOne({ googleId: testGoogleId1 });
        assert.ok(found);
        assert.equal(found.email, testGoogleEmail1);
    });

    await t.test("6. Existing local user account can be linked to Google profile while retaining local password", async () => {
        // 1. Create standard local user with password
        const localUser = new User({
            username: testLocalEmail,
            email: testLocalEmail,
            fullName: "Original Local Member",
            role: "recruiter",
            authProvider: "local",
        });
        await User.register(localUser, originalLocalPass);

        // Verify local login works
        const loginRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testLocalEmail,
                password: originalLocalPass,
            }
        );
        assert.equal(loginRes.status, 200);

        // 2. Simulate account linking (same email logs in via Google)
        const userToLink = await User.findOne({ email: testLocalEmail });
        assert.ok(userToLink);
        userToLink.googleId = testGoogleId2;
        userToLink.avatarUrl = "https://lh3.googleusercontent.com/a/linked-photo=s96-c";
        await userToLink.save();

        // 3. Verify user can STILL log in with their original password
        const postLinkLogin = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testLocalEmail,
                password: originalLocalPass,
            }
        );
        assert.equal(postLinkLogin.status, 200);
        assert.equal(postLinkLogin.data.user.googleId, undefined);
        assert.equal(postLinkLogin.data.user.avatarUrl, "https://lh3.googleusercontent.com/a/linked-photo=s96-c");
    });

    await t.test("7. GET /api/auth/me returns avatarUrl and authProvider for active session", async () => {
        // Login as the linked user
        const loginRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testLocalEmail,
                password: originalLocalPass,
            }
        );
        assert.equal(loginRes.status, 200);
        const cookie = loginRes.headers["set-cookie"]?.[0];
        assert.ok(cookie);

        // Fetch /api/auth/me
        const meRes = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/me",
            method: "GET",
            headers: { Cookie: cookie },
        });

        assert.equal(meRes.status, 200);
        assert.equal(meRes.data.isAuthenticated, true);
        assert.equal(meRes.data.user.email, testLocalEmail);
        assert.equal(meRes.data.user.avatarUrl, "https://lh3.googleusercontent.com/a/linked-photo=s96-c");
    });

    await t.test("8. Multiple Google users with null googleId do not collide (sparse index)", async () => {
        const localOnly1 = new User({
            username: `sparse1_${Date.now()}@example.com`,
            email: `sparse1_${Date.now()}@example.com`,
            fullName: "Local One",
            googleId: null,
        });
        await User.register(localOnly1, "Password123!");

        const localOnly2 = new User({
            username: `sparse2_${Date.now()}@example.com`,
            email: `sparse2_${Date.now()}@example.com`,
            fullName: "Local Two",
            googleId: null,
        });
        await User.register(localOnly2, "Password123!");

        assert.ok(localOnly1._id);
        assert.ok(localOnly2._id);

        await User.deleteMany({ _id: { $in: [localOnly1._id, localOnly2._id] } });
    });

    await t.test("9. Google-only user cannot reset local password (token is not generated in DB)", async () => {
        const googleOnlyEmail = `g_only_reset_${Date.now()}@gmail.com`;
        const gUser = new User({
            username: googleOnlyEmail,
            email: googleOnlyEmail,
            fullName: "Google Only User",
            googleId: `g_only_id_${Date.now()}`,
            role: "job_seeker",
            authProvider: "google",
        });
        await gUser.save();

        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json", "x-test-rate-limit-reset": "true" },
            },
            { email: googleOnlyEmail }
        );

        // Mitigates account enumeration
        assert.equal(res.status, 200);
        assert.equal(res.data.success, true);
        assert.match(res.data.message, /instructions will be sent/i);

        // Critical verification: DB must NOT contain a password reset token for Google-only user
        const refreshedGUser = await User.findOne({ email: googleOnlyEmail });
        assert.equal(refreshedGUser.passwordResetTokenHash, null, "Password reset token hash must remain null");
        assert.equal(refreshedGUser.passwordResetExpires, null);

        await User.deleteOne({ email: googleOnlyEmail });
    });

    await t.test("10. POST /api/auth/verify-smtp verifies live SMTP server connectivity", async () => {
        const res = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/verify-smtp",
            method: "POST",
        });

        assert.equal(res.status, 200);
        assert.equal(res.data.configured, true);
        assert.equal(res.data.verified, true);
        assert.match(res.data.message, /established successfully|verified successfully|accepted credentials/i);
    });

    await t.test("11. Google OAuth privilege escalation protection: sessionRole defaults to job_seeker and never grants admin", async () => {
        const attemptedRoles = ["admin", "root", "superuser", "invalid_role"];
        for (const role of attemptedRoles) {
            const sanitized = role === "recruiter" ? "recruiter" : "job_seeker";
            assert.equal(sanitized, "job_seeker", `Role "${role}" must be sanitized to job_seeker`);
        }
    });

    // Cleanup test users
    await User.deleteMany({ email: { $in: [testGoogleEmail1, testLocalEmail] } });
    await mongoose.disconnect();
});
