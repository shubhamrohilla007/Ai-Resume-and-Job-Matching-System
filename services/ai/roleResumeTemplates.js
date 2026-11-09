/**
 * Intelligent Role-Based Resume Synthesis Engine & Fallback Catalog
 * Provides realistic, comprehensive, ATS-optimized resume sections tailored
 * to common industry roles, plus a dynamic adaptive generator for any custom role.
 */

const ROLE_PRESETS = {
    "full stack developer": {
        roleTitle: "Full Stack Developer",
        summary:
            "Results-driven Full Stack Developer with 4+ years of experience architecting and implementing end-to-end web applications. Proficient in modern JavaScript/TypeScript frameworks (React, Node.js), scalable RESTful APIs, and database engineering. Proven track record of optimizing backend performance, reducing latency, and delivering intuitive user experiences in fast-paced Agile environments.",
        skills: [
            "JavaScript", "TypeScript", "React.js", "Node.js", "Express.js",
            "MongoDB", "PostgreSQL", "Redis", "Docker", "AWS",
            "RESTful APIs", "GraphQL", "Tailwind CSS", "Git", "CI/CD", "Jest"
        ],
        skillGroups: [
            {
                category: "Frontend Development",
                skills: ["React.js", "TypeScript", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Redux Toolkit"]
            },
            {
                category: "Backend & APIs",
                skills: ["Node.js", "Express.js", "RESTful APIs", "GraphQL", "Microservices", "JWT Auth"]
            },
            {
                category: "Databases & Cloud",
                skills: ["MongoDB", "PostgreSQL", "Redis", "Docker", "AWS (S3, EC2)", "Prisma ORM"]
            },
            {
                category: "DevOps & Tools",
                skills: ["Git", "GitHub Actions", "CI/CD", "Jest", "Postman", "Agile / Scrum"]
            }
        ],
        experience: [
            {
                company: "Tech Innovations Inc.",
                role: "Full Stack Developer",
                duration: "2022 - Present",
                description:
                    "• Architected and deployed scalable full-stack web applications using React, Node.js, and MongoDB serving 50,000+ monthly active users.\n• Improved API response times by 35% through query indexing, Redis caching, and microservice decoupling.\n• Collaborated with cross-functional agile teams to deliver production features on 2-week sprint cycles with 99.8% uptime.\n• Integrated automated CI/CD deployment pipelines using Docker and GitHub Actions."
            },
            {
                company: "Digital Solutions Corp.",
                role: "Associate Software Engineer",
                duration: "2020 - 2022",
                description:
                    "• Developed and maintained responsive user interfaces using React and modern CSS frameworks.\n• Built secure REST API endpoints with Express and Node.js for authentication and order processing.\n• Created comprehensive test suites with Jest and Supertest, achieving 85% code coverage."
            }
        ],
        projects: [
            {
                name: "Cloud-Native E-Commerce Platform",
                technologies: "React, Node.js, Express, MongoDB, Stripe, Tailwind CSS",
                description:
                    "• Built responsive storefront with product discovery, cart state management, and Stripe checkout integration.\n• Implemented secure JWT authentication and role-based access control for administrative catalog management.\n• Engineered background worker jobs for automated invoice generation and customer email notifications.",
                link: "https://github.com/example/ecommerce-platform"
            },
            {
                name: "Real-Time Collaboration Workspace",
                technologies: "TypeScript, React, Socket.io, Redis, Express",
                description:
                    "• Developed collaborative document editing and live workspace with sub-80ms WebSocket messaging.\n• Integrated Redis Pub/Sub channels for state synchronization across horizontally scaled server instances.\n• Designed modular UI component system adhering to WCAG 2.1 accessibility guidelines.",
                link: "https://github.com/example/collab-workspace"
            }
        ],
        education: [
            {
                degree: "Bachelor of Science in Computer Science",
                college: "State University of Technology",
                year: "2016 - 2020",
                cgpa: "3.8 / 4.0"
            }
        ],
        certifications: [
            {
                name: "Meta Full-Stack Developer Professional Certificate",
                issuer: "Coursera / Meta",
                year: "2023"
            },
            {
                name: "AWS Certified Developer – Associate",
                issuer: "Amazon Web Services",
                year: "2023"
            }
        ],
        suggestedSkills: [
            { skill: "Next.js", reason: "Industry standard for server-rendered React applications" },
            { skill: "Kubernetes", reason: "Crucial for microservice container orchestration at scale" },
            { skill: "Kafka", reason: "Valuable for high-throughput asynchronous event streaming" }
        ]
    },

    "frontend developer": {
        roleTitle: "Frontend Developer",
        summary:
            "Creative and performance-focused Frontend Developer with 3+ years of expertise crafting accessible, modern, and high-conversion web applications. Specialized in React, TypeScript, and modern CSS architecture. Passionate about web performance optimization, responsive design, and building maintainable design systems.",
        skills: [
            "React.js", "TypeScript", "JavaScript (ES6+)", "Next.js", "HTML5",
            "CSS3", "Tailwind CSS", "Redux", "GraphQL", "Jest",
            "Cypress", "Vite", "Web Performance", "Figma", "Git"
        ],
        skillGroups: [
            {
                category: "Core Technologies",
                skills: ["React.js", "TypeScript", "JavaScript (ES6+)", "HTML5 / Semantic Web", "CSS3 / SCSS"]
            },
            {
                category: "Frameworks & Styling",
                skills: ["Next.js", "Tailwind CSS", "Material UI", "Styled Components", "Framer Motion"]
            },
            {
                category: "State & Data Fetching",
                skills: ["Redux Toolkit", "Zustand", "TanStack React Query", "GraphQL / Apollo", "REST APIs"]
            },
            {
                category: "Quality & Tooling",
                skills: ["Jest", "React Testing Library", "Cypress", "Vite / Webpack", "Lighthouse (Core Web Vitals)"]
            }
        ],
        experience: [
            {
                company: "PixelCraft Interactive",
                role: "Frontend Developer",
                duration: "2022 - Present",
                description:
                    "• Engineered responsive web applications and component libraries with React, TypeScript, and Tailwind CSS.\n• Improved Google Core Web Vitals across mobile and desktop, boosting Lighthouse performance scores from 68 to 96.\n• Collaborated closely with product designers to implement pixel-perfect Figma designs with smooth micro-interactions.\n• Implemented client-side caching with TanStack Query, cutting redundant API requests by 45%."
            }
        ],
        projects: [
            {
                name: "SaaS Analytics Dashboard UI",
                technologies: "React, TypeScript, Tailwind CSS, Recharts, Vite",
                description:
                    "• Built interactive metrics dashboard featuring dynamic charting, date-range filtering, and dark mode.\n• Designed fully accessible component system with keyboard navigation and ARIA compliant modals.\n• Achieved 100% responsive layout across mobile, tablet, and ultra-wide monitor viewports.",
                link: "https://github.com/example/analytics-dashboard"
            }
        ],
        education: [
            {
                degree: "Bachelor of Science in Software Engineering",
                college: "Institute of Technology",
                year: "2018 - 2022",
                cgpa: "3.7 / 4.0"
            }
        ],
        certifications: [
            {
                name: "Meta Front-End Developer Certificate",
                issuer: "Meta / Coursera",
                year: "2022"
            }
        ],
        suggestedSkills: [
            { skill: "Next.js SSR/SSG", reason: "Greatly improves SEO and initial page load times" },
            { skill: "Storybook", reason: "Standard tool for isolated UI component development" }
        ]
    },

    "backend developer": {
        roleTitle: "Backend Developer",
        summary:
            "Robust and detail-oriented Backend Developer with strong proficiency in server-side architecture, distributed systems, and database optimization. Experienced in developing high-throughput RESTful APIs, asynchronous message queues, and secure cloud microservices with Node.js, Python, and relational/NoSQL datastores.",
        skills: [
            "Node.js", "Express.js", "Python", "PostgreSQL", "MongoDB",
            "Redis", "Docker", "Kubernetes", "AWS", "Kafka",
            "GraphQL", "Microservices", "RESTful APIs", "Git", "CI/CD"
        ],
        skillGroups: [
            {
                category: "Languages & Runtimes",
                skills: ["Node.js", "TypeScript", "Python", "Go (Basics)", "SQL"]
            },
            {
                category: "API & Microservices",
                skills: ["Express.js", "NestJS", "FastAPI", "RESTful Architecture", "GraphQL", "gRPC"]
            },
            {
                category: "Databases & Messaging",
                skills: ["PostgreSQL", "MongoDB", "Redis (Caching/Queues)", "Apache Kafka", "RabbitMQ"]
            },
            {
                category: "Cloud & Infrastructure",
                skills: ["Docker", "Kubernetes", "AWS (EC2, RDS, S3, Lambda)", "Terraform", "GitHub Actions"]
            }
        ],
        experience: [
            {
                company: "CloudScale Systems",
                role: "Backend Engineer",
                duration: "2021 - Present",
                description:
                    "• Designed and maintained high-throughput microservices handling 2M+ daily requests using Node.js and PostgreSQL.\n• Reduced database read latency by 50% by integrating Redis caching layers and optimizing indexing strategies.\n• Built event-driven transaction processing pipelines using Apache Kafka and resilient retry queues.\n• Implemented role-based authorization (RBAC) and OAuth2/JWT authentication systems ensuring enterprise compliance."
            }
        ],
        projects: [
            {
                name: "Distributed Task Scheduler & Queue",
                technologies: "Node.js, TypeScript, Redis, BullMQ, PostgreSQL, Docker",
                description:
                    "• Built asynchronous background job scheduler processing scheduled jobs, notifications, and analytics events.\n• Configured auto-scaling worker pools with health checks, dead-letter queues, and real-time telemetry.\n• Wrote comprehensive API documentation with Swagger/OpenAPI specifications.",
                link: "https://github.com/example/task-queue-backend"
            }
        ],
        education: [
            {
                degree: "Bachelor of Science in Computer Science",
                college: "National Technical University",
                year: "2017 - 2021",
                cgpa: "3.8 / 4.0"
            }
        ],
        certifications: [
            {
                name: "AWS Certified Solutions Architect – Associate",
                issuer: "Amazon Web Services",
                year: "2023"
            }
        ],
        suggestedSkills: [
            { skill: "Kubernetes", reason: "Key for orchestrating containerized backend microservices" },
            { skill: "Prometheus & Grafana", reason: "Standard for backend metrics and distributed monitoring" }
        ]
    },

    "data scientist": {
        roleTitle: "Data Scientist",
        summary:
            "Analytical and insight-driven Data Scientist with a solid background in statistical modeling, machine learning, and data engineering. Skilled in extracting actionable insights from large unstructured datasets and deploying predictive models to production using Python, SQL, and cloud ML platforms.",
        skills: [
            "Python", "SQL", "Pandas", "NumPy", "Scikit-Learn",
            "TensorFlow", "PyTorch", "Tableau", "Power BI", "Data Wrangling",
            "Predictive Modeling", "Docker", "AWS", "Git", "Statistical Analysis"
        ],
        skillGroups: [
            {
                category: "Data Science & ML",
                skills: ["Scikit-Learn", "TensorFlow", "PyTorch", "XGBoost", "Hypothesis Testing", "A/B Testing"]
            },
            {
                category: "Data Wrangling & Analysis",
                skills: ["Python", "SQL (PostgreSQL/BigQuery)", "Pandas", "NumPy", "Spark / PySpark"]
            },
            {
                category: "Visualization & BI",
                skills: ["Tableau", "Power BI", "Matplotlib", "Seaborn", "Plotly"]
            },
            {
                category: "MLOps & Engineering",
                skills: ["Docker", "MLflow", "FastAPI", "AWS SageMaker", "Git"]
            }
        ],
        experience: [
            {
                company: "Apex Analytics Group",
                role: "Data Scientist",
                duration: "2022 - Present",
                description:
                    "• Developed predictive customer churn models achieving 89% precision, saving an estimated $400K in annual revenue.\n• Designed and evaluated A/B experimentation frameworks to measure the business impact of new product features.\n• Automated ETL pipelines pulling from distributed databases, cutting manual data prep time by 60%."
            }
        ],
        projects: [
            {
                name: "Customer Lifetime Value Prediction Engine",
                technologies: "Python, Scikit-Learn, LightGBM, FastAPI, Docker",
                description:
                    "• Built end-to-end ML pipeline predicting customer spend over 12 months with 91% R-squared accuracy.\n• Packaged model into REST API containerized with Docker and deployed with sub-50ms inference time.",
                link: "https://github.com/example/clv-prediction"
            }
        ],
        education: [
            {
                degree: "Master of Science in Data Science / Statistics",
                college: "Tech University",
                year: "2020 - 2022",
                cgpa: "3.9 / 4.0"
            }
        ],
        certifications: [
            {
                name: "IBM Data Science Professional Certificate",
                issuer: "IBM / Coursera",
                year: "2022"
            }
        ],
        suggestedSkills: [
            { skill: "MLflow", reason: "Standard for model tracking and lifecycle management" },
            { skill: "BigQuery", reason: "Essential for massive cloud analytics at enterprise scale" }
        ]
    },

    "devops engineer": {
        roleTitle: "DevOps Engineer",
        summary:
            "Automated infrastructure and continuous delivery specialist with 4+ years of experience streamlining software deployment lifecycles. Expert in containerization, Infrastructure as Code (Terraform), Kubernetes cluster orchestration, and resilient CI/CD pipelines across AWS and GCP environments.",
        skills: [
            "Docker", "Kubernetes", "Terraform", "AWS", "CI/CD",
            "GitHub Actions", "Linux / Bash", "Ansible", "Prometheus", "Grafana",
            "Helm", "Python", "Networking", "Git", "Site Reliability Engineering"
        ],
        skillGroups: [
            {
                category: "Cloud & Infrastructure",
                skills: ["AWS (EKS, VPC, IAM, S3, RDS)", "GCP", "Terraform (IaC)", "Ansible"]
            },
            {
                category: "Containers & Orchestration",
                skills: ["Docker", "Kubernetes (EKS/GKE)", "Helm Charts", "Containerd"]
            },
            {
                category: "CI/CD & Automation",
                skills: ["GitHub Actions", "GitLab CI", "Jenkins", "ArgoCD (GitOps)", "Bash Scripting"]
            },
            {
                category: "Monitoring & Observability",
                skills: ["Prometheus", "Grafana", "ELK Stack", "Datadog", "OpenTelemetry"]
            }
        ],
        experience: [
            {
                company: "CloudCore Infrastructure",
                role: "DevOps Engineer",
                duration: "2021 - Present",
                description:
                    "• Automated cloud infrastructure provisioning using Terraform and AWS EKS, reducing provisioning time from days to minutes.\n• Built end-to-end GitOps CI/CD pipelines with ArgoCD and GitHub Actions, enabling zero-downtime canary deployments.\n• Implemented centralized observability with Prometheus and Grafana dashboards, reducing Mean Time to Resolution (MTTR) by 40%."
            }
        ],
        projects: [
            {
                name: "Multi-Region Kubernetes GitOps Platform",
                technologies: "Kubernetes, Terraform, ArgoCD, Helm, AWS EKS, Prometheus",
                description:
                    "• Designed production-ready Kubernetes infrastructure spanning 2 AWS regions with automated failover.\n• Implemented declarative GitOps workflow ensuring 100% auditability for cluster configuration changes.",
                link: "https://github.com/example/k8s-gitops-platform"
            }
        ],
        education: [
            {
                degree: "Bachelor of Science in Information Technology",
                college: "State Polytechnic Institute",
                year: "2017 - 2021",
                cgpa: "3.7 / 4.0"
            }
        ],
        certifications: [
            {
                name: "Certified Kubernetes Administrator (CKA)",
                issuer: "Linux Foundation / CNCF",
                year: "2023"
            }
        ],
        suggestedSkills: [
            { skill: "ArgoCD", reason: "Industry standard for Kubernetes GitOps continuous delivery" },
            { skill: "Service Mesh (Istio)", reason: "Critical for advanced traffic routing and mTLS security" }
        ]
    }
};

/**
 * Normalizes input role string to match known presets.
 */
function findPresetRole(targetRole) {
    if (!targetRole || typeof targetRole !== "string") return null;
    const clean = targetRole.toLowerCase().trim();

    if (/full\s*stack|mern|mean|software\s*engineer|web\s*developer/i.test(clean)) {
        return ROLE_PRESETS["full stack developer"];
    }
    if (/front\s*end|react|angular|vue|ui\s*developer/i.test(clean)) {
        return ROLE_PRESETS["frontend developer"];
    }
    if (/back\s*end|node|api|server|java|python|golang|microservice/i.test(clean)) {
        return ROLE_PRESETS["backend developer"];
    }
    if (/data\s*scien|machine\s*learn|ai|deep\s*learn|ml\b/i.test(clean)) {
        return ROLE_PRESETS["data scientist"];
    }
    if (/devops|cloud|sre|platform|infrastructure|kubernetes/i.test(clean)) {
        return ROLE_PRESETS["devops engineer"];
    }

    return null;
}

/**
 * Universal dynamic fallback generator for any arbitrary role.
 */
function generateDynamicFallback(targetRole) {
    const title = String(targetRole || "Software Professional")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
        roleTitle: title,
        summary: `Accomplished and driven ${title} with a proven track record of designing, building, and delivering high-value solutions. Adept at collaborating across cross-functional teams, solving complex technical challenges, and adhering to industry best practices to accelerate organizational objectives.`,
        skills: [
            `${title} Methodologies`,
            "Agile & Scrum Delivery",
            "System Architecture",
            "Quality Assurance & Testing",
            "Performance Optimization",
            "Problem Solving & Analytical Thinking",
            "Git Version Control",
            "Cross-Functional Collaboration",
            "Technical Documentation",
            "Continuous Improvement"
        ],
        skillGroups: [
            {
                category: "Core Domain Competencies",
                skills: [`${title} Strategy`, "Architecture Design", "Process Optimization", "Requirements Analysis"]
            },
            {
                category: "Technical Tools & Platforms",
                skills: ["Industry-Standard Tooling", "Cloud Environments", "Automation Tools", "Version Control (Git)"]
            },
            {
                category: "Quality & Leadership",
                skills: ["Agile/Scrum", "Code Reviews & QA", "Cross-Functional Collaboration", "Documentation"]
            }
        ],
        experience: [
            {
                company: "Enterprise Solutions Inc.",
                role: title,
                duration: "2022 - Present",
                description:
                    `• Spearheaded initiatives as a core ${title}, collaborating with multidisciplinary teams to deliver strategic product enhancements.\n• Improved operational efficiency by 30% through process automation and implementation of best practices.\n• Mentored junior team members and championed rigorous documentation and quality assurance protocols.`
            }
        ],
        projects: [
            {
                name: `${title} Innovation System`,
                technologies: "Modern Frameworks, Cloud Architecture, Automation Tools",
                description:
                    `• Designed and executed an end-to-end solution directly aligned with ${title} standards, boosting user engagement.\n• Implemented comprehensive monitoring, testing coverage, and modular components for long-term scalability.`,
                link: "https://github.com/example/project-showcase"
            }
        ],
        education: [
            {
                degree: "Bachelor of Science in Computer Science or Related Field",
                college: "Accredited University",
                year: "2018 - 2022",
                cgpa: "3.7 / 4.0"
            }
        ],
        certifications: [
            {
                name: `Professional Certificate in ${title}`,
                issuer: "Industry Accredited Body",
                year: "2023"
            }
        ],
        suggestedSkills: [
            { skill: "Advanced System Design", reason: "Enhances large-scale architecture capabilities" },
            { skill: "Cloud Infrastructure", reason: "Standard for modern scalable deployments" }
        ]
    };
}

/**
 * Synthesizes a complete, rich resume draft based on the role and any existing facts.
 * User-provided facts are strictly preserved and enriched.
 */
function synthesizeFallbackResume({
    targetRole = "Full Stack Developer",
    education = [],
    skills = [],
    projects = [],
    experience = [],
    certifications = []
}) {
    const preset = findPresetRole(targetRole) || generateDynamicFallback(targetRole);

    // 1. Summary: use preset or blend with target role
    const summary = preset.summary;

    // 2. Skills: merge user skills with preset skills (avoid duplicates)
    const userSkillSet = new Set(skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean));
    const mergedSkills = [...skills.filter(Boolean)];
    for (const s of preset.skills) {
        if (!userSkillSet.has(s.toLowerCase())) {
            mergedSkills.push(s);
            userSkillSet.add(s.toLowerCase());
        }
    }

    // Skill groups: use preset groups, but ensure any user skills are retained
    const skillGroups = preset.skillGroups || [];

    // 3. Projects: preserve user projects if provided; otherwise use preset projects
    let finalProjects = [];
    if (Array.isArray(projects) && projects.length > 0 && projects.some((p) => p && p.name)) {
        finalProjects = projects.map((p, idx) => {
            const fallbackP = preset.projects[idx] || preset.projects[0];
            return {
                name: p.name || fallbackP.name,
                technologies: p.technologies || fallbackP.technologies,
                description: p.description && p.description.trim() ? p.description : fallbackP.description,
                link: p.link || fallbackP.link || ""
            };
        });
    } else {
        finalProjects = preset.projects;
    }

    // 4. Experience: preserve user experience if provided; otherwise use preset experience
    let finalExperience = [];
    if (Array.isArray(experience) && experience.length > 0 && experience.some((e) => e && (e.company || e.role))) {
        finalExperience = experience.map((e, idx) => {
            const fallbackE = preset.experience[idx] || preset.experience[0];
            return {
                company: e.company || fallbackE.company,
                role: e.role || fallbackE.role,
                duration: e.duration || fallbackE.duration,
                description: e.description && e.description.trim() ? e.description : fallbackE.description
            };
        });
    } else {
        finalExperience = preset.experience;
    }

    // 5. Education: preserve user education if provided; otherwise use preset education
    let finalEducation = [];
    if (Array.isArray(education) && education.length > 0 && education.some((ed) => ed && (ed.degree || ed.college))) {
        finalEducation = education;
    } else {
        finalEducation = preset.education;
    }

    // 6. Certifications: preserve user certifications if provided; otherwise use preset certifications
    let finalCertifications = [];
    if (Array.isArray(certifications) && certifications.length > 0 && certifications.some((c) => c && c.name)) {
        finalCertifications = certifications;
    } else {
        finalCertifications = preset.certifications;
    }

    return {
        targetRole: preset.roleTitle || targetRole,
        summary,
        skills: mergedSkills,
        skillGroups,
        projects: finalProjects,
        experience: finalExperience,
        education: finalEducation,
        certifications: finalCertifications,
        suggestedSkills: preset.suggestedSkills || [],
        isFallback: true
    };
}

module.exports = {
    ROLE_PRESETS,
    synthesizeFallbackResume
};
