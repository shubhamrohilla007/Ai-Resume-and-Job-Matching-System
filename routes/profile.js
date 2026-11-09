const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profile");

const isLoggedIn = require("../middleware/isLoggedIn");
const isJobSeeker = require("../middleware/isJobSeeker");

// View Profile
router.get(
    "/profile",
    isLoggedIn,
    isJobSeeker,
    profileController.showProfile
);

// Create Profile Form
router.get(
    "/profile/create",
    isLoggedIn,
    isJobSeeker,
    profileController.renderCreateForm
);

// Save Profile
router.post(
    "/profile/create",
    isLoggedIn,
    isJobSeeker,
    profileController.createProfile
);

// Edit Profile Form
router.get(
    "/profile/edit",
    isLoggedIn,
    isJobSeeker,
    profileController.renderEditForm
);

// Update Profile
router.post(
    "/profile/edit",
    isLoggedIn,
    isJobSeeker,
    profileController.updateProfile
);

module.exports = router;