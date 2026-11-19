import React from 'react';
import { ResumeBuilderData } from '../../types';
import { splitCustomSections, renderCustomSectionLines } from './templateUtils';

export const BusinessProfessionalTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  const { projectLike: projectLikeSections, others: otherCustomSections } = splitCustomSections(customSections);

  return (
    <div
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        lineHeight: isOnePage ? '1.38' : '1.5',
        fontSize: isOnePage ? '9.5pt' : '10pt',
      }}
    >
      {/* Header */}
      <div
        className="resume-section"
        style={{
          borderBottom: '3px solid #0f766e',
          paddingBottom: isOnePage ? '10px' : '14px',
          marginBottom: isOnePage ? '12px' : '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: isOnePage ? '20pt' : '24pt',
                fontWeight: '800',
                color: '#0f766e',
                letterSpacing: '-0.5px',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {personal?.fullName || 'Business Executive'}
            </h1>
            <div
              style={{
                fontSize: isOnePage ? '10pt' : '11pt',
                fontWeight: '600',
                color: '#475569',
                marginTop: '2px',
              }}
            >
              {resume.targetRole || 'Strategic Management & Business Operations'}
            </div>
          </div>
          <div
            style={{
              textAlign: 'right',
              fontSize: isOnePage ? '8.5pt' : '9pt',
              color: '#64748b',
            }}
          >
            {personal?.email && <div>{personal.email}</div>}
            {personal?.phone && <div>{personal.phone}</div>}
            {personal?.location && <div>{personal.location}</div>}
            {personal?.linkedin && (
              <div style={{ overflowWrap: 'anywhere' }}>{personal.linkedin}</div>
            )}
            {personal?.portfolioUrl && (
              <div style={{ overflowWrap: 'anywhere' }}>{personal.portfolioUrl}</div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
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
              color: '#0f766e',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Executive Profile
          </h2>
          <p
            style={{
              fontSize: isOnePage ? '9pt' : '9.5pt',
              color: '#334155',
              margin: 0,
              textAlign: 'justify',
              whiteSpace: 'pre-line',
            }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* Core Competencies / Skills */}
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
              color: '#0f766e',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Core Competencies & Technical Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '8.5pt' : '9.5pt', color: '#1e293b' }}>
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
                      <span style={{ fontWeight: '700', color: '#0f766e' }}>{category}: </span>
                      <span>{details}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ marginBottom: isOnePage ? '2px' : '4px' }}>
                    <span style={{ color: '#0f766e', fontWeight: 'bold' }}>▪</span> {skill}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: isOnePage ? '3px 10px' : '4px 12px',
                fontSize: isOnePage ? '8.5pt' : '9pt',
                color: '#1e293b',
              }}
            >
              {skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#0f766e', fontWeight: 'bold' }}>▪</span> {s}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Leadership & Professional Experience */}
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
              color: '#0f766e',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Professional Experience & Leadership
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
                <div>
                  <strong
                    style={{
                      fontSize: isOnePage ? '9.5pt' : '10.5pt',
                      color: '#0f172a',
                    }}
                  >
                    {exp.role}
                  </strong>
                  <span style={{ color: '#0f766e', fontWeight: '600', marginLeft: '6px' }}>
                    — {exp.company}
                  </span>
                </div>
                <span style={{ fontSize: '8.5pt', color: '#64748b', fontStyle: 'italic' }}>
                  {exp.duration}
                </span>
              </div>
              <div
                style={{
                  whiteSpace: 'pre-line',
                  marginTop: '3px',
                  fontSize: isOnePage ? '8.5pt' : '9.25pt',
                  color: '#334155',
                  textAlign: 'justify',
                }}
              >
                {exp.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Strategic Initiatives & Projects */}
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
              color: '#0f766e',
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Key Business Initiatives & Outcomes
          </h2>
          {projects.map((proj, i) => (
            <div
              key={i}
              className="resume-item resume-project-item"
              style={{ marginBottom: isOnePage ? '7px' : '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ fontSize: isOnePage ? '9pt' : '9.5pt', color: '#0f172a' }}>
                  {proj.name}
                </strong>
                {proj.technologies && (
                  <span style={{ fontSize: '8pt', color: '#64748b' }}>
                    ({proj.technologies})
                  </span>
                )}
                {proj.link && (
                  <span
                    style={{
                      fontSize: '8pt',
                      color: '#0f766e',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-all',
                    }}
                  >
                    {proj.link}
                  </span>
                )}
              </div>
              <div
                style={{
                  whiteSpace: 'pre-line',
                  fontSize: isOnePage ? '8.5pt' : '9pt',
                  color: '#475569',
                  marginTop: '2px',
                  textAlign: 'justify',
                }}
              >
                {proj.description}
              </div>
            </div>
          ))}
        </section>
      )}

            {/* Project-like Custom Sections (Hackathons, Competitions, Projects) */}
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
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#0f766e',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#0f766e',
              textColor: '#1e293b',
              metaColor: '#475569',
            })}
          </section>
        ))}

      {/* Education & Executive Credentials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: education?.length && certifications?.length ? '1.2fr 1fr' : '1fr',
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
                color: '#0f766e',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              Education
            </h2>
            {education.map((edu, i) => (
              <div
                key={i}
                className="resume-item resume-education-item"
                style={{ marginBottom: '5px', fontSize: isOnePage ? '8.5pt' : '9pt' }}
              >
                <strong>{edu.degree}</strong>
                <div style={{ color: '#475569' }}>
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
                color: '#0f766e',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              Leadership Certifications
            </h2>
            {certifications.map((c, i) => (
              <div
                key={i}
                className="resume-item resume-cert-item"
                style={{ marginBottom: '4px', fontSize: isOnePage ? '8.5pt' : '9pt' }}
              >
                <strong>{c.name}</strong> — {c.issuer} ({c.year})
              </div>
            ))}
          </div>
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
                fontSize: isOnePage ? '9.5pt' : '10.5pt',
                fontWeight: '700',
                color: '#0f766e',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '3px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#0f766e',
              textColor: '#1e293b',
              metaColor: '#475569',
            })}
          </section>
        ))}
    </div>
  );
};
