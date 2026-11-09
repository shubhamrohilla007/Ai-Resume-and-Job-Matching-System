const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const TEST_EMAIL_LOG_PATH = path.join(__dirname, "../temp_sent_emails.json");

// In-memory test store for automated testing verification within same process
const sentEmailsForTesting = [];

function recordSentEmail(mailOptions, messageId) {
    const record = {
        ...mailOptions,
        messageId,
        sentAt: new Date().toISOString(),
    };
    sentEmailsForTesting.push(record);
    if (sentEmailsForTesting.length > 50) {
        sentEmailsForTesting.shift();
    }

    // Persist across processes for automated test runners
    try {
        let existing = [];
        if (fs.existsSync(TEST_EMAIL_LOG_PATH)) {
            const content = fs.readFileSync(TEST_EMAIL_LOG_PATH, "utf8");
            existing = JSON.parse(content || "[]");
        }
        existing.push(record);
        if (existing.length > 50) {
            existing = existing.slice(-50);
        }
        fs.writeFileSync(TEST_EMAIL_LOG_PATH, JSON.stringify(existing, null, 2), "utf8");
    } catch (e) {
        // Fallback silently if file write has temporary concurrency
    }
}

/**
 * Check whether real SMTP credentials have been configured in environment variables
 */
function isSmtpConfigured() {
    const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : "";
    const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
    return Boolean(smtpHost && smtpUser && smtpPass);
}

/**
 * Get configured frontend URL for password reset links
 */
function getFrontendBaseUrl() {
    return (
        process.env.FRONTEND_URL ||
        process.env.CLIENT_URL ||
        "http://localhost:5173"
    ).replace(/\/+$/, "");
}

/**
 * Create or reuse the email transporter
 */
function getTransporter() {
    const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : "";
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.trim(), 10) : 587;
    const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
    // Clean spaces from App Password (e.g. Gmail 16-character passwords often contain spaces "abcd efgh ijkl mnop")
    const smtpPass = process.env.SMTP_PASS
        ? (smtpHost.toLowerCase() === "smtp.gmail.com" ? process.env.SMTP_PASS.replace(/\s+/g, "") : process.env.SMTP_PASS.trim())
        : "";
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    if (smtpHost && smtpUser && smtpPass) {
        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    // Development / Test transporter: safely records email dispatch without crashing or external network calls
    return {
        sendMail: async (mailOptions) => {
            const messageId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            recordSentEmail(mailOptions, messageId);

            console.log(`[Email Service Simulation] Dispatched password reset email to: ${mailOptions.to}`);
            return {
                messageId,
                accepted: [mailOptions.to],
                rejected: [],
                response: "250 2.0.0 Simulated OK (No real SMTP configured)",
            };
        },
        verify: async () => {
            return true;
        },
    };
}

/**
 * Verify SMTP connection with provider
 */
async function verifySmtpConnection() {
    if (!isSmtpConfigured()) {
        return {
            configured: false,
            verified: false,
            message: "SMTP credentials (SMTP_HOST, SMTP_USER, and SMTP_PASS) are not configured in .env.",
        };
    }

    try {
        const transporter = getTransporter();
        if (typeof transporter.verify !== "function") {
            return {
                configured: false,
                verified: false,
                message: "Current transporter is operating in simulation mode.",
            };
        }
        await transporter.verify();
        return {
            configured: true,
            verified: true,
            message: "SMTP server accepted credentials and connection was established successfully.",
        };
    } catch (err) {
        return {
            configured: true,
            verified: false,
            error: err.message,
            code: err.code || "UNKNOWN_ERROR",
            message: `SMTP verification failed: ${err.message}`,
        };
    }
}

/**
 * Get safe, masked status of SMTP configuration (never exposes passwords)
 */
function getSmtpStatus() {
    const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : "";
    const smtpPort = process.env.SMTP_PORT ? process.env.SMTP_PORT.trim() : "";
    const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
    const emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : "";
    const frontendUrl = getFrontendBaseUrl();

    const configured = isSmtpConfigured();

    let maskedUser = "<unset>";
    if (smtpUser) {
        const parts = smtpUser.split("@");
        if (parts.length === 2) {
            const name = parts[0];
            const domain = parts[1];
            maskedUser = name.length > 2 ? `${name.substring(0, 2)}***@${domain}` : `***@${domain}`;
        } else {
            maskedUser = `${smtpUser.substring(0, 2)}***`;
        }
    }

    return {
        configured,
        host: smtpHost || "<unset>",
        port: smtpPort || (configured ? "587" : "<unset>"),
        secure: process.env.SMTP_SECURE === "true" || smtpPort === "465",
        userMasked: maskedUser,
        passConfigured: Boolean(smtpPass),
        passLength: smtpPass ? smtpPass.length : 0,
        emailFrom: emailFrom || "<unset>",
        frontendUrl,
        mode: configured ? "live_smtp" : "local_simulation",
    };
}

/**
 * Print server startup diagnostic banner
 */
function printSmtpDiagnostics() {
    const status = getSmtpStatus();
    console.log("----------------------------------------------------------------------");
    if (status.configured) {
        console.log("[Email Service] Real Email Delivery: ENABLED (LIVE SMTP)");
        console.log(`[Email Service] Provider: ${status.host}:${status.port} (SSL/TLS: ${status.secure})`);
        console.log(`[Email Service] Account:  ${status.userMasked}`);
        console.log(`[Email Service] Sender:   ${status.emailFrom || '"AI Resume & Careers" <no-reply@airesumesystem.com>'}`);
    } else {
        console.log("[Email Service] Real Email Delivery: DISABLED (LOCAL SIMULATION MODE)");
        console.log("[Email Service] Reason: SMTP_HOST, SMTP_USER, and SMTP_PASS are missing in .env.");
        console.log("[Email Service] Reset emails will be recorded in temp_sent_emails.json for testing.");
        console.log("[Email Service] To send real emails via Gmail, configure in .env:");
        console.log("   SMTP_HOST=smtp.gmail.com");
        console.log("   SMTP_PORT=465");
        console.log("   SMTP_SECURE=true");
        console.log("   SMTP_USER=your_account@gmail.com");
        console.log("   SMTP_PASS=your_16_character_app_password");
        console.log('   EMAIL_FROM="AI Resume & Careers" <your_account@gmail.com>');
        console.log(`   FRONTEND_URL=${status.frontendUrl}`);
    }
    console.log("----------------------------------------------------------------------");
}

/**
 * Send password reset email with cryptographically secure link
 * @param {string} toEmail - Recipient email address
 * @param {string} rawToken - Unhashed random reset token
 * @param {string} [candidateName] - Optional candidate name
 */
async function sendPasswordResetEmail(toEmail, rawToken, candidateName = "") {
    if (!toEmail || !rawToken) {
        throw new Error("Recipient email and reset token are required to dispatch reset email.");
    }

    if (
        process.env.NODE_ENV !== "production" &&
        (toEmail.includes("fail_delivery") || process.env.SIMULATE_EMAIL_FAILURE === "true")
    ) {
        throw new Error("Simulated SMTP Connection Failure: Connection refused");
    }

    const baseUrl = getFrontendBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const sender = process.env.EMAIL_FROM || `"AI Resume & Careers" <no-reply@airesumesystem.com>`;
    const recipientName = candidateName ? candidateName : "Valued Member";

    const mailOptions = {
        from: sender,
        to: toEmail,
        subject: "Password Reset Request - AI Resume & Job Matching System",
        text: `Hello ${recipientName},

We received a request to reset the password for your account.

To set a new password, click the link below (valid for 15 minutes):
${resetUrl}

If you did not request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The AI Resume & Job Matching Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">AI-Powered Resume System</h1>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Hello <strong>${recipientName}</strong>,<br><br>
        We received a request to reset the password associated with your account (<strong>${toEmail}</strong>). Click the button below to choose a new password:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        <strong>Security Notice:</strong> This link will expire in <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains secure.
      </p>
      <p style="font-size: 11.5px; color: #94a3b8; word-break: break-all; margin-top: 16px;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    };

    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
        recordSentEmail(mailOptions, result.messageId);
    }
    console.log(`[Email Service] Dispatched email to: ${toEmail} (MessageID: ${result.messageId})`);

    if (result.rejected && result.rejected.length > 0 && (!result.accepted || result.accepted.length === 0)) {
        throw new Error(`Email provider rejected recipient: ${result.rejected.join(", ")}`);
    }

    return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted || [toEmail],
        resetUrl,
    };
}

/**
 * Send notification to Google OAuth users who attempt password reset
 * @param {string} toEmail - Recipient email address
 * @param {string} [candidateName] - Optional candidate name
 */
async function sendGoogleAccountNoticeEmail(toEmail, candidateName = "") {
    if (!toEmail) {
        throw new Error("Recipient email is required.");
    }

    const baseUrl = getFrontendBaseUrl();
    const loginUrl = `${baseUrl}/login`;
    const sender = process.env.EMAIL_FROM || `"AI Resume & Careers" <no-reply@airesumesystem.com>`;
    const recipientName = candidateName ? candidateName : "Valued Member";

    const mailOptions = {
        from: sender,
        to: toEmail,
        subject: "Google Account Sign-In Notice - AI Resume & Job Matching System",
        text: `Hello ${recipientName},

We received a request to reset the password associated with ${toEmail}.

However, your account was created using Google Sign-In and does not use an independent password.

To access your account, please visit:
${loginUrl}
and click "Sign in with Google".

If you did not make this request, you can safely ignore this email.

Best regards,
The AI Resume & Job Matching Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google Account Notice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">AI-Powered Resume System</h1>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Google Sign-In Notice</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Hello <strong>${recipientName}</strong>,<br><br>
        We received a request to reset the password for your account (<strong>${toEmail}</strong>).<br><br>
        However, your account was created with <strong>Google Sign-In</strong> and does not use a separate password.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          Sign In with Google
        </a>
      </div>
      <p style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        If you did not request this, please ignore this email. Your Google account remains completely secure.
      </p>
    </div>
  </div>
</body>
</html>`,
    };

    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV !== "production") {
        recordSentEmail(mailOptions, result.messageId);
    }
    return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted || [toEmail],
    };
}

// Helpers for automated security test suites
function _getLastSentEmail() {
    try {
        if (fs.existsSync(TEST_EMAIL_LOG_PATH)) {
            const content = fs.readFileSync(TEST_EMAIL_LOG_PATH, "utf8");
            const parsed = JSON.parse(content || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[parsed.length - 1];
            }
        }
    } catch (e) {
        // Fallback to memory
    }
    return sentEmailsForTesting[sentEmailsForTesting.length - 1] || null;
}

function _getAllSentEmails() {
    try {
        if (fs.existsSync(TEST_EMAIL_LOG_PATH)) {
            const content = fs.readFileSync(TEST_EMAIL_LOG_PATH, "utf8");
            const parsed = JSON.parse(content || "[]");
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        // Fallback
    }
    return [...sentEmailsForTesting];
}

function _clearSentEmails() {
    sentEmailsForTesting.length = 0;
    try {
        if (fs.existsSync(TEST_EMAIL_LOG_PATH)) {
            fs.writeFileSync(TEST_EMAIL_LOG_PATH, "[]", "utf8");
        }
    } catch (e) {
        // Ignore
    }
}

module.exports = {
    isSmtpConfigured,
    verifySmtpConnection,
    getSmtpStatus,
    printSmtpDiagnostics,
    sendPasswordResetEmail,
    sendGoogleAccountNoticeEmail,
    getFrontendBaseUrl,
    _getLastSentEmail,
    _getAllSentEmails,
    _clearSentEmails,
};
