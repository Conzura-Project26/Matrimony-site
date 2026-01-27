/**
 * Input Sanitization Middleware
 * Protects against NoSQL injection and XSS attacks
 */

/**
 * MongoDB/NoSQL Injection Protection
 * Custom implementation to remove dangerous operators
 */
export const mongoSanitizeMiddleware = (req, res, next) => {
  // Sanitize function to remove $ and . from keys
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized = {};
    for (const key in obj) {
      // Remove keys that start with $ or contain .
      if (key.startsWith('$') || key.includes('.')) {
        const sanitizedKey = key.replace(/\$/g, '_').replace(/\./g, '_');
        console.warn(`Sanitized dangerous key: ${key} -> ${sanitizedKey} from ${req.ip}`);
        sanitized[sanitizedKey] = sanitize(obj[key]);
      } else {
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };

  // Only sanitize body (query and params are read-only in Express 5)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  next();
};

/**
 * XSS (Cross-Site Scripting) Protection
 * Custom middleware to sanitize HTML/script tags
 */
export const xssMiddleware = (req, res, next) => {
  // Sanitize function to remove/escape dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove script tags and common XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Only sanitize body (query and params are read-only in Express 5)
  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};

/**
 * Combined sanitization middleware
 * Applies both NoSQL injection and XSS protection
 */
export const sanitizeInput = [mongoSanitizeMiddleware, xssMiddleware];
