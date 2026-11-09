const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        adminName: {
            type: String,
            required: true,
            trim: true,
        },
        adminEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                "USER_ROLE_CHANGE",
                "USER_STATUS_CHANGE",
                "USER_DELETED",
                "JOB_STATUS_CHANGE",
                "JOB_DELETED",
                "RESUME_DELETED",
                "SETTINGS_CHANGE",
                "ADMIN_LOGIN",
            ],
            index: true,
        },
        targetEntity: {
            type: String,
            required: true,
            enum: ["User", "Job", "Resume", "Application", "System"],
        },
        targetId: {
            type: String,
            default: "",
            trim: true,
        },
        details: {
            type: String,
            default: "",
            trim: true,
        },
        ipAddress: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Auto-index on createdAt / timestamp for fast activity log sorting and retrieval
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
