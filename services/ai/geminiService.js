const { GoogleGenerativeAI } = require("@google/generative-ai");
const buildPrompt = require("./promptBuilder");
const validateResponse = require("./responseValidator");
const { ruleBasedAnalyzeResume } = require("./ruleBasedAts");
const { synthesizeFallbackResume } = require("./roleResumeTemplates");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
    const message = String(error?.message || "");

    return (
        /\b(429|500|502|503|504)\b/.test(message) ||
        /high demand|temporarily unavailable|rate limit/i.test(message)
    );
}

/**
 * Robust JSON extractor that handles code fences, preamble/postscript text,
 * and cleans trailing commas.
 */
function extractJsonFromAiResponse(raw) {
    if (!raw || typeof raw !== "string") {
        throw new Error("Empty AI response received.");
    }

    // 1. Strip markdown fences if present
    let cleaned = raw
        .replace(/```(?:json|markdown)?/gi, "")
        .replace(/```/g, "")
        .trim();

    // 2. Find the outermost JSON object bounds
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(cleaned);
}

async function generateContentWithRetry(prompt, maxRetries = 1) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Active, verified working models in priority order
    const modelNames = [
        process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
        process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite",
        process.env.GEMINI_SECONDARY_FALLBACK_MODEL || "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
    ];

    const uniqueModels = [...new Set(modelNames)];
    let lastError;

    for (const modelName of uniqueModels) {
        const currentModel = genAI.getGenerativeModel({
            model: modelName,
        });

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[AI] Requesting model: ${modelName}`);

                const result = await currentModel.generateContent(prompt);

                console.log(`[AI] Success with model: ${modelName}`);
                return result;
            } catch (error) {
                lastError = error;

                if (!isRetryableGeminiError(error)) {
                    // Non-retryable error on this model (e.g. 404), break to next model
                    break;
                }

                if (attempt < maxRetries) {
                    const delay = 800 * 2 ** attempt + Math.random() * 300;
                    console.warn(
                        `[AI] ${modelName} rate-limited/failed (${error.status || error.message}). Retry ${attempt + 1}/${maxRetries}`
                    );
                    await sleep(delay);
                }
            }
        }

        console.warn(`[AI] ${modelName} exhausted; attempting next available model in cascade.`);
    }

    throw lastError || new Error("All configured Gemini models failed or exhausted quota.");
}

// ATS analysis with Gemini AI and automatic rule-based fallback
async function analyzeResume(resumeText) {
    try {
        if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
            return ruleBasedAnalyzeResume(resumeText || "");
        }

        const prompt = buildPrompt(resumeText);
        const result = await generateContentWithRetry(prompt);
        const response = await result.response;

        const text = response.text();
        const json = extractJsonFromAiResponse(text);
        const validated = validateResponse(json);

        return {
            ...validated,
            analysisMode: "ai-assisted",
        };
    } catch (err) {
        console.warn("ATS Gemini analysis failed, using rule-based fallback:", err.message);
        return ruleBasedAnalyzeResume(resumeText);
    }
}

// AI resume text enhancement
async function improveResumeText({
    section,
    text,
    skills = [],
    technologies = "",
}) {
    const allowedSections = ["summary", "experience", "project"];

    if (!allowedSections.includes(section)) {
        throw new Error("Unsupported resume section.");
    }

    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Please enter text to improve.");
    }

    if (text.length > 5000) {
        throw new Error("Text must not exceed 5,000 characters.");
    }

    const sectionInstructions = {
        summary:
            "Improve this professional resume summary. Make it concise, clear, professional, and ATS-friendly.",
        experience:
            "Improve this work experience description using clear, professional resume language and action verbs.",
        project:
            "Improve this project description to clearly explain the project, its purpose, and the work described by the user.",
    };

    const prompt = `
You are an expert resume writer specializing in ATS-friendly resumes.

TASK:
${sectionInstructions[section]}

STRICT RULES:
- Preserve all facts provided by the user.
- Do not invent skills, technologies, employers, qualifications, dates,
  responsibilities, achievements, or numerical metrics.
- Correct grammar and improve clarity and professional wording.
- Keep the output concise and suitable for a resume.
- Return only the improved text, without explanations, headings,
  quotation marks, or Markdown fences.

User's existing skills: ${Array.isArray(skills) ? skills.join(", ") : ""}
Technologies supplied for this entry: ${typeof technologies === "string" ? technologies : ""}
Section: ${section}
Original text:
${text.trim()}
`;

    try {
        const result = await generateContentWithRetry(prompt);
        const response = await result.response;
        const improvedText = response.text().trim();

        if (!improvedText) {
            throw new Error("Gemini returned an empty suggestion.");
        }

        return improvedText
            .replace(/^```(?:text|markdown)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
    } catch (err) {
        console.warn("AI section improvement failed, returning original text:", err.message);
        return text.trim();
    }
}

/**
 * Full Resume AI Generator
 * Generates or enhances a complete, ATS-optimized resume for a target job role.
 * Automatically falls back to high-quality role synthesis if AI quota or key fails.
 */
async function generateFullResume({
    targetRole,
    education = [],
    skills = [],
    projects = [],
    experience = [],
    certifications = [],
}) {
    const role = String(targetRole || "").trim();
    if (!role) {
        throw new Error("Target job role is required for resume generation.");
    }

    const inputData = {
        targetRole: role,
        education: Array.isArray(education) ? education : [],
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        experience: Array.isArray(experience) ? experience : [],
        certifications: Array.isArray(certifications) ? certifications : [],
    };

    // If Gemini key is missing, immediately generate high-quality fallback draft
    if (!process.env.GEMINI_API_KEY) {
        console.warn("[AI Resume] GEMINI_API_KEY not found. Using intelligent role synthesis fallback.");
        return synthesizeFallbackResume(inputData);
    }

    try {
        const prompt = `
You are an elite executive resume writer and ATS optimization expert.

TARGET JOB ROLE:
"${role}"

USER-SUPPLIED RESUME DATA (if any):
${JSON.stringify(inputData, null, 2)}

TASK:
Generate a complete, comprehensive, and ATS-friendly professional resume tailored to the target role "${role}".

INSTRUCTIONS:
1. SUMMARY:
   Write a high-impact, 3 to 4 sentence professional summary tailored to "${role}". Mention relevant technologies, competencies, and engineering impact.

2. SKILLS:
   - Provide a list of 12-18 relevant skills for "${role}". If user supplied skills, include them and add missing industry-standard skills.
   - Categorize these skills into 3 to 5 logical "skillGroups" (e.g., Frontend, Backend, Databases & Cloud, DevOps & Tools).

3. PROJECTS:
   - If user provided projects, preserve their names/technologies and rewrite the descriptions into 2-3 crisp, action-oriented bullet points starting with "• ".
   - If user provided NO projects (or fewer than 2), generate 2 realistic, modern, and impressive project entries tailored to "${role}" with real-world tech stacks and achievement-oriented bullets.

4. EXPERIENCE:
   - If user provided experience, preserve company/role/duration and rewrite descriptions into 2-4 strong action-verb bullet points starting with "• ".
   - If user provided NO experience, generate 1 to 2 realistic professional experience entries tailored to "${role}" with measurable achievements and technical bullet points.

5. EDUCATION:
   - If user provided education, preserve it.
   - If user provided NO education, include 1 realistic relevant degree entry (e.g. Bachelor of Science in Computer Science or related field).

6. CERTIFICATIONS:
   - If user provided certifications, preserve them.
   - If user provided NO certifications, include 1 to 2 relevant recognized industry certifications for "${role}".

OUTPUT FORMAT:
Return strictly a valid JSON object without markdown formatting, fences, or explanation.
Exact JSON structure:
{
  "summary": "Professional summary string...",
  "skills": ["Skill 1", "Skill 2", ...],
  "skillGroups": [
    {
      "category": "Frontend Development",
      "skills": ["React.js", "TypeScript", ...]
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "duration": "2022 - Present",
      "description": "• Built...\n• Optimized..."
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": "React, Node.js, MongoDB",
      "description": "• Implemented...\n• Deployed...",
      "link": "https://github.com/example/project"
    }
  ],
  "education": [
    {
      "degree": "Degree Title",
      "college": "University Name",
      "year": "2018 - 2022",
      "cgpa": "3.8 / 4.0"
    }
  ],
  "certifications": [
    {
      "name": "Certificate Title",
      "issuer": "Issuing Org",
      "year": "2023"
    }
  ],
  "suggestedSkills": [
    { "skill": "Skill Name", "reason": "Why it is relevant" }
  ]
}
`;

        const result = await generateContentWithRetry(prompt);
        const response = await result.response;
        const rawText = response.text();

        const parsed = extractJsonFromAiResponse(rawText);

        // Validate essential fields
        if (!parsed || typeof parsed.summary !== "string" || !parsed.summary.trim()) {
            throw new Error("AI response missing valid summary.");
        }

        // Normalize skills
        const skillsList = Array.isArray(parsed.skills) && parsed.skills.length > 0
            ? parsed.skills.map((s) => String(s).trim()).filter(Boolean)
            : [];

        // Normalize skill groups
        const skillGroups = Array.isArray(parsed.skillGroups) ? parsed.skillGroups : [];

        // Normalize projects
        const finalProjects = Array.isArray(parsed.projects) && parsed.projects.length > 0
            ? parsed.projects.map((p) => ({
                name: String(p.name || "Software Project").trim(),
                technologies: String(p.technologies || "").trim(),
                description: String(p.description || "").trim(),
                link: String(p.link || "").trim(),
            }))
            : [];

        // Normalize experience
        const finalExperience = Array.isArray(parsed.experience) && parsed.experience.length > 0
            ? parsed.experience.map((e) => ({
                company: String(e.company || "Technology Corp").trim(),
                role: String(e.role || role).trim(),
                duration: String(e.duration || "2022 - Present").trim(),
                description: String(e.description || "").trim(),
            }))
            : [];

        // Normalize education
        const finalEducation = Array.isArray(parsed.education) && parsed.education.length > 0
            ? parsed.education.map((ed) => ({
                degree: String(ed.degree || "Bachelor of Science in Computer Science").trim(),
                college: String(ed.college || "State University").trim(),
                year: String(ed.year || "2018 - 2022").trim(),
                cgpa: String(ed.cgpa || "").trim(),
            }))
            : (inputData.education.length > 0 ? inputData.education : []);

        // Normalize certifications
        const finalCertifications = Array.isArray(parsed.certifications) && parsed.certifications.length > 0
            ? parsed.certifications.map((c) => ({
                name: String(c.name || "Industry Certificate").trim(),
                issuer: String(c.issuer || "Certification Authority").trim(),
                year: String(c.year || "2023").trim(),
            }))
            : (inputData.certifications.length > 0 ? inputData.certifications : []);

        // If projects or experience ended up empty, blend with role fallback
        if (finalProjects.length === 0 || finalExperience.length === 0 || skillsList.length === 0) {
            const fallback = synthesizeFallbackResume(inputData);
            return {
                targetRole: role,
                summary: parsed.summary || fallback.summary,
                skills: skillsList.length > 0 ? skillsList : fallback.skills,
                skillGroups: skillGroups.length > 0 ? skillGroups : fallback.skillGroups,
                projects: finalProjects.length > 0 ? finalProjects : fallback.projects,
                experience: finalExperience.length > 0 ? finalExperience : fallback.experience,
                education: finalEducation.length > 0 ? finalEducation : fallback.education,
                certifications: finalCertifications.length > 0 ? finalCertifications : fallback.certifications,
                suggestedSkills: parsed.suggestedSkills || fallback.suggestedSkills,
                isFallback: false,
            };
        }

        return {
            targetRole: role,
            summary: parsed.summary,
            skills: skillsList,
            skillGroups,
            projects: finalProjects,
            experience: finalExperience,
            education: finalEducation,
            certifications: finalCertifications,
            suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : [],
            isFallback: false,
        };
    } catch (err) {
        console.warn(`[AI Resume] Gemini generation failed (${err.message}). Activating role synthesis fallback.`);
        const fallback = synthesizeFallbackResume(inputData);
        return {
            ...fallback,
            fallbackReason: err.message,
        };
    }
}

function condenseBulletText(text, maxBullets = 2) {
    if (!text || typeof text !== "string") return "";
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const bullets = lines.slice(0, maxBullets).map((line) => {
        let clean = line.replace(/^[•\-\*]\s*/, "");
        if (clean.length > 140) {
            clean = clean.substring(0, 137).trim() + "...";
        }
        return `• ${clean}`;
    });
    return bullets.join("\n");
}

function ruleBasedOnePageOptimization({ summary = "", experience = [], projects = [] }) {
    let condensedSummary = summary;
    if (summary && summary.length > 220) {
        const sentences = summary.match(/[^.!?]+[.!?]+/g);
        if (sentences && sentences.length >= 2) {
            condensedSummary = sentences.slice(0, 2).join(" ").trim();
        } else {
            condensedSummary = summary.substring(0, 217).trim() + "...";
        }
    }

    const condensedExp = experience.map((exp) => ({
        company: exp.company || "",
        role: exp.role || "",
        duration: exp.duration || "",
        description: condenseBulletText(exp.description, 2),
    }));

    const condensedProj = projects.map((p) => ({
        name: p.name || "",
        technologies: p.technologies || "",
        description: condenseBulletText(p.description, 2),
        link: p.link || "",
    }));

    return {
        summary: condensedSummary,
        experience: condensedExp,
        projects: condensedProj,
        isFallback: true,
    };
}

async function optimizeResumeForOnePage({ summary = "", experience = [], projects = [], skills = [], targetRole = "" }) {
    if (!process.env.GEMINI_API_KEY) {
        return ruleBasedOnePageOptimization({ summary, experience, projects });
    }

    try {
        const prompt = `
You are an executive resume editor specializing in compact One-Page A4 Resumes.

TASK:
Optimize and condense the user's resume content so that it fits comfortably on a single A4 page.
Do NOT invent new facts. Preserve the candidate's actual achievements, technologies, and companies.

TARGET ROLE: ${targetRole || "Professional"}
CURRENT SUMMARY:
${summary}

CURRENT EXPERIENCE:
${JSON.stringify(experience, null, 2)}

CURRENT PROJECTS:
${JSON.stringify(projects, null, 2)}

STRICT RULES:
1. SUMMARY: Condense into exactly 2 punchy, high-impact sentences highlighting the strongest competencies.
2. EXPERIENCE: Keep all existing entries. For each entry, produce 2 concise bullet points starting with "• ". Eliminate wordiness while keeping technical metrics and action verbs.
3. PROJECTS: Keep all existing entries. For each project, produce 1 or 2 concise bullet points starting with "• ".

Return strictly valid JSON:
{
  "summary": "...",
  "experience": [
    {
      "company": "...",
      "role": "...",
      "duration": "...",
      "description": "• Bullet 1\\n• Bullet 2"
    }
  ],
  "projects": [
    {
      "name": "...",
      "technologies": "...",
      "description": "• Bullet 1",
      "link": "..."
    }
  ]
}
`;
        const result = await generateContentWithRetry(prompt);
        const response = await result.response;
        const parsed = extractJsonFromAiResponse(response.text());

        if (!parsed || typeof parsed.summary !== "string") {
            throw new Error("Invalid AI condensing response.");
        }

        return {
            summary: parsed.summary,
            experience: Array.isArray(parsed.experience) ? parsed.experience : experience,
            projects: Array.isArray(parsed.projects) ? parsed.projects : projects,
            isFallback: false,
        };
    } catch (err) {
        console.warn("[One-Page AI] Failed to condense with Gemini, applying rule-based optimizer:", err.message);
        return ruleBasedOnePageOptimization({ summary, experience, projects });
    }
}

module.exports = analyzeResume;
module.exports.generateContentWithRetry = generateContentWithRetry;
module.exports.improveResumeText = improveResumeText;
module.exports.generateFullResume = generateFullResume;
module.exports.extractJsonFromAiResponse = extractJsonFromAiResponse;
module.exports.synthesizeFallbackResume = synthesizeFallbackResume;
module.exports.optimizeResumeForOnePage = optimizeResumeForOnePage;
module.exports.ruleBasedOnePageOptimization = ruleBasedOnePageOptimization;
