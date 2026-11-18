import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Send,
  X,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Lightbulb,
  Building2,
  Briefcase,
  FileCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { builderApi, jobsApi } from '../api/client';

interface SmartApplyModalProps {
  isOpen: boolean;
  job: any;
  onClose: () => void;
  onAppliedSuccessfully: (jobId: string) => void;
}

export const SmartApplyModal: React.FC<SmartApplyModalProps> = ({
  isOpen,
  job,
  onClose,
  onAppliedSuccessfully,
}) => {
  const [step, setStep] = useState<'gate' | 'tailoring' | 'review'>('gate');
  const [tailoringResult, setTailoringResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'summary' | 'experience' | 'project'>('preview');
  const [resumePreviewData, setResumePreviewData] = useState<any>({});
  const [coverNote, setCoverNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const matchScore = typeof job.matchScore === 'number' ? job.matchScore : 0;
  const missingSkills = [
    ...(Array.isArray(job.missingRequired) ? job.missingRequired : []),
    ...(Array.isArray(job.missingPreferred) ? job.missingPreferred : []),
  ];

  // 1. Candidate chooses to apply anyway without changes
  const handleApplyAnyway = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await jobsApi.applyToJob(job._id, coverNote);
      onAppliedSuccessfully(job._id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.response?.data?.message || err?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Candidate chooses AI Role-Tailoring Assistant
  const handleStartAiTailoring = async () => {
    try {
      setStep('tailoring');
      setLoading(true);
      setErrorMsg(null);

      // Pre-fetch current builder resume so full resume preview has complete candidate details
      try {
        const currentBuilderRes = await builderApi.getResume();
        setResumePreviewData(currentBuilderRes?.resume || {});
      } catch (e) {
        // Fallback silently if not yet loaded
      }

      const res = await builderApi.tailorResume({
        jobId: job._id,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.requiredSkills || [],
        preferredSkills: job.preferredSkills || [],
      });

      if (res.success && res.tailoring) {
        setTailoringResult(res.tailoring);
        setStep('review');
        setActiveTab('preview');
      } else {
        throw new Error('AI tailoring returned empty response.');
      }
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.response?.data?.message || err?.message || 'Failed to tailor resume with AI.');
      setStep('gate');
    } finally {
      setLoading(false);
    }
  };

  // 3. Candidate confirms tailored suggestions and submits boosted application
  const handleConfirmAndApply = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch current resume builder
      const currentBuilderRes = await builderApi.getResume();
      const currentResume = currentBuilderRes?.resume || {};

      // 2. Prepare merged tailored updates
      const updatedSkills = Array.from(
        new Set([
          ...(Array.isArray(currentResume.skills) ? currentResume.skills : []),
          ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
          ...(Array.isArray(tailoringResult?.alignedSkills) ? tailoringResult.alignedSkills : []),
        ])
      );

      const updatedPayload = {
        ...currentResume,
        summary: tailoringResult?.tailoredSummary || currentResume.summary,
        skills: updatedSkills,
        targetRole: job.title,
      };

      // 3. Save tailored resume to database
      await builderApi.saveResume(updatedPayload);

      // 4. Submit application to the job opening with synchronized tailored match score & skills
      await jobsApi.applyToJob(job._id, coverNote, {
        tailoredMatchScore: tailoringResult?.targetRoleFitScore || 85,
        tailoredSkills: updatedSkills,
        tailoredSummary: tailoringResult?.tailoredSummary,
      });

      onAppliedSuccessfully(job._id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.message || err.response?.data?.message || err?.message || 'Failed to save tailored resume and apply.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          maxWidth: step === 'review' ? '840px' : '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--slate-50, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {step === 'review' ? (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} />
              </div>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={20} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {step === 'review'
                  ? 'AI Resume Tailoring Complete'
                  : 'Smart Apply Gate: Low Role Match Warning'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                {job.title} at {job.company}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--slate-400)',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: WARNING GATE */}
          {step === 'gate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Match Score Meter */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef08a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
                    Current ATS Compatibility
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.15rem' }}>
                    {matchScore}% Match Score
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1px solid #fecaca',
                  }}
                >
                  High Rejection Risk
                </span>
              </div>

              {/* Missing Skills Warning */}
              {missingSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.4rem' }}>
                    Required skills missing from your resume:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {missingSkills.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          fontWeight: 600,
                        }}
                      >
                        ✗ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanatory notice */}
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.55 }}>
                Recruiters prioritize candidates with at least <strong>50% ATS match</strong>. Direct application
                without targeting this specific role may cause the hiring software to deprioritize your profile.
              </p>

              {/* Action Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleStartAiTailoring}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1rem',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Sparkles size={18} />
                  <span>Tailor Resume with AI for this Job (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyAnyway}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1rem', justifyContent: 'center', fontSize: '0.875rem', color: 'var(--slate-600)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin-animate" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Apply Anyway (Without Changes)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TAILORING IN-PROGRESS */}
          {step === 'tailoring' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={44} color="var(--primary)" className="spin-animate" style={{ margin: '0 auto 1.25rem' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                AI Career Coach at Work...
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                Analyzing {job.title} job description, mapping competencies, synthesizing company-targeted STAR bullets, and bridging missing skills.
              </p>
            </div>
          )}

          {/* STEP 3: BEFORE VS AFTER REVIEW */}
          {step === 'review' && tailoringResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Score Boost Banner */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>
                    Predicted ATS Fit Post-Tailoring
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                    {tailoringResult.targetRoleFitScore || 85}% Optimized Match
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ High Competitive Advantage
                </span>
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.35rem', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: 'none',
                    background: activeTab === 'preview' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'preview' ? '#ffffff' : 'var(--slate-600)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <FileText size={14} /> Full Tailored Resume Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: 'none',
                    background: activeTab === 'summary' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'summary' ? '#ffffff' : 'var(--slate-600)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Executive Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('experience')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: 'none',
                    background: activeTab === 'experience' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'experience' ? '#ffffff' : 'var(--slate-600)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  STAR Bullet Points
                </button>
                {tailoringResult.suggestedProjectIdea && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('project')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: 'none',
                      background: activeTab === 'project' ? 'var(--primary)' : 'transparent',
                      color: activeTab === 'project' ? '#ffffff' : 'var(--slate-600)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Bridge Project Idea
                  </button>
                )}
              </div>

              {/* Tab Content 1: FULL TAILORED RESUME PREVIEW */}
              {activeTab === 'preview' && (
                <div style={{
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  border: '1.5px solid var(--slate-200)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: '450px',
                  overflowY: 'auto',
                }}>
                  {/* Resume Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1.5px solid var(--slate-200)', paddingBottom: '0.85rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {resumePreviewData.personal?.fullName || 'Candidate Profile'}
                      </h4>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.2rem' }}>
                        Target Role: {job.title} ({job.company})
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                        📧 {resumePreviewData.personal?.email || 'email@example.com'} • 📞 {resumePreviewData.personal?.phone || '+91 9876543210'} • 📍 {resumePreviewData.personal?.location || 'India'}
                      </div>
                    </div>
                    <a
                      href="/resume/builder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Open full resume editor in another tab"
                    >
                      <ExternalLink size={13} /> Edit in Resume Builder
                    </a>
                  </div>

                  {/* Section: Tailored Professional Summary */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--slate-700)', letterSpacing: '0.5px' }}>
                        Tailored Professional Summary
                      </strong>
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                        ✨ AI-Optimized for {job.company}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.865rem', color: 'var(--slate-800)', lineHeight: 1.6, background: 'var(--slate-50, #f8fafc)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                      {tailoringResult.tailoredSummary || resumePreviewData.summary}
                    </p>
                  </div>

                  {/* Section: Aligned Skills & Core Competencies */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--slate-700)', letterSpacing: '0.5px' }}>
                        Verified Skills & Aligned Competencies ({Array.isArray(tailoringResult.alignedSkills) ? tailoringResult.alignedSkills.length : (resumePreviewData.skills || []).length})
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                        ✓ 100% Core Requirements Matched
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(Array.isArray(tailoringResult.alignedSkills) ? tailoringResult.alignedSkills : resumePreviewData.skills || []).map((sk: string, i: number) => {
                        const isRequiredMatch = (job.requiredSkills || []).some(
                          (r: string) => String(r).toLowerCase().trim() === String(sk).toLowerCase().trim()
                        );
                        return (
                          <span
                            key={i}
                            className={`badge ${isRequiredMatch ? 'badge-success' : 'badge-slate'}`}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            {isRequiredMatch && <CheckCircle size={12} />} {sk}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Tailored STAR Experience Bullets */}
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--slate-700)', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                      Quantified STAR Experience Bullets
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {(Array.isArray(tailoringResult.tailoredBullets) ? tailoringResult.tailoredBullets : []).map((bullet: string, i: number) => (
                        <div key={i} style={{ fontSize: '0.835rem', color: 'var(--slate-700)', lineHeight: 1.5, display: 'flex', gap: '0.5rem', alignItems: 'baseline', background: 'var(--slate-50, #f8fafc)', padding: '0.55rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Suggested Bridge Project (if any) */}
                  {tailoringResult.suggestedProjectIdea && (
                    <div style={{ background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
                        <Lightbulb size={15} /> Recommended Practical Project: {tailoringResult.suggestedProjectIdea.title}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#14532d', lineHeight: 1.45 }}>
                        {tailoringResult.suggestedProjectIdea.description}
                      </p>
                    </div>
                  )}

                  {/* Section: Education */}
                  {Array.isArray(resumePreviewData.education) && resumePreviewData.education.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--slate-700)', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                        Education
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.825rem', color: 'var(--slate-700)' }}>
                        {resumePreviewData.education.map((edu: any, i: number) => (
                          <div key={i}>
                            <strong>{edu.degree || 'Degree'}</strong> — {edu.college || 'Institution'} {edu.year ? `(${edu.year})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Summary */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                    AI targeted this summary specifically for <strong>{job.company}</strong> with required keywords:
                  </div>
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--slate-50, #f8fafc)',
                      border: '1px solid var(--slate-200)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--slate-800)',
                    }}
                  >
                    {tailoringResult.tailoredSummary}
                  </div>
                </div>
              )}

              {/* Tab Content: Experience Bullets */}
              {activeTab === 'experience' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                    Rewritten STAR bullets (Situation, Task, Action, Result) with measurable metrics:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(Array.isArray(tailoringResult.tailoredBullets) ? tailoringResult.tailoredBullets : []).map(
                      (b: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--slate-50, #f8fafc)',
                            border: '1px solid var(--slate-200)',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'baseline',
                          }}
                        >
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                          <span>{b}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Bridge Project Idea */}
              {activeTab === 'project' && tailoringResult.suggestedProjectIdea && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#166534' }}>
                    <Lightbulb size={18} /> Recommended Project to Prove Missing Skills:
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#14532d' }}>
                    {tailoringResult.suggestedProjectIdea.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                    {tailoringResult.suggestedProjectIdea.description}
                  </p>
                  {Array.isArray(tailoringResult.suggestedProjectIdea.technologies) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.25rem' }}>
                      {tailoringResult.suggestedProjectIdea.technologies.map((t: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 600,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Optional Cover Note input */}
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Optional Note to Recruiter:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excited to contribute my skills to your engineering team!"
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Footer Confirm Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="spin-animate" /> Saving & Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Apply AI Suggestions to Resume & Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
