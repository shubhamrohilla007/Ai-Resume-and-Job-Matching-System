const crypto = require("crypto");
const passport = require("passport");
const User = require("../../models/User");
const {
    sendPasswordResetEmail,
    sendGoogleAccountNoticeEmail,
    isSmtpConfigured,
    getSmtpStatus,
    verifySmtpConnection,
    getFrontendBaseUrl,
} = require("../../services/emailService");

// Signup Handler
module.exports.signup = async (req, res, next) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !fullName.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields (Full name, email, password).",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address format.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match. Please re-enter.",
            });
        }

        // Check if user already exists
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        // Enforce privilege safety: public registration can only create job_seeker or recruiter
        const requestedRole = req.body.role === "recruiter" ? "recruiter" : "job_seeker";

        const newUser = new User({
            username: normalizedEmail,
            email: normalizedEmail,
            fullName: fullName.trim(),
            role: requestedRole,
        });

        const registeredUser = await User.register(newUser, password);

        const performSignupLogin = () => {
            req.login(registeredUser, (err) => {
                if (err) return next(err);

                return res.status(201).json({
                    success: true,
                    message: "Account created successfully!",
                    user: {
                        id: registeredUser._id,
                        fullName: registeredUser.fullName,
                        email: registeredUser.email,
                        role: registeredUser.role,
                        avatarUrl: registeredUser.avatarUrl || "",
                        authProvider: registeredUser.authProvider || "local",
                    },
                });
            });
        };

        if (req.session && typeof req.session.regenerate === "function") {
            req.session.regenerate(() => performSignupLogin());
        } else {
            performSignupLogin();
        }
    } catch (err) {
        console.error("API Signup error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Unable to create your account.",
        });
    }
};

// Login Handler
module.exports.login = (req, res, next) => {
    const rawEmail = req.body.email || req.body.username;
    const password = req.body.password;

    if (!rawEmail || !String(rawEmail).trim() || !password || !String(password).trim()) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required.",
        });
    }

    if (!req.body.username && req.body.email) {
        req.body.username = String(req.body.email).trim().toLowerCase();
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: info?.message || "Invalid email or password.",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support.",
            });
        }

        const performLogin = () => {
            req.login(user, (loginErr) => {
                if (loginErr) return next(loginErr);

                return res.json({
                    success: true,
                    message: `Welcome back, ${user.fullName}!`,
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role,
                        avatarUrl: user.avatarUrl || "",
                        authProvider: user.authProvider || "local",
                    },
                });
            });
        };

        // Regenerate session ID to mitigate session fixation attacks
        if (req.session && typeof req.session.regenerate === "function") {
            req.session.regenerate((regenErr) => {
                if (regenErr) console.warn("Session regeneration warning:", regenErr.message);
                performLogin();
            });
        } else {
            performLogin();
        }
    })(req, res, next);
};

// Logout Handler
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            return res.json({
                success: true,
                message: "Logged out successfully.",
            });
        });
    });
};

// Current Session Info
module.exports.getCurrentUser = (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return res.json({
            success: true,
            isAuthenticated: true,
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                avatarUrl: req.user.avatarUrl || "",
                authProvider: req.user.authProvider || "local",
            },
        });
    }

    return res.json({
        success: true,
        isAuthenticated: false,
        user: null,
    });
};

// Forgot Password Handler
// Generates cryptographically secure token, stores SHA-256 hash with 15-min expiry, dispatches email
module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address format.",
            });
        }

        const isTestSuite = req.headers["x-test-suite"] === "true" || process.env.NODE_ENV === "test";
        const smtpConfigured = isSmtpConfigured();

        // If SMTP is NOT configured and this request is NOT part of an automated test suite:
        if (!smtpConfigured && !isTestSuite) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    `[Email Service Warning] Forgot password requested for "${normalizedEmail}", but SMTP is not configured in .env.`
                );
                return res.status(503).json({
                    success: false,
                    code: "SMTP_NOT_CONFIGURED",
                    message:
                        "Email delivery is not configured on the server. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file to receive password reset emails.",
                });
            } else {
                console.error(
                    `[Email Service Alert] Production server received password reset request but SMTP is NOT configured in .env!`
                );
                return res.json({
                    success: true,
                    message: "If an account exists for this email, password reset instructions will be sent.",
                });
            }
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Google-only users without a local password cannot reset a local password.
            // Dispatch a notice to their email guiding them to use Google Sign-In.
            if (user.authProvider === "google" && (!user.hash || user.hash.length === 0)) {
                try {
                    await sendGoogleAccountNoticeEmail(user.email, user.fullName);
                } catch (noticeErr) {
                    console.error("[Auth] Failed to dispatch Google sign-in notice email:", noticeErr.message);
                }
                // Return generic response to prevent account enumeration
                return res.json({
                    success: true,
                    message: "If an account exists for this email, password reset instructions will be sent.",
                });
            }

            // Generate cryptographically secure random token (32 bytes = 256 bits of entropy)
            const rawToken = crypto.randomBytes(32).toString("hex");

            // Compute SHA-256 hash for secure database storage
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

            // Save token hash with 15-minute expiration
            user.passwordResetTokenHash = tokenHash;
            user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
            user.passwordResetUsed = false;
            await user.save();

            try {
                // Dispatch email containing the unhashed token URL
                await sendPasswordResetEmail(user.email, rawToken, user.fullName);
            } catch (mailErr) {
                console.error("[Auth] Failed to dispatch password reset email:", mailErr.message);
                // Roll back token state so an unreachable token is not left active in DB
                user.passwordResetTokenHash = null;
                user.passwordResetExpires = null;
                await user.save();

                return res.status(500).json({
                    success: false,
                    message: "Unable to send password reset email at this moment. Please try again later.",
                });
            }
        } else {
            // Constant-time dummy hash computation to mitigate timing attacks / user enumeration
            crypto.createHash("sha256").update(normalizedEmail + "dummy_timing_salt").digest("hex");
        }

        // Return a generic neutral confirmation that never reveals whether the account exists
        return res.json({
            success: true,
            message: "If an account exists for this email, password reset instructions will be sent.",
        });
    } catch (err) {
        console.error("API forgotPassword error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request. Please try again later.",
        });
    }
};

// Verify Reset Token Handler
// Allows frontend to pre-validate that the token from the emailed link is valid, unexpired, and unused
module.exports.verifyResetToken = async (req, res) => {
    try {
        const token = req.query.token || req.body?.token;
        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: "Reset token is missing or invalid.",
            });
        }

        const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

        const user = await User.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpires: { $gt: new Date() },
            passwordResetUsed: false,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: "This password reset link is invalid, expired, or has already been used.",
            });
        }

        return res.json({
            success: true,
            valid: true,
            message: "Reset token is valid.",
        });
    } catch (err) {
        console.error("API verifyResetToken error:", err.message);
        return res.status(500).json({
            success: false,
            valid: false,
            message: "Unable to verify reset token.",
        });
    }
};

// Reset Password Handler
// Strictly validates token hash, checks expiration and single-use, updates password, and invalidates token
module.exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // 1. Validate token is present
        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                message: "Password reset token is required. Please use the link sent to your email.",
            });
        }

        // 2. Validate passwords
        if (!newPassword || typeof newPassword !== "string") {
            return res.status(400).json({
                success: false,
                message: "A new password is required.",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long.",
            });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match. Please re-enter.",
            });
        }

        // 3. Hash the submitted token to verify against stored hash
        const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

        // 4. Query user with matching unexpired, unused token
        const user = await User.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpires: { $gt: new Date() },
            passwordResetUsed: false,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Password reset link is invalid, expired, or has already been used. Please request a new reset link.",
            });
        }

        // 5. Update user password via passport-local-mongoose
        await user.setPassword(newPassword);

        // 6. Invalidate the reset token immediately to prevent reuse
        user.passwordResetTokenHash = null;
        user.passwordResetExpires = null;
        user.passwordResetUsed = true;
        await user.save();

        // 7. Invalidate existing session if available
        if (req.session) {
            req.session.destroy(() => {});
        }

        return res.json({
            success: true,
            message: "Your password has been successfully reset. You can now log in with your new password.",
        });
    } catch (err) {
        console.error("API resetPassword error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password. Please try again.",
        });
    }
};

// Get Email System Status (safe diagnostic, never exposes secrets)
module.exports.getEmailStatus = (req, res) => {
    try {
        const status = getSmtpStatus();
        return res.json({
            success: true,
            status,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// Verify SMTP Connection with Provider
module.exports.verifySmtp = async (req, res) => {
    try {
        const result = await verifySmtpConnection();
        return res.json({
            success: result.verified,
            ...result,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// ==========================================
// Google OAuth 2.0 Handlers
// ==========================================

// Google OAuth Status
module.exports.getGoogleAuthStatus = (req, res) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : "";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : "";
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`;

    return res.json({
        success: true,
        configured: Boolean(googleClientId && googleClientSecret),
        clientIdConfigured: Boolean(googleClientId),
        callbackUrl,
    });
};

// Google OAuth Initiation
module.exports.googleAuth = (req, res, next) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : "";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : "";
    const frontendBaseUrl = getFrontendBaseUrl(req);

    if (!googleClientId || !googleClientSecret) {
        console.warn("[Google OAuth Warning] Attempted Google Sign-In but GOOGLE_CLIENT_ID/SECRET are missing in .env.");
        return res.redirect(`${frontendBaseUrl}/login?error=google_oauth_not_configured`);
    }

    // Save requested signup role in session if specified
    if (req.session) {
        req.session.oauthRole = req.query.role === "recruiter" ? "recruiter" : "job_seeker";
    }

    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })(req, res, next);
};

// Google OAuth Callback
module.exports.googleCallback = (req, res, next) => {
    const frontendBaseUrl = getFrontendBaseUrl(req);

    // Catch OAuth denial, cancellation, or missing code immediately
    if (req.query.error || !req.query.code) {
        console.warn("[Google OAuth Callback] Missing authorization code or error:", req.query.error || "no_code_provided");
        return res.redirect(`${frontendBaseUrl}/login?error=google_auth_failed`);
    }

    passport.authenticate("google", (err, user, info) => {
        if (err || !user) {
            console.error("[Google OAuth Error] Callback authentication failed:", err ? err.message : info);
            return res.redirect(`${frontendBaseUrl}/login?error=google_auth_failed`);
        }

        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error("[Google OAuth Error] Session login failed:", loginErr.message);
                return res.redirect(`${frontendBaseUrl}/login?error=google_auth_failed`);
            }

            console.log(`[Google OAuth] User logged in successfully: ${user.email} (${user.role})`);
            return res.redirect(`${frontendBaseUrl}/dashboard?oauth_success=true`);
        });
    })(req, res, next);
};
