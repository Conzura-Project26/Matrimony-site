/**
 * Error Handling Usage Examples
 * This file demonstrates how to use the error handling framework in controllers
 */

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

// ============================================
// Example 1: Using asyncHandler (RECOMMENDED)
// ============================================

/**
 * Get user by ID - WITH asyncHandler
 * No try-catch needed! asyncHandler catches errors automatically
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) }
  });

  // Throw custom error if not found
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

// ============================================
// Example 2: ValidationError with details
// ============================================

export const createUser = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;

  // Validate required fields
  const errors = [];
  if (!email) errors.push({ field: 'email', message: 'Email is required' });
  if (!mobile) errors.push({ field: 'mobile', message: 'Mobile is required' });
  if (!password) errors.push({ field: 'password', message: 'Password is required' });

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { mobile }]
    }
  });

  if (existingUser) {
    throw new ConflictError('User with this email or mobile already exists');
  }

  // Create user
  const user = await prisma.user.create({
    data: { email, mobile, password }
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

// ============================================
// Example 3: UnauthorizedError for auth
// ============================================

export const protectedRoute = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    throw new UnauthorizedError('Please log in to access this resource');
  }

  res.json({
    success: true,
    message: 'This is a protected route',
    data: req.user
  });
});

// ============================================
// Example 4: ForbiddenError for permissions
// ============================================

export const adminOnlyRoute = asyncHandler(async (req, res) => {
  // Check if user has admin role
  if (req.user.role_id !== 3) { // 3 = Admin
    throw new ForbiddenError('Only admins can access this resource');
  }

  res.json({
    success: true,
    message: 'Admin dashboard data'
  });
});

// ============================================
// Example 5: BadRequestError for invalid input
// ============================================

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { age } = req.body;

  // Validate age
  if (age && (age < 18 || age > 100)) {
    throw new BadRequestError('Age must be between 18 and 100');
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { age }
  });

  res.json({
    success: true,
    data: user
  });
});

// ============================================
// Example 6: DatabaseError for DB issues
// ============================================

export const complexDatabaseOperation = asyncHandler(async (req, res) => {
  try {
    // Complex transaction
    const result = await prisma.$transaction(async (tx) => {
      // Multiple database operations
      const user = await tx.user.create({ data: req.body });
      const profile = await tx.userPersonalDetails.create({
        data: { user_id: user.id }
      });
      return { user, profile };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // Wrap database error with context
    throw new DatabaseError('Transaction failed', error);
  }
});

// ============================================
// Example 7: Multiple error conditions
// ============================================

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is deleting their own account or is admin
  if (req.user.id !== parseInt(id) && req.user.role_id !== 3) {
    throw new ForbiddenError('You can only delete your own account');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) }
  });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  // Check if user is already deleted
  if (!user.is_active) {
    throw new BadRequestError('User is already deactivated');
  }

  // Soft delete
  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { is_active: false }
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// ============================================
// Example 8: WITHOUT asyncHandler (NOT recommended)
// ============================================

/**
 * Manual error handling - More verbose, easy to forget try-catch
 */
export const manualErrorHandling = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    // Must manually pass error to next()
    next(error);
  }
};

// ============================================
// Example 9: Prisma errors auto-handled
// ============================================

export const prismaErrorExample = asyncHandler(async (req, res) => {
  // This will throw P2002 (unique constraint) if email exists
  // Error handler will automatically convert to ConflictError
  const user = await prisma.user.create({
    data: {
      email: 'duplicate@example.com', // If exists, auto 409 error
      mobile: '1234567890',
      password: 'password123'
    }
  });

  res.status(201).json({
    success: true,
    data: user
  });
});

// ============================================
// Example 10: Conditional error throwing
// ============================================

export const conditionalErrors = asyncHandler(async (req, res) => {
  const { action } = req.query;

  switch (action) {
    case 'notfound':
      throw new NotFoundError('This resource does not exist');
    
    case 'unauthorized':
      throw new UnauthorizedError('You must be logged in');
    
    case 'forbidden':
      throw new ForbiddenError('You do not have permission');
    
    case 'validation':
      throw new ValidationError('Invalid data', [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be 18 or older' }
      ]);
    
    case 'conflict':
      throw new ConflictError('Resource already exists');
    
    default:
      res.json({
        success: true,
        message: 'No error triggered'
      });
  }
});

// ============================================
// BEST PRACTICES
// ============================================

/*
1. ✅ ALWAYS use asyncHandler for async route handlers
2. ✅ Throw specific error types (NotFoundError, ValidationError, etc.)
3. ✅ Include meaningful error messages
4. ✅ Add error details for validation errors
5. ✅ Let Prisma errors be auto-converted by error handler
6. ✅ Use appropriate HTTP status codes via error classes
7. ❌ DON'T use generic Error() - use custom error classes
8. ❌ DON'T forget to throw errors - they won't be caught otherwise
9. ❌ DON'T send error responses manually - let errorHandler do it
*/
