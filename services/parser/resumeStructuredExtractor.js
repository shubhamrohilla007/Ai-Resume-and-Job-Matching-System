const { generateContentWithRetry, extractJsonFromAiResponse } = require("../ai/geminiService");

const HEADING_KEYWORDS = [
    "summary",
    "professional summary",
    "profile",
    "about me",
    "objective",
    "career objective",
    "education",
    "academic background",
    "qualifications",
    "experience",
    "work experience",
    "employment history",
    "professional experience",
    "projects",
    "key projects",
    "academic projects",
    "technical projects",
    "personal projects",
    "technical skills",
    "skills",
    "competencies",
    "core competencies",
    "certifications",
    "certificates",
    "licenses",
    "contact",
    "curriculum vitae",
    "resume",
    "cv",
    // Multi-profession & specialized headings
    "hackathons",
    "hackathon",
    "coding competitions",
    "competitions",
    "publications",
    "research papers",
    "research experience",
    "patents",
    "conferences",
    "workshops",
    "seminars",
    "clinical rotations",
    "clinical experience",
    "medical residency",
    "medical training",
    "teaching experience",
    "teaching methodology",
    "curriculum development",
    "moot courts",
    "bar admissions",
    "exhibitions",
    "design portfolio",
    "awards",
    "honors",
    "achievements",
    "scholarships",
    "volunteer experience",
    "volunteering",
    "community leadership",
    "leadership",
    "extracurricular activities",
    "extracurriculars",
];

function isHeading(line) {
    if (!line || typeof line !== "string") return false;
    const clean = line.trim().toLowerCase().replace(/[:\-_#*]/g, "").trim();
    if (HEADING_KEYWORDS.includes(clean)) return true;
    const raw = line.trim();
    if (raw.length >= 3 && raw.length <= 40 && !raw.includes("@") && !raw.includes("http") && !raw.startsWith("•") && !raw.startsWith("-") && !raw.startsWith("*")) {
        if (/^[A-Z\s&/]{3,35}$/.test(raw) || /^[A-Z][A-Za-z\s&/]{2,35}:$/.test(raw)) {
            return true;
        }
    }
    return false;
}

/**
 * Deterministic rule-based extractor for resume text
 * Used when Gemini AI is not available, fails, or for testing.
 */
function ruleBasedStructuredExtract(text = "", aiAnalysis = null, originalFileName = "") {
    const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const textLower = text.toLowerCase();

    // 1. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const email = emailMatch ? emailMatch[0].trim() : "";

    // 2. Phone extraction
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // 3. LinkedIn extraction
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([a-zA-Z0-9_.-]+)/i);
    const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith("http") ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : "";

    // 4. GitHub extraction
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)/i);
    const github = githubMatch ? (githubMatch[0].startsWith("http") ? githubMatch[0] : `https://${githubMatch[0]}`) : "";

    // 5. Portfolio URL
    const portfolioMatches = text.match(/https?:\/\/[^\s,;()]+/gi) || [];
    let portfolioUrl = "";
    for (const url of portfolioMatches) {
        if (!url.includes("linkedin.com") && !url.includes("github.com") && !url.includes("render.com")) {
            portfolioUrl = url;
            break;
        }
    }

    // 6. Name extraction
    let fullName = "";
    for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
        const line = rawLines[i];
        const lower = line.toLowerCase();

        // Ignore lines with emails, links, phones, or document headings
        if (
            isHeading(line) ||
            lower.includes("@") ||
            lower.includes("linkedin") ||
            lower.includes("github") ||
            lower.includes("phone") ||
            lower.includes("http") ||
            lower.includes("|") ||
            /\d{4}/.test(line)
        ) {
            continue;
        }

        // A valid name line is typically 1-4 words, alphabetic
        if (/^[a-zA-Z][a-zA-Z\s.'-]{1,45}$/.test(line)) {
            const wordCount = line.split(/\s+/).length;
            if (wordCount >= 1 && wordCount <= 4) {
                // If it's all uppercase like "SHUBHAM", capitalize words nicely
                if (line === line.toUpperCase()) {
                    fullName = line.split(/\s+/).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
                } else {
                    fullName = line.trim();
                }
                break;
            }
        }
    }

    // Fallback name from filename e.g. "Shubham_Resume.pdf" -> "Shubham"
    if (!fullName && originalFileName) {
        const base = originalFileName.replace(/\.(pdf|docx|doc)$/i, "");
        const cleanName = base.replace(/[_-]?(resume|cv|profile|bio)[_-]?/gi, "").replace(/[_-]/g, " ").trim();
        if (cleanName && cleanName.length >= 2) {
            fullName = cleanName.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }
    }

    // 7. Location extraction
    let location = "";
    // Check line containing phone/email for location prefix e.g. "Bahadurgarh, Haryana | +91..."
    for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
        const line = rawLines[i];
        if (line.includes("|") && (line.includes("@") || /\d{10}/.test(line))) {
            const parts = line.split("|").map((p) => p.trim());
            for (const part of parts) {
                if (!part.includes("@") && !/\d{5}/.test(part) && part.length > 2 && part.length < 40) {
                    location = part;
                    break;
                }
            }
            if (location) break;
        }
    }

    if (!location) {
        const commonCities = ["New Delhi", "Delhi", "Bengaluru", "Bangalore", "Mumbai", "Hyderabad", "Pune", "Chennai", "Kolkata", "Noida", "Gurugram", "Haryana", "San Francisco", "New York", "London", "Seattle", "Austin", "Toronto", "Berlin"];
        for (const city of commonCities) {
            if (text.includes(city)) {
                location = city;
                break;
            }
        }
    }

    // 8. Summary extraction
    let summary = (aiAnalysis && aiAnalysis.summary) || "";
    if (!summary) {
        const summaryMatch = text.match(/(?:professional summary|summary|profile|about me|objective)[:\s]*\n([\s\S]{30,550}?)(?:\n\s*[A-Z][A-Z\s]{2,}:|\n\s*(?:education|projects|skills|technical skills|experience|employment))/i);
        if (summaryMatch && summaryMatch[1]) {
            summary = summaryMatch[1].replace(/\n+/g, " ").trim();
        }
    }

    // 9. Skills extraction
    // First, check if text contains structured categorized skills (e.g. "Programming Languages: Java, Python")
    let skills = [];
    const skillsSectionMatch = text.match(/(?:technical skills|skills|technologies|core competencies)[:\s]*\n([\s\S]*?)(?:\n\s*(?:certifications|certificates|licenses|education|academic background|experience|work experience|projects|key projects|employment)|$)/i);
    if (skillsSectionMatch && skillsSectionMatch[1]) {
        const rawChunk = skillsSectionMatch[1];
        const lines = rawChunk.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (line.includes(":")) {
                const parts = line.split(":");
                const category = parts[0].trim();
                const items = parts.slice(1).join(":").split(/[,;•|]/).map((s) => s.trim()).filter(Boolean);
                if (category && items.length > 0) {
                    skills.push(`${category}: ${items.join(", ")}`);
                }
            } else if (line.startsWith("•") || line.startsWith("-")) {
                const item = line.replace(/^[-*•]\s*/, "").trim();
                if (item.length > 1 && item.length < 60) {
                    skills.push(item);
                }
            }
        }
    }

    // Fall back to AI ATS extracted skills only if no structured/categorized skills were found in text
    if (skills.length === 0) {
        if (aiAnalysis && Array.isArray(aiAnalysis.extractedSkills) && aiAnalysis.extractedSkills.length > 0) {
            skills = [...aiAnalysis.extractedSkills];
        } else if (aiAnalysis && Array.isArray(aiAnalysis.skills) && aiAnalysis.skills.length > 0) {
            skills = [...aiAnalysis.skills];
        } else if (skillsSectionMatch && skillsSectionMatch[1]) {
            const rawChunk = skillsSectionMatch[1];
            const lines = rawChunk.split("\n").map((l) => l.trim()).filter(Boolean);
            for (const line of lines) {
                const items = line.split(/[,;•|]/).map((s) => s.trim().replace(/^[-*•]\s*/, "")).filter((s) => s.length > 1 && s.length < 35);
                skills.push(...items);
            }
        }
    }

    // 10. Target Role
    let targetRole = "";
    if (aiAnalysis && Array.isArray(aiAnalysis.recommendedJobs) && aiAnalysis.recommendedJobs.length > 0) {
        targetRole = aiAnalysis.recommendedJobs[0];
    }
    if (!targetRole) {
        const commonRoles = [
            "Full Stack Developer", "Frontend Developer", "Backend Developer", "Software Engineer",
            "DevOps Engineer", "Data Scientist", "Data Analyst", "Product Manager", "UI/UX Designer",
            "Cloud Architect", "Machine Learning Engineer", "QA Engineer", "System Administrator"
        ];
        for (const role of commonRoles) {
            if (textLower.includes(role.toLowerCase())) {
                targetRole = role;
                break;
            }
        }
    }

    // Boundary pattern for terminating section extractions cleanly without matching prefixes (e.g. skills vs SkillSync)
    const SECTION_END_PATTERN = "(?:\\n\\s*\\b(?:education|academic background|qualifications|technical skills|skills|certifications|certificates|licenses|projects|key projects|academic projects|experience|work experience|employment|hackathons?|competitions?|publications?|research|conferences?|workshops?|awards?|honors?|volunteer|clinical|moot)\\b|$)";

    // 11. Projects extraction
    const projects = [];
    const projRegex = new RegExp(`(?:projects|key projects|academic projects|technical projects)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i");
    const projMatch = text.match(projRegex);
    if (projMatch && projMatch[1]) {
        const projChunk = projMatch[1];
        const lines = projChunk.split("\n").map((l) => l.trim()).filter(Boolean);
        let currentProj = null;

        for (const line of lines) {
            // Stop if we hit any subsequent section heading (e.g. HACKATHONS, EDUCATION)
            if (isHeading(line) && !line.toLowerCase().includes("project")) {
                break;
            }

            // Check if this line is a project header: e.g. "Wanderlust — Travel Listing Web Application | Node.js, ..."
            // or "Simon Says Game | HTML, CSS, JavaScript"
            if (line.includes("|") && !line.startsWith("•") && !line.startsWith("-")) {
                if (currentProj) {
                    projects.push(currentProj);
                }
                const parts = line.split("|").map((p) => p.trim());
                const name = parts[0];
                const tech = parts.slice(1).join(" | ");
                currentProj = {
                    name,
                    technologies: tech,
                    description: "",
                    link: "",
                };
            } else if (line.match(/^project link[:\s]+(https?:\/\/[^\s]+)/i)) {
                const linkMatch = line.match(/^project link[:\s]+(https?:\/\/[^\s]+)/i);
                if (currentProj && linkMatch) {
                    currentProj.link = linkMatch[1];
                }
            } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
                const cleanBullet = `• ${line.replace(/^[-*•]\s*/, "")}`;
                if (currentProj) {
                    currentProj.description = currentProj.description ? `${currentProj.description}\n${cleanBullet}` : cleanBullet;
                }
            } else if (line.length > 5 && !isHeading(line)) {
                // If it's a project title line without pipe
                if (currentProj && !currentProj.description) {
                    currentProj.description = `• ${line}`;
                } else if (!currentProj) {
                    currentProj = {
                        name: line,
                        technologies: "",
                        description: "",
                        link: "",
                    };
                }
            }
        }
        if (currentProj) {
            projects.push(currentProj);
        }
    }

    // 12. Education extraction
    const education = [];
    const eduRegex = new RegExp(`(?:education|academic background|qualifications)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i");
    const eduMatch = text.match(eduRegex);
    if (eduMatch && eduMatch[1]) {
        const eduChunk = eduMatch[1];
        const lines = eduChunk.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (isHeading(line) && !line.toLowerCase().includes("education") && !line.toLowerCase().includes("academic") && !line.toLowerCase().includes("qualification")) {
                break;
            }
            if (line.includes("|")) {
                const parts = line.split("|").map((p) => p.trim());
                const college = parts[0] || "University";
                const degree = parts[1] || "";
                let cgpa = "";
                let year = "";
                for (const p of parts.slice(2)) {
                    if (/cgpa|gpa|%/i.test(p)) {
                        cgpa = p.replace(/cgpa[:\s]*/i, "").trim();
                    } else if (/\b(20\d{2}|19\d{2})\b/.test(p)) {
                        const ym = p.match(/\b(20\d{2}|19\d{2})\b/);
                        if (ym) year = ym[0];
                    }
                }
                if (degree || college) {
                    education.push({ degree: degree || "Degree", college, year, cgpa });
                }
            } else {
                const degreeMatch = line.match(/\b(b\.?tech|b\.?e\.?|b\.?s\.?|m\.?tech|m\.?s\.?|bca|mca|bba|mba|ph\.?d|bachelor|master|diploma)[^,;|\n]*/i);
                const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
                const cgpaMatch = line.match(/\b(?:cgpa|gpa|score)?[:\s]*(\d(?:\.\d{1,2})?\s*(?:\/\s*10|\/\s*4)?|\d{2}%)/i);

                if (degreeMatch) {
                    education.push({
                        degree: degreeMatch[0].trim(),
                        college: line.replace(degreeMatch[0], "").replace(yearMatch ? yearMatch[0] : "", "").replace(/[,\-|]/g, " ").trim() || "University",
                        year: yearMatch ? yearMatch[0] : "",
                        cgpa: cgpaMatch ? cgpaMatch[1].trim() : "",
                    });
                }
            }
        }
    }

    // 13. Experience extraction
    const experience = [];
    const expRegex = new RegExp(`(?:experience|work experience|employment history|professional experience)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i");
    const expMatch = text.match(expRegex);
    if (expMatch && expMatch[1]) {
        const expChunk = expMatch[1];
        const blocks = expChunk.split(/\n\s*\n/).filter((b) => b.trim().length > 15);
        for (const block of blocks.slice(0, 5)) {
            const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
            if (lines.length > 0) {
                const header = lines[0];
                if (isHeading(header) && !header.toLowerCase().includes("experience") && !header.toLowerCase().includes("employment")) {
                    break;
                }
                const dateMatch = block.match(/\b(?:20\d{2}|19\d{2})\b\s*(?:-|–|to)\s*(?:\b(?:20\d{2}|19\d{2})\b|present)/i);
                const duration = dateMatch ? dateMatch[0] : "";

                let role = header;
                let company = "";
                if (header.includes(" at ")) {
                    const parts = header.split(" at ");
                    role = parts[0].trim();
                    company = parts[1].replace(duration, "").trim();
                } else if (header.includes("|")) {
                    const parts = header.split("|");
                    company = parts[0].trim();
                    role = parts[1].replace(duration, "").trim();
                } else if (header.includes("-")) {
                    const parts = header.split("-");
                    role = parts[0].trim();
                    company = (parts[1] || "").replace(duration, "").trim();
                }

                const bulletLines = lines.slice(1).filter((l) => !l.includes(duration));
                const description = bulletLines.map((l) => (l.startsWith("•") ? l : `• ${l.replace(/^[-*]\s*/, "")}`)).join("\n");

                if (role || company) {
                    experience.push({
                        company: company || "Company",
                        role: role || targetRole || "Software Professional",
                        duration: duration || "2022 - Present",
                        description: description || "• Contributed to key engineering responsibilities and project deliverables.",
                    });
                }
            }
        }
    }

    // 14. Certifications extraction
    const certifications = [];
    const certRegex = /(?:certifications|certificates|licenses|credentials)[:\s]*\n([\s\S]*?)(?:\n\s*(?:education|experience|projects|skills)|$)/i;
    const certMatch = text.match(certRegex);
    if (certMatch && certMatch[1]) {
        const certLines = certMatch[1].split("\n").map((l) => l.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
        for (const line of certLines.slice(0, 6)) {
            const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
            let rawTitle = line.replace(/\b(20\d{2}|19\d{2})\b/, "").trim();
            let name = rawTitle;
            let issuer = "Credential Authority";

            if (rawTitle.includes("—")) {
                const parts = rawTitle.split("—").map((p) => p.trim());
                name = parts[0];
                issuer = parts[1] || issuer;
            } else if (rawTitle.includes(" - ")) {
                const parts = rawTitle.split(" - ").map((p) => p.trim());
                name = parts[0];
                issuer = parts[1] || issuer;
            } else if (name.includes("AWS")) {
                issuer = "Amazon Web Services";
            } else if (name.includes("Azure") || name.includes("Microsoft")) {
                issuer = "Microsoft";
            } else if (name.includes("Google")) {
                issuer = "Google Cloud";
            } else if (name.includes("IBM")) {
                issuer = "IBM";
            }

            if (name.length > 3) {
                certifications.push({
                    name,
                    issuer,
                    year: yearMatch ? yearMatch[0] : "",
                });
            }
        }
    }

    // 15. Dynamic Custom & Multi-Profession Sections Extraction
    const customSections = [];

    function extractCustomSection(sectionRegex, titleLabel) {
        const match = text.match(sectionRegex);
        if (match && match[1]) {
            const rawChunk = match[1];
            const lines = rawChunk.split("\n").map((l) => l.trim()).filter(Boolean);
            const contentLines = [];
            const items = [];
            let currentItem = [];

            for (let line of lines) {
                // If we reach another known heading that isn't part of this custom section, stop
                const clean = line.toLowerCase().replace(/[:\-_#*]/g, "").trim();
                if (isHeading(line) && !titleLabel.toLowerCase().includes(clean.slice(0, 5))) {
                    break;
                }

                // Check for item boundaries (e.g. pipe title like "TrustBridge... | Hackathon, IIIT Delhi | Team of 5")
                const isPipeHeader = line.includes("|");
                const isMetaLine = /^(?:technologies|tech|proposed stack|stack|tools|event|role):/i.test(line);

                if (!isPipeHeader && !isMetaLine) {
                    // Bullet line: ensure it has standard bullet '• '
                    const cleanText = line.replace(/^[-*•]\s*/, "");
                    line = `• ${cleanText}`;
                }

                contentLines.push(line);

                if (isPipeHeader && currentItem.length > 0) {
                    items.push(currentItem.join("\n"));
                    currentItem = [line];
                } else {
                    currentItem.push(line);
                }
            }
            if (currentItem.length > 0) {
                items.push(currentItem.join("\n"));
            }

            if (contentLines.length > 0) {
                customSections.push({
                    title: titleLabel,
                    content: contentLines.join("\n"),
                    items: items.length > 0 ? items : contentLines,
                });
            }
        }
    }

    // A. Hackathons & Competitions (Tech / Engineering)
    extractCustomSection(
        new RegExp(`(?:hackathons?|coding competitions?|hackathon projects?)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "HACKATHONS"
    );

    // B. Publications & Research Papers (Academia, Professors, Researchers)
    extractCustomSection(
        new RegExp(`(?:publications|research papers|patents|published works)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "PUBLICATIONS & RESEARCH"
    );

    // C. Clinical Rotations & Medical Residency (Healthcare, Doctors, Nursing)
    extractCustomSection(
        new RegExp(`(?:clinical rotations|medical residency|clinical experience|hospital affiliations)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "CLINICAL ROTATIONS"
    );

    // D. Conferences, Workshops & Seminars (Academic / Corporate)
    extractCustomSection(
        new RegExp(`(?:conferences?|workshops?|seminars?|symposiums?)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "CONFERENCES & WORKSHOPS"
    );

    // E. Moot Courts & Bar Admissions (Law / Legal)
    extractCustomSection(
        new RegExp(`(?:moot courts?|bar admissions?|legal internships?|case competitions?)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "MOOT COURTS & LEGAL COMPETITIONS"
    );

    // F. Exhibitions & Creative Showcases (Design, Architecture, Fine Arts)
    extractCustomSection(
        new RegExp(`(?:exhibitions?|creative showcases?|design portfolios?|art galleries?)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "EXHIBITIONS & PORTFOLIO"
    );

    // G. Awards, Honors & Scholarships (All Professions)
    extractCustomSection(
        new RegExp(`(?:awards|honors|achievements|scholarships|academic honors)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "AWARDS & HONORS"
    );

    // H. Volunteering, Community Leadership & Social Impact
    extractCustomSection(
        new RegExp(`(?:volunteer experience|volunteer work|volunteering|community service|social leadership)[:\\s]*\\n([\\s\\S]*?)${SECTION_END_PATTERN}`, "i"),
        "VOLUNTEER & LEADERSHIP"
    );

    return {
        personal: {
            fullName: fullName || "Candidate",
            email,
            phone,
            location,
            linkedin,
            github,
            portfolioUrl,
            photoUrl: "",
        },
        targetRole: targetRole || "Full Stack Developer",
        summary: summary || "Experienced professional with proven domain track record and demonstrated technical execution.",
        skills: skills.length > 0 ? skills : ["JavaScript", "React", "Node.js", "REST APIs"],
        experience,
        projects,
        education,
        certifications,
        customSections,
    };
}

/**
 * Main extractor: attempts Gemini structured extraction with prompt strictness,
 * falls back cleanly to ruleBasedStructuredExtract on error or quota.
 */
async function extractStructuredResume(parsedText, aiAnalysis = null, originalFileName = "") {
    if (!parsedText || !parsedText.trim()) {
        return ruleBasedStructuredExtract("", aiAnalysis, originalFileName);
    }

    if (!process.env.GEMINI_API_KEY) {
        return ruleBasedStructuredExtract(parsedText, aiAnalysis, originalFileName);
    }

    try {
        const prompt = `
You are an expert ATS entity extraction engine.
TASK: Extract all real facts, candidate identity, contact information, and resume sections from the text below.

STRICT CONSTRAINTS & MULTI-PROFESSION SECTION SEGREGATION:
1. Do NOT hallucinate or invent qualifications, jobs, or degrees.
2. If a field or section is not in the text, leave it empty.
3. NEVER merge Hackathons, Coding Competitions, Publications, Research Papers, Clinical Rotations, Moot Courts, or Exhibitions into 'projects' or 'experience'.
4. 'projects' must ONLY contain genuine software/engineering or business projects listed under a Projects heading.
5. If the resume has a 'HACKATHONS' or 'COMPETITIONS' heading, extract it ONLY under 'customSections' with title 'HACKATHONS'.
6. If the resume has profession-specific sections like 'Publications', 'Clinical Rotations', 'Conferences', 'Awards', 'Volunteer Work', extract them into 'customSections' using their original heading as the title.
7. Return ONLY valid JSON matching this exact structure:
{
  "personal": {
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin": "...",
    "github": "...",
    "portfolioUrl": ""
  },
  "targetRole": "...",
  "summary": "...",
  "skills": [
    "Programming Languages: Java, Python, JavaScript",
    "Web Development: HTML, CSS, React.js"
  ],
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
  ],
  "education": [
    {
      "degree": "...",
      "college": "...",
      "year": "...",
      "cgpa": "..."
    }
  ],
  "certifications": [
    {
      "name": "...",
      "issuer": "...",
      "year": "..."
    }
  ],
  "customSections": [
    {
      "title": "HACKATHONS",
      "content": "Full section text preserving titles, events, and bullets",
      "items": [
        "TrustBridge - Scam-Free Job & Internship Platform | Hackathon, IIIT Delhi...",
        "SkillSync - Smart India Hackathon 2026..."
      ]
    }
  ]
}

DOCUMENT FILENAME: ${originalFileName}
DOCUMENT TEXT:
${parsedText.substring(0, 10000)}
`;

        const result = await generateContentWithRetry(prompt, 1);
        const response = await result.response;
        const parsed = extractJsonFromAiResponse(response.text());

        if (parsed && typeof parsed === "object") {
            const fallback = ruleBasedStructuredExtract(parsedText, aiAnalysis, originalFileName);

            const personal = parsed.personal || {};
            let rawName = String(personal.fullName || fallback.personal.fullName || "").trim();
            if (rawName && rawName === rawName.toUpperCase()) {
                rawName = rawName.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            }

            const cleanPersonal = {
                fullName: rawName,
                email: String(personal.email || fallback.personal.email || "").trim(),
                phone: String(personal.phone || fallback.personal.phone || "").trim(),
                location: String(personal.location || fallback.personal.location || "").trim(),
                linkedin: String(personal.linkedin || fallback.personal.linkedin || "").trim(),
                github: String(personal.github || fallback.personal.github || "").trim(),
                portfolioUrl: String(personal.portfolioUrl || fallback.personal.portfolioUrl || "").trim(),
                photoUrl: "",
            };

            let cleanSkills = fallback.skills;
            if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
                const aiSkills = parsed.skills.map((s) => String(s).trim()).filter(Boolean);
                // If fallback extracted high-fidelity categorized skills from text with colons, prefer categories
                if (fallback.skills.some((s) => s.includes(":")) && !aiSkills.some((s) => s.includes(":"))) {
                    cleanSkills = fallback.skills;
                } else {
                    cleanSkills = aiSkills;
                }
            }

            const cleanExperience = Array.isArray(parsed.experience) && parsed.experience.length > 0
                ? parsed.experience.map((exp) => ({
                    company: String(exp.company || "").trim(),
                    role: String(exp.role || "").trim(),
                    duration: String(exp.duration || "").trim(),
                    description: String(exp.description || "").trim(),
                })).filter((e) => e.company || e.role)
                : fallback.experience;

            const cleanProjects = Array.isArray(parsed.projects) && parsed.projects.length > 0
                ? parsed.projects.map((p) => ({
                    name: String(p.name || "").trim(),
                    technologies: String(p.technologies || "").trim(),
                    description: String(p.description || "").trim(),
                    link: String(p.link || "").trim(),
                })).filter((p) => p.name)
                : fallback.projects;

            const cleanEducation = Array.isArray(parsed.education) && parsed.education.length > 0
                ? parsed.education.map((ed) => ({
                    degree: String(ed.degree || "").trim(),
                    college: String(ed.college || "").trim(),
                    year: String(ed.year || "").trim(),
                    cgpa: String(ed.cgpa || "").trim(),
                })).filter((ed) => ed.degree || ed.college)
                : fallback.education;

            const cleanCertifications = Array.isArray(parsed.certifications) && parsed.certifications.length > 0
                ? parsed.certifications.map((c) => ({
                    name: String(c.name || "").trim(),
                    issuer: String(c.issuer || "").trim(),
                    year: String(c.year || "").trim(),
                })).filter((c) => c.name)
                : fallback.certifications;

            const cleanCustomSections = Array.isArray(parsed.customSections) && parsed.customSections.length > 0
                ? parsed.customSections.map((cs) => ({
                    title: String(cs.title || "").trim(),
                    content: String(cs.content || "").trim(),
                    items: Array.isArray(cs.items) ? cs.items.map((it) => String(it).trim()).filter(Boolean) : (cs.content ? [cs.content] : []),
                })).filter((cs) => cs.title && (cs.content || cs.items.length > 0))
                : fallback.customSections;

            return {
                personal: cleanPersonal,
                targetRole: String(parsed.targetRole || fallback.targetRole || "").trim(),
                summary: String(parsed.summary || fallback.summary || "").trim(),
                skills: cleanSkills,
                experience: cleanExperience,
                projects: cleanProjects,
                education: cleanEducation,
                certifications: cleanCertifications,
                customSections: cleanCustomSections,
            };
        }
    } catch (err) {
        console.warn("[Structured Extractor] AI extraction failed, falling back to rule-based parser:", err.message);
    }

    return ruleBasedStructuredExtract(parsedText, aiAnalysis, originalFileName);
}

module.exports = extractStructuredResume;
module.exports.ruleBasedStructuredExtract = ruleBasedStructuredExtract;
