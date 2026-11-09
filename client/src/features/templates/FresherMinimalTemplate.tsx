import React from 'react';
import { ResumeBuilderData } from '../../types';

export const FresherMinimalTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  return (
    <div
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        color: '#334155',
        lineHeight: isOnePage ? '1.38' : '1.48',
        fontSize: isOnePage ? '9pt' : '9.75pt',
      }}
    >
      {/* Header */}
      <div
        className="resume-section"
        style={{
          textAlign: 'center',
          marginBottom: isOnePage ? '12px' : '18px',
        }}
      >
        <h1
          style={{
            fontSize: isOnePage ? '20pt' : '23pt',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.5px',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {personal?.fullName || 'Candidate Name'}
        </h1>
        {resume.targetRole && (
          <div
            style={{
              fontSize: isOnePage ? '10pt' : '10.5pt',
              fontWeight: '600',
              color: '#0891b2',
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
            justifyContent: 'center',
            gap: isOnePage ? '6px 10px' : '8px 12px',
            marginTop: isOnePage ? '4px' : '6px',
            fontSize: isOnePage ? '8.5pt' : '9pt',
            color: '#64748b',
          }}
        >
          {personal?.email && <span>{personal.email}</span>}
          {personal?.phone && <span>| {personal.phone}</span>}
          {personal?.location && <span>| {personal.location}</span>}
          {personal?.github && (
            <span style={{ overflowWrap: 'anywhere' }}>| GitHub: {personal.github}</span>
          )}
          {personal?.linkedin && (
            <span style={{ overflowWrap: 'anywhere' }}>| LinkedIn: {personal.linkedin}</span>
          )}
          {personal?.portfolioUrl && (
            <span style={{ overflowWrap: 'anywhere' }}>| Portfolio: {personal.portfolioUrl}</span>
          )}
        </div>
      </div>

      {/* Career Objective / Summary */}
      {summary && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Career Objective
          </h2>
          <p
            style={{
              fontSize: isOnePage ? '8.5pt' : '9.25pt',
              color: '#475569',
              margin: 0,
              textAlign: 'justify',
              whiteSpace: 'pre-line',
            }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* Education - Placed high for freshers */}
      {education && education.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Education & Academic Background
          </h2>
          {education.map((edu, i) => (
            <div
              key={i}
              className="resume-item resume-education-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: isOnePage ? '4px' : '6px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ color: '#0f172a' }}>{edu.degree}</strong> — {edu.college}
                {edu.cgpa && (
                  <span style={{ color: '#0891b2', fontWeight: '600' }}>
                    {' '}
                    (CGPA: {edu.cgpa})
                  </span>
                )}
              </div>
              <span style={{ color: '#64748b', fontSize: '8.5pt' }}>{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Technical Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '8.5pt' : '9pt', color: '#164e63' }}>
              {skills.map((skill, i) => {
                const colonIdx = skill.indexOf(':');
                if (colonIdx > 0) {
                  const category = skill.substring(0, colonIdx).trim();
                  const details = skill.substring(colonIdx + 1).trim();
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: isOnePage ? '2px' : '3.5px',
                        lineHeight: isOnePage ? '1.3' : '1.4',
                      }}
                    >
                      <span style={{ fontWeight: '700', color: '#0891b2' }}>{category}: </span>
                      <span style={{ color: '#0f172a' }}>{details}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ marginBottom: isOnePage ? '2px' : '3.5px' }}>
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
                    background: '#ecfeff',
                    color: '#0e7490',
                    border: '1px solid #cffafe',
                    padding: isOnePage ? '2px 7px' : '2px 8px',
                    borderRadius: '4px',
                    fontSize: isOnePage ? '8pt' : '8.5pt',
                    fontWeight: '500',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
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
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Academic & Personal Projects
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
                <strong style={{ color: '#0f172a' }}>{proj.name}</strong>
                {proj.technologies && (
                  <span
                    style={{
                      fontSize: '8.5pt',
                      color: '#0891b2',
                      fontWeight: '600',
                    }}
                  >
                    [{proj.technologies}]
                  </span>
                )}
                {proj.link && (
                  <span
                    style={{
                      fontSize: '8pt',
                      color: '#0891b2',
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

      {/* Internships / Experience (if any) */}
      {experience && experience.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '6px' : '10px',
            }}
          >
            Internships & Experience
          </h2>
          {experience.map((exp, i) => (
            <div
              key={i}
              className="resume-item resume-experience-item"
              style={{ marginBottom: isOnePage ? '7px' : '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <strong style={{ color: '#0f172a' }}>{exp.role}</strong>, {exp.company}
                </span>
                <span style={{ fontSize: '8.5pt', color: '#64748b' }}>{exp.duration}</span>
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
                {exp.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Certifications & Training */}
      {certifications && certifications.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '16px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.5pt' : '10pt',
              fontWeight: '700',
              color: '#0891b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1.5px solid #0891b2',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Certifications & Verified Training
          </h2>
          {certifications.map((c, i) => (
            <div
              key={i}
              className="resume-item resume-cert-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: isOnePage ? '3px' : '4px',
                fontSize: isOnePage ? '8.5pt' : '9pt',
                flexWrap: 'wrap',
              }}
            >
              <span>
                • <strong>{c.name}</strong> — {c.issuer}
              </span>
              <span style={{ color: '#64748b' }}>{c.year}</span>
            </div>
          ))}
        </section>
      )}

      {/* Custom Sections (Co-curricular, Volunteering, Hackathons) */}
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
                fontSize: isOnePage ? '9.5pt' : '10pt',
                fontWeight: '700',
                color: '#0891b2',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1.5px solid #0891b2',
                paddingBottom: '2px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {sec.content && (
              <p
                style={{
                  fontSize: isOnePage ? '8.5pt' : '9pt',
                  color: '#475569',
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}
              >
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
                  color: '#475569',
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
