/**
 * Rate Limiting Configuration
 * Protects API from abuse and DoS attacks
 * 
 * Rate Limit Tiers:
 * - Global: 100 requests per 15 minutes (general API protection)
 * - Auth: 50 requests per 15 minutes (stricter for sensitive operations)
 * - Special: 10 requests per 15 minutes (moderate protection)
 */

import rateLimit from 'express-rate-limit';
import { logSecurity } from '../utils/logUtils.js';

/**
 * Global Rate Limiter
 * Applied to all routes
 * 100 requests per 15 minutes
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logSecurity.rateLimit(req.ip, req.originalUrl, {
      limit: 100,
      window: '15 minutes',
      type: 'global',
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      statusCode: 429,
      retryAfter: '15 minutes',
    });
  },
  
  // Skip rate limiting for certain IPs (optional)
  skip: (req) => {
    // Skip for localhost in development
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return false; // Don't skip, still apply rate limit
    }
    return false;
  },
});

/**
 * Auth Rate Limiter (Stricter)
 * Applied to authentication routes
 * 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logSecurity.rateLimit(req.ip, req.originalUrl, {
      limit: 50,
      window: '15 minutes',
      type: 'auth',
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
      statusCode: 429,
      retryAfter: '15 minutes',
    });
  },
  
  // Skip successful requests from counting
  skipSuccessfulRequests: false,
  
  // Skip failed requests from counting (set to false to count all)
  skipFailedRequests: false,
});

/**
 * Special Routes Rate Limiter (Moderate)
 * Applied to specific sensitive routes
 * 10 requests per 15 minutes
 */
export const specialRoutesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to this endpoint, please try again after 15 minutes',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logSecurity.rateLimit(req.ip, req.originalUrl, {
      limit: 10,
      window: '15 minutes',
      type: 'special',
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests to this endpoint, please try again after 15 minutes',
      statusCode: 429,
      retryAfter: '15 minutes',
    });
  },
});

/**
 * Create custom rate limiter with specific config
 */
export const createRateLimiter = (max, windowMs, type = 'custom') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: `Too many requests, please try again after ${windowMs / 60000} minutes`,
      statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req, res) => {
      logSecurity.rateLimit(req.ip, req.originalUrl, {
        limit: max,
        window: `${windowMs / 60000} minutes`,
        type,
      });
      
      res.status(429).json({
        success: false,
        message: `Too many requests, please try again after ${windowMs / 60000} minutes`,
        statusCode: 429,
        retryAfter: `${windowMs / 60000} minutes`,
      });
    },
  });
};

// ============================================
// ADMIN-SPECIFIC RATE LIMITERS (Phase 5 - Task 5.1)
// ============================================

/**
 * Admin Read Operations Rate Limiter
 * Applied to GET requests (view users, analytics)
 * 500 requests per hour
 */
export const adminReadRateLimiter = createRateLimiter(
  500,
  60 * 60 * 1000, // 1 hour
  'admin-read'
);

/**
 * Admin Write Operations Rate Limiter
 * Applied to non-destructive updates (verify profile, status updates)
 * 100 requests per hour
 */
export const adminWriteRateLimiter = createRateLimiter(
  100,
  60 * 60 * 1000, // 1 hour
  'admin-write'
);

/**
 * Admin Destructive Operations Rate Limiter
 * Applied to delete and bulk operations
 * 20 requests per hour
 */
export const adminDestructiveRateLimiter = createRateLimiter(
  20,
  60 * 60 * 1000, // 1 hour
  'admin-destructive'
);

// ============================================
// REPORT MANAGEMENT RATE LIMITERS (Phase 5 - Task 5.4)
// ============================================

/**
 * Report Read Operations Rate Limiter
 * Applied to GET requests (view reports, report details)
 * 2000 requests per hour
 */
export const reportReadRateLimiter = createRateLimiter(
  2000,
  60 * 60 * 1000, // 1 hour
  'report-read'
);

/**
 * Report Status Update Rate Limiter
 * Applied to status update operations
 * 500 requests per hour
 */
export const reportStatusUpdateRateLimiter = createRateLimiter(
  500,
  60 * 60 * 1000, // 1 hour
  'report-status-update'
);

/**
 * Report User Action Rate Limiter
 * Applied to moderation actions on users (ADMIN only)
 * 100 requests per hour
 */
export const reportUserActionRateLimiter = createRateLimiter(
  100,
  60 * 60 * 1000, // 1 hour
  'report-user-action'
);
