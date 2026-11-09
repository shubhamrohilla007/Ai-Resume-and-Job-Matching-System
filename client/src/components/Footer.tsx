import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Brain,
  FileCheck,
  Lock,
  GraduationCap,
  Briefcase,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer no-print">
      <div className="footer-inner">
        {/* Top 4-Column Grid */}
        <div className="footer-grid">
          {/* Col 1: Brand & Overview */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand">
              <div className="footer-logo">
                <FileText size={18} />
              </div>
              <span>AI Resume & Careers</span>
            </Link>
            <p className="footer-desc">
              Next-generation career platform featuring multi-profession ATS resume engineering,
              explainable AI candidate matching, TrustBridge fraud screening, and curated verified free courses.
            </p>
            <div className="footer-status-pill">
              <span className="footer-status-dot" />
              <span>TrustBridge Audit Engine Active</span>
            </div>
          </div>

          {/* Col 2: Resume Tools */}
          <div className="footer-col">
            <h3 className="footer-heading">Resume Tools</h3>
            <ul className="footer-links">
              <li>
                <Link to="/resume/builder">
                  <FileText size={14} /> Resume Builder
                </Link>
              </li>
              <li>
                <Link to="/resume/templates">
                  <Sparkles size={14} /> 6 Profession Templates
                </Link>
              </li>
              <li>
                <Link to="/resume/analysis">
                  <FileCheck size={14} /> ATS Keyword Scanner
                </Link>
              </li>
              <li>
                <Link to="/profile">
                  <ClipboardList size={14} /> Candidate Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Jobs & Applications */}
          <div className="footer-col">
            <h3 className="footer-heading">Jobs & Matching</h3>
            <ul className="footer-links">
              <li>
                <Link to="/jobs/recommended">
                  <Briefcase size={14} /> Match Jobs (Explainable Fit)
                </Link>
              </li>
              <li>
                <Link to="/applications">
                  <CheckCircle2 size={14} /> My Applications Tracker
                </Link>
              </li>
              <li>
                <Link to="/jobs">
                  <Briefcase size={14} /> Browse Verified Openings
                </Link>
              </li>
              <li>
                <Link to="/recruiter/jobs/new">
                  <Sparkles size={14} /> Post a Job (Recruiter)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Free Learning & Credentials */}
          <div className="footer-col">
            <h3 className="footer-heading">Free Learning</h3>
            <ul className="footer-links">
              <li>
                <Link to="/courses">
                  <GraduationCap size={14} /> Free Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Computer+Science">
                  <Brain size={14} /> Computer Science & AI
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Cloud+%26+DevOps">
                  <ShieldCheck size={14} /> Cloud & DevOps Tracks
                </Link>
              </li>
              <li>
                <Link to="/courses">
                  <ArrowRight size={14} /> IBM, Infosys & Swayam
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature & Security Badges Row */}
        <div className="footer-badges-section">
          <div className="footer-badges-label">Platform Trust & Verification Standards:</div>
          <div className="footer-badges-list">
            <span className="footer-badge">
              <Brain size={14} color="var(--primary)" /> Gemini AI Semantic Matching
            </span>
            <span className="footer-badge">
              <ShieldCheck size={14} color="var(--success)" /> TrustBridge Fraud & Scam Audited
            </span>
            <span className="footer-badge">
              <FileCheck size={14} color="var(--primary)" /> 6 Multi-Profession Formats
            </span>
            <span className="footer-badge">
              <Lock size={14} color="var(--slate-500)" /> SSRF Shielded External Verification
            </span>
            <span className="footer-badge">
              <GraduationCap size={14} color="var(--warning)" /> 100% Free Government & Enterprise Courses
            </span>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AI Resume & Careers Platform. All rights reserved.
          </div>
          <div className="footer-tech-stack">
            <span>Built with React 18, TypeScript, Express 5 & MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
