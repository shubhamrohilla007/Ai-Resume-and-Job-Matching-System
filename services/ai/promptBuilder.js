function buildResumePrompt(resumeText) {

    return `
You are an expert ATS (Applicant Tracking System) Resume Analyzer.
Your task is to analyze the resume carefully.
Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return explanations.
Do NOT use \`\`\`json.
JSON Structure:
{
  "atsScore": 0,
  "summary": "",
  "skills": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "recommendedJobs": [],
  "feedback": ""
}
Resume:
${resumeText}
`;
}

module.exports = buildResumePrompt;