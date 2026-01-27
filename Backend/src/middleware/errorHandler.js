/**
 * Global Error Handler Middleware
 * Centralized error handling with proper logging and response formatting
 */

import { Prisma } from '@prisma/client';
import { ApiError, isOperationalError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Convert Prisma errors to API errors
 */
const handlePrismaError = (error) => {
  // Unique constraint violation (duplicate entry)
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return {
      statusCode: 409,
      message: `A record with this ${field} already exists`,
      name: 'ConflictError'
    };
  }

  // Record not found
  if (error.code === 'P2025') {
    return {
      statusCode: 404,
      message: error.meta?.cause || 'Record not found',
      name: 'NotFoundError'
    };
  }

  // Foreign key constraint violation
  if (error.code === 'P2003') {
    const field = error.meta?.field_name || 'reference';
    return {
      statusCode: 400,
      message: `Invalid ${field} - referenced record does not exist`,
      name: 'BadRequestError'
    };
  }

  // Required field missing
  if (error.code === 'P2011') {
    const field = error.meta?.constraint || 'field';
    return {
      statusCode: 400,
      message: `${field} is required`,
      name: 'ValidationError'
    };
  }

  // Default database error
  return {
    statusCode: 500,
    message: 'Database operation failed',
    name: 'DatabaseError'
  };
};

/**
 * Convert JWT errors to API errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token - Please log in again',
      name: 'UnauthorizedError'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired - Please log in again',
      name: 'UnauthorizedError'
    };
  }

  return {
    statusCode: 401,
    message: 'Authentication failed',
    name: 'AuthError'
  };
};

/**
 * Convert Zod validation errors to API errors
 */
const handleZodError = (error) => {
  const errors = (error.issues || error.errors || []).map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return {
    statusCode: 422,
    message: 'Validation failed',
    name: 'ValidationError',
    errors
  };
};

/**
 * Format error response
 */
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    message: error.message || 'Something went wrong',
    statusCode: error.statusCode || 500,
    error: {
      name: error.name || 'Error',
      ...(error.errors && { details: error.errors }),
      ...(error.details && { details: error.details })
    }
  };

  // Include stack trace only in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * Global Error Handler Middleware
 * This should be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;

  // Log error with Winston (without stack trace)
  logger.error('Request Error', {
    name: error.name,
    message: error.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || req.user?.user_id || null,
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString()
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    error.statusCode = prismaError.statusCode;
    error.message = prismaError.message;
    error.name = prismaError.name;
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error.statusCode = 400;
    error.message = 'Invalid data provided';
    error.name = 'ValidationError';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const jwtError = handleJWTError(err);
    error.statusCode = jwtError.statusCode;
    error.message = jwtError.message;
    error.name = jwtError.name;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = handleZodError(err);
    error.statusCode = zodError.statusCode;
    error.message = zodError.message;
    error.name = zodError.name;
    error.errors = zodError.errors;
  }

  // Handle MongoDB/Mongoose errors (if ever used)
  if (err.code === 11000) {
    error.statusCode = 409;
    error.message = 'Duplicate field value entered';
    error.name = 'ConflictError';
  }

  // Handle multer errors (file upload)
  if (err.name === 'MulterError') {
    error.statusCode = 400;
    error.message = `File upload error: ${err.message}`;
    error.name = 'BadRequestError';
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json(
    formatErrorResponse(
      error,
      process.env.NODE_ENV === 'development' // Include stack only in dev
    )
  );
};

/**
 * 404 Not Found Handler
 * Should be placed before the error handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found - ${req.method} ${req.originalUrl}`
  );
  next(error);
};

export { errorHandler, notFoundHandler };
