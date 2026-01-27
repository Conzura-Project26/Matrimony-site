/**
 * Logging Utility Functions
 * Helper functions for different types of logging contexts
 */

import logger from '../config/logger.js';

/**
 * Log API-related events
 */
export const logAPI = {
  /**
   * Log successful API operation
   */
  success: (message, metadata = {}) => {
    logger.info(`[API] ${message}`, metadata);
  },

  /**
   * Log API error
   */
  error: (message, error, metadata = {}) => {
    logger.error(`[API] ${message}`, {
      ...metadata,
      error: error.message,
      stack: error.stack,
    });
  },

  /**
   * Log API warning
   */
  warning: (message, metadata = {}) => {
    logger.warn(`[API] ${message}`, metadata);
  },
};

/**
 * Log database-related events
 */
export const logDatabase = {
  /**
   * Log database query
   */
  query: (query, metadata = {}) => {
    logger.database(`[DB Query] ${query}`, metadata);
  },

  /**
   * Log database connection event
   */
  connection: (message, metadata = {}) => {
    logger.database(`[DB Connection] ${message}`, metadata);
  },

  /**
   * Log database error
   */
  error: (message, error, metadata = {}) => {
    logger.error(`[DB Error] ${message}`, {
      ...metadata,
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
  },

  /**
   * Log database transaction
   */
  transaction: (action, metadata = {}) => {
    logger.database(`[DB Transaction] ${action}`, metadata);
  },

  /**
   * Log slow query
   */
  slowQuery: (query, duration, metadata = {}) => {
    logger.warn(`[DB Slow Query] ${query}`, {
      ...metadata,
      duration,
      threshold: '1000ms',
    });
  },
};

/**
 * Log authentication-related events
 */
export const logAuth = {
  /**
   * Log login attempt
   */
  login: (identifier, success, metadata = {}) => {
    logger.auth(`[Auth] Login attempt: ${success ? 'SUCCESS' : 'FAILED'}`, {
      identifier,
      success,
      ...metadata,
    });
  },

  /**
   * Log signup
   */
  signup: (identifier, success, metadata = {}) => {
    logger.auth(`[Auth] Signup: ${success ? 'SUCCESS' : 'FAILED'}`, {
      identifier,
      success,
      ...metadata,
    });
  },

  /**
   * Log OTP sent
   */
  otpSent: (mobile, purpose, metadata = {}) => {
    logger.auth(`[Auth] OTP sent`, {
      mobile,
      purpose,
      ...metadata,
    });
  },

  /**
   * Log OTP verification
   */
  otpVerify: (mobile, success, metadata = {}) => {
    logger.auth(`[Auth] OTP verification: ${success ? 'SUCCESS' : 'FAILED'}`, {
      mobile,
      success,
      ...metadata,
    });
  },

  /**
   * Log logout
   */
  logout: (userId, metadata = {}) => {
    logger.auth(`[Auth] Logout`, {
      userId,
      ...metadata,
    });
  },

  /**
   * Log token generation
   */
  tokenGenerated: (userId, metadata = {}) => {
    logger.auth(`[Auth] Token generated`, {
      userId,
      ...metadata,
    });
  },

  /**
   * Log token verification
   */
  tokenVerify: (success, metadata = {}) => {
    logger.auth(`[Auth] Token verification: ${success ? 'SUCCESS' : 'FAILED'}`, {
      success,
      ...metadata,
    });
  },

  /**
   * Log suspicious activity
   */
  suspicious: (message, metadata = {}) => {
    logger.warn(`[Auth SUSPICIOUS] ${message}`, metadata);
  },
};

/**
 * Log system-related events
 */
export const logSystem = {
  /**
   * Log system startup
   */
  startup: (message, metadata = {}) => {
    logger.info(`[System] ${message}`, metadata);
  },

  /**
   * Log system shutdown
   */
  shutdown: (message, metadata = {}) => {
    logger.info(`[System] ${message}`, metadata);
  },

  /**
   * Log system error
   */
  error: (message, error, metadata = {}) => {
    logger.error(`[System] ${message}`, {
      ...metadata,
      error: error.message,
      stack: error.stack,
    });
  },

  /**
   * Log system warning
   */
  warning: (message, metadata = {}) => {
    logger.warn(`[System] ${message}`, metadata);
  },

  /**
   * Log cron job execution
   */
  cronJob: (jobName, status, metadata = {}) => {
    logger.info(`[System Cron] ${jobName}: ${status}`, metadata);
  },
};

/**
 * Log security-related events
 */
export const logSecurity = {
  /**
   * Log security threat
   */
  threat: (message, metadata = {}) => {
    logger.error(`[Security THREAT] ${message}`, metadata);
  },

  /**
   * Log rate limit hit
   */
  rateLimit: (ip, endpoint, metadata = {}) => {
    logger.warn(`[Security] Rate limit exceeded`, {
      ip,
      endpoint,
      ...metadata,
    });
  },

  /**
   * Log unauthorized access attempt
   */
  unauthorized: (endpoint, metadata = {}) => {
    logger.warn(`[Security] Unauthorized access attempt`, {
      endpoint,
      ...metadata,
    });
  },

  /**
   * Log data breach attempt
   */
  breach: (message, metadata = {}) => {
    logger.error(`[Security BREACH ATTEMPT] ${message}`, metadata);
  },
};

/**
 * Log performance metrics
 */
export const logPerformance = {
  /**
   * Log slow operation
   */
  slow: (operation, duration, threshold, metadata = {}) => {
    logger.warn(`[Performance] Slow operation: ${operation}`, {
      duration,
      threshold,
      ...metadata,
    });
  },

  /**
   * Log performance metric
   */
  metric: (metric, value, metadata = {}) => {
    logger.info(`[Performance] ${metric}: ${value}`, metadata);
  },
};

/**
 * Utility to measure and log execution time
 */
export const logExecutionTime = (fn, context = '') => {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Log if > 1 second
        logPerformance.slow(context || fn.name, `${duration}ms`, '1000ms');
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Execution failed: ${context || fn.name}`, {
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error;
    }
  };
};

/**
 * Export default logger for direct access
 */
export default logger;
