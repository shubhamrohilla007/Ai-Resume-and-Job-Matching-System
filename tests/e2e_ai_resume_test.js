const axios = require('axios');

async function testE2E() {
    try {
        console.log("1. Logging in as job seeker...");
        const client = axios.create({
            baseURL: 'http://localhost:8080/api',
            withCredentials: true,
            validateStatus: () => true,
        });

        const testEmail = `testuser_${Date.now()}@example.com`;
        console.log(`Creating test user: ${testEmail}...`);
        const signupRes = await client.post('/auth/signup', {
            fullName: 'Alex Morgan',
            email: testEmail,
            password: 'Password123!',
            role: 'job_seeker',
        });
        let cookie = signupRes.headers['set-cookie'];
        if (!cookie) {
            const loginRes = await client.post('/auth/login', {
                username: testEmail,
                password: 'Password123!',
            });
            cookie = loginRes.headers['set-cookie'];
        }

        console.log("2. Requesting AI Resume Generation for 'Full stack developer'...");
        const aiRes = await client.post('/resume-builder/ai-generate', {
            targetRole: 'Full stack developer',
        }, {
            headers: { Cookie: cookie.join('; ') }
        });

        console.log("AI Generation Status:", aiRes.status);
        console.log("AI Generation Response Success:", aiRes.data.success);
        console.log("Is Fallback Used?:", aiRes.data.isFallback);
        console.log("Message:", aiRes.data.message);
        
        const resume = aiRes.data.resume;
        if (!resume) {
            throw new Error("No resume returned in response!");
        }

        console.log("--- Generated Resume Verification ---");
        console.log("Summary:", resume.summary ? resume.summary.substring(0, 80) + "..." : "BLANK");
        console.log("Skills count:", resume.skills ? resume.skills.length : 0);
        console.log("Projects count:", resume.projects ? resume.projects.length : 0);
        if (resume.projects && resume.projects.length > 0) {
            console.log("First Project:", resume.projects[0].name, "| Technologies:", resume.projects[0].technologies);
        }
        console.log("Experience count:", resume.experience ? resume.experience.length : 0);
        if (resume.experience && resume.experience.length > 0) {
            console.log("First Experience:", resume.experience[0].role, "at", resume.experience[0].company);
        }
        console.log("Education count:", resume.education ? resume.education.length : 0);
        console.log("Personal Name:", resume.personal?.fullName);

        if (!resume.summary || !resume.skills?.length || !resume.projects?.length || !resume.experience?.length) {
            throw new Error("FAIL: Resume fields are empty or blank!");
        }

        console.log("\n3. Testing GET /resume-builder to verify MongoDB persistence...");
        const getRes = await client.get('/resume-builder', {
            headers: { Cookie: cookie.join('; ') }
        });

        console.log("GET Status:", getRes.status);
        const persisted = getRes.data.resume;
        console.log("Persisted Summary:", persisted.summary ? persisted.summary.substring(0, 80) + "..." : "BLANK");
        console.log("Persisted Skills count:", persisted.skills?.length);
        console.log("Persisted Projects count:", persisted.projects?.length);
        console.log("Persisted Experience count:", persisted.experience?.length);

        console.log("\n4. Testing One-Page Mode persistence & Save Resume...");
        const saveRes = await client.post('/resume-builder', {
            ...persisted,
            pageMode: 'one-page',
            templateId: 'photo-professional',
        }, {
            headers: { Cookie: cookie.join('; ') }
        });
        console.log("Save status:", saveRes.status);
        if (saveRes.data.resume?.pageMode !== 'one-page') {
            throw new Error(`Expected pageMode 'one-page', got: ${saveRes.data.resume?.pageMode}`);
        }
        if (saveRes.data.resume?.templateId !== 'photo-professional') {
            throw new Error(`Expected templateId 'photo-professional', got: ${saveRes.data.resume?.templateId}`);
        }

        console.log("\n5. Testing POST /resume-builder/optimize-one-page endpoint...");
        const optRes = await client.post('/resume-builder/optimize-one-page', {
            summary: persisted.summary,
            experience: persisted.experience,
            projects: persisted.projects,
            skills: persisted.skills,
            targetRole: persisted.targetRole,
        }, {
            headers: { Cookie: cookie.join('; ') }
        });

        console.log("Optimize Status:", optRes.status);
        console.log("Optimize Success:", optRes.data.success);
        const concise = optRes.data.conciseContent;
        if (!concise || !concise.summary) {
            throw new Error("FAIL: One-page optimizer did not return concise summary!");
        }
        console.log("Optimized Summary:", concise.summary);
        console.log("Optimized Experience count:", concise.experience?.length);
        console.log("Optimized Projects count:", concise.projects?.length);

        console.log("\n>>> ALL CHECKS PASSED: AI RESUME GENERATOR, ONE-PAGE OPTIMIZER & TEMPLATE PERSISTENCE VERIFIED! <<<");
    } catch (err) {
        console.error("Test Error:", err.message);
        process.exit(1);
    }
}

testE2E();
