/**
 * Custom Error Classes
 * Industry-standard error handling with proper HTTP status codes
 */

/**
 * Base API Error class
 * All custom errors extend from this
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.success = false;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request
 * Used when the request is malformed or invalid
 */
class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details = null) {
    super(400, message);
    this.name = 'BadRequestError';
    this.details = details;
  }
}

/**
 * 401 Unauthorized
 * Used when authentication is required but not provided or invalid
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized - Authentication required') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden
 * Used when user is authenticated but doesn't have permission
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden - You do not have permission to access this resource', additionalData = null) {
    super(403, message);
    this.name = 'ForbiddenError';
    if (additionalData) {
      Object.assign(this, additionalData);
    }
  }
}

/**
 * 404 Not Found
 * Used when a resource is not found
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict
 * Used when there's a conflict with existing resource (e.g., duplicate entry)
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity
 * Used for validation errors
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors = []) {
    super(422, message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 500 Internal Server Error
 * Used for database and other server errors
 */
class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(500, message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * 429 Too Many Requests
 * Used when rate limit is exceeded
 */
class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests, please try again later') {
    super(429, message);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Generic Authentication Error
 * Can be used for various auth-related issues
 */
class AuthError extends ApiError {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(statusCode, message);
    this.name = 'AuthError';
  }
}

/**
 * Helper function to check if error is operational
 * Operational errors are expected errors (validation, not found, etc.)
 * Non-operational errors are programming errors (bugs)
 */
const isOperationalError = (error) => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError,
  TooManyRequestsError,
  AuthError,
  isOperationalError
};
