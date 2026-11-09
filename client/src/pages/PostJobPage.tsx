import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recruiterApi } from '../api/client';
import {
  Briefcase,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react';

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Run TrustBridge Pre-Audit Check
  const handlePreAudit = async () => {
    if (!formData.title || !formData.company || !formData.description) {
      setErrorMsg('Please enter at least Title, Company, and Description to run audit preview.');
      return;
    }

    setAuditing(true);
    setErrorMsg(null);

    try {
      const res = await recruiterApi.auditPreview(formData);
      if (res.success && res.audit) {
        setAuditResult(res.audit);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Audit check failed.');
    } finally {
      setAuditing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await recruiterApi.createJob(formData);
      if (res.success) {
        navigate('/recruiter/jobs');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Briefcase color="var(--primary)" />
              Post a New Job Opening
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Job listings are checked against scam keyword blocklists, completeness, and link authenticity.
            </p>
          </div>
          <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm">
            Cancel
          </Link>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="title">Job Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Full Stack React Developer"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="company">Company / Organization *</label>
              <input
                id="company"
                name="company"
                type="text"
                className="form-input"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Innovate Solutions"
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="experienceLevel">Experience Level</label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="form-select"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <option value="Fresher">Fresher</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                name="jobType"
                className="form-select"
                value={formData.jobType}
                onChange={handleChange}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Remote or Bangalore"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="salary">Salary / Compensation</label>
              <input
                id="salary"
                name="salary"
                type="text"
                className="form-input"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g. ₹6,00,000 - ₹9,00,000 / year"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="applicationUrl">External Application Link</label>
              <input
                id="applicationUrl"
                name="applicationUrl"
                type="url"
                className="form-input"
                value={formData.applicationUrl}
                onChange={handleChange}
                placeholder="https://company.com/careers/apply"
              />
              <div className="form-hint">Must start with http:// or https:// (audited for authenticity & SSRF safety).</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="requiredSkills">Required Skills (comma separated) *</label>
            <input
              id="requiredSkills"
              name="requiredSkills"
              type="text"
              className="form-input"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
              required
            />
            <div className="form-hint">Mandatory requirements scored heavily during candidate matching.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="preferredSkills">Preferred / Bonus Skills (comma separated)</label>
            <input
              id="preferredSkills"
              name="preferredSkills"
              type="text"
              className="form-input"
              value={formData.preferredSkills}
              onChange={handleChange}
              placeholder="e.g. Docker, AWS, GraphQL, Tailwind CSS"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Detailed Job Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              rows={6}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the primary responsibilities, qualifications, project scope, team environment, and expectations..."
              required
            />
          </div>

          {/* TrustBridge Pre-Audit Panel */}
          {auditResult && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#1e293b' }}>
                  <ShieldCheck size={18} color="var(--primary)" />
                  TrustBridge Pre-Publish Audit Result
                </div>
                <span className={`badge ${auditResult.trustScore >= 80 ? 'badge-success' : auditResult.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                  Trust Score: {auditResult.trustScore}/100 ({auditResult.trustStatus})
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>
                <strong>Audit Label:</strong> {auditResult.trustStatusLabel} • <strong>Completeness:</strong> {auditResult.completenessScore}%
              </div>

              {auditResult.signals && auditResult.signals.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', color: 'var(--slate-700)' }}>
                  {auditResult.signals.map((sig: string, i: number) => (
                    <li key={i}>{sig}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handlePreAudit}
              className="btn btn-secondary"
              disabled={auditing}
            >
              <ShieldCheck size={16} />
              {auditing ? 'Running Trust Audit...' : 'Run Trust Audit Preview'}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Publish Job Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
