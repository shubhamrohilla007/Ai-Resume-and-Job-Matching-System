import React from 'react';
import { ResumeBuilderData } from '../../types';
import { splitCustomSections, renderCustomSectionLines } from './templateUtils';

export const AcademicCvTemplate: React.FC<{ resume: ResumeBuilderData }> = ({ resume }) => {
  const { personal, summary, education, skills, experience, projects, certifications, customSections } = resume;
  const isOnePage = resume.pageMode === 'one-page';

  const { projectLike: projectLikeSections, others: otherCustomSections } = splitCustomSections(customSections);

  return (
    <div
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        color: '#1c1917',
        lineHeight: isOnePage ? '1.38' : '1.45',
        fontSize: isOnePage ? '9.5pt' : '10.5pt',
      }}
    >
      {/* Scholar Header */}
      <div
        className="resume-section"
        style={{
          textAlign: 'center',
          borderBottom: '1.5px solid #44403c',
          paddingBottom: isOnePage ? '8px' : '10px',
          marginBottom: isOnePage ? '10px' : '16px',
        }}
      >
        <h1
          style={{
            fontSize: isOnePage ? '20pt' : '22pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {personal?.fullName || 'Academic Researcher'}
        </h1>
        {resume.targetRole && (
          <div
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontStyle: 'italic',
              color: '#78716c',
              marginTop: '2px',
            }}
          >
            {resume.targetRole}
          </div>
        )}
        <div
          style={{
            fontSize: isOnePage ? '8.5pt' : '9pt',
            color: '#44403c',
            marginTop: '5px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {[personal?.email, personal?.phone, personal?.location, personal?.linkedin, personal?.portfolioUrl]
            .filter(Boolean)
            .map((item, idx) => (
              <span key={idx} style={{ overflowWrap: 'anywhere' }}>
                {idx > 0 ? '• ' : ''}{item}
              </span>
            ))}
        </div>
      </div>

      {/* Research Interests / Statement */}
      {summary && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Research Interests & Academic Summary
          </h2>
          <p
            style={{
              textAlign: 'justify',
              margin: 0,
              fontSize: isOnePage ? '9pt' : '10pt',
              whiteSpace: 'pre-line',
            }}
          >
            {summary}
          </p>
        </section>
      )}

      {/* Education - Prominent in Academic CVs */}
      {education && education.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Education & Degrees
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
                <strong>{edu.degree}</strong>, {edu.college}
                {edu.cgpa && (
                  <div style={{ fontSize: '8.5pt', fontStyle: 'italic', color: '#57534e' }}>
                    Honors/Score: {edu.cgpa}
                  </div>
                )}
              </div>
              <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {/* Research & Academic Experience */}
      {experience && experience.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Academic, Teaching & Research Appointments
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
                <span>
                  <strong>{exp.role}</strong>, {exp.company}
                </span>
                <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>{exp.duration}</span>
              </div>
              <div
                style={{
                  whiteSpace: 'pre-line',
                  marginTop: '2px',
                  fontSize: isOnePage ? '9pt' : '10pt',
                  textAlign: 'justify',
                }}
              >
                {exp.description}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Research Projects & Investigations */}
      {projects && projects.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '5px' : '8px',
            }}
          >
            Selected Research Projects & Grants
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
                <strong>{proj.name}</strong>
                {proj.technologies && (
                  <span style={{ fontStyle: 'italic', fontSize: '9pt', color: '#57534e' }}>
                    [{proj.technologies}]
                  </span>
                )}
                {proj.link && (
                  <span
                    style={{
                      fontSize: '8.5pt',
                      color: '#44403c',
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
                  fontSize: isOnePage ? '9pt' : '9.5pt',
                  textAlign: 'justify',
                  marginTop: '2px',
                }}
              >
                {proj.description}
              </div>
            </div>
          ))}
        </section>
      )}

            {/* Project-like Custom Sections (Publications, Conferences, Hackathons, Research) */}
      {projectLikeSections &&
        projectLikeSections.length > 0 &&
        projectLikeSections.map((sec, i) => (
          <section
            key={`proj-custom-${i}`}
            className="resume-section"
            style={{ marginBottom: isOnePage ? '10px' : '15px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10pt' : '11pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid #a8a29e',
                paddingBottom: '2px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#1c1917',
              textColor: '#292524',
              metaColor: '#78716c',
            })}
          </section>
        ))}

      {/* Technical Methodologies & Scholarly Tools */}
      {skills && skills.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Technical & Research Skills
          </h2>
          {skills.some((s) => s.includes(':')) ? (
            <div style={{ fontSize: isOnePage ? '9pt' : '10pt' }}>
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
                      <span style={{ fontWeight: 'bold', color: '#111827' }}>{category}: </span>
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
            <div
              style={{
                fontSize: isOnePage ? '9pt' : '10pt',
                display: 'flex',
                flexWrap: 'wrap',
                gap: isOnePage ? '3px 10px' : '4px 12px',
              }}
            >
              {skills.map((s, i) => (
                <span key={i}>• {s}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Fellowships, Certifications & Honors */}
      {certifications && certifications.length > 0 && (
        <section
          className="resume-section"
          style={{ marginBottom: isOnePage ? '10px' : '15px' }}
        >
          <h2
            className="resume-section-heading"
            style={{
              fontSize: isOnePage ? '10pt' : '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #a8a29e',
              paddingBottom: '2px',
              marginBottom: isOnePage ? '4px' : '6px',
            }}
          >
            Honors, Fellowships & Certifications
          </h2>
          {certifications.map((c, i) => (
            <div
              key={i}
              className="resume-item resume-cert-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: isOnePage ? '3px' : '4px',
                flexWrap: 'wrap',
              }}
            >
              <span>
                • <strong>{c.name}</strong>, {c.issuer}
              </span>
              <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>{c.year}</span>
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
            style={{ marginBottom: isOnePage ? '8px' : '12px' }}
          >
            <h2
              className="resume-section-heading"
              style={{
                fontSize: isOnePage ? '10pt' : '11pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid #a8a29e',
                paddingBottom: '2px',
                marginBottom: isOnePage ? '4px' : '6px',
              }}
            >
              {sec.title}
            </h2>
            {renderCustomSectionLines(sec.content, sec.items, {
              isOnePage,
              primaryColor: '#1c1917',
              textColor: '#292524',
              metaColor: '#78716c',
            })}
          </section>
        ))}
    </div>
  );
};
