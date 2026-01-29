/**
 * Role-Based Authorization Middleware
 * Provides granular access control using roles and permissions
 * 
 * Features:
 * - Role-based authorization (authorizeRole)
 * - Permission-based authorization (authorizePermission)
 * - Resource ownership verification (checkOwnership)
 * - ADMIN bypass for all permission checks
 * - Audit logging for failed attempts
 * - Active user verification
 */

import prisma from '../config/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Role-Based Authorization Middleware
 * Checks if user has one of the required roles
 * 
 * @param {string[]} allowedRoles - Array of role names (e.g., ['ADMIN', 'MODERATOR'])
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin/analytics', auth, authorizeRole(['ADMIN']), getAnalytics);
 * router.post('/photos/approve', auth, authorizeRole(['MODERATOR', 'ADMIN']), approvePhoto);
 */
export const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.userId) {
        logger.warn('Authorization attempted without authentication', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        throw new UnauthorizedError('Authentication required');
      }

      const { userId, role } = req.user;
      const roleName = role; // JWT token uses 'role' field

      // Check if user is active
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is_active: true }
      });

      if (!user) {
        logger.error('Authorization failed - User not found', {
          userId,
          ip: req.ip,
          path: req.path
        });
        throw new UnauthorizedError('User not found');
      }

      if (!user.is_active) {
        logger.warn('Authorization failed - Inactive user', {
          userId,
          roleName,
          ip: req.ip,
          path: req.path
        });

        // Log to audit trail
        await logAuthorizationFailure(userId, req, 'Account deactivated', {
          reason: 'inactive_account',
          roleName
        });

        throw new ForbiddenError('Your account has been deactivated');
      }

      // Check if user has one of the allowed roles
      if (allowedRoles.includes(roleName)) {
        logger.auth('Role authorization successful', {
          userId,
          roleName,
          allowedRoles,
          path: req.path,
          method: req.method
        });
        return next();
      }

      // Authorization failed
      logger.warn('Role authorization failed', {
        userId,
        userRole: roleName,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      // Log to audit trail
      await logAuthorizationFailure(userId, req, 'Insufficient role privileges', {
        userRole: roleName,
        requiredRoles: allowedRoles
      });

      throw new ForbiddenError('You do not have permission to access this resource');

    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-Based Authorization Middleware
 * Checks if user has at least one of the required permissions
 * ADMIN role automatically bypasses all permission checks
 * 
 * @param {string[]} requiredPermissions - Array of permission names (e.g., ['delete_users', 'manage_users'])
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/users/:id', auth, authorizePermission(['delete_users']), deleteUser);
 * router.post('/reports/export', auth, authorizePermission(['export_reports', 'view_analytics']), exportReports);
 */
export const authorizePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.userId) {
        logger.warn('Permission authorization attempted without authentication', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        throw new UnauthorizedError('Authentication required');
      }

      const { userId, role } = req.user;
      const roleName = role; // JWT token uses 'role' field

      // Check if user is active
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is_active: true, role_id: true }
      });

      if (!user) {
        logger.error('Permission authorization failed - User not found', {
          userId,
          ip: req.ip,
          path: req.path
        });
        throw new UnauthorizedError('User not found');
      }

      if (!user.is_active) {
        logger.warn('Permission authorization failed - Inactive user', {
          userId,
          roleName,
          ip: req.ip,
          path: req.path
        });

        await logAuthorizationFailure(userId, req, 'Account deactivated', {
          reason: 'inactive_account',
          roleName
        });

        throw new ForbiddenError('Your account has been deactivated');
      }

      // ADMIN bypasses all permission checks
      if (roleName === 'ADMIN') {
        logger.auth('Permission authorization bypassed for ADMIN', {
          userId,
          roleName,
          requiredPermissions,
          path: req.path,
          method: req.method
        });
        return next();
      }

      // Fetch user's permissions from database
      const userPermissions = await prisma.rolePermission.findMany({
        where: { role_id: user.role_id },
        include: {
          permission: {
            select: { permission_name: true }
          }
        }
      });

      // Extract permission names
      const permissionNames = userPermissions.map(rp => rp.permission.permission_name);

      // Check if user has at least one of the required permissions (OR logic)
      const hasPermission = requiredPermissions.some(permission => 
        permissionNames.includes(permission)
      );

      if (hasPermission) {
        logger.auth('Permission authorization successful', {
          userId,
          roleName,
          userPermissions: permissionNames,
          requiredPermissions,
          path: req.path,
          method: req.method
        });
        return next();
      }

      // Authorization failed
      logger.warn('Permission authorization failed', {
        userId,
        userRole: roleName,
        userPermissions: permissionNames,
        requiredPermissions,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      // Log to audit trail
      await logAuthorizationFailure(userId, req, 'Insufficient permissions', {
        userRole: roleName,
        userPermissions: permissionNames,
        requiredPermissions
      });

      throw new ForbiddenError('You do not have permission to access this resource');

    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource Ownership Authorization Middleware
 * Verifies that the authenticated user owns the resource they're trying to access
 * ADMIN and MODERATOR roles can bypass ownership checks
 * 
 * @param {string} paramName - Name of the route parameter to check (e.g., 'userId', 'photoId')
 * @param {Object} options - Configuration options
 * @param {string[]} options.bypassRoles - Roles that can bypass ownership check (default: ['ADMIN', 'MODERATOR'])
 * @param {string} options.resourceType - Type of resource for logging (default: 'resource')
 * @returns {Function} Express middleware
 * 
 * @example
 * // User can only edit their own profile
 * router.put('/profile/:userId', auth, checkOwnership('userId'), updateProfile);
 * 
 * // User can only delete their own photo
 * router.delete('/photos/:photoId', auth, checkOwnership('photoId', { resourceType: 'photo' }), deletePhoto);
 * 
 * // Custom bypass roles
 * router.put('/messages/:messageId', auth, checkOwnership('messageId', { 
 *   bypassRoles: ['ADMIN'], 
 *   resourceType: 'message' 
 * }), editMessage);
 */
export const checkOwnership = (paramName, options = {}) => {
  const {
    bypassRoles = ['ADMIN', 'MODERATOR'],
    resourceType = 'resource'
  } = options;

  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.userId) {
        logger.warn('Ownership check attempted without authentication', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          resourceType
        });
        throw new UnauthorizedError('Authentication required');
      }

      const { userId, role } = req.user;
      const roleName = role; // JWT token uses 'role' field
      const resourceId = req.params[paramName];

      if (!resourceId) {
        logger.error('Ownership check failed - Resource ID not found in params', {
          userId,
          paramName,
          params: req.params,
          path: req.path
        });
        throw new ForbiddenError('Resource identifier not found');
      }

      // Bypass check for specified roles
      if (bypassRoles.includes(roleName)) {
        logger.auth('Ownership check bypassed', {
          userId,
          roleName,
          resourceId,
          resourceType,
          path: req.path,
          method: req.method
        });
        return next();
      }

      // Check ownership based on parameter name
      let isOwner = false;

      if (paramName === 'userId') {
        // Direct user ID comparison
        isOwner = (userId === resourceId);
      } else if (paramName === 'photoId') {
        // Check photo ownership
        const photo = await prisma.userPhoto.findUnique({
          where: { id: parseInt(resourceId) },
          select: { user_id: true }
        });
        isOwner = photo && (photo.user_id === userId);
      } else {
        // Generic ownership check - assumes resource has user_id field
        // You can extend this for other resource types
        logger.warn('Generic ownership check - implement specific logic if needed', {
          userId,
          paramName,
          resourceId,
          resourceType
        });
        isOwner = (userId === resourceId);
      }

      if (isOwner) {
        logger.auth('Ownership check successful', {
          userId,
          resourceId,
          resourceType,
          path: req.path,
          method: req.method
        });
        return next();
      }

      // Ownership check failed
      logger.warn('Ownership check failed', {
        userId,
        roleName,
        resourceId,
        resourceType,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      // Log to audit trail
      await logAuthorizationFailure(userId, req, 'Resource ownership violation', {
        resourceId,
        resourceType,
        roleName
      });

      throw new ForbiddenError('You do not have permission to access this resource');

    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to log authorization failures to audit trail
 * 
 * @param {string} userId - User ID
 * @param {Object} req - Express request object
 * @param {string} action - Action description
 * @param {Object} details - Additional details
 */
async function logAuthorizationFailure(userId, req, action, details = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: action,
        table_name: 'authorization',
        record_id: userId,
        old_values: null,
        new_values: JSON.stringify({
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          ...details
        }),
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    logger.database('Authorization failure logged to audit trail', {
      userId,
      action,
      path: req.path
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('Failed to log authorization failure to audit trail', {
      userId,
      action,
      error: error.message
    });
  }
}

/**
 * Export all middleware functions
 */
export default {
  authorizeRole,
  authorizePermission,
  checkOwnership
};