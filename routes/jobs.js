
const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/isLoggedIn");
const isJobSeeker = require("../middleware/isJobSeeker");
const isRecruiter = require("../middleware/isRecruiter");

const jobController = require("../controllers/jobController");

// Recruiter: create and manage own job posts
router.get(
    "/recruiter/jobs/new",
    isLoggedIn,
    isRecruiter,
    jobController.renderCreateJob
);

router.post(
    "/recruiter/jobs",
    isLoggedIn,
    isRecruiter,
    jobController.createJob
);

router.get(
    "/recruiter/jobs",
    isLoggedIn,
    isRecruiter,
    jobController.manageJobs
);

router.post(
    "/recruiter/jobs/:id/toggle",
    isLoggedIn,
    isRecruiter,
    jobController.toggleJobStatus
);

// Job seeker: see active jobs and match scores
router.get(
    "/jobs/recommended",
    isLoggedIn,
    isJobSeeker,
    jobController.recommendedJobs
);

module.exports = router;
