/**
 * Request Logging Middleware
 * Logs all HTTP requests with response time tracking
 */

import logger from '../config/logger.js';

/**
 * Request logging middleware
 * Logs: Method, URL, IP, User Agent, Status Code, Response Time
 */
const requestLogger = (req, res, next) => {
  // Capture start time
  const startTime = Date.now();

  // Get client IP (handle proxies)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                   req.ip || 
                   req.connection.remoteAddress;

  // Get user agent
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // Capture original res.send/json to log after response
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send
  res.send = function (data) {
    res.send = originalSend; // Restore original
    logRequest();
    return originalSend.call(this, data);
  };

  // Override res.json
  res.json = function (data) {
    res.json = originalJson; // Restore original
    logRequest();
    return originalJson.call(this, data);
  };

  // Function to log the request
  const logRequest = () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Determine log level based on status code
    // Only log detailed metadata for server errors (500+)
    let level = 'http';
    if (statusCode >= 500) {
      level = 'error';
    }

    // Build log message
    const message = `${method} ${url} ${statusCode} ${responseTime}ms`;

    // Log with metadata only for errors (500+)
    if (statusCode >= 500) {
      logger.log(level, message, {
        method,
        url,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip: clientIp,
        userAgent,
        userId: req.user?.id || req.user?.userId || null,
      });
    } else {
      // Simple log for successful requests and client errors (2xx, 3xx, 4xx)
      logger.log(level, message);
    }
  };

  // Handle response finish event as fallback
  res.on('finish', () => {
    // Only log if send/json wasn't called
    if (res.send === originalSend && res.json === originalJson) {
      logRequest();
    }
  });

  next();
};

/**
 * Request summary logger (lighter version for high-traffic endpoints)
 * Only logs method, URL, and status code without metadata
 */
const requestLoggerLite = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTime}ms`;
    logger.http(message);
  });

  next();
};

/**
 * Skip logging for specific routes (e.g., health checks)
 */
const skipLogger = (routes = []) => {
  return (req, res, next) => {
    const url = req.originalUrl || req.url;
    const shouldSkip = routes.some(route => {
      if (route instanceof RegExp) {
        return route.test(url);
      }
      return url.startsWith(route);
    });

    if (shouldSkip) {
      return next();
    }

    return requestLogger(req, res, next);
  };
};

export { requestLogger, requestLoggerLite, skipLogger };
export default requestLogger;
