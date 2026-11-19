function buildResumePrompt(resumeText) {
    return `
You are an expert, multi-profession ATS (Applicant Tracking System) Resume Analyzer.
Your task is to analyze the candidate's resume carefully across their domain (Tech, Healthcare, Academia, Business, Law, Design, etc.).

EVALUATION GUIDELINES:
1. Recognize and award credit for domain-specific achievements:
   - For Tech/Engineering: Value Hackathons, Open-Source Contributions, and Full-Stack Architectures.
   - For Academia/Education: Value Publications, Research Papers, Conferences, Workshops, and Curriculum Design.
   - For Healthcare: Value Clinical Rotations, Medical Residencies, and Certifications.
   - For Law & Business: Value Moot Courts, Bar Admissions, Case Competitions, and Financial Models.
2. Calculate atsScore (0-100) based on role clarity, keyword density, quantified achievements, and structured sections.
3. Return ONLY valid JSON.
4. Do NOT return markdown code fences.
5. Do NOT return text outside the JSON.

JSON Structure:
{
  "atsScore": 85,
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
