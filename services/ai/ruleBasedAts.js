/**
 * Rule-based ATS Analysis Fallback
 * Used when Gemini AI is unreachable or rate-limited.
 * Factual, evidence-based structural ATS scoring without hallucinated metrics.
 */

const COMMON_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "html", "css",
  "react", "angular", "vue", "node.js", "express", "django", "fastapi", "spring",
  "sql", "mysql", "postgresql", "mongodb", "redis", "aws", "azure", "docker",
  "kubernetes", "git", "github", "ci/cd", "rest api", "graphql", "agile", "scrum",
  "machine learning", "data analysis", "pandas", "numpy", "power bi", "tableau",
  "communication", "leadership", "project management", "problem solving"
];

function ruleBasedAnalyzeResume(text = "") {
  const normalized = String(text || "").toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const foundSkills = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i");
    if (regex.test(normalized)) {
      foundSkills.push(skill);
    }
  }

  // Section presence checks
  const hasExperience = /experience|employment|work history|career history/i.test(normalized);
  const hasEducation = /education|academic|degree|university|college|bachelor|master/i.test(normalized);
  const hasSkills = /skills|technical skills|competencies|technologies/i.test(normalized);
  const hasProjects = /projects|portfolio|personal projects|key projects/i.test(normalized);
  const hasContact = /email|phone|linkedin|github|@/i.test(normalized);

  const strengths = [];
  const weaknesses = [];

  let score = 30; // base score for readable text

  if (hasContact) {
    score += 15;
    strengths.push("Clear contact information and profile identifiers detected.");
  } else {
    weaknesses.push("Missing or non-standard contact header.");
  }

  if (hasEducation) {
    score += 15;
    strengths.push("Standard Education section present.");
  } else {
    weaknesses.push("Education credentials section not clearly identified.");
  }

  if (hasExperience) {
    score += 15;
    strengths.push("Professional experience or employment history section identified.");
  } else {
    weaknesses.push("Work experience section not clearly demarcated.");
  }

  if (hasSkills && foundSkills.length >= 4) {
    score += 15;
    strengths.push(`Identified ${foundSkills.length} industry-standard technical keywords.`);
  } else if (foundSkills.length > 0) {
    score += 10;
    weaknesses.push("Keywords are limited. Consider including more relevant industry terms.");
  } else {
    weaknesses.push("Skills section is missing or lacks standard industry keywords.");
  }

  if (hasProjects) {
    score += 10;
    strengths.push("Projects or practical application section present.");
  }

  // Word count health check
  if (wordCount < 150) {
    score -= 10;
    weaknesses.push("Resume appears very brief (under 150 words). More descriptive experience recommended.");
  } else if (wordCount > 1500) {
    score -= 5;
    weaknesses.push("Resume is quite lengthy (over 1,500 words). Aim for concise 1-2 pages.");
  }

  score = Math.max(25, Math.min(95, score));

  return {
    atsScore: score,
    summary: `Structural analysis identified ${foundSkills.length} verified keywords across ${wordCount} words.`,
    skills: foundSkills,
    missingSkills: ["Cloud architecture", "Unit testing", "System design"].filter(s => !foundSkills.includes(s.toLowerCase())),
    strengths,
    weaknesses,
    recommendedJobs: foundSkills.length > 0
      ? [`${foundSkills[0].toUpperCase()} Developer`, "Software Engineer", "Technical Specialist"]
      : ["Associate Specialist", "Entry Level Analyst"],
    feedback: "Rule-based structural evaluation completed (Gemini AI was unavailable). Scores reflect formatting, keyword density, and section completeness.",
    analysisMode: "rule-based-fallback",
  };
}

module.exports = { ruleBasedAnalyzeResume };
