const Profile = require("../models/Profile");

// ==========================================
// Show Profile
// ==========================================
module.exports.showProfile = async (req, res) => {

    try {

        const profile = await Profile.findOne({
            user: req.user._id,
        });

        if (!profile) {
            return res.redirect("/profile/create");
        }

        res.render("profile/show", { profile });

    } catch (err) {

        req.flash("error", err.message);
        res.redirect("/dashboard/jobseeker");

    }

};

// ==========================================
// Render Profile Creation Form
// ==========================================
module.exports.renderCreateForm = async (req, res) => {

    try {

        const existingProfile = await Profile.findOne({
            user: req.user._id,
        });

        if (existingProfile) {

            req.flash("error", "Profile already exists.");

            return res.redirect("/profile");

        }

        res.render("profile/create");

    } catch (err) {

        req.flash("error", err.message);

        res.redirect("/dashboard/jobseeker");

    }

};

// ==========================================
// Create Profile
// ==========================================
module.exports.createProfile = async (req, res) => {

    try {

        const {
            fullName,
            phone,
            education,
            experience,
            skills,
            location,
            linkedin,
            github,
        } = req.body;

        const skillsArray = skills
            ? skills.split(",").map(skill => skill.trim())
            : [];

        const profile = new Profile({

            user: req.user._id,

            fullName,
            phone,
            education,
            experience,

            skills: skillsArray,

            location,
            linkedin,
            github,

        });

        await profile.save();

        req.flash("success", "Profile created successfully!");

        res.redirect("/profile");

    } catch (err) {

        req.flash("error", err.message);

        res.redirect("/profile/create");

    }

};

// ==========================================
// Render Edit Profile Form
// ==========================================
module.exports.renderEditForm = async (req, res) => {

    try {

        const profile = await Profile.findOne({
            user: req.user._id,
        });

        if (!profile) {

            req.flash("error", "Please create your profile first.");

            return res.redirect("/profile/create");

        }

        res.render("profile/edit", { profile });

    } catch (err) {

        req.flash("error", err.message);

        res.redirect("/profile");

    }

};

// ==========================================
// Update Profile
// ==========================================
module.exports.updateProfile = async (req, res) => {

    try {

        const profile = await Profile.findOne({
            user: req.user._id,
        });

        if (!profile) {

            req.flash("error", "Profile not found.");

            return res.redirect("/profile/create");

        }

        profile.fullName = req.body.fullName;
        profile.phone = req.body.phone;
        profile.education = req.body.education;
        profile.experience = req.body.experience;
        profile.location = req.body.location;
        profile.linkedin = req.body.linkedin;
        profile.github = req.body.github;

        profile.skills = req.body.skills
            ? req.body.skills.split(",").map(skill => skill.trim())
            : [];

        await profile.save();

        req.flash("success", "Profile updated successfully!");

        res.redirect("/profile");

    } catch (err) {

        req.flash("error", err.message);

        res.redirect("/profile/edit");

    }

};