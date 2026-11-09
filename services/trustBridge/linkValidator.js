const dns = require('dns').promises;
const net = require('net');
const axios = require('axios');

/**
 * Checks if an IP address belongs to private/internal/cloud metadata subnets
 */
function isPrivateIp(ip) {
  if (!ip) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link local & cloud metadata like AWS/GCP 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 (loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // fe80::/10 (link local)
    if (normalized.startsWith('fe80:')) return true;
    // fc00::/7 (unique local address)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    return false;
  }

  return true;
}

/**
 * Validates external URL with strict SSRF protection
 */
async function validateExternalLink(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, reason: 'No URL provided' };
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { isValid: false, reason: 'Malformed URL format' };
  }

  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { isValid: false, reason: 'Only HTTP and HTTPS protocols are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and common local names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return { isValid: false, reason: 'Internal/localhost network targets are blocked' };
  }

  // Check if hostname is directly an IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { isValid: false, reason: 'Private IP address range is blocked' };
    }
  } else {
    // Resolve DNS to verify it doesn't resolve to private IP (DNS rebinding / SSRF)
    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const rec of records) {
        if (isPrivateIp(rec.address)) {
          return { isValid: false, reason: 'Domain resolves to a restricted internal IP address' };
        }
      }
    } catch {
      return { isValid: false, reason: 'Domain name could not be resolved' };
    }
  }

  // Now perform safe HTTP HEAD/GET with timeout
  try {
    const response = await axios.head(parsed.href, {
      timeout: 4000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'AI-Resume-Job-Audit-Bot/1.0',
      },
      validateStatus: (status) => status < 500, // accept any non-500 status as reachable
    });

    if (response.status >= 200 && response.status < 400) {
      return { isValid: true, status: response.status, reason: 'Link is reachable' };
    }
    return { isValid: false, status: response.status, reason: `Link returned status ${response.status}` };
  } catch {
    // Some servers reject HEAD requests; try lightweight GET
    try {
      const getResp = await axios.get(parsed.href, {
        timeout: 4000,
        maxRedirects: 3,
        maxContentLength: 50000, // 50KB max
        headers: {
          'User-Agent': 'AI-Resume-Job-Audit-Bot/1.0',
        },
        validateStatus: (status) => status < 500,
      });
      return { isValid: true, status: getResp.status, reason: 'Link is reachable' };
    } catch (err) {
      return { isValid: false, reason: 'External link is unreachable or timed out' };
    }
  }
}

module.exports = { validateExternalLink, isPrivateIp };
