import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { Job } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  ShieldCheck,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle2,
  Loader,
} from 'lucide-react';
import { SmartApplyModal } from '../components/SmartApplyModal';

export const PublicJobsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyError, setApplyError] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState<string>('');
  const [coverNoteJobId, setCoverNoteJobId] = useState<string | null>(null);
  const [smartGateJob, setSmartGateJob] = useState<any | null>(null);

  const handleApplyClick = (job: any) => {
    if (!isAuthenticated) return;
    setApplyError(null);
    if (user?.role === 'job_seeker') {
      setSmartGateJob(job);
    } else {
      setCoverNoteJobId(job._id);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated) return;
    setApplyingId(jobId);
    setApplyError(null);
    try {
      const note = coverNoteJobId === jobId ? coverNote : '';
      await jobsApi.applyToJob(jobId, note);
      setAppliedIds((prev) => new Set(prev).add(jobId));
      setCoverNoteJobId(null);
      setCoverNote('');
    } catch (err: any) {
      setApplyError(err?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  const fetchJobs = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (location) params.location = location;
      if (jobType) params.jobType = jobType;

      const res = await jobsApi.getPublicJobs(params);
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err) {
      console.error('Failed to load public jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [location, jobType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Briefcase color="var(--primary)" />
          Explore Verified Job Listings
        </h1>
        <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
          Browse open roles screened with TrustBridge scam detection and keyword analysis.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="grid-3" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keywords / Title / Company</label>
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. React, Python, Product Manager..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote, Delhi, Bangalore"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-select"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>

            <button type="submit" className="btn btn-primary">
              <Search size={16} /> Search
            </button>
          </div>
        </div>
      </form>

      {/* Jobs List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-700)' }}>
          Showing {jobs.length} Active Positions
        </div>
        {isAuthenticated && user?.role === 'job_seeker' && (
          <Link to="/jobs/recommended" className="btn btn-secondary btn-sm">
            <Sparkles size={14} /> Calculate My Match Scores <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Briefcase size={44} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>No Jobs Match Your Query</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', margin: '0.5rem auto 1rem' }}>
            Try broadening your search term or exploring free courses to prepare for new roles.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job) => (
            <div key={job._id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                    {job.title}
                  </h2>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    {job.company}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <span>📍 {job.location}</span>
                    <span>💼 {job.jobType}</span>
                    <span>⏱ {job.experienceLevel}</span>
                    <span>💰 {job.salary}</span>
                  </div>
                </div>

                {job.trustScore !== null && job.trustScore !== undefined && (
                  <span className={`badge ${job.trustScore >= 80 ? 'badge-success' : job.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <ShieldCheck size={15} /> Trust: {job.trustScore}/100 ({job.trustStatus})
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5', margin: '1rem 0' }}>
                {job.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
                {job.requiredSkills && job.requiredSkills.map((s, i) => (
                  <span key={i} className="badge badge-primary">
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-100)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'recently'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* External apply link if provided */}
                  {job.applicationUrl && (
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Employer Site <ExternalLink size={14} />
                    </a>
                  )}

                  {/* Internal Apply via Platform — only for authenticated job seekers */}
                  {isAuthenticated && user?.role === 'job_seeker' && (
                    appliedIds.has(job._id) ? (
                      <span className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }}>
                        <CheckCircle2 size={14} /> Applied ✓
                      </span>
                    ) : coverNoteJobId === job._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '260px' }}>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Optional cover note..."
                          value={coverNote}
                          onChange={(e) => setCoverNote(e.target.value)}
                          style={{ resize: 'vertical', fontSize: '0.82rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={applyingId === job._id}
                            onClick={() => handleApply(job._id)}
                          >
                            {applyingId === job._id ? <Loader size={14} className="spin" /> : <Send size={14} />}
                            {applyingId === job._id ? 'Submitting…' : 'Submit Application'}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setCoverNoteJobId(null); setCoverNote(''); }}>
                            Cancel
                          </button>
                        </div>
                        {applyError && <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{applyError}</div>}
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApplyClick(job)}
                      >
                        <Send size={14} /> Apply via Platform
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SmartApplyModal
        isOpen={Boolean(smartGateJob)}
        job={smartGateJob}
        onClose={() => setSmartGateJob(null)}
        onAppliedSuccessfully={(id) => {
          setAppliedIds((prev) => new Set(prev).add(id));
          setSmartGateJob(null);
        }}
      />
    </div>
  );
};
