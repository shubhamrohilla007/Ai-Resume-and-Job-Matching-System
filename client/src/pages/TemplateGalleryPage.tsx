import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, TemplateInfo } from '../features/templates/templateList';
import { builderApi } from '../api/client';
import { ResumeBuilderData } from '../types';
import { ResumeRenderer } from '../features/templates/ResumeRenderer';
import { Sparkles, Check, Eye, ArrowRight, X } from 'lucide-react';

export const TemplateGalleryPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ats-classic');
  const [resumeData, setResumeData] = useState<ResumeBuilderData | null>(null);
  const [previewModalTemplate, setPreviewModalTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const res = await builderApi.getResume();
        if (res.success && res.resume) {
          setResumeData(res.resume);
          if (res.resume.templateId) {
            setSelectedTemplate(res.resume.templateId);
          }
        }
      } catch (err) {
        console.error('Failed to load resume for template gallery:', err);
      }
    };
    loadResume();
  }, []);

  const categories = [
    'All',
    'Executive & Multi-Profession',
    'Technology & Engineering',
    'Creative & Design',
    'Business & Management',
    'Research & Academia',
    'Entry Level & Graduate',
  ];

  const filteredTemplates = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleSelectTemplate = async (templateId: string) => {
    setSaving(true);
    try {
      setSelectedTemplate(templateId);
      if (resumeData) {
        await builderApi.saveResume({
          ...resumeData,
          templateId,
        });
      }
      navigate(`/resume/builder?template=${templateId}`);
    } catch (err) {
      console.error('Failed to switch template:', err);
      navigate(`/resume/builder?template=${templateId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
        }}>
          <Sparkles size={16} /> Multi-Profession Career Layouts
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--slate-900)' }}>
          Profession-Specific Resume Templates
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '1rem', marginTop: '0.35rem' }}>
          Select a tailored design for your career stage. Switch between templates at any time without losing any of your saved data.
        </p>
      </div>

      {/* Category Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '2.5rem',
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '9999px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        {filteredTemplates.map((tmpl) => {
          const isCurrent = selectedTemplate === tmpl.id;

          return (
            <div
              key={tmpl.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : undefined,
              }}
            >
              {/* Header Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{tmpl.category}</span>
                {isCurrent && (
                  <span className="badge badge-success">
                    <Check size={13} /> Active Template
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                {tmpl.name}
              </h3>

              <div style={{ fontSize: '0.825rem', fontWeight: '600', color: tmpl.accentColor, marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                {tmpl.badge}
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.5', flex: 1, marginBottom: '1rem' }}>
                {tmpl.description}
              </p>

              <div style={{
                fontSize: '0.8rem',
                color: 'var(--slate-600)',
                background: 'var(--slate-50)',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                border: '1px solid var(--slate-200)',
              }}>
                <strong style={{ color: 'var(--slate-800)' }}>Recommended for:</strong> {tmpl.recommendedFor}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplate(tmpl.id)}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={15} /> Preview
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                >
                  Use Template <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview Modal */}
      {previewModalTemplate && (
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
            maxWidth: '920px',
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
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--slate-200)',
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Template Preview: {previewModalTemplate}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Rendered with your current resume profile data
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(previewModalTemplate)}
                  className="btn btn-primary btn-sm"
                >
                  Select & Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplate(null)}
                  className="btn btn-secondary btn-sm"
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f1f5f9' }}>
              {resumeData ? (
                <ResumeRenderer resume={resumeData} templateId={previewModalTemplate} />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading resume data...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
