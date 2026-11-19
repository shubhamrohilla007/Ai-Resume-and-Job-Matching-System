const {
    analyzeSemanticMatch,
} = require("./ai/jobSemanticMatcher");

// Normalize common technology aliases into canonical names.
const SKILL_ALIASES = {
    js: "javascript",
    javascript: "javascript",
    nodejs: "node.js",
    "node js": "node.js",
    node: "node.js",
    reactjs: "react",
    "react.js": "react",
    react: "react",
    expressjs: "express",
    "express.js": "express",
    mongodb: "mongodb",
    mongo: "mongodb",
    postgres: "postgresql",
    postgresql: "postgresql",
    ml: "machine learning",
    ai: "artificial intelligence",
    "scikit learn": "scikit-learn",
    sklearn: "scikit-learn",
    "c plus plus": "c++",
    cpp: "c++",
    py: "python",
    python: "python",
    ts: "typescript",
    typescript: "typescript",
};

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^\w+#.]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function canonicalSkill(value) {
    const normalized = normalize(value);
    return SKILL_ALIASES[normalized] || normalized;
}

function uniqueSkills(skills = []) {
    const result = new Map();

    for (const item of skills) {
        let original = String(item || "").trim();

        // If line is categorized (e.g. "Programming Languages: Java, Python"), strip category prefix
        if (original.includes(":")) {
            const colonIdx = original.indexOf(":");
            original = original.substring(colonIdx + 1).trim();
        }

        // Support comma, semicolon, newline, or sentence period-separated skills
        for (const part of original.split(/[,;\n]|\.\s+/)) {
            const label = part.trim();
            if (!label) continue;
            const cleanLabel = label.length > 45 ? label.slice(0, 42) + "..." : label;
            const normalized = canonicalSkill(cleanLabel);

            if (normalized && !result.has(normalized)) {
                result.set(normalized, cleanLabel);
            }
        }
    }

    return [...result.entries()].map(([normalized, original]) => ({
        normalized,
        original,
    }));
}

function getResumeSkills(resume) {
    return uniqueSkills(
        Array.isArray(resume?.skills) ? resume.skills : []
    );
}

function getProjectText(resume) {
    const projects = Array.isArray(resume?.projects)
        ? resume.projects
        : [];

    return normalize(
        projects.map(project => [
            project.name,
            project.title,
            project.technologies,
            project.description,
        ].filter(Boolean).join(" ")).join(" ")
    );
}

// Avoid partial-word matches, e.g. "Java" inside "JavaScript".
function containsSkill(text, skill) {
    const normalizedText = normalize(text);
    const normalizedSkill = normalize(skill);

    if (!normalizedText || !normalizedSkill) return false;

    const escaped = normalizedSkill.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    return new RegExp(
        `(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`,
        "i"
    ).test(normalizedText);
}

function calculateJobMatch(resume, job) {
    const resumeSkills = getResumeSkills(resume);
    const required = uniqueSkills(job?.requiredSkills || []);
    const preferred = uniqueSkills(job?.preferredSkills || []);

    const resumeSkillSet = new Set(
        resumeSkills.map(skill => skill.normalized)
    );

    const projectText = getProjectText(resume);

    // A skill is matched directly if it is in the skills list.
    // Project text provides separate evidence of practical exposure.
    const matchedRequired = required.filter(
        skill => resumeSkillSet.has(skill.normalized)
    );

    const missingRequired = required.filter(
        skill => !resumeSkillSet.has(skill.normalized)
    );

    const matchedPreferred = preferred.filter(
        skill => resumeSkillSet.has(skill.normalized)
    );

    const missingPreferred = preferred.filter(
        skill => !resumeSkillSet.has(skill.normalized)
    );

    const projectMatches = required.filter(
        skill => containsSkill(projectText, skill.normalized)
    );

    const factors = [];

    if (required.length > 0) {
        factors.push({
            weight: 70,
            score: matchedRequired.length / required.length,
        });
    }

    if (preferred.length > 0) {
        factors.push({
            weight: 20,
            score: matchedPreferred.length / preferred.length,
        });
    }

    if (required.length > 0 && projectText) {
        factors.push({
            weight: 10,
            score: projectMatches.length / required.length,
        });
    }

    const totalWeight = factors.reduce(
        (sum, factor) => sum + factor.weight,
        0
    );

    const ruleScore = totalWeight > 0
        ? Math.round(
            factors.reduce(
                (sum, factor) => sum + factor.score * factor.weight,
                0
            ) / totalWeight * 100
        )
        : null;

    return {
        jobId: job?._id,
        _id: job?._id,
        title: job?.title,
        company: job?.company,
        description: job?.description,
        location: job?.location,
        jobType: job?.jobType,
        experienceLevel: job?.experienceLevel,
        salary: job?.salary,
        applicationUrl: job?.applicationUrl,
        createdAt: job?.createdAt,

        // TrustBridge Job Trust Assessment (Kept independent from matchScore)
        trustScore: job?.trustScore ?? null,
        trustStatus: job?.trustStatus || "approved",
        trustStatusLabel: job?.trustStatusLabel || "No major warning signals detected",
        trustSignals: job?.trustSignals || [],
        completenessScore: job?.completenessScore || 100,

        ruleScore,
        matchScore: ruleScore,

        matchedRequired: matchedRequired.map(s => s.original),
        missingRequired: missingRequired.map(s => s.original),
        matchedPreferred: matchedPreferred.map(s => s.original),
        missingPreferred: missingPreferred.map(s => s.original),
        projectMatches: projectMatches.map(s => s.original),

        mandatoryRequirementsMet:
            required.length > 0 && missingRequired.length === 0,

        hasRequiredSkillData: required.length > 0,

        aiScore: null,
        aiExplanation: "",
        aiRelatedSkills: [],
        matchingMode: "rule-based",
    };
}

async function rankJobs(resume, jobs = []) {
    const activeJobs = jobs.slice(0, 20);
    const results = new Array(activeJobs.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= activeJobs.length) return;

            const job = activeJobs[index];
            const base = calculateJobMatch(resume, job);

            try {
                const ai = await analyzeSemanticMatch(resume, job);

                const validAiScore =
                    Number.isFinite(ai?.score) &&
                    ai.score >= 0 &&
                    ai.score <= 100;

                let matchScore = base.ruleScore;
                let matchingMode = "rule-based";

                if (validAiScore && base.ruleScore !== null) {
                    matchScore = Math.round(
                        base.ruleScore * 0.60 + ai.score * 0.40
                    );
                    matchingMode = "hybrid";
                } else if (validAiScore) {
                    matchScore = ai.score;
                    matchingMode = "ai-assisted";
                }

                results[index] = {
                    ...base,
                    matchScore,
                    aiScore: validAiScore ? ai.score : null,
                    aiExplanation: ai?.explanation || "",
                    aiRelatedSkills: Array.isArray(ai?.relatedSkills)
                        ? ai.relatedSkills
                        : [],
                    matchingMode,
                };
            } catch (error) {
                console.error(
                    `AI matching failed for job ${job._id}:`,
                    error.message
                );

                results[index] = {
                    ...base,
                    aiExplanation:
                        "AI matching is unavailable. Showing rule-based results.",
                    matchingMode: "rule-based-fallback",
                };
            }
        }
    }

    await Promise.all([worker(), worker()]);

    return results.sort((a, b) => {
        // Jobs with all listed required skills rank first.
        if (
            a.mandatoryRequirementsMet !==
            b.mandatoryRequirementsMet
        ) {
            return a.mandatoryRequirementsMet ? -1 : 1;
        }

        return (b.matchScore ?? -1) - (a.matchScore ?? -1);
    });
}

module.exports = {
    calculateJobMatch,
    rankJobs,
};
