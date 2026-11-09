
const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/isLoggedIn");
const isJobSeeker = require("../middleware/isJobSeeker");
const isRecruiter = require("../middleware/isRecruiter");

router.get(
    "/dashboard/jobseeker",
    isLoggedIn,
    isJobSeeker,
    (req, res) => res.render("dashboard/jobseeker")
);

router.get(
    "/dashboard/recruiter",
    isLoggedIn,
    isRecruiter,
    (req, res) => res.render("dashboard/recruiter")
);

router.get(
    "/dashboard/admin",
    isLoggedIn,
    (req, res, next) => {
        if (req.user.role !== "admin") {
            req.flash("error", "Admin access required.");
            return res.redirect("/");
        }
        next();
    },
    (req, res) => res.render("dashboard/admin")
);

module.exports = router;