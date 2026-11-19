import React from 'react';
import { CustomSectionItem } from '../../types';

export const splitCustomSections = (customSections?: CustomSectionItem[]) => {
  const list = customSections || [];
  const projectLike = list.filter((s) =>
    /hackathon|competition|publication|research|portfolio|exhibition|project|clinical\s*rotation|moot\s*court/i.test(s.title)
  );
  const others = list.filter(
    (s) => !/hackathon|competition|publication|research|portfolio|exhibition|project|clinical\s*rotation|moot\s*court/i.test(s.title)
  );
  return { projectLike, others };
};

export interface CustomSectionRenderOptions {
  isOnePage: boolean;
  primaryColor?: string;
  textColor?: string;
  metaColor?: string;
  fontSizeTitle?: string;
  fontSizeText?: string;
  fontSizeMeta?: string;
}

export const renderCustomSectionLines = (
  secContent?: string,
  secItems?: string[],
  options: CustomSectionRenderOptions = { isOnePage: false }
) => {
  const {
    isOnePage,
    primaryColor = '#111827',
    textColor = '#374151',
    metaColor = '#4b5563',
    fontSizeTitle = isOnePage ? '8.75pt' : '10.5pt',
    fontSizeText = isOnePage ? '8.25pt' : '10pt',
    fontSizeMeta = isOnePage ? '7.75pt' : '9.5pt',
  } = options;

  const rawLines: string[] = [];
  if (secContent) {
    rawLines.push(...secContent.split('\n'));
  } else if (secItems && secItems.length > 0) {
    rawLines.push(...secItems.flatMap((it) => it.split('\n')));
  }
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <div style={{ marginTop: '2px' }}>
      {lines.map((line, idx) => {
        // 1. Pipe Header line e.g. "TrustBridge - Scam-Free Job & Internship Platform | Hackathon, IIIT Delhi | Team of 5"
        if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim());
          const mainTitle = parts[0];
          const subInfo = parts.slice(1).join(' | ');

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                fontWeight: 'bold',
                color: primaryColor,
                fontSize: fontSizeTitle,
                marginTop: idx === 0 ? '0' : isOnePage ? '4px' : '10px',
                marginBottom: isOnePage ? '1px' : '2px',
              }}
            >
              <span>{mainTitle}</span>
              {subInfo && (
                <span
                  style={{
                    fontWeight: 'normal',
                    fontStyle: 'italic',
                    color: metaColor,
                    fontSize: fontSizeMeta,
                  }}
                >
                  | {subInfo}
                </span>
              )}
            </div>
          );
        }

        // 2. Tech / Metadata line e.g. "Technologies: Next.js..." or "• Proposed stack: React.js..."
        const isMetaLine = /^(?:[-*•]\s*)?(?:technologies|tech|proposed stack|stack|tools|event|role):/i.test(line);
        if (isMetaLine) {
          const hasBullet = /^[-*•]/.test(line);
          const cleanLine = line.replace(/^[-*•]\s*/, '');
          const colonIdx = cleanLine.indexOf(':');
          const label = cleanLine.slice(0, colonIdx + 1);
          const val = cleanLine.slice(colonIdx + 1).trim();

          return (
            <div
              key={idx}
              style={{
                fontSize: fontSizeMeta,
                color: textColor,
                marginBottom: '3px',
                paddingLeft: hasBullet ? '14px' : '0',
                textIndent: hasBullet ? '-14px' : '0',
              }}
            >
              {hasBullet && '• '}
              <strong>{label}</strong>{' '}
              <span style={{ fontStyle: 'italic', color: metaColor }}>{val}</span>
            </div>
          );
        }

        // 3. Bullet line
        const textOnly = line.replace(/^[-*•]\s*/, '');

        return (
          <div
            key={idx}
            style={{
              paddingLeft: '14px',
              textIndent: '-14px',
              fontSize: fontSizeText,
              color: textColor,
              lineHeight: isOnePage ? '1.24' : '1.4',
              textAlign: 'justify',
              marginBottom: isOnePage ? '1px' : '2px',
            }}
          >
            • {textOnly}
          </div>
        );
      })}
    </div>
  );
};
