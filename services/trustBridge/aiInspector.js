const { GoogleGenerativeAI } = require("@google/generative-ai");

function getGeminiModels() {
  return [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash",
    process.env.GEMINI_SECONDARY_FALLBACK_MODEL || "gemini-2.5-flash",
  ];
}

/**
 * Analyzes a job listing for suspicious claims, unrealistic expectations, and scam markers.
 */
async function analyzeJobListingWithAI(jobData = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      aiAvailable: false,
      skills: [],
      missingFields: [],
      scamMarkers: [],
      isLikelyScam: false,
      professionalismScore: 7,
      rationale: "AI analysis skipped: GEMINI_API_KEY is not configured. Rule-based evaluation used.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [...new Set(getGeminiModels())];

  const prompt = `
You are an expert fraud detection and job listing auditor for an employment platform.
Analyze the following job listing for authenticity, clarity, realistic requirements, and potential scam signals.

Job Title: ${jobData.title || "N/A"}
Company: ${jobData.company || "N/A"}
Location: ${jobData.location || "N/A"}
Job Type: ${jobData.jobType || "N/A"}
Experience Level: ${jobData.experienceLevel || "N/A"}
Salary: ${jobData.salary || "N/A"}
Application URL: ${jobData.applicationUrl || "N/A"}
Required Skills: ${Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills.join(", ") : jobData.requiredSkills || "N/A"}
Description:
${jobData.description || "N/A"}

Respond ONLY with a JSON object in this exact schema (no markdown fences, no extra text):
{
  "skills": ["extracted technical or soft skill 1", "skill 2"],
  "missingFields": ["list of critical missing job aspects, e.g. role responsibilities, specific deliverables"],
  "scamMarkers": ["suspicious wording, requests for money, vague tasks, unrealistic compensation promises"],
  "isLikelyScam": false,
  "professionalismScore": 8,
  "rationale": "One to two sentences summarizing the clarity and credibility of this listing."
}

Rules:
1. "isLikelyScam" should only be true if there are explicit scam indicators (e.g. pay to work, wire money, guaranteed riches, vague typing job).
2. "professionalismScore" must be an integer between 0 and 10 based on description clarity, role specificity, and realistic expectations.
3. Be objective. Do not penalize early-stage startups simply for being concise.
`;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        aiAvailable: true,
        modelUsed: modelName,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
        scamMarkers: Array.isArray(parsed.scamMarkers) ? parsed.scamMarkers : [],
        isLikelyScam: Boolean(parsed.isLikelyScam),
        professionalismScore: Math.max(0, Math.min(10, Number(parsed.professionalismScore) || 7)),
        rationale: String(parsed.rationale || "").trim(),
      };
    } catch (err) {
      console.warn(`[AI Inspector] Model ${modelName} failed:`, err.message);
    }
  }

  // Fallback when all AI models fail
  return {
    aiAvailable: false,
    skills: [],
    missingFields: [],
    scamMarkers: [],
    isLikelyScam: false,
    professionalismScore: 7,
    rationale: "AI service temporarily unavailable. Basic rule-based audit completed.",
  };
}

module.exports = { analyzeJobListingWithAI };
