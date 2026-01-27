/**
 * Error Handling Test Routes
 * Test all error types to verify they work correctly
 * 
 * Run server and test these endpoints:
 * GET /test-errors/400 - BadRequestError
 * GET /test-errors/401 - UnauthorizedError
 * GET /test-errors/403 - ForbiddenError
 * GET /test-errors/404 - NotFoundError
 * GET /test-errors/409 - ConflictError
 * GET /test-errors/422 - ValidationError
 * GET /test-errors/500 - DatabaseError
 * GET /test-errors/prisma - Prisma error
 * GET /test-errors/async - Async error caught by asyncHandler
 */

import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError,
  AuthError
} from '../utils/errors.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Test 400 - Bad Request
router.get('/400', asyncHandler(async (req, res) => {
  throw new BadRequestError('This is a test bad request error');
}));

// Test 401 - Unauthorized
router.get('/401', asyncHandler(async (req, res) => {
  throw new UnauthorizedError('You must be logged in to access this');
}));

// Test 403 - Forbidden
router.get('/403', asyncHandler(async (req, res) => {
  throw new ForbiddenError('You do not have permission to perform this action');
}));

// Test 404 - Not Found
router.get('/404', asyncHandler(async (req, res) => {
  throw new NotFoundError('The requested resource was not found');
}));

// Test 409 - Conflict
router.get('/409', asyncHandler(async (req, res) => {
  throw new ConflictError('A resource with this identifier already exists');
}));

// Test 422 - Validation Error
router.get('/422', asyncHandler(async (req, res) => {
  throw new ValidationError('Validation failed', [
    { field: 'email', message: 'Email is required' },
    { field: 'password', message: 'Password must be at least 8 characters' },
    { field: 'age', message: 'Age must be between 18 and 100' }
  ]);
}));

// Test 500 - Database Error
router.get('/500', asyncHandler(async (req, res) => {
  throw new DatabaseError('Database connection failed');
}));

// Test Prisma Error (will be auto-converted)
router.get('/prisma', asyncHandler(async (req, res) => {
  // This will trigger a Prisma error (record not found)
  await prisma.user.findUniqueOrThrow({
    where: { id: 999999999 }
  });
}));

// Test async error handling
router.get('/async', asyncHandler(async (req, res) => {
  // Simulate async operation that throws error
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Async operation failed'));
    }, 100);
  });
}));

// Test successful response
router.get('/success', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'No error - everything works!'
  });
}));

// Test error with details
router.get('/detailed', asyncHandler(async (req, res) => {
  const error = new BadRequestError('Invalid request parameters', {
    requiredFields: ['name', 'email', 'mobile'],
    receivedFields: Object.keys(req.query),
    missingFields: ['name', 'email']
  });
  throw error;
}));

export default router;
