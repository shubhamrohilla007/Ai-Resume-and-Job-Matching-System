const {
    getFreeCourses,
    recommendCoursesForSkills,
} = require("../../services/trustBridge/courseRecommender");
const ResumeBuilder = require("../../models/ResumeBuilder");
const Resume = require("../../models/Resume");

// Get catalog of verified free courses
module.exports.getCourses = (req, res) => {
    try {
        const { search, category, platform, skill, discipline } = req.query;
        const courses = getFreeCourses({ search, category, platform, skill, discipline });

        return res.json({
            success: true,
            total: courses.length,
            courses,
            disciplines: [
                "All",
                "Technical / Engineering",
                "MBA / Business & Management",
            ],
            categories: [
                "All",
                "Artificial Intelligence",
                "Web Development",
                "Data Structures & Algorithms",
                "Management & MBA",
                "Cloud Computing",
                "Cybersecurity",
                "Computer Science",
            ],
            platforms: [
                "All",
                "IBM SkillsBuild",
                "Infosys Springboard",
                "Swayam / NPTEL",
                "freeCodeCamp",
                "Google Cloud Skills Boost",
                "Kaggle Learn",
                "Harvard University / CS50",
            ],
        });
    } catch (err) {
        console.error("API getCourses error:", err);
        return res.status(500).json({ success: false, message: "Unable to retrieve course catalog." });
    }
};

// Get personalized recommendations and 3-phase roadmap for skill gaps
module.exports.getRecommendations = async (req, res) => {
    try {
        let skills = [];

        if (req.query.skills) {
            skills = String(req.query.skills)
                .split(/[,;\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (req.user) {
            // Read candidate's resume to check missing or target skills
            const resume = await ResumeBuilder.findOne({ user: req.user._id }).lean();
            if (resume && resume.targetRole) {
                skills.push(resume.targetRole);
            }
            const uploadedResume = await Resume.findOne({ user: req.user._id }).lean();
            if (uploadedResume && uploadedResume.missingSkills?.length > 0) {
                skills.push(...uploadedResume.missingSkills);
            }
        }

        const careerGoal = req.query.careerGoal || "";
        const recommendations = await recommendCoursesForSkills(skills, careerGoal);

        return res.json({
            success: true,
            requestedSkills: skills,
            recommendations,
        });
    } catch (err) {
        console.error("API getRecommendations error:", err);
        return res.status(500).json({ success: false, message: "Unable to calculate course recommendations." });
    }
};
