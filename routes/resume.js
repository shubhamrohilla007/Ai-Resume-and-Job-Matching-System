const express = require("express");
const router = express.Router();

const upload = require("../config/multer");

const isLoggedIn = require("../middleware/isLoggedIn");
const isJobSeeker = require("../middleware/isJobSeeker");

const resumeController = require("../controllers/resume");

// Resume upload
router
    .route("/resume/upload")
    .get(
        isLoggedIn,
        isJobSeeker,
        resumeController.renderUploadForm
    )
    .post(
        isLoggedIn,
        isJobSeeker,
        upload.single("resume"),
        resumeController.uploadResume
    );

// Old URL: redirect to the current resume builder
router.get(
    "/resume/create",
    isLoggedIn,
    isJobSeeker,
    (req, res) => {
        res.redirect("/resume/choose");
    }
);

// Handle a stale form that was already open in the browser.
// Do not silently save old fields into the new schema.
router.post(
    "/resume/create",
    isLoggedIn,
    isJobSeeker,
    (req, res) => {
        req.flash(
            "error",
            "The resume form has been updated. Please enter your details in the current builder."
        );

        res.redirect("/resume/builder");
    }
);

// AI resume analysis
router.get(
    "/resume/analysis",
    isLoggedIn,
    isJobSeeker,
    resumeController.showAnalysis
);

// View uploaded resume
router.get(
    "/resume/view",
    isLoggedIn,
    isJobSeeker,
    resumeController.viewResume
);

router.get(
    "/resume/file",
    isLoggedIn,
    isJobSeeker,
    resumeController.serveResumeFile
);

router.get(
    "/resume/download",
    isLoggedIn,
    isJobSeeker,
    resumeController.downloadResumeFile
);


module.exports = router;