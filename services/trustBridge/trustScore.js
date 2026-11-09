const { checkBlocklist } = require('./blocklist');
const { calculateJobCompleteness } = require('./completeness');
const { validateExternalLink } = require('./linkValidator');
const { analyzeJobListingWithAI } = require('./aiInspector');

/**
 * Calculates job trust score and structured signals
 */
async function auditJobListing(jobData = {}) {
  const fullText = `${jobData.title || ''} ${jobData.company || ''} ${jobData.description || ''}`;

  // 1. Blocklist check
  const blocklistMatches = checkBlocklist(fullText);

  // 2. Completeness check
  const completeness = calculateJobCompleteness(jobData);

  // 3. Link validation (with SSRF protection)
  let linkResult = null;
  if (jobData.applicationUrl && typeof jobData.applicationUrl === 'string' && jobData.applicationUrl.trim()) {
    linkResult = await validateExternalLink(jobData.applicationUrl.trim());
  }

  // 4. AI Analysis
  const aiResult = await analyzeJobListingWithAI(jobData);

  // 5. Score computation
  const signals = [];
  let score = 100;
  let status = 'approved';
  let statusLabel = 'No major warning signals detected';

  // Severe blocklist hit
  if (blocklistMatches.length > 0) {
    score = 10;
    status = 'blocked';
    statusLabel = 'High risk: Suspicious payment/scam keywords detected';
    signals.push(`Blocked keywords detected: ${blocklistMatches.join(', ')}`);
  }

  // AI scam detection
  if (aiResult.isLikelyScam) {
    score = Math.min(score, 25);
    status = 'blocked';
    statusLabel = 'High risk: AI detected predatory or fraudulent job listing pattern';
    signals.push('AI audit flagged this listing as potentially fraudulent');
  }

  if (aiResult.scamMarkers && aiResult.scamMarkers.length > 0) {
    score -= Math.min(25, aiResult.scamMarkers.length * 8);
    aiResult.scamMarkers.forEach(m => signals.push(`Warning marker: ${m}`));
  }

  // Completeness impact
  if (completeness.score < 60) {
    score -= 20;
    signals.push(`Listing has limited details (${completeness.score}% complete)`);
  } else if (completeness.score < 80) {
    score -= 10;
    signals.push(`Listing could include more role specifics (${completeness.score}% complete)`);
  } else {
    signals.push(`Comprehensive job specifications (${completeness.score}% complete)`);
  }

  // Professionalism score
  if (aiResult.professionalismScore < 5) {
    score -= 15;
    signals.push('Job description formatting and clarity is below typical professional standards');
  } else if (aiResult.professionalismScore >= 8) {
    signals.push('Clear, well-defined job scope and role responsibilities');
  }

  // Link validation outcome
  if (linkResult) {
    if (!linkResult.isValid) {
      score -= 15;
      signals.push(`External application link verification issue: ${linkResult.reason}`);
    } else {
      signals.push('External application link verified reachable');
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Final status categorization
  if (score >= 80 && status !== 'blocked') {
    status = 'approved';
    statusLabel = 'No major warning signals detected';
  } else if (score >= 50 && status !== 'blocked') {
    status = 'needs-review';
    statusLabel = 'Limited information / Review recommended';
  } else {
    status = 'blocked';
    if (!statusLabel.startsWith('High risk')) {
      statusLabel = 'Needs review / Insufficient trust signals';
    }
  }

  return {
    trustScore: score,
    trustStatus: status,
    trustStatusLabel: statusLabel,
    signals,
    completenessScore: completeness.score,
    missingFields: completeness.missingFields,
    blocklistMatches,
    linkResult,
    aiResult: {
      aiAvailable: aiResult.aiAvailable,
      professionalismScore: aiResult.professionalismScore,
      scamMarkers: aiResult.scamMarkers,
      isLikelyScam: aiResult.isLikelyScam,
      rationale: aiResult.rationale,
    },
    auditedAt: new Date(),
  };
}

module.exports = { auditJobListing };
