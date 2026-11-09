const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const assert = require('node:assert/strict');

const BASE_URL = 'http://localhost:8080/api';

async function runAtsBuilderSyncTests() {
    console.log("=== Starting ATS & Resume Builder Synchronization Test Suite ===\n");

    const client = axios.create({
        baseURL: BASE_URL,
        withCredentials: true,
        validateStatus: () => true,
    });

    // Setup Test User 1
    const user1Email = `user1_${Date.now()}@example.com`;
    console.log(`Setting up User 1: ${user1Email}...`);
    const signup1 = await client.post('/auth/signup', {
        fullName: 'Test User One',
        email: user1Email,
        password: 'Password123!',
        role: 'job_seeker',
    });
    assert.equal(signup1.status, 201, 'User 1 signup must succeed');
    const cookie1 = signup1.headers['set-cookie'].join('; ');

    // -------------------------------------------------------------
    // Test A: Upload and Edit
    // -------------------------------------------------------------
    console.log("\n--- Test A: Upload real PDF resume, scan ATS, and Edit in Resume Builder ---");
    const pdfPath = path.resolve(__dirname, '../uploads/resumes/1792605394302.pdf');
    assert.ok(fs.existsSync(pdfPath), `Sample PDF must exist at ${pdfPath}`);

    const formA = new FormData();
    formA.append('resume', fs.createReadStream(pdfPath), {
        filename: 'Shubham_Resume.pdf',
        contentType: 'application/pdf',
    });

    const uploadResA = await client.post('/resume/upload', formA, {
        headers: { ...formA.getHeaders(), Cookie: cookie1 },
    });

    assert.equal(uploadResA.status, 200, 'Upload must succeed with 200');
    assert.equal(uploadResA.data.success, true, 'Upload response must be success: true');
    assert.ok(uploadResA.data.resume.id, 'Upload must return resume ID');
    assert.equal(uploadResA.data.resume.originalName, 'Shubham_Resume.pdf', 'Must preserve uploaded filename');

    const resumeAId = uploadResA.data.resume.id;
    console.log(`Resume A uploaded. ID: ${resumeAId}, ATS Score: ${uploadResA.data.resume.atsScore}%`);

    // Simulate clicking "Edit in Resume Builder"
    console.log(`Simulating click 'Edit in Resume Builder' (GET /resume-builder?resumeId=${resumeAId})...`);
    const builderResA = await client.get(`/resume-builder?resumeId=${resumeAId}`, {
        headers: { Cookie: cookie1 },
    });

    assert.equal(builderResA.status, 200, 'Builder get must return 200');
    assert.equal(builderResA.data.success, true);
    const builderResumeA = builderResA.data.resume;

    console.log("Builder Loaded Personal Name:", builderResumeA.personal?.fullName);
    console.log("Builder Loaded Email:", builderResumeA.personal?.email);
    console.log("Builder Loaded Target Role:", builderResumeA.targetRole);
    console.log("Builder Source Document Name:", builderResumeA.sourceOriginalName);
    console.log("Builder Skills Count:", builderResumeA.skills?.length);
    console.log("Builder Projects Count:", builderResumeA.projects?.length);
    console.log("Builder Education Count:", builderResumeA.education?.length);

    // Verify candidate identity from Shubham_Resume.pdf
    assert.equal(builderResumeA.personal.fullName.toLowerCase(), 'shubham', 'Candidate name must match uploaded document');
    assert.equal(builderResumeA.personal.email, 'rohillashubham123@gmail.com', 'Candidate email must match uploaded document');
    assert.equal(builderResumeA.sourceOriginalName, 'Shubham_Resume.pdf', 'Source original name must be preserved');
    assert.ok(builderResumeA.skills.length >= 1, 'Skills must be populated from uploaded document');
    assert.ok(builderResumeA.skills.some(s => s.includes(':')), 'Skills must preserve categorized structure');
    assert.ok(builderResumeA.projects.length >= 2, 'Projects must be populated from uploaded document');
    assert.ok(builderResumeA.education.length >= 1, 'Education must be populated from uploaded document');

    console.log(">>> Test A PASSED: Uploaded resume content synchronized faithfully to Resume Builder!");

    // -------------------------------------------------------------
    // Test B: Multiple Resumes
    // -------------------------------------------------------------
    console.log("\n--- Test B: Upload second resume, verify both open correct records and do not mix ---");
    
    // Create a second test PDF buffer representing Jane Doe
    const pdfPathB = path.resolve(__dirname, '../uploads/resumes/1786034780525.pdf');
    const formB = new FormData();
    formB.append('resume', fs.createReadStream(pdfPathB), {
        filename: 'Jane_Doe_Resume.pdf',
        contentType: 'application/pdf',
    });

    const uploadResB = await client.post('/resume/upload', formB, {
        headers: { ...formB.getHeaders(), Cookie: cookie1 },
    });

    assert.equal(uploadResB.status, 200, 'Second upload must succeed');
    const resumeBId = uploadResB.data.resume.id;
    assert.notEqual(resumeAId, resumeBId, 'Second resume must have a distinct unique ID');
    console.log(`Resume B uploaded. ID: ${resumeBId}, OriginalName: ${uploadResB.data.resume.originalName}`);

    // Verify resumes list endpoint returns both resumes
    const listRes = await client.get('/resume/list', { headers: { Cookie: cookie1 } });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.count, 2, 'User 1 must have exactly 2 uploaded resumes');
    console.log(`Verified user has ${listRes.data.count} uploaded resumes in list.`);

    // Open Resume A
    const openA = await client.get(`/resume-builder?resumeId=${resumeAId}`, { headers: { Cookie: cookie1 } });
    assert.equal(openA.status, 200);
    assert.equal(openA.data.resume.sourceOriginalName, 'Shubham_Resume.pdf', 'Resume A must still be Shubham');
    assert.equal(openA.data.resume.personal.fullName, 'Shubham');

    // Open Resume B
    const openB = await client.get(`/resume-builder?resumeId=${resumeBId}`, { headers: { Cookie: cookie1 } });
    assert.equal(openB.status, 200);
    assert.equal(openB.data.resume.sourceOriginalName, 'Jane_Doe_Resume.pdf', 'Resume B must be Jane_Doe_Resume.pdf');
    assert.notEqual(openA.data.resume._id, openB.data.resume._id, 'Resume A and Resume B builder documents must be distinct');

    console.log(">>> Test B PASSED: Multiple resumes coexist independently and data does NOT get mixed!");

    // -------------------------------------------------------------
    // Test C: Save and Reload
    // -------------------------------------------------------------
    console.log("\n--- Test C: Edit skills, summary, experience, save and reload ---");
    const updatedSummary = "Updated executive summary with 5+ years of distributed systems engineering.";
    const updatedSkills = ["TypeScript", "Golang", "Kubernetes", "GraphQL", "PostgreSQL", "Docker"];
    const updatedExperience = [
        {
            company: "Acme Cloud Infrastructure",
            role: "Principal Architect",
            duration: "2023 - Present",
            description: "• Architected multi-region Kubernetes clusters with 99.99% uptime.",
        },
    ];

    const saveRes = await client.post('/resume-builder', {
        _id: openA.data.resume._id,
        sourceResume: resumeAId,
        sourceOriginalName: 'Shubham_Resume.pdf',
        personal: {
            ...openA.data.resume.personal,
            phone: '+91 99999 88888',
            location: 'New Delhi, India',
        },
        targetRole: 'Lead Cloud Architect',
        summary: updatedSummary,
        skills: updatedSkills,
        experience: updatedExperience,
        education: openA.data.resume.education,
        projects: openA.data.resume.projects,
        certifications: openA.data.resume.certifications,
    }, {
        headers: { Cookie: cookie1 },
    });

    assert.equal(saveRes.status, 200, 'Save must return 200');
    assert.equal(saveRes.data.success, true);
    assert.equal(saveRes.data.resume.summary, updatedSummary);

    // Reload from server
    console.log("Reloading saved resume from server...");
    const reloadRes = await client.get(`/resume-builder?resumeId=${resumeAId}`, {
        headers: { Cookie: cookie1 },
    });
    assert.equal(reloadRes.status, 200);
    const reloaded = reloadRes.data.resume;

    assert.equal(reloaded.summary, updatedSummary, 'Summary edits must persist');
    assert.equal(reloaded.targetRole, 'Lead Cloud Architect', 'Target role edits must persist');
    assert.equal(reloaded.personal.phone, '+91 99999 88888', 'Phone edits must persist');
    assert.deepEqual(reloaded.skills, updatedSkills, 'Skill chips must persist');
    assert.equal(reloaded.experience[0].company, 'Acme Cloud Infrastructure', 'Experience edits must persist');
    assert.equal(reloaded.sourceOriginalName, 'Shubham_Resume.pdf', 'Original source name must remain associated');

    console.log(">>> Test C PASSED: Edits persist and resume stays linked to original upload!");

    // -------------------------------------------------------------
    // Test D: Error Handling & Ownership Security
    // -------------------------------------------------------------
    console.log("\n--- Test D: Error handling on invalid IDs and unauthorized access ---");
    
    // 1. Invalid ObjectId format
    const invalidIdRes = await client.get('/resume-builder?resumeId=not-a-valid-id', {
        headers: { Cookie: cookie1 },
    });
    assert.equal(invalidIdRes.status, 400, 'Invalid ID must return 400 Bad Request');
    assert.equal(invalidIdRes.data.success, false);

    // 2. Non-existent ObjectId
    const nonExistentId = '507f1f77bcf86cd799439011';
    const notFoundRes = await client.get(`/resume-builder?resumeId=${nonExistentId}`, {
        headers: { Cookie: cookie1 },
    });
    assert.equal(notFoundRes.status, 404, 'Non-existent resume must return 404');
    assert.equal(notFoundRes.data.success, false);

    // 3. Unauthorized access (User 2 trying to access User 1's resume)
    const user2Email = `user2_${Date.now()}@example.com`;
    const signup2 = await client.post('/auth/signup', {
        fullName: 'Hacker User',
        email: user2Email,
        password: 'Password123!',
        role: 'job_seeker',
    });
    const cookie2 = signup2.headers['set-cookie'].join('; ');

    const forbiddenRes = await client.get(`/resume-builder?resumeId=${resumeAId}`, {
        headers: { Cookie: cookie2 },
    });
    assert.equal(forbiddenRes.status, 403, 'Access to another user resume must return 403 Forbidden');
    assert.equal(forbiddenRes.data.success, false);

    console.log(">>> Test D PASSED: Error handling and ownership security enforced strictly!");

    // -------------------------------------------------------------
    // Test E: Regression Tests
    // -------------------------------------------------------------
    console.log("\n--- Test E: Regression (Direct builder access, AI generation, new resume) ---");

    // 1. Direct access to /resume-builder without query params
    const directRes = await client.get('/resume-builder', {
        headers: { Cookie: cookie1 },
    });
    assert.equal(directRes.status, 200, 'Direct builder access must succeed');
    assert.ok(directRes.data.resume, 'Must return active resume');

    // 2. Brand new user accessing builder for the first time
    const user3Email = `user3_${Date.now()}@example.com`;
    const signup3 = await client.post('/auth/signup', {
        fullName: 'New User Fresh',
        email: user3Email,
        password: 'Password123!',
        role: 'job_seeker',
    });
    const cookie3 = signup3.headers['set-cookie'].join('; ');

    const freshBuilderRes = await client.get('/resume-builder', {
        headers: { Cookie: cookie3 },
    });
    assert.equal(freshBuilderRes.status, 200);
    assert.equal(freshBuilderRes.data.resume.personal.fullName, 'New User Fresh', 'Must use new user name');
    assert.equal(freshBuilderRes.data.resume.summary, '', 'Must not contain demo summary for new user');

    // 3. AI Full Resume Generator still works seamlessly
    const aiRes = await client.post('/resume-builder/ai-generate', {
        targetRole: 'DevOps Engineer',
    }, {
        headers: { Cookie: cookie3 },
    });
    assert.equal(aiRes.status, 200);
    assert.ok(aiRes.data.resume.summary.length > 20, 'AI generator must populate summary');

    console.log(">>> Test E PASSED: Direct access, brand-new user, and AI generator work with zero regressions!");

    console.log("\n===============================================================================");
    console.log("ALL TESTS (A, B, C, D, E) PASSED SUCCESSFULLY! FULL DATA SYNC VERIFIED!");
    console.log("===============================================================================");
}

runAtsBuilderSyncTests().catch((err) => {
    console.error("Test Failure:", err.message);
    if (err.response) {
        console.error("Response data:", err.response.data);
    }
    process.exit(1);
});
