# AI-Powered Resume & Job Matching System

> **Cloud Architecture, React Modernization & TrustBridge Enterprise Edition**  
> A trust-aware, multi-profession career platform connecting ATS-optimized resumes with verified, scam-screened job opportunities. Powered by React 18, Node.js, Express, MongoDB Atlas, Cloudinary, Google Gemini AI, and Gmail SMTP.

---

## 🌟 Key Features & Architectural Highlights

### 1. Modern React Single-Page Application (Vite + TypeScript)
- Fully typed React 18 client located in `client/` built with Vite, TypeScript, and Lucide icons.
- **Universal Responsive Design:** Optimized for all screen viewports (Mobile, Tablet, Laptop, and 4K Displays).
- **Dark / Light Theme Engine:** Dynamic theme toggle with CSS custom properties and persistent user preference in `localStorage`.
- **Integrated Feedback System:** Built-in floating feedback modal allowing users to submit ratings (1-5 stars) and bug/feature reports directly to the admin dashboard.
- Serves the compiled production React bundle (`client/dist`) directly from Express in production while supporting Vite proxy workflow during development.

### 2. Multi-Profession Resume Template System & Live Builder
- **Decoupled Architecture:** One unified resume dataset seamlessly switchable across 6 profession-tailored templates:
  1. `ats-classic` — Strict single-column, high-scan ATS format for enterprise parsers.
  2. `tech-modern` — Tech stacks, GitHub repositories, systems architecture, and engineering metrics.
  3. `creative-portfolio` — Visual layout, portfolio URL badges, and creative campaign showcases.
  4. `business-professional` — Executive summary, leadership milestones, and business outcome metrics.
  5. `academic-cv` — Scholarly formatting, degrees, research appointments, grants, and publications.
  6. `fresher-minimal` — Project-driven layout for college students, internship candidates, and career changers.
- **Dual-Pane Live Editor:** Split-screen mode with instantaneous template preview, photo upload support, and single-page auto-condenser.
- **Reliable PDF Export:** Native print styling (`@page { size: A4 }`) allowing one-click **Save as PDF** in any browser.

### 3. Smart Apply Gate & ATS Match Synchronization
- **Synchronized Scoring Engine:** Dynamic semantic ATS compatibility scoring is strictly synchronized across:
  - Recommended Jobs Cards
  - Smart Apply Warning & Tailoring Modal
  - Recruiter's Candidate Applicant Review & Profile View
- **Interactive Full Tailored Resume Preview:** Live paper-sheet resume preview modal displaying AI-targeted summary, keyword alignment badges, STAR-formatted bullets, and bridge project proposals before application submission.
- **Re-application & Score Boost:** Existing applicants who tailor their resume for a position automatically have their profile, skills, and ATS match score synchronized without duplicate application errors.

### 4. Recruiter Management & Automated Candidate Alerts
- **Recruiter Workflow:** Manage posted jobs, filter candidates by match score (>70%), and review tailored resumes.
- **Automated Email Notifications (Gmail SMTP):** When a recruiter updates candidate status (`Shortlisted`, `Reviewed`, `Rejected`), the system immediately sends a branded email alert with the recruiter's custom interview notes/feedback.

### 5. Preserved & Improved ATS Resume Analysis
- Supports PDF and DOC/DOCX resume file uploads (up to 5MB) via Multer, `pdf-parse`, and `mammoth`.
- **Cloud-Ready Storage:** Uploaded files and photos stream securely to Cloudinary with private signed delivery links.
- **Gemini AI Integration:** Multi-model cascade (`gemini-flash-lite-latest` → `gemini-1.5-flash` → `gemini-1.5-pro`).
- **Rule-Based Fallback Engine:** If Gemini API is unreachable or quota is exhausted, the system automatically runs an intelligent rule-based structural ATS audit based on actual parsed text.

### 6. Selective TrustBridge Integration (Scam-Free Jobs & Learning)
- **Automated Scam Detection:** Detects upfront fees, payment-to-work scams, unrealistic salaries, and predatory MLMs.
- **SSRF-Protected Link Validation:** Prevents Server-Side Request Forgery by blocking loopback (`127.0.0.1`), localhost, cloud metadata (`169.254.169.254`), and private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Strict Score Independence:** Job-Match Score (candidate fit) and Job-Trust Score (employer legitimacy) remain completely independent.
- **Skill-Gap Course Recommendations:** 16 verified 100% free enterprise courses from IBM SkillsBuild, Infosys Springboard, Swayam / NPTEL, Harvard CS50, and Kaggle.

### 7. Dedicated Enterprise Admin Dashboard
A professional, role-guarded SaaS dashboard with 9 operational modules:
1. **Platform Overview:** Real-time metrics for users, jobs, applications, average ATS scores, and 7-day registration/application charts.
2. **User Management:** Paginated user directory with real-time search, role filter, role reassignment (Candidate / Recruiter / Admin), account active/suspend toggle, and user deletion.
3. **Recruiter Directory:** Dedicated recruiter monitoring with active listings and applicant tallies.
4. **Job Moderation & TrustBridge:** Listing management with instant active toggle, trust score audit badges, and trust status overrides (`approved`, `needs-review`, `blocked`).
5. **Resume & ATS Repository:** Paginated resume catalog with applicant metadata, calculated ATS match score badges, and secure file inspection links.
6. **Platform Applications:** Application tracker linking candidates, target jobs, recruiter employers, and status.
7. **Feedback & Bug Inbox:** Review platform user feedback, ratings (1-5 stars), issue categories, and manage resolution notes.
8. **Audit Activity Logs:** Tamper-evident admin action logs recording admin identity, target entity, timestamp, IP address, and one-click **Export to CSV**.
9. **System Diagnostics & Cloud Health:** Live connectivity health check for MongoDB Atlas, Cloudinary storage, Gemini AI, and Gmail SMTP.

---

## 🔐 Admin Account Creation & Management

To ensure security in production environments, default passwords and administrator credentials are **never hardcoded** in documentation or public configuration.

### 1. Create or Promote an Admin via CLI
You can initialize an administrator account or elevate an existing user to the `admin` role using the secure CLI script:

```bash
# Syntax: node scripts/createAdmin.js <email> <password> "<Full Name>"
node scripts/createAdmin.js your-admin-email@example.com "YourStrongPassword123!" "System Administrator"
```

Or configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in your `.env` file and run:
```bash
npm run seed:admin
```

### 2. Login Steps
1. Start the application (`npm run dev` or `npm start`).
2. Navigate to: **`/login`**
3. Enter your administrator email and chosen password.
4. Click **Sign In**.
5. Once authenticated, an **Admin Panel** link with a shield badge will appear in the top navigation bar, granting access to **`/admin`**.

> **Security Note:** Public registration (`/signup`) intentionally restricts roles to `job_seeker` and `recruiter`. The `admin` role can only be assigned through backend CLI seeding or by an existing admin from the Admin Dashboard.

---

## 🛡️ External Tool & API Defense (Postman, Hoppscotch, curl)

The application implements defense-in-depth against unauthorized access and privilege escalation from external tools:

| Vector | External Attack Attempt | Defense Implementation | Response |
| :--- | :--- | :--- | :--- |
| **Unauthenticated API Access** | Postman sending `GET /api/profile`, `GET /api/admin/overview`, etc. without session cookie | `requireAuth` middleware validates active session | `401 Unauthorized` `{ code: "UNAUTHORIZED" }` |
| **Privilege Escalation on Signup** | Postman `POST /api/auth/signup` with `{ "role": "admin" }` | Role whitelist in `authController.signup`: only `"job_seeker"` or `"recruiter"` permitted | Forced to `"job_seeker"` |
| **Profile Mass Assignment** | Postman `PUT /api/profile` with `{ "role": "admin" }` | `profileController.updateProfile` strips sensitive system keys (`role`, `isActive`, `googleId`, `email`) | Role is untouched |
| **Cross-Role Tampering** | Job seeker sending requests to `/api/recruiter/*` or `/api/admin/*` | `requireRole("recruiter")` and `requireRole("admin")` | `403 Forbidden` `{ code: "FORBIDDEN" }` |
| **Direct Resume Scraping** | Postman `GET /uploads/resumes/secret.pdf` | Direct static directory route explicitly guarded with HTTP 403 | `403 Forbidden` |
| **IDOR Resume Tampering** | User A requesting User B's resume via `GET /api/resume/download` | IDOR check validates candidate ownership or recruiter job application relationship | `404 Not Found` (Ownership Denied) |
| **Admin Self-Harm Protection** | Admin attempting to demote or delete their own account | `adminController` verifies `targetId !== req.user._id` and checks minimum active admin count | `400 Bad Request` |
| **Suspended Account Access** | Suspended user attempting to authenticate | `isActive === false` check in local login and Google OAuth strategy | `403 Forbidden` |

---

## ☁️ Cloud Database Policy: MongoDB Atlas Only

The application enforces a **Zero-Local-Database Policy**. Local MongoDB connections (`localhost`, `127.0.0.1`, `0.0.0.0`) are strictly rejected.

Configure your cloud MongoDB connection string in `.env` using **`ATLASDB`** or **`ATLASDB_URL`**:
```env
ATLASDB=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ai_resume_system?retryWrites=true&w=majority
```

If an attempt is made to configure a local database, the server will immediately throw:
```text
[Database] Security & Compliance Error: Local storage database is strictly disabled.
Only cloud-hosted MongoDB Atlas connections (mongodb+srv://... or *.mongodb.net) are permitted.
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server Port & Environment
PORT=8080
NODE_ENV=development

# MongoDB Atlas Cloud Database (Zero local fallback)
ATLASDB=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ai_resume_system?retryWrites=true&w=majority

# Session Encryption Secret (at least 32 characters)
SESSION_SECRET=your_super_secret_session_key_here_at_least_32_chars

# Cloudinary Cloud File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest

# Gmail SMTP for Candidate Alerts and Password Reset Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_16_character_app_password
SMTP_FROM="AI Resume System <your_email@gmail.com>"

# Google OAuth 2.0 Credentials (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
BACKEND_URL=http://localhost:8080

# Frontend URL for CORS
CLIENT_URL=http://localhost:5173
```

---

## 🏗️ Repository Layout

```text
AI-Powered-Resume-System/
├── client/                               # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/client.ts                 # Typed fetch client with credentials & adminApi
│   │   ├── components/                   # Navbar, Footer, SmartApplyModal, FeedbackModal, ThemeToggle
│   │   ├── context/                      # AuthContext.tsx & ThemeContext.tsx
│   │   ├── features/templates/           # 6 Multi-profession Resume Templates & Renderer
│   │   ├── pages/                        # Home, Auth, AdminDashboard, RecommendedJobs, RecruiterJobs
│   │   ├── types/index.ts                # TypeScript interfaces (Job, Application, Feedback, Diagnostics)
│   │   ├── App.tsx                       # React Router configuration & ProtectedRoute
│   │   ├── index.css                     # Design system, CSS variables & print PDF stylesheet
│   │   └── main.tsx                      # Vite React entrypoint
│   ├── package.json                      # Client dependencies (React 18, Lucide, Router)
│   ├── tsconfig.json                     # TypeScript configuration
│   └── vite.config.ts                    # Vite config with backend proxy
│
├── config/
│   ├── db.js                             # MongoDB Atlas connection (cloud-only enforcement)
│   ├── multer.js                         # MemoryStorage Multer with MIME validation
│   └── passport.js                       # Passport local & Google OAuth strategies
│
├── controllers/
│   └── api/
│       ├── adminController.js            # Admin management, metrics & AuditLog persistence
│       ├── authController.js             # Local & Google auth, password reset, session fixation defense
│       ├── feedbackController.js         # User feedback submission & admin resolution
│       ├── profileController.js          # Candidate profile CRUD
│       ├── resumeController.js           # Cloudinary file upload, ATS analysis, signed links
│       ├── resumeBuilderController.js    # Multi-template resume builder, photos & AI polish
│       ├── jobController.js              # Job matching, recruiter posting, ATS match scoring
│       └── courseController.js           # Verified courses & learning roadmap
│
├── middleware/
│   └── apiAuth.js                        # requireAuth, requireRole, requireAnyRole guards
│
├── models/
│   ├── User.js                           # User schema with isActive, roles, reset tokens
│   ├── AuditLog.js                       # Administrative actions & audit logging model
│   ├── Feedback.js                       # User ratings, feedback categories & admin resolution
│   ├── Job.js                            # Job schema with TrustBridge audit fields
│   ├── JobApplication.js                 # Job application link model with matchScore & recruiterFeedback
│   ├── Resume.js                         # Cloudinary resume metadata & ATS scan results
│   ├── ResumeBuilder.js                  # Multi-profession resume builder data
│   └── Profile.js                        # Candidate profile model
│
├── routes/
│   └── api.js                            # Centralized REST API router (including /api/admin & /api/feedback)
│
├── scripts/
│   ├── createAdmin.js                    # CLI admin seeder / promoter
│   ├── checkModels.js                    # Gemini API model verification utility
│   ├── migrate_mongo_to_atlas.js         # MongoDB to Atlas migration script
│   └── migrate_local_files_to_cloudinary.js # Uploads to Cloudinary migration utility
│
├── services/
│   ├── cloudinaryService.js              # Cloudinary upload, delete, and private signed URLs
│   ├── emailService.js                   # Gmail SMTP Nodemailer service with token encryption
│   ├── ai/geminiService.js               # Multi-model Gemini cascade & fallback engine
│   └── trustBridge/                      # Fraud screening, blocklist, and SSRF validator
│
├── tests/
│   ├── postman_external_security.test.js # External tool penetration tests (401, 403, IDOR)
│   ├── auth_authorization_atlas.test.js  # RBAC, self-protection, and Atlas persistence
│   ├── cloud_storage_and_atlas.test.js   # Cloudinary storage and Atlas cloud database
│   ├── password_reset_security.test.js   # 16 cryptographic reset token test cases
│   ├── next_level_upgrades.test.js       # ATS sync, AI role tailoring, and email alerts tests
│   ├── acceptance.test.js                # Core ATS and TrustBridge tests
│   └── ats_builder_sync_test.js          # ATS upload to Resume Builder synchronization
│
├── app.js                                # Express application setup, security headers, CORS, SPA static serve
├── server.js                             # Server startup with MongoDB Atlas connection
├── package.json                          # Backend scripts and dependencies
└── README.md                             # Comprehensive project documentation
```

---

## 🚀 Installation & Running

### 1. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix client
```

### 2. Seed Admin Account
```bash
node scripts/createAdmin.js your-admin-email@example.com "YourSecurePassword123!" "Admin Name"
```

### 3. Run in Development Mode
Start backend and React frontend concurrently:
```bash
# Terminal 1: Backend server (runs on http://localhost:8080)
npm run dev

# Terminal 2: React Vite client (runs on http://localhost:5173)
npm run dev:client
```
Visit **http://localhost:5173** (or **http://localhost:8080**) to use the application.

### 4. Build & Run in Production Mode
```bash
# Compile the React frontend into client/dist
npm run build

# Start the production Express server
npm start
```
The Express server serves the production React SPA directly at **http://localhost:8080**.

---

## ☁️ Deployment Guide (Render / Railway)

### Deploying to Render.com (Single Web Service)
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render.com](https://render.com).
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add the variables specified in the `.env` section above (`ATLASDB`, `SESSION_SECRET`, `CLOUDINARY_*`, `GEMINI_API_KEY`, `SMTP_*`, `CLIENT_URL`).
6. Click **Deploy Web Service**.

---

## 🧪 Comprehensive Automated Test Suites

The application includes automated verification suites covering security, cloud storage, authentication, ATS synchronization, and job matching:

```bash
# Run acceptance and upgrade tests (33 tests)
npm test

# Run external client security audit (SSRF, IDOR, privilege escalation)
npm run test:security

# Run all test suites
npm run test:all
```
