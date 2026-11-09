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

  // Update candidate application status
  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      const res = await recruiterApi.updateApplicationStatus(appId, newStatus);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: newStatus as any } : a))
        );
      }
    } catch (err: any) {
      setErrorMsg('Failed to update status.');
    } finally {
      setUpdatingAppId(null);
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
                  {applications.map((app) => (
                    <div key={app._id} style={{
                      border: '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      background: 'var(--slate-50)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                            {app.fullName}
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={14} /> {app.email}
                            </span>
                            {app.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={14} /> {app.phone}
                              </span>
                            )}
                            {app.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} /> {app.location}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Status Select */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--slate-600)' }}>Status:</label>
                          <select
                            className="form-select"
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            disabled={updatingAppId === app._id}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: app.status === 'shortlisted' ? 'var(--success)' : app.status === 'rejected' ? 'var(--danger)' : 'var(--primary)',
                            }}
                          >
                            <option value="applied">Applied</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      {/* Candidate Skills */}
                      {app.skills && app.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.75rem' }}>
                          {app.skills.map((s, idx) => (
                            <span key={idx} className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Cover Note */}
                      {app.coverNote && (
                        <div style={{
                          marginTop: '0.75rem',
                          background: '#fff',
                          border: '1px solid var(--slate-200)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          color: 'var(--slate-700)',
                        }}>
                          <strong>Applicant Note:</strong> {app.coverNote}
                        </div>
                      )}
                    </div>
                  ))}
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
    </div>
  );
};
