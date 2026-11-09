/**
 * Job scam and suspicious keyword blocklist
 * Adapted from TrustBridge / HackShift
 */

const BLOCKLIST = [
  // Pay to work scams
  'pay to apply', 'registration fee', 'training fee', 'deposit required',
  'pay before joining', 'refundable deposit', 'security deposit', 'processing fee',
  'pay upfront', 'buying kit required', 'pay for interview',

  // Unrealistic promises
  'earn lakhs', 'earn crores', 'guaranteed income', 'guaranteed salary',
  'earn from home without work', 'work from home earn 50000 daily', '100% placement guarantee without interview',
  'no experience needed earn 100000', 'unlimited earning potential overnight', 'passive income fast rich',

  // MLM / pyramid
  'multi level marketing', 'multilevel', 'network marketing', 'refer and earn chain',
  'downline', 'upline', 'chain marketing', 'direct selling scheme',

  // Urgency / pressure
  'limited seats apply now or lose', 'urgent requirement only today transfer money',
  'last chance pay now', 'act now or seat cancelled',

  // Vague / high-risk scams
  'copy paste job earn money', 'form filling job pay deposit',
  'ad posting job pay registration', 'captcha solving deposit',
  'click ads earn money scheme', 'wire transfer agent', 'crypto investment job'
];

/**
 * Returns matched blocklist phrases found in the text.
 * Empty array = clean.
 */
function checkBlocklist(text = '') {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  return BLOCKLIST.filter(phrase => lower.includes(phrase));
}

module.exports = { BLOCKLIST, checkBlocklist };
