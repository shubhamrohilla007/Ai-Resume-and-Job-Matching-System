const multer = require("multer");

/**
 * Memory storage for candidate resumes.
 * Files are held in memory buffer and streamed directly to Cloudinary
 * or parsed in temporary scratch files, avoiding permanent local disk storage.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOCX files are allowed."));
    }
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});
