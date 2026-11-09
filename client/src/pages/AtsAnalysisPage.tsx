import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resumeApi } from '../api/client';
import { AtsAnalysis } from '../types';
import {
  Upload,
  Brain,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const AtsAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('resumeId') || searchParams.get('id');

  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null);
  const [resumesList, setResumesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAnalysis = async (targetId?: string) => {
    try {
      const data = await resumeApi.getAnalysis(targetId || queryId || undefined);
      if (data.hasResume && data.resume) {
        setAnalysis(data.resume);
      } else {
        setAnalysis(null);
      }
    } catch (err: any) {
      console.error('Failed to load ATS analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumesList = async () => {
    try {
      const res = await resumeApi.getResumesList();
      if (res.success && Array.isArray(res.resumes)) {
        setResumesList(res.resumes);
      }
    } catch (err) {
      // Ignore list fetch error
    }
  };

  useEffect(() => {
    fetchAnalysis();
    fetchResumesList();
  }, [queryId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.type)) {
      setErrorMsg('Only PDF and DOCX files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must not exceed 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resumeApi.uploadResume(file);
      if (res.success && res.resume) {
        setAnalysis(res.resume);
        setSuccessMsg('Resume parsed, analyzed, and synchronized with builder successfully!');
        fetchResumesList();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse and analyze resume.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#2563eb';
    if (score >= 40) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      {/* Page Header */}
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
            <Sparkles color="var(--primary)" />
            AI Resume & ATS Scan
          </h1>
          <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Evidence-based keyword audit, formatting checks, and skill-gap recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={17} />
            {uploading ? 'Analyzing Document...' : 'Upload New Resume'}
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc"
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>

          {analysis?.originalName && (
            <a href={resumeApi.getDownloadUrl(analysis.id)} className="btn btn-secondary" target="_blank" rel="noreferrer">
              <Download size={16} /> Download File
            </a>
          )}
        </div>
      </div>

      {/* Multiple Resumes Switcher (when user has uploaded more than 1 resume) */}
      {resumesList.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          background: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--slate-200)',
          flexWrap: 'wrap',
        }}>
          <FileText size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-800)' }}>
            Select Uploaded Resume ({resumesList.length}):
          </span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '240px', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
            value={analysis?.id || ''}
            onChange={(e) => {
              const targetId = e.target.value;
              if (targetId) {
                fetchAnalysis(targetId);
              }
            }}
          >
            {resumesList.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.originalName} ({r.atsScore}% ATS • {new Date(r.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {uploading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginBottom: '2rem' }}>
          <div className="spinner spinner-primary" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Extracting Text & Running ATS Analysis...</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '460px', margin: '0.5rem auto 0' }}>
            Gemini AI is scanning keyword density, structural sections, and job-market relevance.
          </p>
        </div>
      )}

      {!analysis && !uploading ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <FileText size={48} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            No Resume Analyzed Yet
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', maxWidth: '500px', margin: '0.5rem auto 1.75rem' }}>
            Upload your resume in PDF or DOCX format to receive an ATS score breakdown, strength identification, and missing skill suggestions.
          </p>
          <label className="btn btn-primary btn-lg" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Upload size={18} /> Upload Your Resume
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc"
              style={{ display: 'none' }}
            />
          </label>
        </div>
      ) : analysis ? (
        <div>
          {/* Top Score Banner */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            {/* ATS Score Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Overall ATS Score
              </div>
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(${scoreColor(analysis.atsScore)} ${analysis.atsScore}%, #e2e8f0 0)`,
                marginBottom: '0.75rem',
              }}>
                <span style={{ fontSize: '1.9rem', fontWeight: '800', color: scoreColor(analysis.atsScore) }}>
                  {analysis.atsScore}%
                </span>
              </div>
              <span className={`badge ${analysis.atsScore >= 80 ? 'badge-success' : analysis.atsScore >= 60 ? 'badge-primary' : 'badge-warning'}`}>
                {analysis.atsScore >= 80 ? 'Excellent Match' : analysis.atsScore >= 60 ? 'Good Formatting' : 'Needs Optimization'}
              </span>
            </div>

            {/* Analysis Mode & Origin */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Inspection Source
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`badge ${analysis.analysisMode === 'rule-based-fallback' ? 'badge-warning' : 'badge-primary'}`}>
                  <Brain size={14} /> {analysis.analysisMode === 'rule-based-fallback' ? 'Rule-Based Fallback' : 'Gemini AI Verified'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.75rem', lineHeight: '1.5' }}>
                {analysis.aiFeedback || 'Structural evaluation based on candidate evidence and keyword density.'}
              </p>
            </div>

            {/* Document Details */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Uploaded File
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--slate-900)' }}>
                {analysis.originalName || 'Uploaded Document'}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                {analysis.fileSize ? `${Math.round(analysis.fileSize / 1024)} KB` : ''} • Last scanned {analysis.updatedAt ? new Date(analysis.updatedAt).toLocaleDateString() : 'recently'}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/resume/builder?resumeId=${analysis.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                  Edit in Resume Builder <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {analysis.summary && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 className="card-title">Professional Profile Summary</h2>
              </div>
              <p style={{ color: 'var(--slate-700)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Strengths & Weaknesses Grid */}
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {/* Strengths */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                  <CheckCircle2 size={20} /> Resume Strengths
                </h2>
              </div>
              {analysis.strengths && analysis.strengths.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {analysis.strengths.map((str, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--slate-700)' }}>
                      <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>No specific strengths highlighted.</p>
              )}
            </div>

            {/* Areas for Improvement */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                  <AlertTriangle size={20} /> Optimization Opportunities
                </h2>
              </div>
              {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--slate-700)' }}>
                      <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>No critical issues detected.</p>
              )}
            </div>
          </div>

          {/* Skills Audit Grid */}
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {/* Extracted Skills */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Verified Extracted Skills</h2>
                <span className="badge badge-primary">{analysis.extractedSkills?.length || 0} Skills</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.extractedSkills && analysis.extractedSkills.length > 0 ? (
                  analysis.extractedSkills.map((s, i) => (
                    <span key={i} className="badge badge-primary">
                      {s}
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>No skills extracted from document.</p>
                )}
              </div>
            </div>

            {/* Missing In-Demand Skills */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Recommended Keywords to Add</h2>
                <Link to="/courses" className="badge badge-warning" style={{ textDecoration: 'none' }}>
                  Bridge Gaps ↗
                </Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
                  analysis.missingSkills.map((s, i) => (
                    <span key={i} className="badge badge-warning">
                      + {s}
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>Great job! No major keyword omissions detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Job Roles */}
          {analysis.recommendedJobs && analysis.recommendedJobs.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Suggested Job Role Targets</h2>
                <Link to="/jobs/recommended" className="btn btn-primary btn-sm">
                  View Matched Jobs <ArrowRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {analysis.recommendedJobs.map((role, i) => (
                  <span key={i} style={{
                    background: 'var(--slate-100)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'var(--slate-800)',
                  }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
