const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const JobApplication = require("../models/JobApplication");
const Feedback = require("../models/Feedback");
const { tailorResumeForJobWithAi } = require("../services/ai/geminiService");
const emailService = require("../services/emailService");
const { calculateJobMatch } = require("../services/jobMatchingService");

describe("Next-Level Upgrade: Schema & Data Integrity", () => {
    test("JobApplication schema includes matchScore, missingSkills, and recruiterFeedback fields", () => {
        const schema = JobApplication.schema.obj;
        assert.ok(schema.matchScore, "Schema should define matchScore");
        assert.ok(schema.matchingSkills, "Schema should define matchingSkills");
        assert.ok(schema.missingSkills, "Schema should define missingSkills");
        assert.ok(schema.resumeUrl, "Schema should define resumeUrl");
        assert.ok(schema.resumeId, "Schema should define resumeId");
        assert.ok(schema.recruiterFeedback, "Schema should define recruiterFeedback");
        assert.ok(schema.reviewedAt, "Schema should define reviewedAt");
    });

    test("Feedback schema includes category, rating (1-5), subject, message, and adminNote", () => {
        const schema = Feedback.schema.obj;
        assert.ok(schema.category, "Feedback schema should define category");
        assert.ok(schema.rating, "Feedback schema should define rating");
        assert.ok(schema.subject, "Feedback schema should define subject");
        assert.ok(schema.message, "Feedback schema should define message");
        assert.ok(schema.status, "Feedback schema should define status");
        assert.ok(schema.adminNote, "Feedback schema should define adminNote");
    });
});

describe("Next-Level Upgrade: AI Role-Tailoring Assistant", () => {
    test("tailorResumeForJobWithAi produces company-targeted summary and STAR bullets", async () => {
        const resume = {
            summary: "Experienced software developer skilled in React and Node.js.",
            skills: ["React", "Node.js", "JavaScript", "HTML", "CSS"],
            experience: [
                {
                    company: "Tech Corp",
                    position: "Frontend Developer",
                    description: "Built web applications and fixed bugs.",
                    highlights: ["Created responsive user interfaces.", "Worked with team on API integration."],
                },
            ],
            projects: [
                {
                    title: "E-Commerce App",
                    description: "Online store built with React and Node.",
                    technologies: ["React", "Express", "MongoDB"],
                },
            ],
        };

        const job = {
            title: "Senior Full Stack Engineer",
            company: "Fintech Innovations",
            description: "Looking for an engineer to build scalable payment pipelines with Docker and AWS.",
            requiredSkills: ["Node.js", "React", "Docker", "AWS"],
            preferredSkills: ["TypeScript", "GraphQL"],
        };

        const result = await tailorResumeForJobWithAi({ resume, job });

        assert.ok(result, "Tailoring result should exist");
        assert.ok(typeof result.tailoredSummary === "string" && result.tailoredSummary.length > 20, "Should generate tailored summary");
        assert.ok(
            result.tailoredSummary.includes("Fintech Innovations") || result.tailoredSummary.toLowerCase().includes("senior full stack engineer"),
            "Tailored summary should mention company or target role"
        );
        assert.ok(Array.isArray(result.tailoredBullets), "Should produce tailored bullets array");
        assert.ok(result.tailoredBullets.length > 0, "Tailored bullets should not be empty");
        assert.ok(result.targetRoleFitScore >= 50, "Predicted fit score should be at least 50%");
        assert.ok(result.suggestedProjectIdea, "Should provide suggested bridge project idea");
        assert.ok(result.suggestedProjectIdea.title, "Suggested project should have a title");
    });
});

describe("Next-Level Upgrade: Automated Email Alerts on Status Update", () => {
    test("sendApplicationStatusUpdateEmail logs and dispatches status notification with recruiter feedback", async () => {
        emailService._clearSentEmails();

        const emailResult = await emailService.sendApplicationStatusUpdateEmail({
            to: "candidate_test@example.com",
            candidateName: "Rohil Candidate",
            jobTitle: "Cloud Solutions Architect",
            company: "Google Cloud Partners",
            status: "shortlisted",
            recruiterFeedback: "Impressive project portfolio. Moving forward to technical phone screen this Thursday.",
        });

        assert.ok(emailResult, "Email dispatcher should return info object");

        const lastSent = emailService._getLastSentEmail();
        assert.ok(lastSent, "Email must be recorded in sent logs");
        assert.equal(lastSent.to, "candidate_test@example.com");
        assert.ok(lastSent.subject.includes("Shortlisted"), "Subject should indicate Shortlisted status");
        assert.ok(lastSent.html.includes("Google Cloud Partners"), "HTML body should reference target company");
        assert.ok(lastSent.html.includes("Impressive project portfolio"), "HTML body should contain recruiter feedback note");
    });
});

describe("Next-Level Upgrade: ATS Scoring & Candidate Matching", () => {
    test("calculateJobMatch assigns ATS matchScore and detects missing skills", () => {
        const resume = {
            skills: ["React", "JavaScript", "CSS"],
            projects: [],
        };

        const job = {
            title: "Frontend Engineer",
            company: "Modern Web Inc",
            requiredSkills: ["React", "JavaScript", "TypeScript", "TailwindCSS"],
            preferredSkills: ["Redux", "Next.js"],
        };

        const match = calculateJobMatch(resume, job);

        assert.ok(typeof match.matchScore === "number", "matchScore should be a number");
        assert.ok(match.matchedRequired.includes("React"), "React should be matched");
        assert.ok(match.matchedRequired.includes("JavaScript"), "JavaScript should be matched");
        assert.ok(match.missingRequired.includes("TypeScript"), "TypeScript should be missing");
        assert.ok(match.missingRequired.includes("TailwindCSS"), "TailwindCSS should be missing");
        assert.ok(match.matchScore < 60, "Match score should reflect missing skills");
    });
});
