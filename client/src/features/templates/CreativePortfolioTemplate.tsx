import React from 'react';
import { ResumeBuilderData } from '../../types';

export const CreativePortfolioTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  return (
    <div
      style={{
        fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
        color: '#1f2937',
        lineHeight: isOnePage ? '1.38' : '1.5',
        fontSize: isOnePage ? '9.5pt' : '10pt',
      }}
    >
      {/* Creative Header */}
      <div
        className="resume-section"
        style={{
          background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
          padding: isOnePage ? '14px 18px' : '20px 22px',
          borderRadius: '10px',
          border: '1px solid #f0abfc',
          marginBottom: isOnePage ? '12px' : '18px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isOnePage ? '20pt' : '24pt',
              fontWeight: '800',
              color: '#581c87',
              letterSpacing: '-0.5px',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {personal?.fullName || 'Creative Specialist'}
          </h1>
          <div
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: '600',
              color: '#9333ea',
              marginTop: '2px',
            }}
          >
            {resume.targetRole || 'Designer & Creative Technologist'}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isOnePage ? '6px 10px' : '8px 12px',
              marginTop: isOnePage ? '5px' : '8px',
              fontSize: isOnePage ? '8.5pt' : '9pt',
              color: '#6b7280',
            }}
          >
            {personal?.email && <span>{personal.email}</span>}
            {personal?.phone && <span>• {personal.phone}</span>}
            {personal?.location && <span>• {personal.location}</span>}
            {personal?.linkedin && (
              <span style={{ overflowWrap: 'anywhere' }}>• {personal.linkedin}</span>
            )}
            {personal?.github && (
              <span style={{ overflowWrap: 'anywhere' }}>• {personal.github}</span>
            )}
          </div>
        </div>

        {personal?.portfolioUrl && (
          <div
            style={{
              background: '#9333ea',
              color: '#fff',
              padding: isOnePage ? '5px 12px' : '7px 14px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: isOnePage ? '8pt' : '8.5pt',
              boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.3)',
              overflowWrap: 'anywhere',
              wordBreak: 'break-all',
            }}
          >
            Portfolio: {personal.portfolioUrl}
          </div>
        )}
      </div>

      {/* Creative Statement / Summary */}
      {summary && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: '700',
              color: '#7e22ce',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Creative Vision & Background
          </h2>
          <p
            style={{
              fontSize: isOnePage ? '9pt' : '9.5pt',
              color: '#4b5563',
              margin: 0,
              textAlign: 'justify',
              whiteSpace: 'pre-line',
            }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* Selected Creative Projects */}
      {projects && projects.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: '700',
              color: '#7e22ce',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Featured Portfolio & Creative Projects
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: projects.length > 1 ? '1fr 1fr' : '1fr',
              gap: isOnePage ? '8px' : '12px',
            }}
          >
            {projects.map((proj, i) => (
              <div
                key={i}
                className="resume-item resume-project-item"
                style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: isOnePage ? '8px 10px' : '10px 12px',
                  background: '#faf5ff',
                }}
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
                  <strong style={{ color: '#581c87', fontSize: isOnePage ? '9pt' : '9.5pt' }}>
                    {proj.name}
                  </strong>
                  {proj.link && (
                    <span
                      style={{
                        fontSize: '7.5pt',
                        color: '#9333ea',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-all',
                      }}
                    >
                      {proj.link}
                    </span>
                  )}
                </div>
                {proj.technologies && (
                  <div
                    style={{
                      fontSize: '7.5pt',
                      color: '#a855f7',
                      fontWeight: '600',
                      marginTop: '2px',
                    }}
                  >
                    Tools / Medium: {proj.technologies}
                  </div>
                )}
                <div
                  style={{
                    fontSize: isOnePage ? '8.5pt' : '9pt',
                    color: '#374151',
                    marginTop: '4px',
                    whiteSpace: 'pre-line',
                    textAlign: 'justify',
                  }}
                >
                  {proj.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Design Experience */}
      {experience && experience.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: '700',
              color: '#7e22ce',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: isOnePage ? '6px' : '8px',
            }}
          >
            Professional Practice & Roles
          </h2>
          {experience.map((exp, i) => (
            <div
              key={i}
              className="resume-item resume-experience-item"
              style={{
                marginBottom: isOnePage ? '8px' : '12px',
                borderLeft: '2px solid #e9d5ff',
                paddingLeft: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontWeight: '700',
                    color: '#1f2937',
                    fontSize: isOnePage ? '9pt' : '10pt',
                  }}
                >
                  {exp.role} <span style={{ color: '#7e22ce' }}>@ {exp.company}</span>
                </span>
                <span style={{ fontSize: '8pt', color: '#6b7280' }}>{exp.duration}</span>
              </div>
              <div
                style={{
                  fontSize: isOnePage ? '8.5pt' : '9pt',
                  color: '#4b5563',
                  marginTop: '3px',
                  whiteSpace: 'pre-line',
                  textAlign: 'justify',
                }}
              >
                {exp.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills / Software / Techniques */}
      {skills && skills.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: '700',
              color: '#7e22ce',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Skills & Technical Tools
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '8.5pt' : '9pt', color: '#1f2937' }}>
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
                      <span style={{ fontWeight: '700', color: '#7e22ce' }}>{category}: </span>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isOnePage ? '4px' : '6px' }}>
              {skills.map((s, i) => (
                <span
                  key={i}
                  style={{
                    background: '#f3e8ff',
                    color: '#6b21a8',
                    border: '1px solid #d8b4fe',
                    padding: isOnePage ? '2px 7px' : '3px 9px',
                    borderRadius: '12px',
                    fontSize: isOnePage ? '8pt' : '8.5pt',
                    fontWeight: '600',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Education & Credentials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: education?.length && certifications?.length ? '1fr 1fr' : '1fr',
          gap: isOnePage ? '10px' : '16px',
          marginBottom: isOnePage ? '8px' : '14px',
        }}
      >
        {education && education.length > 0 && (
          <div className="resume-section">
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#7e22ce',
                textTransform: 'uppercase',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              Design Education
            </h2>
            {education.map((edu, i) => (
              <div
                key={i}
                className="resume-item resume-education-item"
                style={{ marginBottom: '5px', fontSize: isOnePage ? '8.5pt' : '9pt' }}
              >
                <strong>{edu.degree}</strong>
                <div style={{ color: '#6b7280' }}>
                  {edu.college} ({edu.year})
                </div>
              </div>
            ))}
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div className="resume-section">
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#7e22ce',
                textTransform: 'uppercase',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              Exhibitions & Awards
            </h2>
            {certifications.map((c, i) => (
              <div
                key={i}
                className="resume-item resume-cert-item"
                style={{ marginBottom: '5px', fontSize: isOnePage ? '8.5pt' : '9pt' }}
              >
                <strong>{c.name}</strong>
                <div style={{ color: '#6b7280' }}>
                  {c.issuer} ({c.year})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Sections */}
      {customSections &&
        customSections.map((sec, i) => (
          <section
            key={i}
            className="resume-section"
            style={{ marginBottom: isOnePage ? '8px' : '12px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#7e22ce',
                textTransform: 'uppercase',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {sec.content && (
              <p style={{ margin: 0, fontSize: isOnePage ? '8.5pt' : '9pt', whiteSpace: 'pre-line' }}>
                {sec.content}
              </p>
            )}
          </section>
        ))}
    </div>
  );
};
