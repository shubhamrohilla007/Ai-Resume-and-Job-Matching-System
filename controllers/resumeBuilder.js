const ResumeBuilder = require("../models/ResumeBuilder");
const aiService = require("../services/ai/geminiService");

// =========================
// Render Resume Builder
// =========================

module.exports.renderBuilder = async (req, res) => {
    try {
        let resume = await ResumeBuilder.findOne({
            user: req.user._id,
        });

        // If user doesn't have a resume builder document,
        // create an empty one
        if (!resume) {
            resume = new ResumeBuilder({
                user: req.user._id,
                personal: {
                    fullName: req.user.fullName || "",
                    email: req.user.email || "",
                },
            });

            await resume.save();
        }

        res.render("resume/builder", {
            resume,
        });

    } catch (err) {

        console.log(err);

        req.flash("error", "Unable to open resume builder.");

        res.redirect("/dashboard/jobseeker");
    }
};


// =========================
// Save Resume
// =========================

module.exports.saveResume = async (req, res) => {

    try {

        const {
            fullName,
            email,
            phone,
            location,
            linkedin,
            github,

            summary,

            educationDegree,
            educationCollege,
            educationYear,
            educationCgpa,

            skills,

            experienceCompany,
            experienceRole,
            experienceDuration,
            experienceDescription,

            projectName,
            projectTechnologies,
            projectDescription,

            certificationName,
            certificationIssuer,
            certificationYear,

        } = req.body;


        // Find existing builder
        let resume = await ResumeBuilder.findOne({
            user: req.user._id,
        });


        if (!resume) {

            resume = new ResumeBuilder({
                user: req.user._id,
            });

        }


        // =========================
        // Personal Information
        // =========================

        resume.personal = {

            fullName: fullName || "",
            email: email || "",
            phone: phone || "",
            location: location || "",
            linkedin: linkedin || "",
            github: github || "",

        };


        // =========================
        // Summary
        // =========================

        resume.summary = summary || "";


        // =========================
        // Education
        // =========================

        resume.education = [];

        if (educationDegree) {

            const degrees = Array.isArray(educationDegree)
                ? educationDegree
                : [educationDegree];

            const colleges = Array.isArray(educationCollege)
                ? educationCollege
                : [educationCollege];

            const years = Array.isArray(educationYear)
                ? educationYear
                : [educationYear];

            const cgpas = Array.isArray(educationCgpa)
                ? educationCgpa
                : [educationCgpa];


            for (let i = 0; i < degrees.length; i++) {

                if (
                    degrees[i] ||
                    colleges[i] ||
                    years[i] ||
                    cgpas[i]
                ) {

                    resume.education.push({

                        degree: degrees[i] || "",
                        college: colleges[i] || "",
                        year: years[i] || "",
                        cgpa: cgpas[i] || "",

                    });

                }

            }

        }

        // =========================
        // Skills
        // =========================

        const rawSkills = req.body.skills || "";

        if (Array.isArray(rawSkills)) {
            resume.skills = rawSkills
                .map(skill => String(skill).trim())
                .filter(Boolean);
        } else if (
            rawSkills.includes("\n") ||
            rawSkills.includes("\r")
        ) {
            // Preserve category-wise skills, one category per line.
            resume.skills = rawSkills
                .split(/\r?\n/)
                .map(skill => skill.trim())
                .filter(Boolean);
        } else {
            // Backward compatibility with older comma-separated skills.
            resume.skills = rawSkills
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean);
        }

        // =========================
        // Experience
        // =========================

        resume.experience = [];

        if (experienceCompany) {

            const companies = Array.isArray(experienceCompany)
                ? experienceCompany
                : [experienceCompany];

            const roles = Array.isArray(experienceRole)
                ? experienceRole
                : [experienceRole];

            const durations = Array.isArray(experienceDuration)
                ? experienceDuration
                : [experienceDuration];

            const descriptions = Array.isArray(experienceDescription)
                ? experienceDescription
                : [experienceDescription];


            for (let i = 0; i < companies.length; i++) {

                if (
                    companies[i] ||
                    roles[i] ||
                    durations[i] ||
                    descriptions[i]
                ) {

                    resume.experience.push({

                        company: companies[i] || "",
                        role: roles[i] || "",
                        duration: durations[i] || "",
                        description: descriptions[i] || "",

                    });

                }

            }

        }


        // =========================
        // Projects
        // =========================

        resume.projects = [];

        if (projectName) {

            const names = Array.isArray(projectName)
                ? projectName
                : [projectName];

            const technologies = Array.isArray(projectTechnologies)
                ? projectTechnologies
                : [projectTechnologies];

            const descriptions = Array.isArray(projectDescription)
                ? projectDescription
                : [projectDescription];


            for (let i = 0; i < names.length; i++) {

                if (
                    names[i] ||
                    technologies[i] ||
                    descriptions[i]
                ) {

                    resume.projects.push({

                        name: names[i] || "",
                        technologies: technologies[i] || "",
                        description: descriptions[i] || "",

                    });

                }

            }

        }


        // =========================
        // Certifications
        // =========================

        resume.certifications = [];

        if (certificationName) {

            const names = Array.isArray(certificationName)
                ? certificationName
                : [certificationName];

            const issuers = Array.isArray(certificationIssuer)
                ? certificationIssuer
                : [certificationIssuer];

            const years = Array.isArray(certificationYear)
                ? certificationYear
                : [certificationYear];


            for (let i = 0; i < names.length; i++) {

                if (
                    names[i] ||
                    issuers[i] ||
                    years[i]
                ) {

                    resume.certifications.push({

                        name: names[i] || "",
                        issuer: issuers[i] || "",
                        year: years[i] || "",

                    });

                }

            }

        }


        await resume.save();


        req.flash(
            "success",
            "Resume saved successfully!"
        );


        res.redirect("/resume/builder/preview");

    } catch (err) {

        console.log(err);

        req.flash(
            "error",
            "Unable to save resume."
        );

        res.redirect("/resume/builder");

    }

};


// =========================
// Resume Preview
// =========================

module.exports.previewResume = async (req, res) => {

    try {

        const resume = await ResumeBuilder.findOne({
            user: req.user._id,
        });

        if (!resume) {

            req.flash(
                "error",
                "Please create your resume first."
            );

            return res.redirect("/resume/builder");

        }


        res.render("resume/preview", {
            resume,
        });

    } catch (err) {

        console.log(err);

        req.flash(
            "error",
            "Unable to load resume preview."
        );

        res.redirect("/resume/builder");

    }

};

// =========================
// Render AI Resume Form
// =========================

module.exports.renderAIForm = (req, res) => {
    res.render("resume/ai-generator");
};


// =========================
// Helper: Parse Form Rows
// =========================

function parseRows(value, fieldNames) {
    if (!value || typeof value !== "string") {
        return [];
    }

    return value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const parts = line.split("|").map(part => part.trim());

            const item = {};

            fieldNames.forEach((field, index) => {
                item[field] = parts[index] || "";
            });

            return item;
        });
}

// =========================
// Generate Full AI Resume
// =========================

module.exports.generateAIResume = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            location,
            linkedin,
            github,
            targetRole,
            skills
        } = req.body;

        // 1. Validate required fields
        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof targetRole !== "string" ||
            !targetRole.trim()
        ) {
            req.flash(
                "error",
                "Full name, email and target job role are required."
            );

            return res.redirect("/resume/builder/ai");
        }

        if (
            fullName.length > 150 ||
            email.length > 200 ||
            targetRole.length > 150
        ) {
            req.flash(
                "error",
                "Please check the length of your input fields."
            );

            return res.redirect("/resume/builder/ai");
        }

        // 2. Parse user-provided information
        const education = parseRows(
            req.body.education,
            ["degree", "college", "year", "cgpa"]
        );

        const projects = parseRows(
            req.body.projects,
            ["name", "technologies", "description"]
        );

        const experience = parseRows(
            req.body.experience,
            ["company", "role", "duration", "description"]
        );

        const certifications = parseRows(
            req.body.certifications,
            ["name", "issuer", "year"]
        );

        const skillList = (
            typeof skills === "string" ? skills : ""
        )
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean)
            .slice(0, 100);

        // 3. Limit total input size
        const totalInputLength = JSON.stringify({
            education,
            projects,
            experience,
            certifications,
            skillList
        }).length;

        if (totalInputLength > 20000) {
            req.flash(
                "error",
                "Your resume details are too long. Please shorten them."
            );

            return res.redirect("/resume/builder/ai");
        }

        // 4. Generate resume content using Gemini
        const generated = await aiService.generateFullResume({
            targetRole: targetRole.trim(),
            education,
            skills: skillList,
            projects,
            experience,
            certifications
        });

        // 5. Validate Gemini response
        if (
            !generated ||
            typeof generated.summary !== "string" ||
            !Array.isArray(generated.projectDescriptions) ||
            !Array.isArray(generated.experienceDescriptions) ||
            !Array.isArray(generated.skillGroups) ||
            !Array.isArray(generated.suggestedSkills)
        ) {
            throw new Error("Invalid AI-generated resume structure.");
        }

        if (
            generated.projectDescriptions.length !== projects.length ||
            generated.experienceDescriptions.length !== experience.length
        ) {
            throw new Error(
                "AI-generated project or experience count does not match input."
            );
        }

        // 6. Only allow user-provided skills in verified skills
        const normalizeSkill = value =>
            String(value || "")
                .toLowerCase()
                .replace(/[^a-z0-9+#]/g, "");

        const verifiedSkillMap = new Map();

        for (const skill of skillList) {
            const normalized = normalizeSkill(skill);

            if (normalized && !verifiedSkillMap.has(normalized)) {
                verifiedSkillMap.set(normalized, skill);
            }
        }

        const usedSkills = new Set();
        const categorizedSkills = [];

        for (const group of generated.skillGroups) {
            if (
                !group ||
                typeof group.category !== "string" ||
                !Array.isArray(group.skills)
            ) {
                continue;
            }

            const verifiedInGroup = [];

            for (const candidate of group.skills) {
                if (typeof candidate !== "string") {
                    continue;
                }

                const normalized = normalizeSkill(candidate);
                const originalSkill = verifiedSkillMap.get(normalized);

                if (originalSkill && !usedSkills.has(normalized)) {
                    verifiedInGroup.push(originalSkill);
                    usedSkills.add(normalized);
                }
            }

            if (verifiedInGroup.length > 0) {
                categorizedSkills.push(
                    `${group.category.trim()}: ${verifiedInGroup.join(", ")}`
                );
            }
        }

        // Preserve every supplied skill, even if Gemini omitted it
        const remainingSkills = skillList.filter(skill =>
            !usedSkills.has(normalizeSkill(skill))
        );

        if (remainingSkills.length > 0) {
            categorizedSkills.push(
                `Additional Skills: ${remainingSkills.join(", ")}`
            );
        }

        // 7. Convert project bullet arrays to existing string fields
        const finalProjects = projects.map((project, index) => {
            const result = generated.projectDescriptions[index];

            const bullets = Array.isArray(result?.bullets)
                ? result.bullets
                    .filter(
                        bullet =>
                            typeof bullet === "string" &&
                            bullet.trim().length > 0
                    )
                    .map(bullet => `• ${bullet.trim()}`)
                : [];

            return {
                name: project.name,
                technologies: project.technologies,
                description: bullets.length
                    ? bullets.join("\n")
                    : project.description
            };
        });

        // 8. Convert experience bullet arrays to existing string fields
        const finalExperience = experience.map((item, index) => {
            const result = generated.experienceDescriptions[index];

            const bullets = Array.isArray(result?.bullets)
                ? result.bullets
                    .filter(
                        bullet =>
                            typeof bullet === "string" &&
                            bullet.trim().length > 0
                    )
                    .map(bullet => `• ${bullet.trim()}`)
                : [];

            return {
                company: item.company,
                role: item.role,
                duration: item.duration,
                description: bullets.length
                    ? bullets.join("\n")
                    : item.description
            };
        });

        // 9. Find or create the user's existing resume
        let resume = await ResumeBuilder.findOne({
            user: req.user._id
        });

        if (!resume) {
            resume = new ResumeBuilder({
                user: req.user._id
            });
        }

        // 10. Save generated content
        resume.personal = {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: typeof phone === "string" ? phone.trim() : "",
            location: typeof location === "string" ? location.trim() : "",
            linkedin: typeof linkedin === "string" ? linkedin.trim() : "",
            github: typeof github === "string" ? github.trim() : ""
        };

        resume.summary = generated.summary.trim();
        resume.education = education;
        resume.skills = categorizedSkills;
        resume.projects = finalProjects;
        resume.experience = finalExperience;
        resume.certifications = certifications;

        await resume.save();

        req.flash(
            "success",
            "AI resume generated successfully. Review it before use."
        );

        return res.redirect("/resume/builder/preview");

    } catch (err) {
        console.error("AI resume generation error:", err);

        req.flash(
            "error",
            "AI resume generation failed. Please check the Gemini configuration and try again."
        );

        return res.redirect("/resume/builder/ai");
    }
};