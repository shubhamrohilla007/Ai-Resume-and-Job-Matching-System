import React from 'react';
import { ResumeBuilderData } from '../../types';

export const TechModernTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  return (
    <div
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        lineHeight: isOnePage ? '1.38' : '1.5',
        fontSize: isOnePage ? '9.5pt' : '10pt',
      }}
    >
      {/* Top Banner */}
      <div
        className="resume-section"
        style={{
          borderLeft: '4px solid #2563eb',
          paddingLeft: '14px',
          marginBottom: isOnePage ? '12px' : '18px',
        }}
      >
        <h1
          style={{
            fontSize: isOnePage ? '20pt' : '24pt',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.5px',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {personal?.fullName || 'Full Name'}
        </h1>
        {resume.targetRole && (
          <div
            style={{
              fontSize: isOnePage ? '10.5pt' : '11.5pt',
              fontWeight: '600',
              color: '#2563eb',
              marginTop: '2px',
            }}
          >
            {resume.targetRole}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isOnePage ? '6px 12px' : '8px 14px',
            marginTop: isOnePage ? '5px' : '8px',
            fontSize: isOnePage ? '8.5pt' : '9pt',
            color: '#64748b',
          }}
        >
          {personal?.email && <span>📧 {personal.email}</span>}
          {personal?.phone && <span>📱 {personal.phone}</span>}
          {personal?.location && <span>📍 {personal.location}</span>}
          {personal?.github && (
            <span style={{ overflowWrap: 'anywhere' }}>💻 {personal.github}</span>
          )}
          {personal?.linkedin && (
            <span style={{ overflowWrap: 'anywhere' }}>🔗 {personal.linkedin}</span>
          )}
          {personal?.portfolioUrl && (
            <span style={{ overflowWrap: 'anywhere' }}>🌐 {personal.portfolioUrl}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div
          className="resume-section"
          style={{
            background: '#f8fafc',
            padding: isOnePage ? '8px 12px' : '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            marginBottom: isOnePage ? '10px' : '16px',
            fontSize: isOnePage ? '9pt' : '9.5pt',
            color: '#334155',
            textAlign: 'justify',
            whiteSpace: 'pre-line',
          }}
        >
          {summary}
        </div>
      )}

      {/* Skills Grid */}
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
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '8px',
            }}
          >
            Technical Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '9pt' : '9.5pt' }}>
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
                      <span style={{ fontWeight: '700', color: '#1e40af' }}>{category}: </span>
                      <span style={{ color: '#1e293b' }}>{details}</span>
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
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: isOnePage ? '2px 6px' : '3px 8px',
                    borderRadius: '4px',
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

      {/* Experience */}
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
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #e2e8f0',
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
                }}
              >
                <span
                  style={{
                    fontWeight: '700',
                    fontSize: isOnePage ? '9.5pt' : '10.5pt',
                    color: '#0f172a',
                  }}
                >
                  {exp.role} <span style={{ fontWeight: '400', color: '#64748b' }}>at</span> {exp.company}
                </span>
                <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '500' }}>
                  {exp.duration}
                </span>
              </div>
              <div
                style={{
                  whiteSpace: 'pre-line',
                  marginTop: '3px',
                  color: '#334155',
                  fontSize: isOnePage ? '9pt' : '9.5pt',
                  textAlign: 'justify',
                }}
              >
                {exp.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
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
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Technical Projects & Systems
          </h2>
          {projects.map((p, i) => (
            <div
              key={i}
              className="resume-item resume-project-item"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: isOnePage ? '8px 10px' : '10px 14px',
                marginBottom: isOnePage ? '6px' : '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <strong style={{ fontSize: isOnePage ? '9.5pt' : '10pt', color: '#0f172a' }}>
                  {p.name}
                </strong>
                {p.link && (
                  <span
                    style={{
                      fontSize: '8pt',
                      color: '#2563eb',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-all',
                    }}
                  >
                    {p.link}
                  </span>
                )}
              </div>
              {p.technologies && (
                <div
                  style={{
                    fontSize: '8.5pt',
                    color: '#2563eb',
                    fontWeight: '600',
                    marginTop: '2px',
                  }}
                >
                  Stack: {p.technologies}
                </div>
              )}
              <div
                style={{
                  whiteSpace: 'pre-line',
                  marginTop: '3px',
                  color: '#475569',
                  fontSize: isOnePage ? '8.5pt' : '9pt',
                  textAlign: 'justify',
                }}
              >
                {p.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Education & Certifications Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: education?.length && certifications?.length ? '1fr 1fr' : '1fr',
          gap: isOnePage ? '12px' : '18px',
          marginBottom: isOnePage ? '10px' : '16px',
        }}
      >
        {education && education.length > 0 && (
          <div className="resume-section">
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#2563eb',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e2e8f0',
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
                <div style={{ fontWeight: '700', fontSize: isOnePage ? '9pt' : '9.5pt' }}>
                  {edu.degree}
                </div>
                <div style={{ fontSize: '8.5pt', color: '#475569' }}>{edu.college}</div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>
                  {edu.year} {edu.cgpa && `• GPA: ${edu.cgpa}`}
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
                color: '#2563eb',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e2e8f0',
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
                style={{ marginBottom: '5px' }}
              >
                <div style={{ fontWeight: '600', fontSize: isOnePage ? '8.5pt' : '9pt' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>
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
            style={{ marginBottom: isOnePage ? '10px' : '14px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#2563eb',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '5px' : '8px',
              }}
            >
              {sec.title}
            </h2>
            {sec.content && (
              <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: isOnePage ? '9pt' : '9.5pt' }}>
                {sec.content}
              </p>
            )}
            {sec.items && (
              <ul
                style={{
                  paddingLeft: '18px',
                  marginTop: '3px',
                  marginBottom: 0,
                  fontSize: isOnePage ? '8.5pt' : '9pt',
                }}
              >
                {sec.items.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </div>
  );
};
