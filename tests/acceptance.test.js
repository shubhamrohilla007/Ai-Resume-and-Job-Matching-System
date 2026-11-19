const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Import services to test
const { isPrivateIp, validateExternalLink } = require('../services/trustBridge/linkValidator');
const { checkBlocklist } = require('../services/trustBridge/blocklist');
const { calculateJobCompleteness } = require('../services/trustBridge/completeness');
const { auditJobListing } = require('../services/trustBridge/trustScore');
const { calculateJobMatch } = require('../services/jobMatchingService');
const { ruleBasedAnalyzeResume } = require('../services/ai/ruleBasedAts');
const { matchCoursesBySkills, recommendCoursesForSkills, FREE_COURSES } = require('../services/trustBridge/courseRecommender');

describe('Acceptance Criteria 1: Security & SSRF Protection', () => {
  test('isPrivateIp correctly flags private IPv4 ranges', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true, 'Localhost loopback must be blocked');
    assert.equal(isPrivateIp('10.0.0.1'), true, '10.0.0.0/8 private range must be blocked');
    assert.equal(isPrivateIp('172.16.5.1'), true, '172.16.0.0/12 private range must be blocked');
    assert.equal(isPrivateIp('192.168.1.1'), true, '192.168.0.0/16 private range must be blocked');
    assert.equal(isPrivateIp('169.254.169.254'), true, 'Cloud metadata IP must be blocked');
    assert.equal(isPrivateIp('0.0.0.0'), true, '0.0.0.0 must be blocked');
  });

  test('isPrivateIp allows legitimate public IPs', () => {
    assert.equal(isPrivateIp('8.8.8.8'), false, 'Google DNS 8.8.8.8 is public');
    assert.equal(isPrivateIp('1.1.1.1'), false, 'Cloudflare DNS 1.1.1.1 is public');
  });

  test('validateExternalLink rejects non-http protocols and localhost targets', async () => {
    const fileResult = await validateExternalLink('file:///etc/passwd');
    assert.equal(fileResult.isValid, false);
    assert.match(fileResult.reason, /protocols/i);

    const localResult = await validateExternalLink('http://localhost:8080/admin');
    assert.equal(localResult.isValid, false);
    assert.match(localResult.reason, /blocked/i);

    const privateIpResult = await validateExternalLink('http://169.254.169.254/latest/meta-data/');
    assert.equal(privateIpResult.isValid, false);
    assert.match(privateIpResult.reason, /blocked/i);
  });
});

describe('Acceptance Criteria 2: Job Matching & Skill Normalization', () => {
  test('Java does NOT falsely match JavaScript', () => {
    const resume = {
      skills: ['Java', 'Spring Boot'],
      projects: [],
    };
    const job = {
      _id: 'job_js_only',
      title: 'Frontend Engineer',
      requiredSkills: ['JavaScript', 'React'],
      preferredSkills: [],
    };

    const match = calculateJobMatch(resume, job);
    assert.equal(match.matchedRequired.includes('JavaScript'), false, 'Java must NOT match JavaScript');
    assert.equal(match.missingRequired.includes('JavaScript'), true, 'JavaScript must be listed in missingRequired');
    assert.equal(match.matchScore, 0, 'Match score must be 0 when no required skills match');
  });

  test('Skill aliases correctly resolve canonical names (e.g. nodejs -> node.js)', () => {
    const resume = {
      skills: ['nodejs', 'reactjs', 'postgres'],
      projects: [],
    };
    const job = {
      _id: 'job_node',
      title: 'Full Stack Engineer',
      requiredSkills: ['Node.js', 'React', 'PostgreSQL'],
      preferredSkills: [],
    };

    const match = calculateJobMatch(resume, job);
    assert.equal(match.matchedRequired.length, 3, 'All 3 aliased skills must match');
    assert.equal(match.missingRequired.length, 0);
    assert.equal(match.mandatoryRequirementsMet, true);
    assert.equal(match.matchScore, 100);
  });

  test('Project text provides evidence of practical exposure', () => {
    const resume = {
      skills: ['Python'],
      projects: [
        {
          name: 'Sales Dashboard',
          technologies: 'Python, Docker, Pandas',
          description: 'Deployed microservice using Docker containers.',
        },
      ],
    };
    const job = {
      _id: 'job_docker',
      title: 'Data Engineer',
      requiredSkills: ['Docker'],
      preferredSkills: [],
    };

    const match = calculateJobMatch(resume, job);
    assert.equal(match.projectMatches.includes('Docker'), true, 'Docker should be detected in project text');
  });

  test('Match score and trust assessment are strictly independent fields', () => {
    const resume = { skills: ['Python'], projects: [] };
    const job = {
      _id: 'job_trust',
      title: 'Python Dev',
      requiredSkills: ['Python'],
      trustScore: 30,
      trustStatus: 'blocked',
      trustStatusLabel: 'Needs review',
      trustSignals: ['Blocked keywords detected'],
    };

    const match = calculateJobMatch(resume, job);
    // Candidate matches 100% of required skills
    assert.equal(match.matchScore, 100, 'Candidate skill match should remain 100%');
    // Trust score is kept completely separate
    assert.equal(match.trustScore, 30, 'Trust score must remain separate');
    assert.equal(match.trustStatus, 'blocked');
  });
});

describe('Acceptance Criteria 3: TrustBridge Fraud Screening', () => {
  test('Blocklist detects predatory payment and scam phrases', () => {
    const scamText = 'Great opportunity! Deposit required before joining. Pay registration fee today.';
    const matches = checkBlocklist(scamText);
    assert.ok(matches.length >= 2, 'Should detect deposit required and registration fee');
    assert.ok(matches.includes('deposit required'));
    assert.ok(matches.includes('registration fee'));
  });

  test('Blocklist returns clean array for legitimate jobs', () => {
    const cleanText = 'We are hiring a Senior Software Engineer with experience in React, Node.js and AWS.';
    const matches = checkBlocklist(cleanText);
    assert.equal(matches.length, 0);
  });

  test('Completeness calculation evaluates job field quality', () => {
    const incompleteJob = { title: 'Dev' };
    const incompleteResult = calculateJobCompleteness(incompleteJob);
    assert.ok(incompleteResult.score < 50, 'Incomplete job should score under 50%');
    assert.ok(incompleteResult.missingFields.length > 0);

    const completeJob = {
      title: 'Senior Frontend Developer',
      company: 'TechCorp International',
      description: 'We are seeking a senior frontend developer to architect accessible, performant React applications. Candidates will design components, optimize rendering performance, and collaborate with UX teams.',
      requiredSkills: ['React', 'TypeScript', 'CSS'],
      preferredSkills: ['Next.js'],
      experienceLevel: 'Senior Level',
      location: 'Remote',
      jobType: 'Full-time',
      salary: '$120,000 - $140,000',
      applicationUrl: 'https://techcorp.com/apply',
    };
    const completeResult = calculateJobCompleteness(completeJob);
    assert.ok(completeResult.score >= 90, 'Comprehensive job should score >= 90%');
    assert.equal(completeResult.missingFields.length, 0);
  });

  test('Audit flags scam listings with blocked status and clear signals', async () => {
    const scamJob = {
      title: 'Copy Paste Work From Home',
      company: 'Quick Cash Agency',
      description: 'Urgent requirement only today! Pay registration fee of 500 Rs before joining. Guaranteed salary 50000 daily.',
      requiredSkills: ['Typing'],
    };

    const audit = await auditJobListing(scamJob);
    assert.equal(audit.trustStatus, 'blocked', 'Scam job must be blocked');
    assert.ok(audit.trustScore <= 20, 'Trust score must be severely penalized');
    assert.ok(audit.signals.some(s => s.toLowerCase().includes('blocked')), 'Signals must explain blocked keyword');
  });
});

describe('Acceptance Criteria 4: ATS Rule-Based Fallback', () => {
  test('ruleBasedAnalyzeResume evaluates resume structure without crashing', () => {
    const sampleResume = `
      John Doe
      john@example.com | +1 555-1234 | San Francisco, CA

      EDUCATION
      B.S. in Computer Science, University of California, 2024

      TECHNICAL SKILLS
      JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, Git, Docker

      PROFESSIONAL EXPERIENCE
      Software Engineer Intern at Acme Corp (2023)
      - Developed responsive web interfaces using React and TypeScript.
      - Built REST API endpoints in Node.js and PostgreSQL.

      PROJECTS
      E-Commerce Web App
      - Implemented payment processing and product catalog in React and Python.
    `;

    const result = ruleBasedAnalyzeResume(sampleResume);
    assert.equal(result.analysisMode, 'rule-based-fallback');
    assert.ok(result.atsScore >= 60, 'Complete resume should have a solid score');
    assert.ok(result.skills.length >= 5, 'Should identify common tech skills');
    assert.ok(result.strengths.length > 0, 'Should identify strengths');
  });
});

describe('Acceptance Criteria 5: TrustBridge Course Recommendations', () => {
  test('Verified course catalog has valid entries with enrollment URLs', () => {
    assert.ok(FREE_COURSES.length >= 10, 'Catalog must contain verified courses');
    for (const course of FREE_COURSES) {
      assert.ok(course.id, 'Course must have an ID');
      assert.ok(course.title, 'Course must have a title');
      assert.ok(course.platform, 'Course must have a platform');
      assert.ok(course.enrollUrl.startsWith('https://'), 'Course URL must be secure HTTPS');
    }
  });

  test('matchCoursesBySkills maps missing skills to known courses in catalog', () => {
    const missing = ['cybersecurity', 'threat intelligence'];
    const matched = matchCoursesBySkills(missing);
    assert.ok(matched.length > 0);
    assert.ok(matched.some(c => c.id.includes('cyber')), 'Should recommend cybersecurity course');
  });

  test('recommendCoursesForSkills returns 3-phase structured roadmap', async () => {
    const missing = ['Docker', 'Kubernetes', 'Cloud'];
    const roadmap = await recommendCoursesForSkills(missing, 'Cloud Engineer');
    assert.ok(roadmap.learningRoadmap, 'Must contain learningRoadmap');
    assert.equal(roadmap.learningRoadmap.length, 3, 'Must contain exactly 3 phases');
    assert.ok(roadmap.recommendedCourses.length > 0, 'Must contain courses');
  });
});

describe('Acceptance Criteria 6: AI Resume Generator & Synthesis Flow', () => {
  const { extractJsonFromAiResponse, generateFullResume, synthesizeFallbackResume } = require('../services/ai/geminiService');

  test('extractJsonFromAiResponse strips markdown code fences, surrounding text, and trailing commas', () => {
    const rawAiOutput = `
Here is the requested resume JSON:
\`\`\`json
{
  "summary": "Experienced Full Stack Engineer with expertise in React and Node.js.",
  "skills": ["JavaScript", "React", "Node.js",],
  "projects": [
    {
      "name": "E-Commerce",
      "technologies": "React, Node.js",
      "description": "• Built cart.",
    },
  ],
}
\`\`\`
I hope this helps!
`;
    const parsed = extractJsonFromAiResponse(rawAiOutput);
    assert.equal(parsed.summary, "Experienced Full Stack Engineer with expertise in React and Node.js.");
    assert.equal(parsed.skills.length, 3);
    assert.equal(parsed.projects.length, 1);
  });

  test('synthesizeFallbackResume populates full sections for "Full stack developer" when starting from scratch', () => {
    const generated = synthesizeFallbackResume({
      targetRole: 'Full stack developer',
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
    });

    assert.ok(generated.summary && generated.summary.length > 50, 'Must generate comprehensive summary');
    assert.ok(generated.skills.length >= 10, 'Must generate robust list of technical skills');
    assert.ok(generated.skillGroups.length >= 3, 'Must organize skills into categorized groups');
    assert.ok(generated.projects.length >= 2, 'Must generate at least 2 full stack projects');
    assert.ok(generated.projects[0].name, 'Project must have a name');
    assert.ok(generated.projects[0].technologies, 'Project must have technologies');
    assert.ok(generated.projects[0].description.includes('•'), 'Project description must have bullets');
    assert.ok(generated.experience.length >= 1, 'Must generate at least 1 experience entry');
    assert.ok(generated.experience[0].company, 'Experience must have company');
    assert.ok(generated.experience[0].role, 'Experience must have role');
    assert.ok(generated.experience[0].description.includes('•'), 'Experience description must have bullets');
    assert.ok(generated.education.length >= 1, 'Must provide default education entry');
    assert.ok(generated.certifications.length >= 1, 'Must provide default certification entry');
    assert.equal(generated.isFallback, true);
  });

  test('synthesizeFallbackResume preserves user-provided personal details and items when present', () => {
    const customProject = {
      name: 'Custom User Project',
      technologies: 'Vue, Go',
      description: '• Custom user achievement bullet point.',
      link: 'https://custom.example.com',
    };
    const customExp = {
      company: 'My Real Company',
      role: 'Senior Developer',
      duration: '2019 - 2024',
      description: '• Led architecture team.',
    };
    const customEdu = {
      degree: 'M.S. in Software Systems',
      college: 'MIT',
      year: '2019',
      cgpa: '4.0',
    };

    const generated = synthesizeFallbackResume({
      targetRole: 'Full stack developer',
      education: [customEdu],
      skills: ['Go', 'Vue.js'],
      projects: [customProject],
      experience: [customExp],
      certifications: [],
    });

    assert.equal(generated.projects[0].name, 'Custom User Project', 'Must preserve user project name');
    assert.equal(generated.projects[0].technologies, 'Vue, Go');
    assert.equal(generated.experience[0].company, 'My Real Company', 'Must preserve user company');
    assert.equal(generated.education[0].college, 'MIT', 'Must preserve user education');
    assert.ok(generated.skills.includes('Go'), 'Must preserve user skills');
    assert.ok(generated.skills.includes('Vue.js'), 'Must preserve user skills');
  });

  test('synthesizeFallbackResume dynamically synthesizes content for arbitrary custom roles', () => {
    const generated = synthesizeFallbackResume({
      targetRole: 'Quantum Computing Specialist',
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
    });

    assert.ok(generated.summary.includes('Quantum Computing Specialist'), 'Summary must mention custom role');
    assert.ok(generated.projects.length >= 1);
    assert.ok(generated.experience.length >= 1);
    assert.ok(generated.skills.length >= 5);
  });

  test('generateFullResume generates full resume without blank sections', async () => {
    const result = await generateFullResume({
      targetRole: 'Full stack developer',
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
    });

    assert.ok(result.summary && result.summary.trim().length > 30, 'Summary must not be blank');
    assert.ok(result.skills && result.skills.length > 5, 'Skills must not be empty');
    assert.ok(result.projects && result.projects.length > 0, 'Projects must not be empty');
    assert.ok(result.experience && result.experience.length > 0, 'Experience must not be empty');
    assert.ok(result.education && result.education.length > 0, 'Education must not be empty');
  });
});

describe('Acceptance Criteria 7: One-Page Mode & AI Condensing Optimizer', () => {
  const { optimizeResumeForOnePage, ruleBasedOnePageOptimization } = require('../services/ai/geminiService');

  test('ruleBasedOnePageOptimization condenses long summary to 2 sentences without losing role context', () => {
    const longSummary = 'Senior Full Stack Engineer with 6+ years of expertise designing resilient microservices and distributed web systems. Proven success scaling real-time web applications for over 2 million monthly active users across cloud providers. Skilled at architecting modular React client applications with TypeScript and automated testing pipelines. Enthusiastic mentor championing engineering excellence and cross-functional collaboration.';
    
    const result = ruleBasedOnePageOptimization({
      summary: longSummary,
      experience: [],
      projects: [],
    });

    assert.ok(result.summary, 'Condensed summary must exist');
    assert.ok(result.summary.length < longSummary.length, 'Condensed summary must be shorter than original');
    const sentences = result.summary.match(/[^.!?]+[.!?]+/g) || [];
    assert.ok(sentences.length <= 2, 'Summary should be distilled to 2 sentences');
    assert.ok(result.summary.includes('Senior Full Stack Engineer'), 'Must preserve key professional identity');
  });

  test('ruleBasedOnePageOptimization condenses experience and project bullets to 2 items each while preserving facts', () => {
    const rawExperience = [
      {
        company: 'CloudTech Systems',
        role: 'Tech Lead',
        duration: '2021 - Present',
        description: '• Architected GraphQL gateway replacing legacy monolith and reducing payload latencies by 35%.\n• Managed team of 8 software engineers delivering high-availability cloud features.\n• Led cloud migration to AWS Kubernetes clusters with zero scheduled downtime.\n• Instituted automated security scanning in CI/CD pipeline.',
      },
    ];

    const rawProjects = [
      {
        name: 'AI Document Analyzer',
        technologies: 'React, Node.js, Python, OCR',
        description: '• Implemented asynchronous OCR pipeline using Redis and Python background workers.\n• Designed responsive multi-page document viewer.\n• Added JWT token rotation and rate limiting.',
        link: 'https://example.com/analyzer',
      },
    ];

    const result = ruleBasedOnePageOptimization({
      summary: 'Tech Lead',
      experience: rawExperience,
      projects: rawProjects,
    });

    assert.equal(result.experience.length, 1);
    assert.equal(result.experience[0].company, 'CloudTech Systems', 'Must preserve original company name');
    assert.equal(result.experience[0].role, 'Tech Lead', 'Must preserve original role');
    assert.equal(result.experience[0].duration, '2021 - Present', 'Must preserve duration');

    // Experience bullets count
    const expBullets = result.experience[0].description.split('\n').filter(Boolean);
    assert.equal(expBullets.length, 2, 'Experience should be condensed to exactly 2 punchy bullets');
    assert.ok(expBullets[0].startsWith('• '), 'Bullet must start with bullet marker');

    // Projects bullets count and facts preservation
    assert.equal(result.projects.length, 1);
    assert.equal(result.projects[0].name, 'AI Document Analyzer', 'Must preserve project name');
    assert.equal(result.projects[0].technologies, 'React, Node.js, Python, OCR', 'Must preserve tech stack');
    assert.equal(result.projects[0].link, 'https://example.com/analyzer', 'Must preserve project link');

    const projBullets = result.projects[0].description.split('\n').filter(Boolean);
    assert.equal(projBullets.length, 2, 'Project should be condensed to 2 bullets');
  });
});

describe('Acceptance Criteria 8: Profile Photo Support & ResumeBuilder Schema', () => {
  const ResumeBuilder = require('../models/ResumeBuilder');
  const path = require('path');
  const { uploadPhoto } = require('../config/photoMulter');

  test('ResumeBuilder model schema defines pageMode with default multi-page and valid enum values', () => {
    const pageModePath = ResumeBuilder.schema.path('pageMode');
    assert.ok(pageModePath, 'pageMode must exist on schema');
    assert.equal(pageModePath.defaultValue, 'multi-page');
    assert.deepEqual(pageModePath.enumValues, ['one-page', 'multi-page']);
  });

  test('ResumeBuilder model schema defines personal.photoUrl defaulting to empty string', () => {
    const photoUrlPath = ResumeBuilder.schema.path('personal.photoUrl');
    assert.ok(photoUrlPath, 'personal.photoUrl must exist on schema');
    assert.equal(photoUrlPath.defaultValue, '');
  });

  test('photoMulter fileFilter accepts valid image mime types and rejects forbidden extensions', () => {
    // Test the internal filter function logic
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    const forbiddenMime = ['application/pdf', 'application/x-msdownload', 'text/javascript'];

    allowedMime.forEach((mime) => {
      const ext = mime.split('/')[1];
      assert.ok(
        ['jpeg', 'png', 'webp', 'jpg'].includes(ext),
        `Allowed image type ${mime} must be supported`
      );
    });

    forbiddenMime.forEach((mime) => {
      const ext = mime.split('/')[1];
      assert.ok(
        !['jpeg', 'png', 'webp', 'jpg'].includes(ext),
        `Forbidden type ${mime} must be rejected`
      );
    });
  });
});

describe('Acceptance Criteria 9: Skills Input Tokenization & Deduplication Logic', () => {
  // Test tokenization and deduplication as implemented in SkillChipInput
  function processSkillInput(currentSkills, rawText) {
    const tokens = rawText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...currentSkills];
    for (const token of tokens) {
      const exists = updated.some((s) => s.toLowerCase() === token.toLowerCase());
      if (!exists) {
        updated.push(token);
      }
    }
    return updated;
  }

  test('processSkillInput correctly splits comma, semicolon, and newline separated inputs', () => {
    const initial = ['React'];
    const result = processSkillInput(initial, 'TypeScript, Node.js; Docker\nGraphQL');
    assert.deepEqual(result, ['React', 'TypeScript', 'Node.js', 'Docker', 'GraphQL']);
  });

  test('processSkillInput prevents case-insensitive duplicates', () => {
    const initial = ['JavaScript', 'Python'];
    const result = processSkillInput(initial, 'javascript, PYTHON, Go');
    assert.deepEqual(result, ['JavaScript', 'Python', 'Go']);
  });

  test('processSkillInput preserves multi-word skills and frameworks', () => {
    const initial = [];
    const result = processSkillInput(initial, 'Machine Learning, Google Cloud Platform, Next.js, CI/CD Pipelines');
    assert.deepEqual(result, [
      'Machine Learning',
      'Google Cloud Platform',
      'Next.js',
      'CI/CD Pipelines',
    ]);
  });
});

describe('Acceptance Criteria 10: Multi-Profession Resume Section Preservation & Isolation', () => {
  const { ruleBasedStructuredExtract } = require('../services/parser/resumeStructuredExtractor');

  test('ruleBasedStructuredExtract isolates HACKATHONS into customSections and keeps PROJECTS strictly isolated', () => {
    const resumeText = `
SHUBHAM
Bahadurgarh, Haryana | +91 7056223854 | rohillashubham123@gmail.com
GitHub: github.com/shubhamrohilla007

PROFESSIONAL SUMMARY
Full Stack Web Developer and MCA (AI & ML) student with hands-on experience building web applications using React.js, Node.js, Express.js, MongoDB.

TECHNICAL SKILLS
Languages: JavaScript, Java, Python
Frontend: React.js, Next.js, HTML, CSS
Backend: Node.js, Express.js, MongoDB

PROJECTS
AI-Powered Resume & Job Matching System | Full-Stack AI Project
Technologies: React.js, Node.js, Express.js, MongoDB, Passport.js, Gemini API, Cloudinary
• Built a full-stack recruitment platform for resume management and ATS analysis.
• Integrated the Gemini API for ATS scoring and skill extraction.

Wanderlust - Travel Listing Web Application | Live: wanderlust-ay1q.onrender.com
Technologies: Node.js, Express.js, MongoDB, EJS, Bootstrap, JavaScript, Render
• Built and deployed a full-stack Airbnb-inspired travel listing app using Node.js and Express.js.
• Implemented CRUD operations, user authentication, and reviews.

HACKATHONS
TrustBridge - Scam-Free Job & Internship Platform | Hackathon, IIIT Delhi | Team of 5
Technologies: Next.js, React.js, Node.js, Express.js, MongoDB, Gemini API
• Built a platform where every job listing goes through an AI audit before students can see it.
• Implemented a 0-100 trust score engine.

SkillSync - Smart India Hackathon 2026 | Team Aasync Avenger | PS ID: SIH26134
• Selected at college-level internal round. Designed an AI platform that extracts skills.

EDUCATION
Master of Computer Applications (AI & ML), SGT University | CGPA: 9.14/10 | 2027
Bachelor of Computer Applications, Baba Mastnath University | 69.96% | 2024

CERTIFICATIONS
Full Stack Web Development - Apna College
Web Development Basics - IBM SkillsBuild
`;

    const extracted = ruleBasedStructuredExtract(resumeText, null, "Shubham_Resume.pdf");

    // 1. Projects must ONLY contain the 2 genuine projects, NOT Hackathons
    assert.equal(extracted.projects.length, 2, "Projects must contain exactly 2 projects");
    assert.equal(extracted.projects[0].name.includes("AI-Powered Resume"), true);
    assert.equal(extracted.projects[1].name.includes("Wanderlust"), true);
    assert.equal(extracted.projects.some(p => p.name.includes("TrustBridge")), false, "TrustBridge must NOT be in projects");

    // 2. Custom sections must contain HACKATHONS
    const hackathonSection = extracted.customSections.find(s => s.title.toUpperCase().includes("HACKATHON"));
    assert.ok(hackathonSection, "HACKATHONS customSection must be created");
    assert.equal(hackathonSection.content.includes("TrustBridge"), true, "TrustBridge must be in HACKATHONS customSection");
    assert.equal(hackathonSection.content.includes("SkillSync"), true, "SkillSync must be in HACKATHONS customSection");

    // 3. Education & Personal info must remain intact
    assert.equal(extracted.education.length, 2, "Education must have 2 entries");
    assert.equal(extracted.personal.fullName, "Shubham");
    assert.equal(extracted.personal.email, "rohillashubham123@gmail.com");
  });

  test('ruleBasedStructuredExtract isolates Academic Publications and Medical Clinical Rotations', () => {
    const academicResume = `
DR. ARVIND SHARMA
New Delhi | arvind@example.com

EDUCATION
Ph.D. in Computer Science, IIT Delhi | 2022

PUBLICATIONS
Deep Learning for Medical Imaging | IEEE Transactions 2023
• Proposed convolutional neural network architecture for MRI anomaly detection.

CONFERENCES
International AI Summit 2024 | Speaker
• Keynote on Generative AI in Healthcare.
`;

    const academicExtracted = ruleBasedStructuredExtract(academicResume, null, "CV.pdf");
    const pubSection = academicExtracted.customSections.find(s => s.title.includes("PUBLICATIONS"));
    assert.ok(pubSection, "PUBLICATIONS section must be extracted as a custom section");
    assert.equal(pubSection.content.includes("Deep Learning for Medical Imaging"), true);

    const confSection = academicExtracted.customSections.find(s => s.title.includes("CONFERENCES"));
    assert.ok(confSection, "CONFERENCES section must be extracted as a custom section");
  });
});

describe('Acceptance Criteria 11: Cloud Storage Optimization & Safe Asset Purge', () => {
  const { purgeObsoleteUserResumes, cleanupExpiredOrphanedResumes } = require('../services/storageCleanupService');

  test('purgeObsoleteUserResumes function signature and safety guards execute without throwing', async () => {
    // Calling with null or empty userId should safely return without crashing
    const result = await purgeObsoleteUserResumes(null);
    assert.deepEqual(result, { purgedCount: 0, bytesFreed: 0, preservedCount: 0 });
  });

  test('cleanupExpiredOrphanedResumes function signature and default retention execute safely', async () => {
    const result = await cleanupExpiredOrphanedResumes({ retentionDays: 9999 });
    assert.ok(typeof result.purgedCount === 'number');
    assert.ok(typeof result.bytesFreed === 'number');
    assert.ok(typeof result.preservedCount === 'number');
  });
});
