import React from 'react';
import { ResumeBuilderData } from '../../types';
import { splitCustomSections, renderCustomSectionLines } from './templateUtils';
import { User, Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

export const ProfessionalPhotoTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections, targetRole } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  const { projectLike: projectLikeSections, others: otherCustomSections } = splitCustomSections(customSections);

  // Get initials for placeholder
  const getInitials = (name?: string) => {
    if (!name) return 'CV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        lineHeight: isOnePage ? '1.38' : '1.5',
        fontSize: isOnePage ? '9.5pt' : '10pt',
      }}
    >
      {/* ========================================================
          HEADER: Photo + Candidate Information Split Banner
          ======================================================== */}
      <div
        className="resume-section"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isOnePage ? '16px' : '22px',
          paddingBottom: isOnePage ? '12px' : '18px',
          borderBottom: '2.5px solid #2563eb',
          marginBottom: isOnePage ? '12px' : '18px',
        }}
      >
        {/* Profile Photo / Avatar Container */}
        <div
          style={{
            flexShrink: 0,
            width: isOnePage ? '85px' : '105px',
            height: isOnePage ? '85px' : '105px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #2563eb',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {personal?.photoUrl ? (
            <img
              src={personal.photoUrl}
              alt={personal?.fullName || 'Candidate Photo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                // If image fails to load, replace with styled placeholder
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: isOnePage ? '18pt' : '22pt',
                letterSpacing: '1px',
              }}
            >
              {getInitials(personal?.fullName)}
            </div>
          )}
        </div>

        {/* Candidate Details & Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: isOnePage ? '20pt' : '24pt',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {personal?.fullName || 'Candidate Name'}
          </h1>

          {targetRole && (
            <div
              style={{
                fontSize: isOnePage ? '10.5pt' : '12pt',
                fontWeight: 700,
                color: '#2563eb',
                marginTop: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {targetRole}
            </div>
          )}

          {/* Contact Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isOnePage ? '6px 12px' : '8px 16px',
              marginTop: isOnePage ? '6px' : '10px',
              fontSize: isOnePage ? '8.5pt' : '9pt',
              color: '#475569',
            }}
          >
            {personal?.email && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} color="#2563eb" /> {personal.email}
              </span>
            )}
            {personal?.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} color="#2563eb" /> {personal.phone}
              </span>
            )}
            {personal?.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#2563eb" /> {personal.location}
              </span>
            )}
            {personal?.linkedin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', overflowWrap: 'anywhere' }}>
                <Linkedin size={12} color="#2563eb" /> {personal.linkedin}
              </span>
            )}
            {personal?.github && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', overflowWrap: 'anywhere' }}>
                <Github size={12} color="#2563eb" /> {personal.github}
              </span>
            )}
            {personal?.portfolioUrl && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', overflowWrap: 'anywhere' }}>
                <Globe size={12} color="#2563eb" /> {personal.portfolioUrl}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          1. PROFESSIONAL SUMMARY
          ======================================================== */}
      {summary && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10.5pt' : '11.5pt',
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Executive Summary
          </h2>
          <p
            style={{
              margin: 0,
              color: '#334155',
              textAlign: 'justify',
              whiteSpace: 'pre-line',
            }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* ========================================================
          2. CORE COMPETENCIES & SKILLS
          ======================================================== */}
      {skills && skills.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10.5pt' : '11.5pt',
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '8px',
            }}
          >
            Technical & Professional Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '8.5pt' : '9.5pt', color: '#0f172a' }}>
              {skills.map((skill, i) => {
                const colonIdx = skill.indexOf(':');
                if (colonIdx > 0) {
                  const category = skill.substring(0, colonIdx).trim();
                  const details = skill.substring(colonIdx + 1).trim();
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: isOnePage ? '2px' : '4px',
                        lineHeight: isOnePage ? '1.3' : '1.42',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{category}: </span>
                      <span>{details}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ marginBottom: isOnePage ? '2px' : '4px' }}>
                    <span>• {skill}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isOnePage ? '4px 8px' : '6px 10px' }}>
              {skills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    background: '#f8fafc',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: isOnePage ? '2px 7px' : '3px 9px',
                    fontSize: isOnePage ? '8.5pt' : '9pt',
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          3. WORK EXPERIENCE
          ======================================================== */}
      {experience && experience.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10.5pt' : '11.5pt',
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Professional Experience
          </h2>
          {experience.map((exp, i) => (
            <div
              key={i}
              className="resume-item resume-experience-item"
              style={{ marginBottom: isOnePage ? '8px' : '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <div>
                  <strong style={{ fontSize: isOnePage ? '9.5pt' : '10.5pt', color: '#0f172a' }}>
                    {exp.role || 'Role Title'}
                  </strong>{' '}
                  <span style={{ color: '#475569', fontWeight: 600 }}>• {exp.company || 'Company'}</span>
                </div>
                <span style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic' }}>
                  {exp.duration}
                </span>
              </div>
              {exp.description && (
                <div
                  style={{
                    marginTop: '3px',
                    color: '#334155',
                    whiteSpace: 'pre-line',
                    textAlign: 'justify',
                  }}
                >
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ========================================================
          4. KEY PROJECTS
          ======================================================== */}
      {projects && projects.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10.5pt' : '11.5pt',
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              borderBottom: '1.5px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Key Projects
          </h2>
          {projects.map((proj, i) => (
            <div
              key={i}
              className="resume-item resume-project-item"
              style={{ marginBottom: isOnePage ? '8px' : '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <div>
                  <strong style={{ fontSize: isOnePage ? '9.5pt' : '10.5pt', color: '#0f172a' }}>
                    {proj.name}
                  </strong>
                  {proj.technologies && (
                    <span style={{ color: '#64748b', fontSize: '9pt', marginLeft: '6px' }}>
                      ({proj.technologies})
                    </span>
                  )}
                </div>
                {proj.link && (
                  <span
                    style={{
                      fontSize: '8.5pt',
                      color: '#2563eb',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-all',
                    }}
                  >
                    {proj.link}
                  </span>
                )}
              </div>
              {proj.description && (
                <div
                  style={{
                    marginTop: '2px',
                    color: '#334155',
                    whiteSpace: 'pre-line',
                    textAlign: 'justify',
                  }}
                >
                  {proj.description}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

            {/* Project-like Custom Sections (Hackathons, Competitions, Publications) */}
      {projectLikeSections &&
        projectLikeSections.length > 0 &&
        projectLikeSections.map((sec, i) => (
          <section
            key={`proj-custom-${i}`}
            className="resume-section"
            style={{ marginBottom: isOnePage ? '8px' : '12px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10.5pt' : '11.5pt',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                borderBottom: '1.5px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '5px' : '8px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#0f172a',
              textColor: '#334155',
              metaColor: '#2563eb',
            })}
          </section>
        ))}

      {/* ========================================================
          5. EDUCATION & CERTIFICATIONS (Side-by-Side or Stacked)
          ======================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: education?.length && certifications?.length ? '1fr 1fr' : '1fr',
          gap: isOnePage ? '12px' : '18px',
          marginBottom: isOnePage ? '8px' : '14px',
        }}
      >
        {/* Education */}
        {education && education.length > 0 && (
          <section className="resume-section">
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10pt' : '11pt',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                borderBottom: '1.5px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '5px' : '8px',
              }}
            >
              Education
            </h2>
            {education.map((edu, i) => (
              <div
                key={i}
                className="resume-item resume-education-item"
                style={{ marginBottom: '6px' }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {edu.degree || 'Degree'}
                </div>
                <div style={{ fontSize: '9pt', color: '#475569' }}>
                  {edu.college || 'Institution'}
                  {edu.year && <span> • {edu.year}</span>}
                  {edu.cgpa && <span> • GPA: {edu.cgpa}</span>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="resume-section">
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10pt' : '11pt',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                borderBottom: '1.5px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '5px' : '8px',
              }}
            >
              Certifications
            </h2>
            {certifications.map((c, i) => (
              <div
                key={i}
                className="resume-item resume-cert-item"
                style={{ marginBottom: '6px' }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '9pt', color: '#475569' }}>
                  {c.issuer}
                  {c.year && <span> • {c.year}</span>}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Other Custom Sections (Awards, Volunteering, Leadership, etc.) */}
      {otherCustomSections &&
        otherCustomSections.length > 0 &&
        otherCustomSections.map((sec, i) => (
          <section
            key={`other-custom-${i}`}
            className="resume-section"
            style={{ marginBottom: isOnePage ? '8px' : '12px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10.5pt' : '11.5pt',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                borderBottom: '1.5px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '5px' : '8px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#0f172a',
              textColor: '#334155',
              metaColor: '#2563eb',
            })}
          </section>
        ))}
    </div>
  );
};
