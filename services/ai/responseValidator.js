function validateAIResponse(data) {

    return {
        atsScore:
            typeof data.atsScore === "number"
                ? data.atsScore
                : 0,
        summary:
            data.summary || "",
        skills:
            Array.isArray(data.skills)
                ? data.skills
                : [],
        missingSkills:
            Array.isArray(data.missingSkills)
                ? data.missingSkills
                : [],
        strengths:
            Array.isArray(data.strengths)
                ? data.strengths
                : [],
        weaknesses:
            Array.isArray(data.weaknesses)
                ? data.weaknesses
                : [],
        recommendedJobs:
            Array.isArray(data.recommendedJobs)
                ? data.recommendedJobs
                : [],
        feedback:
            data.feedback ||
            "No feedback generated."
    };

}

module.exports = validateAIResponse;