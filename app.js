require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const cors = require("cors");
const passport = require("passport");
const initializePassport = require("./config/passport");
const { getMongoUri, getDbName } = require("./config/db");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

// Reverse Proxy Trust for Cloud Deployments (Render, Heroku, AWS ELB)
app.set("trust proxy", 1);

// Import Legacy EJS Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");
const resumeRoutes = require("./routes/resume");
const resumeBuilderRoutes = require("./routes/resumeBuilder");
const jobsRoutes = require("./routes/jobs");

// Import React-facing API Routes
const apiRoutes = require("./routes/api");

// CORS configuration for React SPA
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        credentials: true,
    })
);

// Health check endpoint for Cloud monitoring & load balancers (Render, Railway)
app.get(["/health", "/healthz"], (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Legacy View Engine setup (preserved during migration)
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Static assets
app.use(express.static(path.join(__dirname, "public")));

// Protect local uploads directory from direct unauthenticated file retrieval
app.use("/uploads/resumes", (req, res) => {
    return res.status(403).json({
        success: false,
        message: "Direct file access forbidden. Use authorized API endpoints.",
    });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session Store configuration
const sessionSecret = process.env.SESSION_SECRET || "ai_resume_dev_secret_key_2026";
let store;

const mongoUri = getMongoUri();
if (mongoUri) {
    try {
        store = MongoStore.create({
            mongoUrl: mongoUri,
            dbName: getDbName(mongoUri),
            crypto: {
                secret: sessionSecret,
            },
            touchAfter: 24 * 3600,
        });
    } catch (e) {
        console.warn("MongoStore creation failed, falling back to memory store:", e.message);
    }
}

const sessionConfig = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
initializePassport();

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Mount Modern JSON API Endpoints
app.use("/api", apiRoutes);

// Direct download/file endpoints for backward compatibility
const resumeApiController = require("./controllers/api/resumeController");
const { requireAuth, requireRole, requireAnyRole } = require("./middleware/apiAuth");
app.get("/resume/file", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), resumeApiController.serveResumeFile);
app.get("/resume/download", requireAuth, requireAnyRole(["job_seeker", "recruiter", "admin"]), resumeApiController.downloadResumeFile);

// Mount Legacy EJS Routes under /legacy prefix so they remain preserved for backward compatibility
// but do not hijack modern React SPA routes (e.g., /resume/builder, /dashboard, etc.)
app.use("/legacy", authRoutes);
app.use("/legacy", dashboardRoutes);
app.use("/legacy", profileRoutes);
app.use("/legacy", resumeRoutes);
app.use("/legacy", resumeBuilderRoutes);
app.use("/legacy", jobsRoutes);

// Serve built React client if available
const clientDistPath = path.join(__dirname, "client/dist");
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get(/^(?!\/api|\/legacy|\/uploads|\/resume\/file|\/resume\/download).*$/, (req, res, next) => {
        // If request accepts HTML and doesn't match API, serve React index.html
        if (req.accepts("html")) {
            return res.sendFile(path.join(clientDistPath, "index.html"));
        }
        next();
    });
} else {
    // Fallback Home Route for EJS if client build is not yet generated
    app.get("/", (req, res) => {
        res.render("home/index");
    });
}

// Global API error handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    if (req.originalUrl.startsWith("/api")) {
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal Server Error",
        });
    }
    next(err);
});

module.exports = app;
