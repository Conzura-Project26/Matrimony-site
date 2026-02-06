/**
 * Audit Context Middleware
 * Phase 5 - Task 5.6: Audit Logging
 * 
 * Captures and attaches audit context to request object:
 * - IP address (from various headers and request)
 * - User agent
 * - Request timestamp
 * 
 * This middleware should be applied globally to all routes
 * that need audit logging capability.
 */

import logger from '../config/logger.js';

/**
 * Extract real IP address from request
 * Handles proxies and load balancers
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} - IP address or null
 */
function extractIpAddress(req) {
  // Priority order for IP address extraction:
  // 1. x-forwarded-for (most common for proxies/load balancers)
  // 2. x-real-ip (nginx proxy)
  // 3. cf-connecting-ip (Cloudflare)
  // 4. fastly-client-ip (Fastly CDN)
  // 5. x-client-ip (Apache)
  // 6. x-cluster-client-ip (Rackspace LB)
  // 7. req.ip (Express default)
  // 8. req.connection.remoteAddress (fallback)

  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2, ...)
    // Take the first one (original client IP)
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp;

  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) return cfConnectingIp;

  const fastlyClientIp = req.headers['fastly-client-ip'];
  if (fastlyClientIp) return fastlyClientIp;

  const xClientIp = req.headers['x-client-ip'];
  if (xClientIp) return xClientIp;

  const xClusterClientIp = req.headers['x-cluster-client-ip'];
  if (xClusterClientIp) return xClusterClientIp;

  // Express built-in IP (respects trust proxy setting)
  if (req.ip) return req.ip;

  // Fallback to connection remote address
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  // Socket remote address (alternative)
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return null;
}

/**
 * Extract user agent from request
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} - User agent string or null
 */
function extractUserAgent(req) {
  return req.headers['user-agent'] || null;
}

/**
 * Sanitize IP address (remove IPv6 prefix if present)
 * 
 * @param {string} ip - Raw IP address
 * @returns {string} - Sanitized IP address
 */
function sanitizeIp(ip) {
  if (!ip) return null;

  // Remove IPv6 prefix (::ffff:) if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // Handle IPv6 loopback
  if (ip === '::1') {
    return '127.0.0.1';
  }

  return ip;
}

/**
 * Audit Context Middleware
 * Attaches audit context to req.auditContext for use in controllers/services
 * 
 * Usage in controller:
 * ```
 * const { ipAddress, userAgent } = req.auditContext;
 * await AuditService.log({
 *   action: AuditAction.LOGIN_SUCCESS,
 *   actionType: AuditActionType.AUTH_EVENT,
 *   actorId: userId,
 *   ipAddress: ipAddress,
 *   userAgent: userAgent
 * });
 * ```
 */
export const captureAuditContext = (req, res, next) => {
  try {
    const rawIp = extractIpAddress(req);
    const ipAddress = sanitizeIp(rawIp);
    const userAgent = extractUserAgent(req);

    // Attach to request object
    req.auditContext = {
      ipAddress: ipAddress,
      userAgent: userAgent,
      timestamp: new Date()
    };

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Audit context captured: IP=${ipAddress}, UA=${userAgent?.substring(0, 50)}...`);
    }

    next();
  } catch (error) {
    logger.error(`Failed to capture audit context: ${error.message}`);
    
    // Don't fail the request - just set null values
    req.auditContext = {
      ipAddress: null,
      userAgent: null,
      timestamp: new Date()
    };
    
    next();
  }
};

/**
 * Helper function to get audit context from request
 * Provides a consistent way to access audit context in controllers
 * 
 * @param {Object} req - Express request object
 * @returns {Object} - Audit context { ipAddress, userAgent, timestamp }
 */
export const getAuditContext = (req) => {
  return req.auditContext || {
    ipAddress: null,
    userAgent: null,
    timestamp: new Date()
  };
};

export default {
  captureAuditContext,
  getAuditContext
};
