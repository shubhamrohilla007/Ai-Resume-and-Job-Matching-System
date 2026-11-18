import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recruiterApi } from '../api/client';
import { Job, JobApplication } from '../types';
import {
  Briefcase,
  PlusCircle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Power,
  Trash2,
  AlertTriangle,
  Users,
  Edit,
  X,
  Clock,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  FileText,
  Eye,
  Award,
  BookOpen,
  Sparkles,
  Send,
  MessageSquare,
  Download,
} from 'lucide-react';

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Applicants Modal State
  const [activeJobForApps, setActiveJobForApps] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState<'all' | 'high_match' | 'shortlisted' | 'reviewed' | 'rejected'>('all');
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [modalAlertMsg, setModalAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Candidate Deep Inspection Modal State
  const [inspectingCandidate, setInspectingCandidate] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Edit Job Modal State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    company: '',
    description: '',
    requiredSkills: '',
    preferredSkills: '',
    experienceLevel: 'Fresher',
    location: 'Remote',
    jobType: 'Full-time',
    salary: 'Not specified',
    applicationUrl: '',
  });
  const [editAuditing, setEditAuditing] = useState(false);
  const [editAuditResult, setEditAuditResult] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await recruiterApi.getMyJobs();
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to retrieve your jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Open Applicants Modal & fetch applicants
  const handleOpenApplicants = async (job: Job) => {
    setActiveJobForApps(job);
    setLoadingApps(true);
    setApplications([]);
    try {
      const res = await recruiterApi.getApplications(job._id);
      if (res.success && res.applications) {
        setApplications(res.applications);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load applicants.');
    } finally {
      setLoadingApps(false);
    }
  };

  // Update candidate application status with optional recruiter feedback & automated candidate email
  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      const feedbackText = feedbackDrafts[appId] || '';
      const res = await recruiterApi.updateApplicationStatus(appId, newStatus, feedbackText);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) =>
            a._id === appId
              ? {
                  ...a,
                  status: newStatus as any,
                  recruiterFeedback: feedbackText || a.recruiterFeedback,
                }
              : a
          )
        );
        const emailNotice = res.emailDispatched
          ? `✓ Notification email dispatched to ${res.recipientEmail || 'candidate'}!`
          : `(Status saved in candidate records)`;
        const updateText = `Candidate status updated to ${newStatus.toUpperCase()}.${feedbackText ? ' Note attached.' : ''} ${emailNotice}`;
        
        setActionMsg(updateText);
        setModalAlertMsg({ type: 'success', text: updateText });
        setTimeout(() => {
          setActionMsg(null);
          setModalAlertMsg(null);
        }, 5000);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err?.message || 'Failed to update status.';
      setErrorMsg(errMsg);
      setModalAlertMsg({ type: 'error', text: errMsg });
      setTimeout(() => setModalAlertMsg(null), 5000);
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Inspect deep candidate profile
  const handleInspectCandidate = async (appId: string) => {
    try {
      setLoadingProfile(true);
      const res = await recruiterApi.getCandidateProfile(appId);
      if (res.success) {
        setInspectingCandidate(res);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err?.message || 'Failed to load candidate profile details.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : '',
      preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills.join(', ') : '',
      experienceLevel: job.experienceLevel || 'Fresher',
      location: job.location || 'Remote',
      jobType: job.jobType || 'Full-time',
      salary: job.salary || 'Not specified',
      applicationUrl: job.applicationUrl || '',
    });
    setEditAuditResult(null);
  };

  // Pre-audit check during editing
  const handleEditPreAudit = async () => {
    setEditAuditing(true);
    try {
      const res = await recruiterApi.auditPreview(editFormData);
      if (res.success && res.audit) {
        setEditAuditResult(res.audit);
      }
    } catch (err) {
      console.error('Audit check failed:', err);
    } finally {
      setEditAuditing(false);
    }
  };

  // Save Job Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setSavingEdit(true);
    try {
      const res = await recruiterApi.editJob(editingJob._id, editFormData);
      if (res.success && res.job) {
        setJobs((prev) => prev.map((j) => (j._id === editingJob._id ? { ...j, ...res.job } : j)));
        setEditingJob(null);
        setActionMsg('Job posting updated successfully!');
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update job post.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle active/inactive status
  const handleToggle = async (id: string) => {
    setTogglingId(id);
    setActionMsg(null);
    setErrorMsg(null);

    try {
      const res = await recruiterApi.toggleStatus(id);
      if (res.success) {
        setJobs((prev) =>
          prev.map((j) => (j._id === id ? { ...j, isActive: res.isActive } : j))
        );
        setActionMsg(res.message || 'Status updated.');
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to toggle job status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This cannot be undone.')) {
      return;
    }

    try {
      const res = await recruiterApi.deleteJob(id);
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j._id !== id));
        setActionMsg('Job posting deleted.');
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete job.');
    }
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Briefcase color="var(--primary)" />
            Manage Your Job Openings
          </h1>
          <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Track how many candidates applied, view applicant details, edit your job posts, and manage status.
          </p>
        </div>

        <Link to="/recruiter/jobs/new" className="btn btn-primary">
          <PlusCircle size={17} /> Post a New Job
        </Link>
      </div>

      {actionMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{actionMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Briefcase size={44} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>No Jobs Posted Yet</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            Post a job description with required skills to reach qualified job seekers and receive applications.
          </p>
          <Link to="/recruiter/jobs/new" className="btn btn-primary">
            <PlusCircle size={16} /> Post Your First Job
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job) => (
            <div key={job._id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                      {job.title}
                    </h3>
                    <span className={`badge ${job.isActive ? 'badge-success' : 'badge-slate'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                    {/* Applicant Count Pill */}
                    <button
                      type="button"
                      onClick={() => handleOpenApplicants(job)}
                      className="badge badge-primary"
                      style={{ cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      title="Click to view applicants"
                    >
                      <Users size={14} />
                      <strong>{job.applicantCount || 0}</strong> Applicants
                    </button>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                    {job.company} • {job.location} • {job.jobType} • {job.experienceLevel} • {job.salary}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {/* Trust Score Badge */}
                  {job.trustScore !== null && job.trustScore !== undefined && (
                    <span className={`badge ${job.trustScore >= 80 ? 'badge-success' : job.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      <ShieldCheck size={14} /> Trust: {job.trustScore}/100
                    </span>
                  )}

                  {/* View Applicants Action */}
                  <button
                    type="button"
                    onClick={() => handleOpenApplicants(job)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Users size={14} /> View Applicants ({job.applicantCount || 0})
                  </button>

                  {/* Edit Job Action */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(job)}
                    className="btn btn-secondary btn-sm"
                    title="Edit job details"
                  >
                    <Edit size={14} /> Edit
                  </button>

                  {/* Activate / Deactivate Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(job._id)}
                    className={`btn btn-sm ${job.isActive ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={togglingId === job._id}
                    title={job.isActive ? 'Close this job to candidates' : 'Activate job'}
                  >
                    <Power size={14} />
                    {togglingId === job._id ? 'Updating...' : job.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(job._id)}
                    className="btn btn-danger btn-sm"
                    title="Delete posting"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Required & Preferred Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '1rem' }}>
                {job.requiredSkills && job.requiredSkills.map((s, i) => (
                  <span key={i} className="badge badge-primary">
                    Req: {s}
                  </span>
                ))}
                {job.preferredSkills && job.preferredSkills.map((s, i) => (
                  <span key={i} className="badge badge-slate">
                    Pref: {s}
                  </span>
                ))}
              </div>

              {/* Trust Signals if present */}
              {job.trustSignals && job.trustSignals.length > 0 && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--slate-600)',
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <ShieldCheck size={14} color="var(--primary)" />
                  <strong>Audit Status:</strong> {job.trustStatusLabel || 'Audited'} ({job.trustSignals.join(' • ')})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          MODAL 1: VIEW CANDIDATES WHO APPLIED
          ========================================== */}
      {activeJobForApps && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--slate-200)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--slate-900)' }}>
                  Applicants for: {activeJobForApps.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                  Total Candidates Applied: <strong>{applications.length}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveJobForApps(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} /> Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {/* Filter Tabs for Applicants */}
              {applications.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.35rem', borderBottom: '1px solid var(--slate-200)' }}>
                  {[
                    { id: 'all', label: `All Applicants (${applications.length})` },
                    { id: 'high_match', label: `High Match >70% (${applications.filter((a) => (a.matchScore || 0) >= 70).length})`, color: '#059669' },
                    { id: 'shortlisted', label: `Shortlisted (${applications.filter((a) => a.status === 'shortlisted').length})`, color: '#2563eb' },
                    { id: 'reviewed', label: `Reviewed (${applications.filter((a) => a.status === 'reviewed').length})` },
                    { id: 'rejected', label: `Rejected (${applications.filter((a) => a.status === 'rejected').length})`, color: '#dc2626' },
                  ].map((tab) => {
                    const active = appFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAppFilter(tab.id as any)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: active ? '1.5px solid var(--primary)' : '1px solid var(--slate-300)',
                          background: active ? 'rgba(37, 99, 235, 0.08)' : 'var(--card-bg, #ffffff)',
                          color: active ? 'var(--primary)' : tab.color || 'var(--slate-600)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {modalAlertMsg && (
                <div
                  className={`alert alert-${modalAlertMsg.type === 'success' ? 'success' : 'danger'}`}
                  style={{
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {modalAlertMsg.type === 'success' ? (
                    <CheckCircle size={16} style={{ flexShrink: 0, color: 'var(--success)' }} />
                  ) : (
                    <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--danger)' }} />
                  )}
                  <span>{modalAlertMsg.text}</span>
                </div>
              )}

              {loadingApps ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner spinner-primary" style={{ width: '36px', height: '36px', margin: '0 auto' }} />
                  <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)' }}>Loading candidate applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Users size={40} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>No Candidates Have Applied Yet</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.25rem auto 0' }}>
                    As soon as job seekers click "Apply", their profile and contact details will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {applications
                    .filter((app) => {
                      if (appFilter === 'high_match') return (app.matchScore || 0) >= 70;
                      if (appFilter === 'shortlisted') return app.status === 'shortlisted';
                      if (appFilter === 'reviewed') return app.status === 'reviewed';
                      if (appFilter === 'rejected') return app.status === 'rejected';
                      return true;
                    })
                    .map((app) => {
                      const score = typeof app.matchScore === 'number' ? app.matchScore : 0;
                      const isHigh = score >= 70;
                      const isMid = score >= 40 && score < 70;

                      return (
                        <div
                          key={app._id}
                          style={{
                            border: '1px solid var(--slate-200)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            background: 'var(--card-bg, #ffffff)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--slate-900)', margin: 0 }}>
                                  {app.fullName}
                                </h4>

                                {/* Match Badge */}
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    backgroundColor: isHigh ? '#ecfdf5' : isMid ? '#fffbeb' : '#fef2f2',
                                    color: isHigh ? '#059669' : isMid ? '#b45309' : '#dc2626',
                                    border: `1px solid ${isHigh ? '#a7f3d0' : isMid ? '#fde68a' : '#fecaca'}`,
                                  }}
                                >
                                  {isHigh ? '🟢' : isMid ? '🟡' : '🔴'} {score}% ATS Match
                                </span>

                                <span
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    backgroundColor:
                                      app.status === 'shortlisted' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#eff6ff',
                                    color:
                                      app.status === 'shortlisted' ? '#15803d' : app.status === 'rejected' ? '#b91c1c' : '#1d4ed8',
                                  }}
                                >
                                  {app.status.toUpperCase()}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.825rem', color: 'var(--slate-600)', marginTop: '0.35rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Mail size={13} /> {app.email}
                                </span>
                                {app.phone && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Phone size={13} /> {app.phone}
                                  </span>
                                )}
                                {app.location && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={13} /> {app.location}
                                  </span>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={13} /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Deep Profile & Resume Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleInspectCandidate(app._id)}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                disabled={loadingProfile}
                              >
                                <Eye size={14} /> View Full Profile
                              </button>

                              {app.resumeUrl && (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                >
                                  <FileText size={14} /> View Resume PDF
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Skills Breakdown */}
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            {Array.isArray(app.matchingSkills) && app.matchingSkills.length > 0 && (
                              <>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginRight: '0.2rem' }}>
                                  Matching:
                                </span>
                                {app.matchingSkills.map((s, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      backgroundColor: '#ecfdf5',
                                      color: '#059669',
                                      border: '1px solid #a7f3d0',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✓ {s}
                                  </span>
                                ))}
                              </>
                            )}

                            {Array.isArray(app.missingSkills) && app.missingSkills.length > 0 && (
                              <>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', marginLeft: '0.4rem', marginRight: '0.2rem' }}>
                                  Missing:
                                </span>
                                {app.missingSkills.slice(0, 5).map((s, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px',
                                      backgroundColor: '#fef2f2',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✗ {s}
                                  </span>
                                ))}
                                {app.missingSkills.length > 5 && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                    +{app.missingSkills.length - 5} more
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Cover Note */}
                          {app.coverNote && (
                            <div
                              style={{
                                marginTop: '0.75rem',
                                background: 'var(--slate-50)',
                                border: '1px solid var(--slate-200)',
                                borderRadius: '6px',
                                padding: '0.65rem 0.85rem',
                                fontSize: '0.825rem',
                                color: 'var(--slate-700)',
                              }}
                            >
                              <strong>Candidate Note:</strong> {app.coverNote}
                            </div>
                          )}

                          {/* Recruiter Feedback Note & Status Update Section */}
                          <div
                            style={{
                              marginTop: '0.85rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid var(--slate-200)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <input
                                type="text"
                                placeholder="Add recruiter feedback or interview notes (sent to candidate on status change)..."
                                value={feedbackDrafts[app._id] ?? (app.recruiterFeedback || '')}
                                onChange={(e) =>
                                  setFeedbackDrafts((prev) => ({ ...prev, [app._id]: e.target.value }))
                                }
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.65rem',
                                  fontSize: '0.825rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--slate-300)',
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <select
                                className="form-select"
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                disabled={updatingAppId === app._id}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                  borderRadius: '6px',
                                  color:
                                    app.status === 'shortlisted'
                                      ? 'var(--success)'
                                      : app.status === 'rejected'
                                      ? 'var(--danger)'
                                      : 'var(--primary)',
                                }}
                              >
                                <option value="applied">Applied</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                              </select>

                              {feedbackDrafts[app._id] && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(app._id, app.status)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                  disabled={updatingAppId === app._id}
                                >
                                  Save Note
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {modalAlertMsg && (
                <div
                  className={`alert alert-${modalAlertMsg.type === 'success' ? 'success' : 'danger'}`}
                  style={{
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {modalAlertMsg.type === 'success' ? (
                    <CheckCircle size={16} style={{ flexShrink: 0, color: 'var(--success)' }} />
                  ) : (
                    <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--danger)' }} />
                  )}
                  <span>{modalAlertMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: EDIT JOB POSTING
          ========================================== */}
      {editingJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--slate-200)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--slate-900)' }}>
                  Edit Job Posting: {editingJob.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                  Update details, requirements, compensation and TrustBridge audit signals.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} /> Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.company}
                    onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select
                    className="form-select"
                    value={editFormData.experienceLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, experienceLevel: e.target.value })}
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select
                    className="form-select"
                    value={editFormData.jobType}
                    onChange={(e) => setEditFormData({ ...editFormData, jobType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Salary</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Application URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={editFormData.applicationUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (comma separated) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.requiredSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, requiredSkills: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Skills (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.preferredSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, preferredSkills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  required
                />
              </div>

              {/* Edit Pre-Audit Review */}
              {editAuditResult && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '0.35rem' }}>
                    <span>Audit Preview</span>
                    <span className={`badge ${editAuditResult.trustScore >= 80 ? 'badge-success' : 'badge-warning'}`}>
                      Score: {editAuditResult.trustScore}/100
                    </span>
                  </div>
                  <div>Status: {editAuditResult.trustStatusLabel}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleEditPreAudit}
                  className="btn btn-secondary btn-sm"
                  disabled={editAuditing}
                >
                  <ShieldCheck size={15} /> {editAuditing ? 'Auditing...' : 'Check Trust Score'}
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setEditingJob(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                    {savingEdit ? <span className="spinner" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: CANDIDATE DEEP PROFILE INSPECTION
          ========================================== */}
      {inspectingCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setInspectingCandidate(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color, #e2e8f0)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--slate-50, #f8fafc)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Candidate Profile: {inspectingCandidate.candidate?.fullName || inspectingCandidate.application?.fullName}
                </h3>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                  Evaluating application for <strong>{inspectingCandidate.job?.title}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                {inspectingCandidate.resumeUrl && (
                  <a
                    href={inspectingCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                  >
                    <FileText size={14} /> Open Resume PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingCandidate(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.6rem' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Overview banner */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--slate-50, #f8fafc)',
                  border: '1px solid var(--slate-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)' }}>Contact Info:</div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} /> {inspectingCandidate.candidate?.email || inspectingCandidate.application?.email}
                    </span>
                    {inspectingCandidate.application?.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> {inspectingCandidate.application.phone}
                      </span>
                    )}
                    {inspectingCandidate.application?.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {inspectingCandidate.application.location}
                      </span>
                    )}
                  </div>
                </div>

                {typeof inspectingCandidate.application?.matchScore === 'number' && (
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      backgroundColor:
                        inspectingCandidate.application.matchScore >= 70
                          ? '#ecfdf5'
                          : inspectingCandidate.application.matchScore >= 40
                          ? '#fffbeb'
                          : '#fef2f2',
                      color:
                        inspectingCandidate.application.matchScore >= 70
                          ? '#059669'
                          : inspectingCandidate.application.matchScore >= 40
                          ? '#b45309'
                          : '#dc2626',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      textAlign: 'center',
                    }}
                  >
                    {inspectingCandidate.application.matchScore}% ATS Role Match
                  </div>
                )}
              </div>

              {/* Bio / Summary */}
              {(inspectingCandidate.resumeBuilder?.personal?.bio ||
                inspectingCandidate.candidateProfile?.bio ||
                inspectingCandidate.resumeBuilder?.summary) && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="var(--primary)" /> Executive Summary / Bio
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--slate-700)' }}>
                    {inspectingCandidate.resumeBuilder?.personal?.bio ||
                      inspectingCandidate.candidateProfile?.bio ||
                      inspectingCandidate.resumeBuilder?.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(inspectingCandidate.application?.skills) && inspectingCandidate.application.skills.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Core Candidate Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {inspectingCandidate.application.skills.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 600,
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {Array.isArray(inspectingCandidate.resumeBuilder?.experience) &&
                inspectingCandidate.resumeBuilder.experience.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Briefcase size={16} color="var(--primary)" /> Experience & Track Record
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {inspectingCandidate.resumeBuilder.experience.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--slate-200)',
                            backgroundColor: 'var(--slate-50, #f8fafc)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                              {exp.position || exp.role || 'Role'}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                              {exp.startDate} - {exp.current ? 'Present' : exp.endDate || ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </div>
                          {exp.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                              {exp.description}
                            </p>
                          )}
                          {Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
                            <ul style={{ margin: '0.4rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem', color: 'var(--slate-700)' }}>
                              {exp.highlights.map((h: string, hIdx: number) => (
                                <li key={hIdx}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Education */}
              {Array.isArray(inspectingCandidate.resumeBuilder?.education) &&
                inspectingCandidate.resumeBuilder.education.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BookOpen size={16} color="var(--primary)" /> Academic Background
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {inspectingCandidate.resumeBuilder.education.map((edu: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--slate-200)',
                            backgroundColor: 'var(--slate-50, #f8fafc)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                              {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                              {edu.graduationYear || edu.year || ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>{edu.institution || edu.school}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Projects */}
              {Array.isArray(inspectingCandidate.resumeBuilder?.projects) &&
                inspectingCandidate.resumeBuilder.projects.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={16} color="var(--primary)" /> Portfolio Projects
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {inspectingCandidate.resumeBuilder.projects.map((proj: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--slate-200)',
                            backgroundColor: 'var(--slate-50, #f8fafc)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--slate-900)' }}>{proj.title || proj.name}</strong>
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none' }}
                              >
                                View Project &rarr;
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p style={{ fontSize: '0.825rem', color: 'var(--slate-700)', margin: '0.35rem 0' }}>
                              {proj.description}
                            </p>
                          )}
                          {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.35rem' }}>
                              {proj.technologies.map((t: string, tIdx: number) => (
                                <span key={tIdx} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#f1f5f9' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
