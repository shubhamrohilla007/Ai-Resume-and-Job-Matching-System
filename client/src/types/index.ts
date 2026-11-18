export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'job_seeker' | 'recruiter' | 'admin';
  avatarUrl?: string;
  googleId?: string;
  authProvider?: 'local' | 'google';
}

export interface Profile {
  _id?: string;
  fullName: string;
  phone?: string;
  education?: string;
  experience?: string;
  skills: string[];
  location?: string;
  linkedin?: string;
  github?: string;
}

export interface EducationItem {
  degree: string;
  college: string;
  year: string;
  cgpa: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface ProjectItem {
  name: string;
  technologies: string;
  description: string;
  link?: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  year: string;
}

export interface CustomSectionItem {
  title: string;
  content: string;
  items: string[];
}

export interface ResumeBuilderData {
  _id?: string;
  sourceResume?: string;
  sourceOriginalName?: string;
  templateId: string;
  careerCategory: string;
  targetRole: string;
  pageMode?: 'one-page' | 'multi-page';
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolioUrl?: string;
    photoUrl?: string;
  };
  summary: string;
  education: EducationItem[];
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  customSections: CustomSectionItem[];
  updatedAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: 'Fresher' | 'Entry Level' | 'Mid Level' | 'Senior Level';
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  salary: string;
  applicationUrl: string;
  isActive: boolean;
  trustScore?: number | null;
  trustStatus?: 'approved' | 'needs-review' | 'blocked';
  trustStatusLabel?: string;
  trustSignals?: string[];
  completenessScore?: number;
  auditedAt?: string;
  createdAt?: string;
  applicantCount?: number;
}

export interface JobApplication {
  _id: string;
  job: Job | any;
  applicant: { _id?: string; fullName?: string; email?: string } | string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeId?: string;
  matchScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  recruiterFeedback?: string;
  reviewedAt?: string;
  coverNote?: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'rejected';
  appliedAt: string;
}

export interface JobRecommendation extends Job {
  ruleScore: number | null;
  matchScore: number | null;
  aiScore: number | null;
  aiExplanation: string;
  aiRelatedSkills: Array<{ jobSkill: string; resumeEvidence: string }>;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  missingPreferred: string[];
  projectMatches: string[];
  matchingMode: 'hybrid' | 'ai-assisted' | 'rule-based' | 'rule-based-fallback';
  mandatoryRequirementsMet: boolean;
}

export interface AtsAnalysis {
  id?: string;
  resumeBuilderId?: string;
  originalName?: string;
  fileSize?: number;
  fileType?: string;
  atsScore: number;
  summary: string;
  extractedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendedJobs: string[];
  aiFeedback: string;
  analysisMode?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  platform: string;
  provider: string;
  category: string;
  discipline: string;
  duration: string;
  price: string;
  certificateAvailable: boolean;
  certificateType: string;
  level: string;
  skills: string[];
  description: string;
  enrollUrl: string;
  badge: string;
  rating: number;
  learnersCount: string;
}

export interface CourseRoadmapItem {
  phase: string;
  goal: string;
  duration: string;
}

export interface CourseRecommendations {
  discipline: string;
  trendingSkills: string[];
  recommendedCourses: Course[];
  learningRoadmap: CourseRoadmapItem[];
  aiRationale: string;
}
