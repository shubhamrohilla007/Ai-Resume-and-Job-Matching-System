import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Briefcase,
  Upload,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ArrowRight,
  ClipboardList,
  Clock,
  Eye,
  XCircle,
} from 'lucide-react';
import { builderApi, resumeApi, jobsApi, recruiterApi, profileApi } from '../api/client';
import { AdminDashboardPage } from './AdminDashboardPage';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [atsData, setAtsData] = useState<any>(null);
  const [recJobsCount, setRecJobsCount] = useState<number>(0);
  const [recruiterJobs, setRecruiterJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [applicationStats, setApplicationStats] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (user?.role === 'job_seeker') {
          const [profRes, bldRes, atsRes, jobRes, appsRes] = await Promise.allSettled([
            profileApi.getProfile(),
            builderApi.getResume(),
            resumeApi.getAnalysis(),
            jobsApi.getRecommended(),
            jobsApi.getMyApplications(),
          ]);

          if (profRes.status === 'fulfilled') setProfile(profRes.value.profile);
          if (bldRes.status === 'fulfilled') setResumeData(bldRes.value.resume);
          if (atsRes.status === 'fulfilled' && atsRes.value.hasResume) setAtsData(atsRes.value.resume);
          if (jobRes.status === 'fulfilled' && jobRes.value.recommendations) {
            setRecJobsCount(jobRes.value.recommendations.length);
          }
          if (appsRes.status === 'fulfilled' && appsRes.value.success) {
            setMyApplications(appsRes.value.applications || []);
            setApplicationStats(appsRes.value.stats || null);
          }
        } else if (user?.role === 'recruiter') {
          const res = await recruiterApi.getMyJobs();
          if (res.success && res.jobs) {
            setRecruiterJobs(res.jobs);
          }
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  // ==========================================
  // Admin Dashboard View
  // ==========================================
  if (user?.role === 'admin') {
    return <AdminDashboardPage />;
  }

  // ==========================================
  // Recruiter Dashboard View
  // ==========================================
  if (user?.role === 'recruiter') {
    const activeCount = recruiterJobs.filter((j) => j.isActive).length;
    const auditedCount = recruiterJobs.filter((j) => j.trustScore !== null && j.trustScore !== undefined).length;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--slate-900)' }}>
              Recruiter Dashboard
            </h1>
            <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Welcome back, {user.fullName}. Manage your job openings and TrustBridge audit signals.
            </p>
          </div>
          <Link to="/recruiter/jobs/new" className="btn btn-primary">
            <PlusCircle size={17} /> Post a New Job
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>TOTAL POSTED JOBS</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {recruiterJobs.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Positions created by your account
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>ACTIVE CANDIDATE LISTINGS</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.25rem' }}>
              {activeCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Open for job matching & applications
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>AUDITED POSITIONS</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.25rem' }}>
              {auditedCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Audited by TrustBridge Fraud Inspector
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Job Openings</h2>
            <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm">
              Manage All Jobs <ArrowRight size={14} />
            </Link>
          </div>

          {recruiterJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Briefcase size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>No Jobs Posted Yet</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.25rem auto 1.5rem' }}>
                Post your first opening to reach matched candidates and receive instant TrustBridge credibility verification.
              </p>
              <Link to="/recruiter/jobs/new" className="btn btn-primary">
                <PlusCircle size={16} /> Post Your First Job
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recruiterJobs.slice(0, 5).map((job) => (
                <div key={job._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--slate-200)',
                  background: 'var(--slate-50)',
                }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--slate-900)' }}>{job.title}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                      {job.company} • {job.location} • {job.jobType}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {job.trustScore !== null && job.trustScore !== undefined && (
                      <span className={`badge ${job.trustScore >= 80 ? 'badge-success' : job.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                        <ShieldCheck size={14} /> Trust: {job.trustScore}/100
                      </span>
                    )}
                    <span className={`badge ${job.isActive ? 'badge-success' : 'badge-slate'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                    <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm">
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // Job Seeker Dashboard View
  // ==========================================
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Welcome back, {user?.fullName}!
        </h1>
        <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
          Here is an overview of your resume preparedness, ATS scores, and top job recommendations.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>ATS RESUME SCORE</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: atsData?.atsScore ? 'var(--primary)' : 'var(--slate-400)', marginTop: '0.25rem' }}>
            {atsData?.atsScore ? `${atsData.atsScore}%` : 'Not Scanned'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            {atsData ? (atsData.analysisMode === 'ai-assisted' ? 'Gemini AI Verified' : 'Rule-Based Evaluated') : 'Upload resume to scan'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>SAVED RESUME SKILLS</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {resumeData?.skills?.length || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Extracted for job matching
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>MATCHED JOBS</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.25rem' }}>
            {recJobsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Ranked with explainable evidence
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: '600' }}>ACTIVE TEMPLATE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--slate-900)', marginTop: '0.65rem', textTransform: 'capitalize' }}>
            {resumeData?.templateId?.replace('-', ' ') || 'ATS Classic'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Multi-profession format
          </div>
        </div>
      </div>

      {/* Applications & Status Tracker */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList color="var(--primary)" size={20} />
              Recent Job Applications & Status
            </h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Real-time feedback: see if recruiters have viewed, shortlisted, or decided on your applications.
            </p>
          </div>
          <Link to="/applications" className="btn btn-secondary btn-sm">
            View All ({myApplications.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {myApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
            <ClipboardList size={32} color="var(--slate-400)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: '600', color: 'var(--slate-700)' }}>No applications submitted yet</div>
            <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
              Apply to verified jobs using your resume profile and track hiring stages here.
            </div>
            <Link to="/jobs/recommended" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
              Explore Matching Jobs
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myApplications.slice(0, 3).map((app) => {
              const job = typeof app.job === 'object' && app.job ? app.job : null;
              return (
                <div
                  key={app._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--slate-200)',
                    background: 'var(--slate-50)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--slate-900)' }}>{job?.title || 'Job Listing'}</strong>
                    <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                      {job?.company || 'Company'} • {job?.location || 'Remote'} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    {app.status === 'shortlisted' && (
                      <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: '700' }}>
                        <CheckCircle2 size={13} /> Shortlisted / Accepted
                      </span>
                    )}
                    {app.status === 'reviewed' && (
                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: '700' }}>
                        <Eye size={13} /> Profile Reviewed
                      </span>
                    )}
                    {app.status === 'applied' && (
                      <span className="badge" style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fef08a', fontWeight: '700' }}>
                        <Clock size={13} /> Submitted
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '700' }}>
                        <XCircle size={13} /> Not Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Actions Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--slate-900)' }}>
        Quick Career Actions
      </h2>

      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <Link to="/resume/builder" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <FileText size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Resume Builder & AI Polish
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Create or edit your resume with real-time preview, AI section improvements, and custom sections.
          </p>
        </Link>

        <Link to="/resume/templates" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#faf5ff',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Sparkles size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            6 Profession Templates
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Switch between Tech, Business, Creative, Academic, and Fresher templates with zero data loss.
          </p>
        </Link>

        <Link to="/resume/analysis" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Upload size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Upload & ATS Analysis
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Upload existing PDF/DOCX files to inspect keyword density, missing skills, and strengths.
          </p>
        </Link>

        <Link to="/jobs/recommended" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Briefcase size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Matched Job Recommendations
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Explore ranked jobs scored by your verified resume skills and project evidence.
          </p>
        </Link>

        <Link to="/courses" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <GraduationCap size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Free Course Catalog & Skill Gaps
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Bridge missing requirements with verified credentials from IBM, Infosys, Swayam, and Harvard.
          </p>
        </Link>

        <Link to="/profile" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <UserCheck size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Candidate Profile
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
            Keep your contact details, education history, and career preferences updated.
          </p>
        </Link>
      </div>
    </div>
  );
};
