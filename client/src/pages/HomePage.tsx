import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Briefcase,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Brain,
  Download,
} from 'lucide-react';
import { TEMPLATES } from '../features/templates/templateList';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem 4rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
          border: '1px solid var(--primary-border)',
        }}>
          <Sparkles size={16} /> Multi-Profession Career Platform with TrustBridge Fraud Detection
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
          fontWeight: '800',
          color: 'var(--slate-900)',
          lineHeight: '1.2',
          letterSpacing: '-1px',
          marginBottom: '1.25rem',
        }}>
          Build ATS-Engineered Resumes, <br />
          <span style={{ color: 'var(--primary)' }}>Find Verified Scam-Free Jobs</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--slate-600)',
          lineHeight: '1.6',
          marginBottom: '2rem',
        }}>
          Design professional resumes tailored for Engineering, Design, Business, Academic, and Fresher roles.
          Receive evidence-backed ATS analysis, transparent job matching, and independent job-trust verification.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Your Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In to Account
              </Link>
            </>
          )}
          <Link to="/resume/templates" className="btn btn-secondary btn-lg">
            Explore 6 Resume Templates
          </Link>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="grid-4">
          <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              6 Profession Templates
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
              Switch layouts dynamically across Tech, Business, Creative, Academic, and Freshers without losing user data. Instant PDF export.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #16a34a' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <Brain size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Evidence-Based ATS Scan
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
              Gemini AI analyzes uploaded resumes with transparent strengths, missing keywords, and reliable rule-based fallback guarantees.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #0f766e' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#f0fdfa',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              TrustBridge Job Audit
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
              Recruiter postings are audited with keyword blocklists, completeness checks, and SSRF-hardened link verification.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#faf5ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <GraduationCap size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Skill-Gap Learning
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
              Directly bridges candidate missing skills using verified free courses from IBM, Infosys, Swayam, Harvard, and Kaggle.
            </p>
          </div>
        </div>
      </section>

      {/* Template Showcase */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            Profession-Specific Resume Gallery
          </h2>
          <p style={{ color: 'var(--slate-600)', marginTop: '0.35rem' }}>
            One resume profile, renderable into 6 specialized career designs with live preview and PDF generation.
          </p>
        </div>

        <div className="grid-3">
          {TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{tmpl.category}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
                {tmpl.name}
              </h3>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: tmpl.accentColor, marginBottom: '0.65rem' }}>
                {tmpl.badge}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5', flex: 1, marginBottom: '1rem' }}>
                {tmpl.description}
              </p>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--slate-500)',
                background: 'var(--slate-50)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
              }}>
                <strong>Best for:</strong> {tmpl.recommendedFor}
              </div>
              <Link
                to={`/resume/builder?template=${tmpl.id}`}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                Use This Template <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiator Callout Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: '600', marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} /> Distinct Scoring Architecture
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: '800', lineHeight: '1.3', marginBottom: '0.75rem' }}>
            Job-Match Scores are Strictly Kept Separate from Trust Assessments
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
            A job can match a candidate’s skills well but still need recruiter trust verification. Our system clearly decouples candidate skill relevance from job legitimacy signals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/jobs" className="btn btn-primary btn-lg">
            Explore Open Jobs
          </Link>
          <Link to="/courses" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            Browse Free Courses
          </Link>
        </div>
      </section>
    </div>
  );
};
