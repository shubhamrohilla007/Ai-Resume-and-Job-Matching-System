import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { builderApi, authApi } from '../api/client';
import { ResumeBuilderData, EducationItem, ExperienceItem, ProjectItem, CertificationItem, CustomSectionItem } from '../types';
import { TEMPLATES } from '../features/templates/templateList';
import { ResumeRenderer } from '../features/templates/ResumeRenderer';
import { SkillChipInput } from '../components/SkillChipInput';
import {
  FileText,
  Save,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Wand2,
  ChevronDown,
  ExternalLink,
  Camera,
  User,
  Upload,
  FileCheck,
  AlertTriangle,
  X,
  Layers,
} from 'lucide-react';

export const ResumeBuilderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const templateQuery = searchParams.get('template');
  const resumeIdQuery = searchParams.get('resumeId') || searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');

  // Photo Upload State
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRole, setAiRole] = useState('');

  // AI 1-Page Optimizer State
  const [showOnePageModal, setShowOnePageModal] = useState(false);
  const [onePageOptimizing, setOnePageOptimizing] = useState(false);
  const [optimizedDraft, setOptimizedDraft] = useState<{ summary?: string; experience?: ExperienceItem[]; projects?: ProjectItem[]; isFallback?: boolean } | null>(null);

  // Skills Editor Mode (Categorized rows vs Flat chips)
  const [skillsMode, setSkillsMode] = useState<'categorized' | 'flat'>('categorized');

  const [resume, setResume] = useState<ResumeBuilderData>({
    templateId: templateQuery || 'ats-classic',
    pageMode: 'multi-page',
    careerCategory: 'tech',
    targetRole: '',
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolioUrl: '',
      photoUrl: '',
    },
    summary: '',
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    customSections: [],
  });

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await builderApi.getResume({ resumeId: resumeIdQuery || undefined });
        if (res.success && res.resume) {
          const loaded = res.resume;
          let personal = loaded.personal || {};

          // Auto-fill fullName/email from logged-in user if completely empty and not from uploaded source
          if (!personal.fullName || !personal.email) {
            try {
              const userRes = await authApi.getCurrentUser();
              if (userRes.success && userRes.user) {
                personal = {
                  ...personal,
                  fullName: personal.fullName || userRes.user.fullName || '',
                  email: personal.email || userRes.user.email || '',
                };
              }
            } catch (err) {
              // Ignore auth session retrieval error
            }
          }

          setResume({
            ...loaded,
            _id: loaded._id,
            sourceResume: loaded.sourceResume,
            sourceOriginalName: loaded.sourceOriginalName || '',
            pageMode: loaded.pageMode || 'multi-page',
            templateId: templateQuery || loaded.templateId || 'ats-classic',
            personal: {
              ...personal,
              photoUrl: personal.photoUrl || '',
            },
            education: Array.isArray(loaded.education) ? loaded.education : [],
            skills: Array.isArray(loaded.skills) ? loaded.skills : [],
            experience: Array.isArray(loaded.experience) ? loaded.experience : [],
            projects: Array.isArray(loaded.projects) ? loaded.projects : [],
            certifications: Array.isArray(loaded.certifications) ? loaded.certifications : [],
            customSections: Array.isArray(loaded.customSections) ? loaded.customSections : [],
          });
          if (Array.isArray(loaded.skills) && loaded.skills.some((s: string) => s.includes(':'))) {
            setSkillsMode('categorized');
          } else if (Array.isArray(loaded.skills) && loaded.skills.length > 0) {
            setSkillsMode('flat');
          }
          if (loaded.targetRole) {
            setAiRole(loaded.targetRole);
          }
        } else {
          setErrorMsg(res?.message || 'Failed to load existing resume data.');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'The requested resume could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [templateQuery, resumeIdQuery]);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await builderApi.saveResume(resume);
      if (res.success) {
        setSuccessMsg('Resume saved successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  // AI Improve Section
  const handleAiImprove = async (section: 'summary' | 'experience' | 'project', text: string, index?: number) => {
    if (!text.trim()) {
      setErrorMsg('Please enter text into this section before requesting AI improvements.');
      return;
    }

    setImprovingSection(`${section}-${index !== undefined ? index : 'root'}`);
    setErrorMsg(null);

    try {
      const res = await builderApi.improveSection({
        section,
        text,
        technologies: index !== undefined && section === 'project' ? resume.projects[index]?.technologies : '',
      });

      if (res.success && res.improvedText) {
        if (section === 'summary') {
          setResume((prev) => ({ ...prev, summary: res.improvedText }));
        } else if (section === 'experience' && index !== undefined) {
          const updated = [...resume.experience];
          updated[index] = { ...updated[index], description: res.improvedText };
          setResume((prev) => ({ ...prev, experience: updated }));
        } else if (section === 'project' && index !== undefined) {
          const updated = [...resume.projects];
          updated[index] = { ...updated[index], description: res.improvedText };
          setResume((prev) => ({ ...prev, projects: updated }));
        }
        setSuccessMsg('AI polished text updated!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'AI improvement temporarily unavailable.');
    } finally {
      setImprovingSection(null);
    }
  };

  // AI Full Resume Generator
  const handleFullAiGenerate = async () => {
    if (!aiRole.trim()) {
      setErrorMsg('Target Job Role is required for AI resume generation.');
      return;
    }

    setAiGenerating(true);
    setErrorMsg(null);

    try {
      const res = await builderApi.generateAIResume({
        ...resume.personal,
        personal: resume.personal,
        targetRole: aiRole.trim(),
        skills: resume.skills,
        education: resume.education,
        experience: resume.experience,
        projects: resume.projects,
        certifications: resume.certifications,
        customSections: resume.customSections,
        templateId: resume.templateId,
        careerCategory: resume.careerCategory,
      });

      if (res.success && res.resume) {
        const loaded = res.resume;
        setResume((prev) => ({
          ...prev,
          ...loaded,
          pageMode: prev.pageMode || loaded.pageMode || 'multi-page',
          templateId: prev.templateId || loaded.templateId || 'ats-classic',
          careerCategory: loaded.careerCategory || prev.careerCategory || 'tech',
          targetRole: loaded.targetRole || aiRole.trim(),
          personal: {
            ...prev.personal,
            ...(loaded.personal || {}),
            photoUrl: loaded.personal?.photoUrl || prev.personal.photoUrl || '',
          },
          summary: loaded.summary || '',
          skills: Array.isArray(loaded.skills) ? loaded.skills : [],
          education: Array.isArray(loaded.education) ? loaded.education : [],
          experience: Array.isArray(loaded.experience) ? loaded.experience : [],
          projects: Array.isArray(loaded.projects) ? loaded.projects : [],
          certifications: Array.isArray(loaded.certifications) ? loaded.certifications : [],
          customSections: Array.isArray(loaded.customSections) && loaded.customSections.length > 0
            ? loaded.customSections
            : prev.customSections,
        }));

        setShowAiModal(false);
        const msg = res.isFallback
          ? 'Role-tailored resume draft synthesized and applied! (AI quota fallback used)'
          : 'Full AI resume synthesized and applied successfully!';
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res?.message || 'AI resume generation failed to return content.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Profile Photo Upload Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    setPhotoUploading(true);
    setErrorMsg(null);
    try {
      const res = await builderApi.uploadPhoto(file, resume._id || resume.sourceResume);
      if (res.success && res.photoUrl) {
        setResume((prev) => ({
          ...prev,
          personal: { ...prev.personal, photoUrl: res.photoUrl },
        }));
        setSuccessMsg('Profile photo uploaded and saved successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = async () => {
    try {
      const res = await builderApi.deletePhoto(resume._id || resume.sourceResume);
      if (res.success) {
        setResume((prev) => ({
          ...prev,
          personal: { ...prev.personal, photoUrl: '' },
        }));
        setSuccessMsg('Profile photo removed.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove photo.');
    }
  };

  // AI 1-Page Optimizer Handlers
  const handleOpenOnePageOptimizer = async () => {
    setOnePageOptimizing(true);
    setErrorMsg(null);
    try {
      const res = await builderApi.optimizeOnePage({
        summary: resume.summary,
        experience: resume.experience,
        projects: resume.projects,
        skills: resume.skills,
        targetRole: resume.targetRole,
      });

      if (res.success && res.conciseContent) {
        setOptimizedDraft(res.conciseContent);
        setShowOnePageModal(true);
      } else {
        setErrorMsg('Failed to generate concise one-page content.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to run AI 1-Page Optimizer.');
    } finally {
      setOnePageOptimizing(false);
    }
  };

  const handleApplyOnePageOptimization = () => {
    if (!optimizedDraft) return;

    setResume((prev) => ({
      ...prev,
      pageMode: 'one-page',
      summary: optimizedDraft.summary !== undefined ? optimizedDraft.summary : prev.summary,
      experience: Array.isArray(optimizedDraft.experience) && optimizedDraft.experience.length > 0
        ? optimizedDraft.experience
        : prev.experience,
      projects: Array.isArray(optimizedDraft.projects) && optimizedDraft.projects.length > 0
        ? optimizedDraft.projects
        : prev.projects,
    }));

    setShowOnePageModal(false);
    setSuccessMsg('Concise 1-page resume wording applied successfully!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Check if content exceeds 1 standard page limits
  const isContentLengthExceeded = (resume.pageMode === 'one-page') && (
    (resume.summary?.length || 0) > 350 ||
    (resume.experience?.length || 0) > 3 ||
    (resume.projects?.length || 0) > 3 ||
    (resume.skills?.length || 0) > 16 ||
    (resume.certifications?.length || 0) > 4
  );

  // Handlers for array mutations
  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', college: '', year: '', cgpa: '' }],
    }));
  };

  const removeEducation = (index: number) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }],
    }));
  };

  const removeExperience = (index: number) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: '', technologies: '', description: '', link: '' }],
    }));
  };

  const removeProject = (index: number) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    setResume((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '' }],
    }));
  };

  const removeCertification = (index: number) => {
    setResume((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const addCustomSection = () => {
    setResume((prev) => ({
      ...prev,
      customSections: [...prev.customSections, { title: 'Volunteering & Awards', content: '', items: [] }],
    }));
  };

  const removeCustomSection = (index: number) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index),
    }));
  };

  // Helper functions for Categorized Skills
  const parseSkillsToCategories = (skillsList: string[]) => {
    if (!skillsList || skillsList.length === 0) return [];
    return skillsList.map((line) => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        return {
          category: line.substring(0, idx).trim(),
          items: line.substring(idx + 1).trim(),
        };
      }
      return {
        category: '',
        items: line.trim(),
      };
    });
  };

  const handleCategoryChange = (index: number, field: 'category' | 'items', value: string) => {
    const categories = parseSkillsToCategories(resume.skills);
    if (categories[index]) {
      categories[index][field] = value;
      const updated = categories.map((c) => {
        const cat = c.category;
        return `${cat}: ${c.items}`;
      });
      setResume((prev) => ({ ...prev, skills: updated }));
    }
  };

  const addSkillCategory = () => {
    setResume((prev) => ({
      ...prev,
      skills: [...prev.skills, 'New Category: '],
    }));
  };

  const removeSkillCategory = (index: number) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const switchToFlatSkills = () => {
    const flat: string[] = [];
    for (const s of resume.skills) {
      if (s.includes(':')) {
        const parts = s.substring(s.indexOf(':') + 1).split(/[,;•|]/).map((item) => item.trim()).filter(Boolean);
        flat.push(...parts);
      } else if (s.trim()) {
        flat.push(s.trim());
      }
    }
    setResume((prev) => ({ ...prev, skills: flat }));
    setSkillsMode('flat');
  };

  const switchToCategorizedSkills = () => {
    if (resume.skills.some((s) => s.includes(':'))) {
      setSkillsMode('categorized');
      return;
    }
    if (resume.skills.length > 0) {
      setResume((prev) => ({ ...prev, skills: [`Technical Skills: ${prev.skills.join(', ')}`] }));
    } else {
      setResume((prev) => ({ ...prev, skills: ['Technical Skills: '] }));
    }
    setSkillsMode('categorized');
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
      {/* Top Action Bar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--slate-200)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Template Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Template:</label>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px', maxWidth: '240px', padding: '0.45rem 0.65rem' }}
            value={resume.templateId}
            onChange={(e) => setResume({ ...resume, templateId: e.target.value })}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.badge})
              </option>
            ))}
          </select>

          <Link to="/resume/templates" className="btn btn-secondary btn-sm">
            Gallery
          </Link>
        </div>

        {/* Page Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--slate-100)', padding: '3px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)', paddingLeft: '4px', paddingRight: '2px' }}>
            Mode:
          </span>
          <button
            type="button"
            onClick={() => setResume({ ...resume, pageMode: 'one-page' })}
            className={`btn btn-sm ${resume.pageMode === 'one-page' ? 'btn-primary' : ''}`}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.78rem',
              background: resume.pageMode === 'one-page' ? 'var(--primary)' : 'transparent',
              color: resume.pageMode === 'one-page' ? '#fff' : 'var(--slate-700)',
              border: 'none',
              boxShadow: resume.pageMode === 'one-page' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            One-Page (A4)
          </button>
          <button
            type="button"
            onClick={() => setResume({ ...resume, pageMode: 'multi-page' })}
            className={`btn btn-sm ${resume.pageMode !== 'one-page' ? 'btn-primary' : ''}`}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.78rem',
              background: resume.pageMode !== 'one-page' ? 'var(--primary)' : 'transparent',
              color: resume.pageMode !== 'one-page' ? '#fff' : 'var(--slate-700)',
              border: 'none',
              boxShadow: resume.pageMode !== 'one-page' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Multi-Page
          </button>
        </div>

        {/* View Toggle (Mobile / Desktop) */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`btn btn-sm ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Editor Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`btn btn-sm ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Live Preview
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="btn btn-outline-primary btn-sm"
          >
            <Wand2 size={15} /> AI Generator
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Resume'}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
          >
            <Printer size={15} /> Export PDF
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success no-print">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger no-print">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Uploaded ATS Resume Context Banner */}
      {resume.sourceOriginalName && (
        <div className="alert alert-info no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: '#1E40AF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Editing Synchronized Resume: {resume.sourceOriginalName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#3B82F6', marginTop: '2px' }}>
                Extracted from your uploaded document. All edits will save to this resume record.
              </div>
            </div>
          </div>
          {resume.sourceResume && (
            <Link
              to={`/resume/analysis?id=${resume.sourceResume}`}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', background: '#fff' }}
            >
              View ATS Analysis &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Main Container: Split or Full */}
      <div className={`resume-builder-grid ${activeTab === 'split' ? 'split' : 'full'}`}>
        {/* ==========================================
            LEFT PANE: Form Editor
            ========================================== */}
        {(activeTab === 'editor' || activeTab === 'split') && (
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Header & Contact Details */}
            <div className="card">
              <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                1. Personal Information & Header
              </h2>

              {/* Profile Photo Upload Control */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                border: '1px dashed var(--slate-300)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--slate-50)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--slate-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--slate-300)',
                  flexShrink: 0,
                }}>
                  {resume.personal.photoUrl ? (
                    <img
                      src={resume.personal.photoUrl}
                      alt={resume.personal.fullName || 'Candidate Photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={32} color="var(--slate-400)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem', color: 'var(--slate-800)' }}>
                    Profile Photo (Optional)
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--slate-500)', marginBottom: '0.45rem', lineHeight: 1.4 }}>
                    Displayed in photo templates (e.g., <em>Professional Photo Template</em>). JPG, PNG, or WebP up to 5MB.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      disabled={photoUploading}
                    >
                      <Camera size={13} /> {photoUploading ? 'Uploading...' : (resume.personal.photoUrl ? 'Change Photo' : 'Upload Photo')}
                    </button>
                    {resume.personal.photoUrl && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.fullName}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, fullName: e.target.value } })}
                    placeholder="e.g. Rohil Kumar"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Job Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.targetRole}
                    onChange={(e) => setResume({ ...resume, targetRole: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={resume.personal.email}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, email: e.target.value } })}
                    placeholder="you@domain.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.phone}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, phone: e.target.value } })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Location (City, Country)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.location}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, location: e.target.value } })}
                    placeholder="New Delhi, India"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Portfolio / Website Link</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.portfolioUrl || ''}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, portfolioUrl: e.target.value } })}
                    placeholder="https://myportfolio.design"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.linkedin}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, linkedin: e.target.value } })}
                    placeholder="linkedin.com/in/rohil"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resume.personal.github}
                    onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, github: e.target.value } })}
                    placeholder="github.com/rohil"
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  2. Professional Summary
                </h2>
                <button
                  type="button"
                  onClick={() => handleAiImprove('summary', resume.summary)}
                  className="btn btn-outline-primary btn-sm"
                  disabled={improvingSection === 'summary-root'}
                >
                  <Sparkles size={14} /> {improvingSection === 'summary-root' ? 'Polishing...' : 'AI Enhance'}
                </button>
              </div>

              <textarea
                className="form-textarea"
                rows={4}
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                placeholder="Write a concise overview highlighting your core strengths, proven outcomes, and technical background..."
              />
              <div className="form-hint">Pro-tip: Focus on concrete responsibilities without unverifiable claims.</div>
            </div>

            {/* 3. Skills */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                    3. Technical Skills & Competencies
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    Organize skills into ATS categories (e.g. Programming Languages, Databases) or manage flat skill tags.
                  </div>
                </div>

                {/* View Switcher: Categorized vs Flat */}
                <div style={{ display: 'flex', background: 'var(--slate-100)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    type="button"
                    onClick={switchToCategorizedSkills}
                    className="btn btn-sm"
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      background: skillsMode === 'categorized' ? 'var(--primary)' : 'transparent',
                      color: skillsMode === 'categorized' ? '#fff' : 'var(--slate-600)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Categorized Rows
                  </button>
                  <button
                    type="button"
                    onClick={switchToFlatSkills}
                    className="btn btn-sm"
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      background: skillsMode === 'flat' ? 'var(--primary)' : 'transparent',
                      color: skillsMode === 'flat' ? '#fff' : 'var(--slate-600)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Flat Tags
                  </button>
                </div>
              </div>

              {skillsMode === 'categorized' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {parseSkillsToCategories(resume.skills).map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(140px, 1fr) 2fr auto',
                        gap: '0.65rem',
                        alignItems: 'center',
                        background: 'var(--slate-50)',
                        border: '1px solid var(--slate-200)',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '3px' }}>
                          Category Name
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem', fontWeight: 600 }}
                          value={cat.category}
                          onChange={(e) => handleCategoryChange(idx, 'category', e.target.value)}
                          placeholder="e.g. Programming Languages"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '3px' }}>
                          Skills & Technologies (comma separated)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem' }}
                          value={cat.items}
                          onChange={(e) => handleCategoryChange(idx, 'items', e.target.value)}
                          placeholder="e.g. Java, Python, JavaScript"
                        />
                      </div>
                      <div style={{ paddingTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => removeSkillCategory(idx)}
                          className="btn btn-outline-danger btn-sm"
                          title="Remove Category"
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={addSkillCategory}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={14} /> Add Skill Category
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)', marginBottom: '0.75rem' }}>
                    Add skills by typing and pressing <strong>Enter</strong> or <strong>comma</strong>. You can also paste a comma-separated list.
                  </p>
                  <SkillChipInput
                    skills={resume.skills}
                    onChange={(newSkills) => setResume({ ...resume, skills: newSkills })}
                    placeholder="Type skill & press Enter or Comma (e.g. React, TypeScript, Docker)..."
                  />
                </>
              )}
            </div>

            {/* 4. Experience Section */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  4. Experience ({resume.experience.length})
                </h2>
                <button type="button" onClick={addExperience} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Role
                </button>
              </div>

              {resume.experience.map((exp, i) => (
                <div key={i} style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'var(--slate-50)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Entry #{i + 1}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleAiImprove('experience', exp.description, i)}
                        className="btn btn-outline-primary btn-sm"
                        disabled={improvingSection === `experience-${i}`}
                      >
                        <Sparkles size={13} /> {improvingSection === `experience-${i}` ? 'Polishing...' : 'AI Polish'}
                      </button>
                      <button type="button" onClick={() => removeExperience(i)} className="btn btn-danger btn-sm">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Job Title / Role</label>
                      <input
                        type="text"
                        className="form-input"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[i].role = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[i].company = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        placeholder="e.g. Google Cloud"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration / Dates</label>
                    <input
                      type="text"
                      className="form-input"
                      value={exp.duration}
                      onChange={(e) => {
                        const updated = [...resume.experience];
                        updated[i].duration = e.target.value;
                        setResume({ ...resume, experience: updated });
                      }}
                      placeholder="e.g. Jan 2024 - Present"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Key Responsibilities & Deliverables</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={exp.description}
                      onChange={(e) => {
                        const updated = [...resume.experience];
                        updated[i].description = e.target.value;
                        setResume({ ...resume, experience: updated });
                      }}
                      placeholder="• Engineered microservice REST endpoints handling high volume requests&#10;• Collaborated with product team on React UI features"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Projects Section */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  5. Projects ({resume.projects.length})
                </h2>
                <button type="button" onClick={addProject} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Project
                </button>
              </div>

              {resume.projects.map((proj, i) => (
                <div key={i} style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'var(--slate-50)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Project #{i + 1}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleAiImprove('project', proj.description, i)}
                        className="btn btn-outline-primary btn-sm"
                        disabled={improvingSection === `project-${i}`}
                      >
                        <Sparkles size={13} /> {improvingSection === `project-${i}` ? 'Polishing...' : 'AI Polish'}
                      </button>
                      <button type="button" onClick={() => removeProject(i)} className="btn btn-danger btn-sm">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Project Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={proj.name}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[i].name = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        placeholder="e.g. AI-Powered Resume System"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Technologies Used</label>
                      <input
                        type="text"
                        className="form-input"
                        value={proj.technologies}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[i].technologies = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        placeholder="e.g. React, Node.js, Gemini API, MongoDB"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Repository or Live URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = [...resume.projects];
                        updated[i].link = e.target.value;
                        setResume({ ...resume, projects: updated });
                      }}
                      placeholder="https://github.com/rohil/resume-system"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description & Technical Highlights</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...resume.projects];
                        updated[i].description = e.target.value;
                        setResume({ ...resume, projects: updated });
                      }}
                      placeholder="• Built semantic matching service blending rule-based score with Gemini AI&#10;• Designed responsive React Vite UI"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 6. Education Section */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  6. Education ({resume.education.length})
                </h2>
                <button type="button" onClick={addEducation} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Education
                </button>
              </div>

              {resume.education.map((edu, i) => (
                <div key={i} style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'var(--slate-50)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>Degree #{i + 1}</strong>
                    <button type="button" onClick={() => removeEducation(i)} className="btn btn-danger btn-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Degree / Program</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[i].degree = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        placeholder="e.g. Bachelor of Technology in CSE"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">University / College</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.college}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[i].college = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        placeholder="e.g. Delhi University"
                      />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Graduation Year</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.year}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[i].year = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        placeholder="e.g. 2026"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">CGPA / Percentage</label>
                      <input
                        type="text"
                        className="form-input"
                        value={edu.cgpa}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[i].cgpa = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        placeholder="e.g. 8.8 / 10"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 7. Certifications */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  7. Certifications ({resume.certifications.length})
                </h2>
                <button type="button" onClick={addCertification} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Certificate
                </button>
              </div>

              {resume.certifications.map((cert, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={cert.name}
                    onChange={(e) => {
                      const updated = [...resume.certifications];
                      updated[i].name = e.target.value;
                      setResume({ ...resume, certifications: updated });
                    }}
                    placeholder="Certificate Title (e.g. IBM Generative AI)"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={cert.issuer}
                    onChange={(e) => {
                      const updated = [...resume.certifications];
                      updated[i].issuer = e.target.value;
                      setResume({ ...resume, certifications: updated });
                    }}
                    placeholder="Issuer (e.g. IBM SkillsBuild)"
                    style={{ flex: 1.5 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={cert.year}
                    onChange={(e) => {
                      const updated = [...resume.certifications];
                      updated[i].year = e.target.value;
                      setResume({ ...resume, certifications: updated });
                    }}
                    placeholder="Year"
                    style={{ width: '80px' }}
                  />
                  <button type="button" onClick={() => removeCertification(i)} className="btn btn-danger btn-sm">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* 8. Custom Sections */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
                  8. Custom Sections ({resume.customSections.length})
                </h2>
                <button type="button" onClick={addCustomSection} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Section
                </button>
              </div>

              {resume.customSections.map((sec, i) => (
                <div key={i} style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'var(--slate-50)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={sec.title}
                      onChange={(e) => {
                        const updated = [...resume.customSections];
                        updated[i].title = e.target.value;
                        setResume({ ...resume, customSections: updated });
                      }}
                      placeholder="Section Title (e.g. Publications, Volunteer Work)"
                      style={{ fontWeight: '700' }}
                    />
                    <button type="button" onClick={() => removeCustomSection(i)} className="btn btn-danger btn-sm" style={{ marginLeft: '0.75rem' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={sec.content}
                    onChange={(e) => {
                      const updated = [...resume.customSections];
                      updated[i].content = e.target.value;
                      setResume({ ...resume, customSections: updated });
                    }}
                    placeholder="Section description or bullet points..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            RIGHT PANE: Live Template Preview
            ========================================== */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div
            className="resume-preview-pane"
            style={{
              position: activeTab === 'split' ? 'sticky' : 'static',
              top: '80px',
              maxHeight: activeTab === 'split' ? 'calc(100vh - 100px)' : 'none',
              overflowY: activeTab === 'split' ? 'auto' : 'visible',
              paddingRight: activeTab === 'split' ? '6px' : '0',
            }}
          >
            {/* One-Page Length Advisory Warning */}
            {resume.pageMode === 'one-page' && (
              <div
                className="no-print"
                style={{
                  background: isContentLengthExceeded ? '#FFFBEB' : '#EFF6FF',
                  border: `1px solid ${isContentLengthExceeded ? '#FCD34D' : '#BFDBFE'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.825rem',
                  color: isContentLengthExceeded ? '#92400E' : '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isContentLengthExceeded ? <AlertTriangle size={16} /> : <FileCheck size={16} />}
                  <span>
                    {isContentLengthExceeded
                      ? 'One-Page Advisory: Content length may exceed 1 standard A4 page.'
                      : 'One-Page Mode Active: Compact A4 single-page formatting applied.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenOnePageOptimizer}
                  className="btn btn-sm"
                  style={{
                    background: isContentLengthExceeded ? '#D97706' : 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.775rem',
                    padding: '0.3rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  disabled={onePageOptimizing}
                >
                  <Sparkles size={13} />
                  {onePageOptimizing ? 'Analyzing...' : 'AI 1-Page Optimizer'}
                </button>
              </div>
            )}

            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}>
              <span className="badge badge-primary">
                Live Document Preview • Template: {resume.templateId} • Mode: {resume.pageMode === 'one-page' ? '1-Page A4' : 'Multi-Page'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>

            <ResumeRenderer resume={resume} pageMode={resume.pageMode} />
          </div>
        )}

        {/* Off-screen / Print-only preview when in Editor Only tab */}
        {activeTab === 'editor' && (
          <div className="resume-preview-pane print-only" style={{ display: 'none' }}>
            <ResumeRenderer resume={resume} pageMode={resume.pageMode} />
          </div>
        )}
      </div>

      {/* Full AI Resume Generation Modal */}
      {showAiModal && (
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
          <div className="card" style={{ maxWidth: '540px', width: '100%' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles color="var(--primary)" />
                AI Full Resume Generator
              </h3>
              <button type="button" onClick={() => setShowAiModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Gemini AI will synthesize your target role with your entered facts to produce a professional summary, action-driven project bullets, and structured skill groupings.
            </p>

            {errorMsg && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Target Role / Designation</label>
              <input
                type="text"
                className="form-input"
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                placeholder="e.g. Full Stack Engineer / UI Designer / Product Manager"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowAiModal(false)} className="btn btn-secondary">
                Close
              </button>
              <button
                type="button"
                onClick={handleFullAiGenerate}
                className="btn btn-primary"
                disabled={aiGenerating || !aiRole.trim()}
              >
                {aiGenerating ? <span className="spinner" /> : 'Generate & Apply to Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 1-Page Optimizer Review Modal */}
      {showOnePageModal && optimizedDraft && (
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
          zIndex: 110,
          padding: '1.5rem',
        }}>
          <div className="card" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles color="var(--primary)" />
                AI 1-Page Optimizer Review
              </h3>
              <button type="button" onClick={() => setShowOnePageModal(false)} className="btn btn-secondary btn-sm">
                <X size={15} />
              </button>
            </div>

            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#1E40AF',
              lineHeight: 1.5,
            }}>
              <strong>Review Mode:</strong> The AI has analyzed your resume and prepared high-impact, concise wording designed to fit comfortably on 1 standard printed A4 page. <em>No content has been altered or deleted yet</em>. Review the proposed changes below before applying.
            </div>

            {/* Proposed Summary */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--slate-800)' }}>
                1. Concise Professional Summary (2 Sentences)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '0.25rem' }}>CURRENT SUMMARY:</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                    {resume.summary || <em>None provided</em>}
                  </div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>PROPOSED CONCISE SUMMARY:</div>
                  <div style={{ fontSize: '0.825rem', color: '#14532D', lineHeight: 1.5, fontWeight: 500 }}>
                    {optimizedDraft.summary}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed Experience Bullets */}
            {Array.isArray(optimizedDraft.experience) && optimizedDraft.experience.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--slate-800)' }}>
                  2. Distilled Experience Bullets (2 Punchy Bullets per Role)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {optimizedDraft.experience.map((exp, i) => (
                    <div key={i} style={{ background: '#F8FAFC', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
                        {exp.role} @ {exp.company} <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 400 }}>({exp.duration})</span>
                      </div>
                      <pre style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                        whiteSpace: 'pre-wrap',
                        color: '#15803D',
                        background: '#F0FDF4',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #DCFCE7',
                        lineHeight: 1.5,
                      }}>
                        {exp.description}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proposed Project Bullets */}
            {Array.isArray(optimizedDraft.projects) && optimizedDraft.projects.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--slate-800)' }}>
                  3. Concise Project Bullets (1–2 Impact Bullets)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {optimizedDraft.projects.map((proj, i) => (
                    <div key={i} style={{ background: '#F8FAFC', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
                        {proj.name} {proj.technologies && <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 400 }}>[{proj.technologies}]</span>}
                      </div>
                      <pre style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                        whiteSpace: 'pre-wrap',
                        color: '#15803D',
                        background: '#F0FDF4',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #DCFCE7',
                        lineHeight: 1.5,
                      }}>
                        {proj.description}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--slate-200)', paddingTop: '1rem' }}>
              <button type="button" onClick={() => setShowOnePageModal(false)} className="btn btn-secondary">
                Keep Original / Close
              </button>
              <button
                type="button"
                onClick={handleApplyOnePageOptimization}
                className="btn btn-primary"
              >
                Apply Concise 1-Page Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
