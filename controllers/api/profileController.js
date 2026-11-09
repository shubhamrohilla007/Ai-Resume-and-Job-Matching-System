const Profile = require("../../models/Profile");

// Get Profile
module.exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        return res.json({
            success: true,
            profile: profile || null,
        });
    } catch (err) {
        console.error("API getProfile error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve profile.",
        });
    }
};

// Create or Update Profile (Upsert)
module.exports.saveProfile = async (req, res) => {
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

        if (!fullName || !String(fullName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Full name is required.",
            });
        }

        let skillsArray = [];
        if (Array.isArray(skills)) {
            skillsArray = skills.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof skills === "string") {
            skillsArray = skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        }

        let profile = await Profile.findOne({ user: req.user._id });

        if (profile) {
            profile.fullName = fullName.trim();
            profile.phone = phone ? String(phone).trim() : "";
            profile.education = education ? String(education).trim() : "";
            profile.experience = experience ? String(experience).trim() : "";
            profile.location = location ? String(location).trim() : "";
            profile.linkedin = linkedin ? String(linkedin).trim() : "";
            profile.github = github ? String(github).trim() : "";
            profile.skills = skillsArray;
            await profile.save();
        } else {
            profile = new Profile({
                user: req.user._id,
                fullName: fullName.trim(),
                phone: phone ? String(phone).trim() : "",
                education: education ? String(education).trim() : "",
                experience: experience ? String(experience).trim() : "",
                location: location ? String(location).trim() : "",
                linkedin: linkedin ? String(linkedin).trim() : "",
                github: github ? String(github).trim() : "",
                skills: skillsArray,
            });
            await profile.save();
        }

        return res.json({
            success: true,
            message: "Profile saved successfully!",
            profile,
        });
    } catch (err) {
        console.error("API saveProfile error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to save profile.",
        });
    }
};
