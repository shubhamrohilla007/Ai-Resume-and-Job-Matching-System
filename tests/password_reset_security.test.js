require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");
const User = require("../models/User");
const { _getLastSentEmail, _clearSentEmails, isSmtpConfigured } = require("../services/emailService");
const { _resetRateLimits } = require("../middleware/passwordResetLimiter");

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

async function clearServerRateLimits() {
    _resetRateLimits();
    try {
        await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-test-rate-limit-reset": "true",
                },
            },
            { resetOnly: true }
        );
    } catch (e) {
        // ignore
    }
}

test("Password Reset Security & Email Verification Test Suite", async (t) => {
    // Connect mongoose if not already connected
    if (mongoose.connection.readyState === 0) {
        const connectDB = require("../config/db");
        await connectDB();
    }

    const testEmailA = `sec_victim_${Date.now()}@example.com`;
    const testEmailB = `sec_attacker_${Date.now()}@example.com`;
    const originalPasswordA = "OriginalPassA123!";
    const originalPasswordB = "OriginalPassB123!";
    const newPasswordA = "UpdatedSecurePassA456!";

    // Setup User A and User B
    await clearServerRateLimits();
    _clearSentEmails();

    await t.test("Setup test accounts in database", async () => {
        const userA = new User({
            username: testEmailA,
            email: testEmailA,
            fullName: "Alice Victim",
            role: "job_seeker",
        });
        await User.register(userA, originalPasswordA);

        const userB = new User({
            username: testEmailB,
            email: testEmailB,
            fullName: "Bob Attacker",
            role: "job_seeker",
        });
        await User.register(userB, originalPasswordB);

        assert.ok(userA._id);
        assert.ok(userB._id);
    });

    await t.test("Case 1: Submitting an email alone cannot change any password", async () => {
        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailA,
                newPassword: "MaliciousPassword123",
                confirmPassword: "MaliciousPassword123",
            }
        );

        assert.equal(res.status, 400, "Must return HTTP 400 when token is missing");
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /token is required/i);

        // Verify User A password is NOT changed
        const loginRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailA,
                password: originalPasswordA,
            }
        );
        assert.equal(loginRes.status, 200, "Original password must still work");
    });

    await t.test("Case 2: A reset request does not grant reset authorization and never reveals raw tokens in API", async () => {
        _clearSentEmails();
        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailA,
            }
        );

        assert.equal(res.status, 200);
        assert.equal(res.data.success, true);
        assert.match(res.data.message, /instructions will be sent/i);
        // Security check: Raw token must NEVER be returned in response body
        assert.equal(res.data.token, undefined, "API must NEVER return raw reset token");
        assert.equal(res.data.resetToken, undefined, "API must NEVER return raw resetToken");
        assert.equal(res.data.passwordResetTokenHash, undefined);

        // Verify database stores ONLY SHA-256 hash, not raw token
        const dbUser = await User.findOne({ email: testEmailA });
        assert.ok(dbUser.passwordResetTokenHash, "Token hash must be stored in DB");
        assert.equal(dbUser.passwordResetTokenHash.length, 64, "Token hash must be a 64-char hex SHA-256 string");
        assert.ok(dbUser.passwordResetExpires > new Date(), "Expiration must be in the future");
    });

    await t.test("Case 3 & 12: A valid emailed token allows password change, new password works, and old password fails", async () => {
        // Retrieve the dispatched email from the email service
        const sentEmail = _getLastSentEmail();
        assert.ok(sentEmail, "Email must have been dispatched");
        assert.equal(sentEmail.to, testEmailA);

        // Extract token from reset link in email
        const tokenMatch = sentEmail.text.match(/token=([a-f0-9]{64})/i);
        assert.ok(tokenMatch, "Reset link must contain 64-char hex token");
        const rawToken = tokenMatch[1];

        // 1. Verify token endpoint verifies it is valid
        const verifyRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: `/api/auth/verify-reset-token?token=${rawToken}`,
                method: "GET",
            }
        );
        assert.equal(verifyRes.status, 200);
        assert.equal(verifyRes.data.valid, true);

        // 2. Submit password reset with the valid token
        const resetRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: rawToken,
                newPassword: newPasswordA,
                confirmPassword: newPasswordA,
            }
        );
        assert.equal(resetRes.status, 200);
        assert.equal(resetRes.data.success, true);

        // 3. Old password must fail
        const oldLoginRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailA,
                password: originalPasswordA,
            }
        );
        assert.equal(oldLoginRes.status, 401, "Old password must be rejected");

        // 4. New password must succeed
        const newLoginRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailA,
                password: newPasswordA,
            }
        );
        assert.equal(newLoginRes.status, 200, "New password must authenticate successfully");
    });

    await t.test("Case 4: A missing token is rejected", async () => {
        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: "",
                newPassword: "ValidPassword123!",
                confirmPassword: "ValidPassword123!",
            }
        );
        assert.equal(res.status, 400);
        assert.equal(res.data.success, false);
    });

    await t.test("Case 5: An invalid token is rejected", async () => {
        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
                newPassword: "ValidPassword123!",
                confirmPassword: "ValidPassword123!",
            }
        );
        assert.equal(res.status, 400);
        assert.equal(res.data.success, false);
        assert.match(res.data.message, /invalid, expired, or has already been used/i);
    });

    await t.test("Case 6: An expired token is rejected", async () => {
        // Request token for User B
        _clearSentEmails();
        await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            { email: testEmailB }
        );

        const sentEmail = _getLastSentEmail();
        const rawToken = sentEmail.text.match(/token=([a-f0-9]{64})/i)[1];

        // Manually expire token in database (10 minutes in the past)
        await User.updateOne(
            { email: testEmailB },
            { $set: { passwordResetExpires: new Date(Date.now() - 10 * 60 * 1000) } }
        );

        // Attempt verify token
        const verifyRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: `/api/auth/verify-reset-token?token=${rawToken}`,
                method: "GET",
            }
        );
        assert.equal(verifyRes.status, 400);
        assert.equal(verifyRes.data.valid, false);

        // Attempt reset password
        const resetRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: rawToken,
                newPassword: "ExpiredAttemptPass123!",
                confirmPassword: "ExpiredAttemptPass123!",
            }
        );
        assert.equal(resetRes.status, 400);
        assert.equal(resetRes.data.success, false);
        assert.match(resetRes.data.message, /expired/i);
    });

    await t.test("Case 7: A previously used token is rejected (single-use enforcement)", async () => {
        // Issue fresh token for User B
        _clearSentEmails();
        await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            { email: testEmailB }
        );

        const sentEmail = _getLastSentEmail();
        const rawToken = sentEmail.text.match(/token=([a-f0-9]{64})/i)[1];

        // 1st use: should succeed
        const firstUseRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: rawToken,
                newPassword: "UserBNewPass123!",
                confirmPassword: "UserBNewPass123!",
            }
        );
        assert.equal(firstUseRes.status, 200);

        // 2nd use: MUST be rejected immediately
        const secondUseRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: rawToken,
                newPassword: "ReplayAttackPass456!",
                confirmPassword: "ReplayAttackPass456!",
            }
        );
        assert.equal(secondUseRes.status, 400, "Used token must be rejected");
        assert.equal(secondUseRes.data.success, false);
    });

    await t.test("Case 8: A token for Account A cannot reset Account B's password", async () => {
        // Request token for User A
        _clearSentEmails();
        await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            { email: testEmailA }
        );

        const sentEmail = _getLastSentEmail();
        const rawTokenA = sentEmail.text.match(/token=([a-f0-9]{64})/i)[1];

        // Attempt to pass tokenA while attempting to modify User B
        // Because token strictly resolves user from its hash in DB, User B is unaffected
        const resetRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                token: rawTokenA,
                email: testEmailB, // Attempt to spoof target email
                newPassword: "TargetedHijack123!",
                confirmPassword: "TargetedHijack123!",
            }
        );

        // The reset succeeds ONLY for the account owning the token (User A)
        assert.equal(resetRes.status, 200);

        // Verify User B password is NOT changed
        const loginB = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailB,
                password: "UserBNewPass123!", // Current User B password
            }
        );
        assert.equal(loginB.status, 200, "User B password must be completely unaffected");

        const failedLoginB = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: testEmailB,
                password: "TargetedHijack123!",
            }
        );
        assert.equal(failedLoginB.status, 401, "Hijack password must not have touched User B");
    });

    await t.test("Case 9: A forged frontend verification flag cannot bypass backend validation", async () => {
        const res = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/reset-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                verified: true,
                clientVerified: true,
                isAuthorized: true,
                email: testEmailA,
                newPassword: "BypassAttempt123!",
                confirmPassword: "BypassAttempt123!",
            }
        );
        assert.equal(res.status, 400);
        assert.equal(res.data.success, false);
    });

    await t.test("Case 10: Repeated requests are rate-limited", async () => {
        await clearServerRateLimits();
        const spamEmail = `ratelimit_${Date.now()}@example.com`;

        // First 5 requests should succeed (under limit)
        for (let i = 0; i < 5; i++) {
            const res = await apiRequest(
                {
                    hostname: "localhost",
                    port: 8080,
                    path: "/api/auth/forgot-password",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                },
                { email: spamEmail }
            );
            assert.equal(res.status, 200);
        }

        // 6th request must trigger HTTP 429 Too Many Requests
        const limitedRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/forgot-password",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            { email: spamEmail }
        );

        assert.equal(limitedRes.status, 429, "6th request within window must be rate-limited (HTTP 429)");
        assert.equal(limitedRes.data.success, false);
        assert.match(limitedRes.data.message, /too many/i);

        await clearServerRateLimits();
    });

    await t.test("Case 11: Email delivery failures are handled safely without leaving dangling active tokens", async () => {
        const failEmail = `fail_delivery_${Date.now()}@example.com`;
        const failUser = new User({
            username: failEmail,
            email: failEmail,
            fullName: "Simulated Delivery Failure User",
            role: "job_seeker",
        });
        await User.register(failUser, "ValidPass123!");

        try {
            const res = await apiRequest(
                {
                    hostname: "localhost",
                    port: 8080,
                    path: "/api/auth/forgot-password",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                },
                { email: failEmail }
            );

            // Server must catch failure and report 500 safely
            assert.equal(res.status, 500);
            assert.equal(res.data.success, false);
            assert.match(res.data.message, /unable to send/i);

            // Verify database token was rolled back to null
            const userInDb = await User.findOne({ email: failEmail });
            assert.equal(userInDb.passwordResetTokenHash, null, "Token must be rolled back on delivery failure");
            assert.equal(userInDb.passwordResetExpires, null);
        } finally {
            await User.deleteOne({ email: failEmail });
        }
    });

    await t.test("Case 13: Existing login, signup, logout, and protected routes continue working", async () => {
        const normalUser = `normal_${Date.now()}@example.com`;
        const normalPass = "NormalPassword123!";

        // 1. Signup
        const signupRes = await apiRequest(
            {
                hostname: "localhost",
                port: 8080,
                path: "/api/auth/signup",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                fullName: "Normal User",
                email: normalUser,
                password: normalPass,
            }
        );
        assert.equal(signupRes.status, 201);
        const cookie = signupRes.headers["set-cookie"]?.[0];

        // 2. Auth me with session cookie
        const meRes = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/me",
            method: "GET",
            headers: cookie ? { Cookie: cookie } : {},
        });
        assert.equal(meRes.status, 200);
        assert.equal(meRes.data.isAuthenticated, true);
        assert.equal(meRes.data.user.email, normalUser);

        // 3. Logout
        const logoutRes = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/logout",
            method: "POST",
            headers: cookie ? { Cookie: cookie } : {},
        });
        assert.equal(logoutRes.status, 200);
    });

    await t.test("Case 14: Development mode SMTP configuration behavior", async () => {
        await clearServerRateLimits();
        const nonTestRes = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/forgot-password",
            method: "POST",
            headers: {
                "x-test-suite": "false",
                "Content-Type": "application/json",
            },
        }, {
            email: "smtp_check@example.com"
        });

        if (isSmtpConfigured()) {
            assert.equal(nonTestRes.status, 200, "When SMTP is configured, request succeeds with HTTP 200");
            assert.equal(nonTestRes.data.success, true);
        } else {
            assert.equal(nonTestRes.status, 503, "When SMTP is unconfigured in dev, returns HTTP 503");
            assert.equal(nonTestRes.data.code, "SMTP_NOT_CONFIGURED");
            assert.match(nonTestRes.data.message, /SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS/i);
        }
    });

    await t.test("Case 15: GET /api/auth/email-status returns safe configuration diagnostics without exposing secrets", async () => {
        const statusRes = await apiRequest({
            hostname: "localhost",
            port: 8080,
            path: "/api/auth/email-status",
            method: "GET",
        });

        assert.equal(statusRes.status, 200);
        assert.equal(statusRes.data.success, true);
        assert.ok(statusRes.data.status);
        assert.equal(typeof statusRes.data.status.configured, "boolean");
        assert.equal(typeof statusRes.data.status.mode, "string");
        // Ensure secret password is never returned in status
        assert.equal(statusRes.data.status.SMTP_PASS, undefined);
        assert.equal(statusRes.data.status.smtpPass, undefined);
        assert.equal(statusRes.data.status.password, undefined);
    });

    // Cleanup test users and temp files
    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });
    _clearSentEmails();
    await mongoose.disconnect();
});
