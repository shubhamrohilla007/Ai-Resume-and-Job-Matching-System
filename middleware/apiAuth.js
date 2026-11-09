/**
 * API Authentication & Role Authorization Middleware
 * Returns JSON status codes (401/403) for React client calls.
 */

function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Please log in to access this resource.",
      code: "UNAUTHORIZED",
    });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Please log in first.",
        code: "UNAUTHORIZED",
      });
    }

    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${role} role.`,
        code: "FORBIDDEN",
      });
    }

    next();
  };
}

function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Please log in first.",
        code: "UNAUTHORIZED",
      });
    }

    if (!roles.includes(req.user.role) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient role permissions.",
        code: "FORBIDDEN",
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAnyRole,
};
