const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FREE_COURSES, getFreeCourses } = require("./freeCourses");

function getGeminiModels() {
  return [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash",
    process.env.GEMINI_SECONDARY_FALLBACK_MODEL || "gemini-2.5-flash",
  ];
}

/**
 * Maps a list of missing or target skills to the most relevant courses in our verified catalog
 */
function matchCoursesBySkills(skills = []) {
  if (!skills || skills.length === 0) return FREE_COURSES.slice(0, 4);

  const normalizedInputSkills = skills.map((s) => String(s).toLowerCase().trim());
  const scoredCourses = FREE_COURSES.map((course) => {
    let matchCount = 0;
    const courseSkills = (course.skills || []).map((s) => String(s).toLowerCase());
    const courseTitle = (course.title || "").toLowerCase();
    const courseDesc = (course.description || "").toLowerCase();

    for (const inputSkill of normalizedInputSkills) {
      if (courseSkills.some((cs) => cs.includes(inputSkill) || inputSkill.includes(cs))) {
        matchCount += 3;
      } else if (courseTitle.includes(inputSkill)) {
        matchCount += 2;
      } else if (courseDesc.includes(inputSkill)) {
        matchCount += 1;
      }
    }
    return { course, matchCount };
  });

  scoredCourses.sort((a, b) => b.matchCount - a.matchCount);

  // Return top matches, or default high-demand courses if no direct hits
  const matched = scoredCourses.filter((sc) => sc.matchCount > 0).map((sc) => sc.course);
  if (matched.length > 0) {
    return matched.slice(0, 6);
  }
  return FREE_COURSES.slice(0, 4);
}

/**
 * Builds a structured learning roadmap based on missing skills and course matches
 */
function buildRuleBasedRoadmap(skills = [], matchedCourses = []) {
  const topCourseNames = matchedCourses.slice(0, 3).map((c) => c.title);

  return {
    discipline: matchedCourses[0]?.discipline || "General Professional",
    trendingSkills: skills.slice(0, 5),
    recommendedCourses: matchedCourses,
    learningRoadmap: [
      {
        phase: "Phase 1: Core Fundamentals",
        goal: `Build foundational competence in ${skills.slice(0, 2).join(" & ") || "core tools"} with ${topCourseNames[0] || "introductory modules"}.`,
        duration: "Weeks 1-3",
      },
      {
        phase: "Phase 2: Practical Application & Projects",
        goal: `Implement hands-on portfolio projects addressing skill gaps in ${skills.slice(2, 4).join(", ") || "advanced techniques"} via ${topCourseNames[1] || "structured practice"}.`,
        duration: "Weeks 4-7",
      },
      {
        phase: "Phase 3: Certification & Resume Augmentation",
        goal: `Earn recognized vendor credentials and update your resume with verified project evidence using ${topCourseNames[2] || "capstone certification"}.`,
        duration: "Weeks 8-10",
      },
    ],
    aiRationale: `Targeting these ${skills.length} missing skill(s) directly bridges the gap between your current resume profile and employer requirements.`,
  };
}

/**
 * AI Course Recommender powered by Gemini with graceful rule-based fallback
 */
async function recommendCoursesForSkills(missingSkills = [], careerGoal = "") {
  const matchedCourses = matchCoursesBySkills(missingSkills);
  const fallback = buildRuleBasedRoadmap(missingSkills, matchedCourses);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || missingSkills.length === 0) {
    return fallback;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(getGeminiModels())];

  const catalogSummary = matchedCourses.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    provider: c.provider,
    skills: c.skills,
  }));

  const prompt = `
You are an expert career counselor and curriculum advisor.
A job seeker has identified specific missing skill gaps for their target roles.

Missing Skills: ${missingSkills.join(", ")}
Career Target: ${careerGoal || "Competitive job placement"}

Relevant Courses Available:
${JSON.stringify(catalogSummary, null, 2)}

Provide a structured recommendation in valid JSON (no markdown):
{
  "discipline": "Technical / Engineering or Business / Management",
  "trendingSkills": ["skill 1", "skill 2", "skill 3"],
  "recommendedCourseIds": ["id1", "id2"],
  "learningRoadmap": [
    { "phase": "Phase 1: Foundation", "goal": "concrete learning goal", "duration": "Weeks 1-3" },
    { "phase": "Phase 2: Project Building", "goal": "concrete project to build", "duration": "Weeks 4-7" },
    { "phase": "Phase 3: Industry Certification", "goal": "credential to earn", "duration": "Weeks 8-10" }
  ],
  "aiRationale": "2-3 sentences explaining how acquiring these skills improves candidate match rate."
}
`;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(cleaned);

      const courseMap = new Map(FREE_COURSES.map((c) => [c.id, c]));
      const resolvedCourses = (parsed.recommendedCourseIds || [])
        .map((id) => courseMap.get(id))
        .filter(Boolean);

      return {
        discipline: parsed.discipline || fallback.discipline,
        trendingSkills: Array.isArray(parsed.trendingSkills) ? parsed.trendingSkills : fallback.trendingSkills,
        recommendedCourses: resolvedCourses.length > 0 ? resolvedCourses : matchedCourses,
        learningRoadmap: Array.isArray(parsed.learningRoadmap) ? parsed.learningRoadmap : fallback.learningRoadmap,
        aiRationale: parsed.aiRationale || fallback.aiRationale,
      };
    } catch (err) {
      console.warn(`[Course Recommender] Model ${modelName} fallback triggered:`, err.message);
    }
  }

  return fallback;
}

module.exports = {
  getFreeCourses,
  matchCoursesBySkills,
  recommendCoursesForSkills,
  FREE_COURSES,
};
