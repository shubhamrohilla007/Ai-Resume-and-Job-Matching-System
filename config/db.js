const mongoose = require("mongoose");

/**
 * Returns the effective MongoDB Atlas connection URI.
 * Exclusively connects to MongoDB Atlas (ATLASDB, ATLASDB_URL, or MONGODB_URI).
 * Local storage MongoDB (127.0.0.1 / localhost) is strictly forbidden and disabled.
 */
function getMongoUri() {
    const raw = (
        process.env.ATLASDB ||
        process.env.ATLASDB_URL ||
        process.env.MONGODB_URI ||
        process.env.MONGO_URL
    );

    if (!raw || !String(raw).trim()) {
        throw new Error(
            "[Database] Configuration Error: No MongoDB Atlas connection URI configured. " +
            "Please provide ATLASDB or ATLASDB_URL in your environment variables. " +
            "Local storage MongoDB is strictly disabled."
        );
    }

    const uri = String(raw).trim();

    // Enforce cloud-only database policy: reject any localhost or 127.0.0.1 attempts
    if (
        uri.includes("localhost") ||
        uri.includes("127.0.0.1") ||
        uri.includes("0.0.0.0") ||
        (!uri.startsWith("mongodb+srv://") && !uri.includes(".mongodb.net"))
    ) {
        throw new Error(
            "[Database] Security & Compliance Error: Local storage database is strictly disabled. " +
            "Only cloud-hosted MongoDB Atlas connections (mongodb+srv://... or *.mongodb.net) are permitted."
        );
    }

    return uri;
}

/**
 * Masks credentials in MongoDB connection string for safe diagnostics logging.
 */
function maskMongoUri(uri) {
    if (!uri || typeof uri !== "string") return "";
    try {
        return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    } catch {
        return "mongodb://[masked]";
    }
}

function getDbName(uri = null) {
    if (process.env.MONGO_DB_NAME) return process.env.MONGO_DB_NAME;
    const target = uri || getMongoUri();
    try {
        const dummy = target.replace("mongodb+srv://", "http://").replace("mongodb://", "http://");
        const parsed = new URL(dummy);
        const name = parsed.pathname.replace(/^\//, "");
        if (name && name !== "test") {
            return name;
        }
    } catch {}
    return "ai_resume_system";
}

/**
 * Connects to MongoDB with cloud-ready options, reconnection listeners, and sanitized logs.
 */
async function connectDB(customUri = null) {
    const uri = customUri || getMongoUri();
    const maskedUri = maskMongoUri(uri);
    const dbName = getDbName(uri);

    const mongooseOptions = {
        dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    try {
        await mongoose.connect(uri, mongooseOptions);
        console.log(`[Database] MongoDB Connected Successfully: ${maskedUri} (db: ${dbName})`);
    } catch (error) {
        console.error(`[Database] MongoDB Connection Failed (${maskedUri}):`, error.message);
        if (process.env.NODE_ENV === "production") {
            process.exit(1);
        } else {
            console.warn("[Database] Running in non-production mode; connection failure logged.");
            throw error;
        }
    }

    // Attach event listeners for monitoring lifecycle
    mongoose.connection.on("error", (err) => {
        console.error("[Database] Mongoose runtime connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("[Database] Mongoose disconnected from MongoDB.");
    });

    mongoose.connection.on("reconnected", () => {
        console.log("[Database] Mongoose reconnected to MongoDB.");
    });
}

module.exports = connectDB;
module.exports.getMongoUri = getMongoUri;
module.exports.getDbName = getDbName;
module.exports.maskMongoUri = maskMongoUri;
