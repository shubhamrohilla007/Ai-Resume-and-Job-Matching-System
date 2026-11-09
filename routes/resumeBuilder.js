const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/isLoggedIn");
const isJobSeeker = require("../middleware/isJobSeeker");

const resumeBuilderController = require("../controllers/resumeBuilder");

const resumeAIController = require("../controllers/resumeAI");

// Choose Manual or AI
router.get(
    "/resume/choose",
    isLoggedIn,
    isJobSeeker,
    (req, res) => {
        res.render("resume/choose");
    }
);

// Manual Resume Builder
router.get(
    "/resume/builder",
    isLoggedIn,
    isJobSeeker,
    resumeBuilderController.renderBuilder
);

router.post(
    "/resume/builder",
    isLoggedIn,
    isJobSeeker,
    resumeBuilderController.saveResume
);

// AI Resume Form
router.get(
    "/resume/builder/ai",
    isLoggedIn,
    isJobSeeker,
    resumeBuilderController.renderAIForm
);

// Generate and Save AI Resume
router.post(
    "/resume/builder/ai",
    isLoggedIn,
    isJobSeeker,
    resumeBuilderController.generateAIResume
);

// Shared Resume Preview
router.get(
    "/resume/builder/preview",
    isLoggedIn,
    isJobSeeker,
    resumeBuilderController.previewResume
);

router.post(
    "/resume/builder/ai-improve",
    isLoggedIn,
    isJobSeeker,
    resumeAIController.improveSection
);


module.exports = router;