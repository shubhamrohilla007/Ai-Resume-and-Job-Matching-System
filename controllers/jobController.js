
const Job = require("../models/Job");
const ResumeBuilder = require("../models/ResumeBuilder");
const { rankJobs } = require("../services/jobMatchingService");

function parseSkills(value) {
    if (Array.isArray(value)) {
        return value
            .flatMap((item) => String(item).split(/[,;\n]/))
            .map((skill) => skill.trim())
            .filter(Boolean);
    }

    return String(value || "")
        .split(/[,;\n]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
}

function jobFormData(body) {
    return {
        title: String(body.title || "").trim(),
        company: String(body.company || "").trim(),
        description: String(body.description || "").trim(),
        requiredSkills: parseSkills(body.requiredSkills),
        preferredSkills: parseSkills(body.preferredSkills),
        experienceLevel: body.experienceLevel,
        location: String(body.location || "Remote").trim(),
        jobType: body.jobType,
        salary: String(body.salary || "Not specified").trim(),
        applicationUrl: String(body.applicationUrl || "").trim(),
    };
}

function validateJob(data) {
    if (!data.title || !data.company || !data.description) {
        return "Job title, company and description are required.";
    }

    const validLevels = [
        "Fresher", "Entry Level", "Mid Level", "Senior Level",
    ];

    const validTypes = [
        "Full-time", "Part-time", "Internship", "Contract",
    ];

    if (!validLevels.includes(data.experienceLevel)) {
        return "Select a valid experience level.";
    }

    if (!validTypes.includes(data.jobType)) {
        return "Select a valid job type.";
    }

    if (
        data.applicationUrl &&
        !/^https?:\/\/\S+$/i.test(data.applicationUrl)
    ) {
        return "Application URL must start with http:// or https://.";
    }

    return null;
}

exports.renderCreateJob = (req, res) => {
    res.render("jobs/new", { job: null });
};

exports.createJob = async (req, res, next) => {
    try {
        const data = jobFormData(req.body);
        const error = validateJob(data);

        if (error) {
            req.flash("error", error);
            return res.status(400).render("jobs/new", { job: data });
        }

        await Job.create({
            ...data,
            recruiter: req.user._id,
            isActive: true,
        });

        req.flash("success", "Job posted successfully.");
        return res.redirect("/recruiter/jobs");
    } catch (error) {
        next(error);
    }
};

exports.manageJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({
            recruiter: req.user._id,
        }).sort({ createdAt: -1 }).lean();

        res.render("jobs/manage", { jobs });
    } catch (error) {
        next(error);
    }
};

exports.toggleJobStatus = async (req, res, next) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            recruiter: req.user._id,
        });

        if (!job) {
            req.flash("error", "Job not found or access denied.");
            return res.redirect("/recruiter/jobs");
        }

        job.isActive = !job.isActive;
        await job.save();

        req.flash(
            "success",
            job.isActive ? "Job activated." : "Job closed."
        );

        return res.redirect("/recruiter/jobs");
    } catch (error) {
        if (error.name === "CastError") {
            req.flash("error", "Invalid job ID.");
            return res.redirect("/recruiter/jobs");
        }

        next(error);
    }
};

exports.recommendedJobs = async (req, res, next) => {
    try {
        const resume = await ResumeBuilder.findOne({
            user: req.user._id,
        }).lean();

        if (!resume) {
            req.flash(
                "error",
                "Create your resume to get job recommendations."
            );

            return res.redirect("/resume/choose");
        }

        const jobs = await Job.find({
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const recommendations = await rankJobs(resume, jobs);

        res.render("jobs/index", {
            recommendations,
            hasResumeSkills:
                Array.isArray(resume.skills) &&
                resume.skills.length > 0,
        });
    } catch (error) {
        next(error);
    }
};
