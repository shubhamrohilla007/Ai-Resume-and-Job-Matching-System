const mongoose = require("mongoose");
const Feedback = require("../../models/Feedback");

// User: Submit Feedback (Job Seeker / Recruiter / Admin)
module.exports.submitFeedback = async (req, res) => {
    try {
        const {
            category = "general",
            rating = 5,
            subject = "",
            message = "",
            pageUrl = "",
        } = req.body;

        const cleanSubject = String(subject).trim();
        const cleanMessage = String(message).trim();

        if (!cleanSubject) {
            return res.status(400).json({
                success: false,
                message: "Subject is required.",
            });
        }

        if (!cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "Feedback message cannot be empty.",
            });
        }

        const validCategories = ["bug", "feature_request", "job_quality", "ui_ux", "general"];
        const sanitizedCategory = validCategories.includes(category) ? category : "general";

        const numericRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

        const feedback = await Feedback.create({
            user: req.user._id,
            userName: req.user.fullName || "Platform User",
            userEmail: req.user.email || "",
            userRole: req.user.role || "job_seeker",
            category: sanitizedCategory,
            rating: numericRating,
            subject: cleanSubject,
            message: cleanMessage,
            pageUrl: String(pageUrl).trim(),
            status: "pending",
        });

        return res.status(201).json({
            success: true,
            message: "Thank you! Your feedback has been received and will help improve the platform.",
            feedback,
        });
    } catch (err) {
        console.error("API submitFeedback error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to submit feedback.",
        });
    }
};

// User: Get Feedbacks Submitted by Currently Logged-in User
module.exports.getMyFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            feedbacks,
        });
    } catch (err) {
        console.error("API getMyFeedback error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load your feedback history.",
        });
    }
};

// Admin: Get All Feedbacks with Filtering, Pagination & Summary Metrics
module.exports.getAdminFeedback = async (req, res) => {
    try {
        const {
            category,
            userRole,
            status,
            rating,
            page = 1,
            limit = 20,
        } = req.query;

        const query = {};
        if (category && category !== "all") query.category = category;
        if (userRole && userRole !== "all") query.userRole = userRole;
        if (status && status !== "all") query.status = status;
        if (rating && rating !== "all") query.rating = parseInt(rating, 10);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [feedbacks, total, counts, avgRatingResult] = await Promise.all([
            Feedback.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Feedback.countDocuments(query),
            Feedback.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
            Feedback.aggregate([
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                    },
                },
            ]),
        ]);

        const statusCounts = {
            total: 0,
            pending: 0,
            reviewed: 0,
            resolved: 0,
        };

        counts.forEach((c) => {
            statusCounts.total += c.count;
            if (statusCounts[c._id] !== undefined) {
                statusCounts[c._id] = c.count;
            }
        });

        const avgRating = avgRatingResult.length > 0
            ? Math.round((avgRatingResult[0].avgRating || 0) * 10) / 10
            : 5.0;

        return res.json({
            success: true,
            feedbacks,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
            metrics: {
                ...statusCounts,
                avgRating,
            },
        });
    } catch (err) {
        console.error("API getAdminFeedback error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve feedback list.",
        });
    }
};

// Admin: Update Status & Admin Notes on Feedback
module.exports.updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Feedback not found." });
        }

        const validStatuses = ["pending", "reviewed", "resolved"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid feedback status." });
        }

        const updateFields = {};
        if (status) updateFields.status = status;
        if (typeof adminNote === "string") updateFields.adminNote = adminNote.trim();

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found." });
        }

        return res.json({
            success: true,
            message: "Feedback status updated.",
            feedback,
        });
    } catch (err) {
        console.error("API updateFeedbackStatus error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update feedback.",
        });
    }
};

// Admin: Delete Feedback (Spam removal)
module.exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Feedback not found." });
        }

        const feedback = await Feedback.findByIdAndDelete(id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found." });
        }

        return res.json({
            success: true,
            message: "Feedback deleted successfully.",
        });
    } catch (err) {
        console.error("API deleteFeedback error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to delete feedback.",
        });
    }
};
