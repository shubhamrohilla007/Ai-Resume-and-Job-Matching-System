import React from 'react';
import { ResumeBuilderData } from '../../types';
import { AtsClassicTemplate } from './AtsClassicTemplate';
import { TechModernTemplate } from './TechModernTemplate';
import { CreativePortfolioTemplate } from './CreativePortfolioTemplate';
import { BusinessProfessionalTemplate } from './BusinessProfessionalTemplate';
import { AcademicCvTemplate } from './AcademicCvTemplate';
import { FresherMinimalTemplate } from './FresherMinimalTemplate';
import { ProfessionalPhotoTemplate } from './ProfessionalPhotoTemplate';

interface ResumeRendererProps {
  resume: ResumeBuilderData;
  templateId?: string;
  pageMode?: 'one-page' | 'multi-page';
}

export const ResumeRenderer: React.FC<ResumeRendererProps> = ({ resume, templateId, pageMode }) => {
  const activeTemplate = templateId || resume.templateId || 'ats-classic';
  const activeMode = pageMode || resume.pageMode || 'multi-page';
  const isOnePage = activeMode === 'one-page';

  const mergedResume: ResumeBuilderData = {
    ...resume,
    pageMode: activeMode,
  };

  return (
    <div
      className={`print-sheet ${isOnePage ? 'one-page-mode' : 'multi-page-mode'}`}
      style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
        padding: isOnePage ? '26px 36px' : '36px 44px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        minHeight: isOnePage ? '1040px' : '1080px',
        boxSizing: 'border-box',
      }}
    >
      {activeTemplate === 'photo-professional' && <ProfessionalPhotoTemplate resume={mergedResume} />}
      {activeTemplate === 'tech-modern' && <TechModernTemplate resume={mergedResume} />}
      {activeTemplate === 'creative-portfolio' && <CreativePortfolioTemplate resume={mergedResume} />}
      {activeTemplate === 'business-professional' && <BusinessProfessionalTemplate resume={mergedResume} />}
      {activeTemplate === 'academic-cv' && <AcademicCvTemplate resume={mergedResume} />}
      {activeTemplate === 'fresher-minimal' && <FresherMinimalTemplate resume={mergedResume} />}
      {(activeTemplate === 'ats-classic' ||
        !['photo-professional', 'tech-modern', 'creative-portfolio', 'business-professional', 'academic-cv', 'fresher-minimal'].includes(
          activeTemplate
        )) && <AtsClassicTemplate resume={mergedResume} />}
    </div>
  );
};
