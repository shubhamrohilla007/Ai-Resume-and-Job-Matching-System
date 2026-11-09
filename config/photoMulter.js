const multer = require("multer");

/**
 * Memory storage for profile photos.
 * Keeps uploaded image in memory buffer for immediate processing and streaming to Cloudinary.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error("Invalid image format. Only JPG, JPEG, PNG, and WebP images are supported."));
    }
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});
