/**
 * Helmet Security Configuration
 * Comprehensive HTTP security headers
 */

import helmet from 'helmet';

/**
 * Helmet configuration with all security headers
 */
const helmetConfig = helmet({
  // Content Security Policy - Controls resources the browser can load
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Cross-Origin-Embedder-Policy - Prevents document from loading cross-origin resources
  crossOriginEmbedderPolicy: true,

  // Cross-Origin-Opener-Policy - Isolates browsing context
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy - Controls who can load the resource
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // DNS Prefetch Control - Controls browser DNS prefetching
  dnsPrefetchControl: { allow: false },

  // Expect-CT - Certificate Transparency
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },

  // Frameguard - Prevents clickjacking attacks
  frameguard: { action: 'deny' },

  // Hide Powered By - Removes X-Powered-By header
  hidePoweredBy: true,

  // HSTS - HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open - Sets X-Download-Options for IE8+
  ieNoOpen: true,

  // No Sniff - Prevents MIME type sniffing
  noSniff: true,

  // Origin Agent Cluster - Requests origin-keyed agent clusters
  originAgentCluster: true,

  // Permitted Cross Domain Policies - Controls Adobe Flash/PDF cross-domain requests
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy - Controls Referer header
  referrerPolicy: { policy: 'no-referrer' },

  // XSS Filter - Enables XSS filter in older browsers
  xssFilter: true,
});

export default helmetConfig;
