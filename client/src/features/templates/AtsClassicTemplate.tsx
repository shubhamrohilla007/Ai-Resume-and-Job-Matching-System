import React from 'react';
import { ResumeBuilderData } from '../../types';
import { splitCustomSections, renderCustomSectionLines } from './templateUtils';

export const AtsClassicTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  // Split custom sections: project-like (Hackathons, Competitions, Publications) appear right after Key Projects; others appear at the end
  const { projectLike: projectLikeSections, others: otherCustomSections } = splitCustomSections(customSections);

  return (
    <div
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#111827',
        lineHeight: isOnePage ? '1.24' : '1.45',
        fontSize: isOnePage ? '8.25pt' : '10.5pt',
      }}
    >
      {/* Header */}
      <div
        className="resume-section"
        style={{
          textAlign: 'center',
          borderBottom: '2px solid #111827',
          paddingBottom: isOnePage ? '4px' : '12px',
          marginBottom: isOnePage ? '6px' : '16px',
        }}
      >
        <h1
          style={{
            fontSize: isOnePage ? '16pt' : '23pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: isOnePage ? '2px' : '4px',
            lineHeight: 1.15,
          }}
        >
          {personal?.fullName || 'Candidate Name'}
        </h1>
        {resume.targetRole && (
          <div
            style={{
              fontSize: isOnePage ? '8.75pt' : '11pt',
              fontWeight: '600',
              color: '#374151',
              marginBottom: isOnePage ? '2px' : '4px',
              textTransform: 'uppercase',
            }}
          >
            {resume.targetRole}
          </div>
        )}
        <div
          style={{
            fontSize: isOnePage ? '7.75pt' : '9.5pt',
            color: '#374151',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: isOnePage ? '6px' : '8px',
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
          {personal?.portfolioUrl && (
            <span style={{ overflowWrap: 'anywhere' }}>• {personal.portfolioUrl}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #9ca3af',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '6px',
            }}
          >
            Professional Summary
          </h2>
          <p style={{ margin: 0, whiteSpace: 'pre-line', textAlign: 'justify', fontSize: isOnePage ? '8.25pt' : '10.5pt', lineHeight: isOnePage ? '1.24' : '1.45' }}>{summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #111827',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '6px',
            }}
          >
            Technical Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '8.25pt' : '10pt' }}>
              {skills.map((skill, i) => {
                const colonIdx = skill.indexOf(':');
                if (colonIdx > 0) {
                  const category = skill.substring(0, colonIdx).trim();
                  const details = skill.substring(colonIdx + 1).trim();
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: isOnePage ? '1.5px' : '3.5px',
                        lineHeight: isOnePage ? '1.22' : '1.4',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>{category}: </span>
                      <span>{details}</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: isOnePage ? '1.5px' : '3.5px',
                      lineHeight: isOnePage ? '1.22' : '1.4',
                    }}
                  >
                    <span>• {skill}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                fontSize: isOnePage ? '8.25pt' : '10pt',
                display: 'flex',
                flexWrap: 'wrap',
                gap: isOnePage ? '2px 8px' : '4px 12px',
                lineHeight: isOnePage ? '1.22' : '1.4',
              }}
            >
              {skills.map((skill, i) => (
                <span key={i}>• {skill}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #9ca3af',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '8px',
            }}
          >
            Work Experience
          </h2>
          {experience.map((exp, i) => (
            <div
              key={i}
              className="resume-item resume-experience-item"
              style={{ marginBottom: isOnePage ? '4px' : '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  flexWrap: 'wrap',
                  fontSize: isOnePage ? '8.75pt' : '10pt',
                }}
              >
                <span>
                  {exp.role || 'Role'} — {exp.company || 'Company'}
                </span>
                <span style={{ fontStyle: 'italic', fontSize: isOnePage ? '8pt' : '9pt' }}>{exp.duration}</span>
              </div>
              {exp.description && (
                <div
                  style={{
                    whiteSpace: 'pre-line',
                    marginTop: isOnePage ? '1px' : '3px',
                    textAlign: 'justify',
                    fontSize: isOnePage ? '8.25pt' : '10pt',
                    lineHeight: isOnePage ? '1.22' : '1.4',
                  }}
                >
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #9ca3af',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '8px',
            }}
          >
            Key Projects
          </h2>
          {projects.map((proj, i) => (
            <div
              key={i}
              className="resume-item resume-project-item"
              style={{ marginBottom: isOnePage ? '4px' : '10px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  flexWrap: 'wrap',
                  fontSize: isOnePage ? '8.75pt' : '10pt',
                }}
              >
                <span>
                  {proj.name}{' '}
                  {proj.technologies && (
                    <span style={{ fontWeight: 'normal', fontStyle: 'italic', color: '#4b5563', fontSize: isOnePage ? '8pt' : '9pt' }}>
                      ({proj.technologies})
                    </span>
                  )}
                </span>
                {proj.link && (
                  <span
                    style={{
                      fontSize: isOnePage ? '7.75pt' : '8.5pt',
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
                    whiteSpace: 'pre-line',
                    marginTop: isOnePage ? '1px' : '2px',
                    textAlign: 'justify',
                    fontSize: isOnePage ? '8.25pt' : '10pt',
                    lineHeight: isOnePage ? '1.22' : '1.4',
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
            style={{ marginBottom: isOnePage ? '5px' : '15px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.25pt' : '11pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderBottom: '1px solid #9ca3af',
                paddingBottom: isOnePage ? '1px' : '2px',
                marginBottom: isOnePage ? '2px' : '8px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, { isOnePage, primaryColor: '#111827', textColor: '#111827', metaColor: '#4b5563' })}
          </section>
        ))}

      {/* Education */}
      {education && education.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #9ca3af',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '8px',
            }}
          >
            Education
          </h2>
          {education.map((edu, i) => (
            <div
              key={i}
              className="resume-item resume-education-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: isOnePage ? '2px' : '6px',
                flexWrap: 'wrap',
                fontSize: isOnePage ? '8.25pt' : '10pt',
                lineHeight: isOnePage ? '1.22' : '1.4',
              }}
            >
              <div>
                <strong>{edu.degree || 'Degree'}</strong>, {edu.college || 'Institution'}
                {edu.cgpa && <span> — CGPA/Score: {edu.cgpa}</span>}
              </div>
              <span style={{ fontStyle: 'italic', fontSize: isOnePage ? '8pt' : '9pt' }}>{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '5px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '9.25pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderBottom: '1px solid #9ca3af',
              paddingBottom: isOnePage ? '1px' : '2px',
              marginBottom: isOnePage ? '2px' : '6px',
            }}
          >
            Certifications & Credentials
          </h2>
          {certifications.map((cert, i) => (
            <div
              key={i}
              className="resume-item resume-cert-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: isOnePage ? '1.5px' : '4px',
                flexWrap: 'wrap',
                fontSize: isOnePage ? '8.25pt' : '10pt',
                lineHeight: isOnePage ? '1.22' : '1.4',
              }}
            >
              <span>
                • <strong>{cert.name}</strong> — {cert.issuer}
              </span>
              <span style={{ fontStyle: 'italic', fontSize: isOnePage ? '8pt' : '9pt' }}>{cert.year}</span>
            </div>
          ))}
        </section>
      )}

      {/* Other Custom Sections (Awards, Volunteering, Leadership, etc.) */}
      {otherCustomSections &&
        otherCustomSections.length > 0 &&
        otherCustomSections.map((sec, i) => (
          <section
            key={`other-custom-${i}`}
            className="resume-section"
            style={{ marginBottom: isOnePage ? '5px' : '15px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '9.25pt' : '11pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderBottom: '1px solid #9ca3af',
                paddingBottom: isOnePage ? '1px' : '2px',
                marginBottom: isOnePage ? '2px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, { isOnePage, primaryColor: '#111827', textColor: '#111827', metaColor: '#4b5563' })}
          </section>
        ))}
    </div>
  );
};
