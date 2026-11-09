// In-memory rate limiting store for password reset requests
const ipRequests = new Map();
const emailRequests = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // 5 requests per window

/**
 * Clean up entries older than WINDOW_MS
 */
function cleanupExpired(map) {
    const now = Date.now();
    for (const [key, timestamps] of map.entries()) {
        const valid = timestamps.filter((t) => now - t < WINDOW_MS);
        if (valid.length === 0) {
            map.delete(key);
        } else {
            map.set(key, valid);
        }
    }
}

/**
 * Express middleware to rate-limit password reset requests by IP and email
 */
function passwordResetRateLimiter(req, res, next) {
    if (process.env.NODE_ENV !== "production" && req.headers["x-test-rate-limit-reset"] === "true") {
        _resetRateLimits();
        if (req.body && req.body.resetOnly) {
            return res.json({ success: true, message: "Rate limits cleared for testing" });
        }
    }

    cleanupExpired(ipRequests);
    cleanupExpired(emailRequests);

    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const email = req.body && typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : null;
    const now = Date.now();

    // 1. Check IP limit
    const ipTimestamps = ipRequests.get(clientIp) || [];
    const validIpTimestamps = ipTimestamps.filter((t) => now - t < WINDOW_MS);
    if (validIpTimestamps.length >= MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            message: "Too many password reset requests from this network. Please wait a few minutes before trying again.",
        });
    }

    // 2. Check Email limit
    if (email) {
        const emailTimestamps = emailRequests.get(email) || [];
        const validEmailTimestamps = emailTimestamps.filter((t) => now - t < WINDOW_MS);
        if (validEmailTimestamps.length >= MAX_REQUESTS) {
            return res.status(429).json({
                success: false,
                message: "Too many password reset requests for this account. Please wait a few minutes before trying again.",
            });
        }
        validEmailTimestamps.push(now);
        emailRequests.set(email, validEmailTimestamps);
    }

    validIpTimestamps.push(now);
    ipRequests.set(clientIp, validIpTimestamps);

    next();
}

function _resetRateLimits() {
    ipRequests.clear();
    emailRequests.clear();
}

module.exports = {
    passwordResetRateLimiter,
    _resetRateLimits,
};
