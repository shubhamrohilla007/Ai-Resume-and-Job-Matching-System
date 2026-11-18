import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { JobApplication } from '../types';
import {
  ClipboardList,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'shortlisted' | 'in_progress' | 'rejected'>('all');
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
  });

  const fetchApplications = async () => {
    try {
      const res = await jobsApi.getMyApplications();
      if (res.success && res.applications) {
        setApplications(res.applications);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdrawApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    setWithdrawingId(appId);
    try {
      const res = await jobsApi.withdrawApplication(appId);
      if (res.success) {
        setApplications((prev) => prev.filter((a) => a._id !== appId));
        setActionNotice('Your application was withdrawn successfully.');
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    if (filter === 'shortlisted') return app.status === 'shortlisted';
    if (filter === 'in_progress') return app.status === 'applied' || app.status === 'reviewed';
    if (filter === 'rejected') return app.status === 'rejected';
    return true;
  });

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
          <ClipboardList color="var(--primary)" />
          My Job Applications & Status Tracker
        </h1>
        <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
          Track real-time hiring decisions: see whether recruiters have reviewed, shortlisted, or decided on your applications.
        </p>
      </div>

      {actionNotice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} /> {actionNotice}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Submitted
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            All platform applications
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>
            🎉 Shortlisted / Accepted
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', marginTop: '0.25rem' }}>
            {stats.shortlisted}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.25rem' }}>
            Selected for next rounds
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>
            Under Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', marginTop: '0.25rem' }}>
            {stats.applied + stats.reviewed}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            {stats.reviewed} profile views recorded
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #94a3b8' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Not Selected
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Position filled or passed
          </div>
        </div>
      </div>

      {/* Filter Tabs & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({applications.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'shortlisted' ? 'btn-primary' : 'btn-secondary'}`}
            style={filter === 'shortlisted' ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
            onClick={() => setFilter('shortlisted')}
          >
            Shortlisted ({stats.shortlisted})
          </button>
          <button
            className={`btn btn-sm ${filter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('in_progress')}
          >
            Under Review ({stats.applied + stats.reviewed})
          </button>
          <button
            className={`btn btn-sm ${filter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('rejected')}
          >
            Not Selected ({stats.rejected})
          </button>
        </div>

        <Link to="/jobs/recommended" className="btn btn-secondary btn-sm">
          <Sparkles size={14} /> Find More Jobs <ArrowRight size={14} />
        </Link>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <ClipboardList size={44} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>No Applications Found</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            {applications.length === 0
              ? 'You have not submitted any job applications yet. Match your resume against open roles to apply.'
              : 'No applications match the selected filter.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/jobs/recommended" className="btn btn-primary">
              <Sparkles size={16} /> Explore Recommended Jobs
            </Link>
            <Link to="/jobs" className="btn btn-secondary">
              <Briefcase size={16} /> Browse All Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredApplications.map((app) => {
            const job = typeof app.job === 'object' && app.job ? app.job : null;

            return (
              <div
                key={app._id}
                className="card"
                style={{
                  padding: '1.5rem',
                  borderLeft:
                    app.status === 'shortlisted'
                      ? '5px solid #16a34a'
                      : app.status === 'reviewed'
                      ? '5px solid #2563eb'
                      : app.status === 'rejected'
                      ? '5px solid #94a3b8'
                      : '5px solid #eab308',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                      {job?.title || 'Job Listing'}
                    </h2>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building2 size={16} />
                      {job?.company || 'Company'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {job?.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} /> {job.location}
                        </span>
                      )}
                      {job?.jobType && <span>💼 {job.jobType}</span>}
                      {job?.salary && <span>💰 {job.salary}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Trust Score & Status Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Live Status Badge */}
                    {app.status === 'shortlisted' && (
                      <span
                        className="badge"
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <CheckCircle2 size={16} /> Shortlisted / Accepted
                      </span>
                    )}

                    {app.status === 'reviewed' && (
                      <span
                        className="badge"
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Eye size={16} /> Profile Reviewed
                      </span>
                    )}

                    {app.status === 'applied' && (
                      <span
                        className="badge"
                        style={{
                          background: '#fefce8',
                          color: '#a16207',
                          border: '1px solid #fef08a',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Clock size={16} /> Application Submitted
                      </span>
                    )}

                    {app.status === 'rejected' && (
                      <span
                        className="badge"
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <XCircle size={16} /> Not Selected
                      </span>
                    )}

                    {job?.trustScore !== null && job?.trustScore !== undefined && (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}>
                        <ShieldCheck size={13} /> Trust: {job.trustScore}/100
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Explanation Card */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    background:
                      app.status === 'shortlisted'
                        ? '#f0fdf4'
                        : app.status === 'reviewed'
                        ? '#eff6ff'
                        : app.status === 'rejected'
                        ? '#f8fafc'
                        : '#fffbeb',
                    border:
                      app.status === 'shortlisted'
                        ? '1px solid #bbf7d0'
                        : app.status === 'reviewed'
                        ? '1px solid #bfdbfe'
                        : app.status === 'rejected'
                        ? '1px solid #e2e8f0'
                        : '1px solid #fef08a',
                    color:
                      app.status === 'shortlisted'
                        ? '#166534'
                        : app.status === 'reviewed'
                        ? '#1e40af'
                        : app.status === 'rejected'
                        ? '#475569'
                        : '#854d0e',
                  }}
                >
                  {app.status === 'shortlisted' && (
                    <div>
                      <strong>🎉 Congratulations! You have been shortlisted by the recruiter.</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
                        The hiring team is reviewing your profile for interviews. Keep your phone and email active for contact.
                      </div>
                    </div>
                  )}

                  {app.status === 'reviewed' && (
                    <div>
                      <strong>👀 Application Under Review:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
                        The recruiter has opened and reviewed your submitted resume details. A decision will be posted soon.
                      </div>
                    </div>
                  )}

                  {app.status === 'applied' && (
                    <div>
                      <strong>⏳ Application Received:</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.825rem' }}>
                        Your application was successfully delivered to the recruiter's portal and is in the initial screening queue.
                      </div>
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <div>
                      <strong>Update:</strong> The recruiter has decided not to move forward with your application for this position. Don't worry! Explore our free course recommendations to strengthen your profile for other openings.
                    </div>
                  )}
                </div>

                {/* Recruiter Feedback Note if provided */}
                {app.recruiterFeedback && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      marginBottom: '1rem',
                      padding: '0.85rem 1rem',
                      backgroundColor: '#eff6ff',
                      borderLeft: '4px solid #2563eb',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.25rem' }}>
                      <MessageSquare size={15} /> Recruiter Feedback & Interview Note:
                    </div>
                    <div style={{ color: '#1e293b', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{app.recruiterFeedback}"
                    </div>
                  </div>
                )}

                {/* Cover Note Snippet if provided */}
                {app.coverNote && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                    <strong>Your Note to Recruiter:</strong> "{app.coverNote}"
                  </div>
                )}

                {/* Footer with Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-100)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    Candidate profile: <strong>{app.fullName}</strong> ({app.email})
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {(app.status === 'applied' || app.status === 'reviewed') && (
                      <button
                        type="button"
                        onClick={() => handleWithdrawApplication(app._id)}
                        disabled={withdrawingId === app._id}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fecaca', fontSize: '0.8rem' }}
                        title="Withdraw this active application"
                      >
                        <Trash2 size={13} /> {withdrawingId === app._id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                    {job?.applicationUrl && (
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Company Site <ExternalLink size={13} />
                      </a>
                    )}
                    <Link to="/jobs/recommended" className="btn btn-secondary btn-sm">
                      Compare Matches
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
