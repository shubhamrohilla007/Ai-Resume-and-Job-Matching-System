import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { JobRecommendation } from '../types';
import {
  Briefcase,
  ShieldCheck,
  Brain,
  CheckCircle2,
  XCircle,
  FileCheck,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Send,
  Loader,
} from 'lucide-react';
import { SmartApplyModal } from '../components/SmartApplyModal';

export const RecommendedJobsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [hasResumeSkills, setHasResumeSkills] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  const [missingSkillsAggregate, setMissingSkillsAggregate] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [coverNote, setCoverNote] = useState<string>('');
  const [coverNoteJobId, setCoverNoteJobId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [smartGateJob, setSmartGateJob] = useState<any | null>(null);

  const handleApplyClick = (job: any) => {
    setApplyError(null);
    const score = typeof job.matchScore === 'number' ? job.matchScore : (typeof job.ruleScore === 'number' ? job.ruleScore : 0);
    const hasMissingCore = Array.isArray(job.missingRequired) && job.missingRequired.length > 0;

    if (score < 50 || hasMissingCore) {
      setSmartGateJob(job);
    } else {
      setCoverNoteJobId(job._id);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    setApplyError(null);
    try {
      const note = coverNoteJobId === jobId ? coverNote : '';
      await jobsApi.applyToJob(jobId, note);
      setAppliedIds((prev) => new Set(prev).add(jobId));
      setCoverNoteJobId(null);
      setCoverNote('');
    } catch (err: any) {
      setApplyError(err?.message || 'Application failed. You may have already applied.');
    } finally {
      setApplyingId(null);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await jobsApi.getRecommended();
        if (res.success) {
          setHasResume(res.hasResume !== false);
          setHasResumeSkills(res.hasResumeSkills !== false);
          setRecommendations(res.recommendations || []);
          setMissingSkillsAggregate(res.aggregateMissingSkills || []);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to load job recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

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
          Recommended Jobs & Match Breakdown
        </h1>
        <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
          Jobs ranked by verified resume skills, project evidence, and AI semantic relevance.
          Job-trust ratings are independently audited by TrustBridge.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Warning if no resume created */}
      {!hasResume && (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} />
            <div>
              <strong>No Resume Profile Found:</strong> Create your profile in the Resume Builder or upload a resume to calculate personalized match scores.
            </div>
          </div>
          <Link to="/resume/builder" className="btn btn-primary btn-sm">
            Create Resume <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {hasResume && !hasResumeSkills && (
        <div className="alert alert-warning">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            Your resume builder document does not have any saved skills yet. Add your technical & professional skills to get high-accuracy recommendations.
          </div>
        </div>
      )}

      {/* Aggregate Missing Skills / Bridge Gaps Banner */}
      {missingSkillsAggregate.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <div style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.35rem' }}>
              <GraduationCap size={20} style={{ flexShrink: 0 }} />
              <span>Identified Skill Gaps Across Recommended Jobs</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem', maxWidth: '100%', overflow: 'hidden' }}>
              {missingSkillsAggregate
                .filter((s) => s && s.trim().length > 0)
                .map((skill, i) => {
                  const isLong = skill.length > 35;
                  const displaySkill = isLong ? skill.slice(0, 35) + '...' : skill;
                  return (
                    <span
                      key={i}
                      className="badge badge-warning"
                      title={skill}
                      style={{
                        maxWidth: '100%',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        lineHeight: 1.35,
                      }}
                    >
                      {displaySkill}
                    </span>
                  );
                })}
            </div>
          </div>

          <Link
            to={`/courses?skills=${encodeURIComponent(
              missingSkillsAggregate
                .filter((s) => s && s.length <= 35)
                .slice(0, 5)
                .join(',')
            )}`}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            Find Free Courses for Missing Skills <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Recommended Jobs List */}
      {recommendations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Briefcase size={44} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>No Active Job Openings Found</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            Check back soon as recruiters add verified positions, or explore our free course roadmaps to build your profile.
          </p>
          <Link to="/courses" className="btn btn-secondary">
            Browse Free Learning Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {recommendations.map((job) => (
            <div key={job._id || job.title} className="card" style={{ padding: '1.5rem' }}>
              {/* Header: Title, Company, Scores */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }} className="job-card-header">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                    {job.title}
                  </h2>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.15rem' }}>
                    {job.company}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.35rem' }}>
                    📍 {job.location || 'Remote'} • 💼 {job.jobType} • ⏱ {job.experienceLevel} • 💰 {job.salary}
                  </div>
                </div>

                {/* Score Badges - Strictly Separated */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }} className="job-card-scores">
                  {/* Job Match Score */}
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                      CANDIDATE FIT
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: (job.matchScore || 0) >= 70 ? 'var(--success)' : 'var(--primary)' }}>
                      {job.matchScore !== null ? `${job.matchScore}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                      {job.matchingMode?.replace('-', ' ')}
                    </div>
                  </div>

                  {/* TrustBridge Trust Audit Badge */}
                  <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={13} /> TRUST AUDIT
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: job.trustScore && job.trustScore >= 80 ? '#16a34a' : '#d97706' }}>
                      {job.trustScore !== null && job.trustScore !== undefined ? `${job.trustScore}/100` : 'Audited'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#166534' }}>
                      {job.trustStatus === 'approved' ? 'No Scam Signals' : 'Needs Review'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Snippet */}
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                {job.description}
              </p>

              {/* AI Explanation / Evidence Callout */}
              {job.aiExplanation && (
                <div style={{
                  background: '#f8fafc',
                  borderLeft: '3px solid var(--primary)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--slate-700)',
                }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                    <Brain size={15} /> Semantic Match Analysis:
                  </strong>
                  {job.aiExplanation}
                </div>
              )}

              {/* Skills Breakdown Grid */}
              <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                {/* Required Skills */}
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--slate-600)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Required Skills Breakdown
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {job.matchedRequired && job.matchedRequired.map((s, i) => (
                      <span key={i} className="badge badge-success">
                        <CheckCircle2 size={13} /> {s}
                      </span>
                    ))}
                    {job.missingRequired && job.missingRequired.map((s, i) => (
                      <span key={i} className="badge badge-danger">
                        <XCircle size={13} /> Missing: {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practical Project Evidence */}
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--slate-600)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Practical Project Evidence
                  </div>
                  {job.projectMatches && job.projectMatches.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {job.projectMatches.map((s, i) => (
                        <span key={i} className="badge badge-primary">
                          <FileCheck size={13} /> Proven in Projects: {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                      No direct project keyword matches identified for this role.
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Signals Footer */}
              {job.trustSignals && job.trustSignals.length > 0 && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--slate-600)',
                  background: '#f0fdf4',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <ShieldCheck size={15} color="#16a34a" />
                  <strong>TrustBridge Audit Signals:</strong> {job.trustSignals.join(' • ')}
                </div>
              )}

              {/* Apply / Learn Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-100)' }}>
                <div>
                  {job.missingRequired && job.missingRequired.length > 0 && (
                    <Link
                      to={`/courses?skills=${encodeURIComponent(job.missingRequired.join(','))}`}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
                    >
                      <GraduationCap size={15} /> Learn Missing Skills ({job.missingRequired.length})
                    </Link>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* External link if provided */}
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

                  {/* Internal platform apply */}
                  {appliedIds.has(job._id) ? (
                    <span className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'default' }}>
                      <CheckCircle2 size={14} /> Applied ✓
                    </span>
                  ) : coverNoteJobId === job._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '280px' }}>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Optional: add a cover note highlighting your match..."
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
                          {applyingId === job._id ? <Loader size={14} /> : <Send size={14} />}
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
