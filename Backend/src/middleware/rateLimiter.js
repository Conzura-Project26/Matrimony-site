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
