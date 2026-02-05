/**
 * Admin Routes
 * Phase 5 - Task 5.1: Admin User Management
 * Phase 5 - Task 5.4: Report Management
 * 
 * Photo Moderation Routes:
 * - GET    /admin/photos/pending - Get pending photos for moderation
 * - PATCH  /admin/photos/:photoId/approve - Approve a photo
 * - DELETE /admin/photos/:photoId - Reject/delete a photo
 * 
 * User Management Routes:
 * - GET    /admin/users - Get all users with filters
 * - GET    /admin/users/analytics - Get analytics/statistics
 * - GET    /admin/users/:id - Get user details
 * - PUT    /admin/users/:id/status - Update user status
 * - PUT    /admin/users/:id/verify - Verify user profile
 * - DELETE /admin/users/:id - Delete user (soft delete)
 * - POST   /admin/users/export - Export users data
 * - POST   /admin/users/bulk - Bulk operations
 * 
 * Report Management Routes:
 * - GET    /admin/reports - Get all reports with filters
 * - GET    /admin/reports/statistics - Get report statistics
 * - GET    /admin/reports/:id - Get report details
 * - PUT    /admin/reports/:id/status - Update report status
 * - PUT    /admin/reports/:id/action - Take action on reported user
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/authorization.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
  bulkApprovePhotos,
  bulkRejectPhotos,
} from '../controllers/photoController.js';
import adminController from '../controllers/adminController.js';
import statisticsController from '../controllers/statisticsController.js';
import reportController from '../controllers/reportController.js';
import {
  adminReadRateLimiter,
  adminWriteRateLimiter,
  adminDestructiveRateLimiter,
  reportReadRateLimiter,
  reportStatusUpdateRateLimiter,
  reportUserActionRateLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /admin/photos/pending:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get pending photos for moderation
 *     description: Retrieve all photos awaiting moderation approval with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Pending photos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Pending photos retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           file_url:
 *                             type: string
 *                             format: uri
 *                           visibility:
 *                             type: string
 *                             enum: [PUBLIC, PRIVATE, AUTHENTICATED]
 *                           is_approved:
 *                             type: boolean
 *                             example: false
 *                           uploaded_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               full_name:
 *                                 type: string
 *                               mobile_number:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       500:
 *         description: Server error
 */
router.get(
  '/photos/pending',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(getPendingPhotos)
);

// ============================================
// BULK OPERATIONS (must be before :photoId routes)
// ============================================

/**
 * @swagger
 * /admin/photos/bulk-approve:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Bulk approve multiple photos
 *     description: Approve multiple photos at once (max 50 per request). Fault-tolerant - continues processing even if some photos fail.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_ids
 *             properties:
 *               photo_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: Array of photo IDs to approve (1-50 photos)
 *                 example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 *     responses:
 *       200:
 *         description: Bulk approval completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Bulk approve completed: 8 processed, 2 failed'
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 10
 *                         processed:
 *                           type: integer
 *                           example: 8
 *                         failed:
 *                           type: integer
 *                           example: 2
 *                     failures:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           photo_id:
 *                             type: integer
 *                             example: 999
 *                           error:
 *                             type: string
 *                             example: 'Photo not found'
 *       400:
 *         description: Validation error (empty array, too many photos, invalid data)
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       500:
 *         description: Server error
 */
router.patch(
  '/photos/bulk-approve',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminWriteRateLimiter,
  asyncHandler(bulkApprovePhotos)
);

/**
 * @swagger
 * /admin/photos/bulk-reject:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Bulk reject and delete multiple photos
 *     description: Reject and delete multiple photos at once (max 50 per request). Requires reason that applies to all photos. Fault-tolerant - continues processing even if some photos fail.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_ids
 *               - reason
 *             properties:
 *               photo_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: Array of photo IDs to reject (1-50 photos)
 *                 example: [11, 12, 13, 14, 15]
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for rejection (applies to ALL photos, logged in audit trail)
 *                 example: 'Photos contain inappropriate content that violates our community standards'
 *     responses:
 *       200:
 *         description: Bulk rejection completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Bulk reject completed: 5 processed, 0 failed'
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         processed:
 *                           type: integer
 *                           example: 5
 *                         failed:
 *                           type: integer
 *                           example: 0
 *                     failures:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           photo_id:
 *                             type: integer
 *                             example: 999
 *                           error:
 *                             type: string
 *                             example: 'Photo not found'
 *       400:
 *         description: Validation error (empty array, too many photos, invalid reason length)
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       500:
 *         description: Server error
 */
router.delete(
  '/photos/bulk-reject',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminDestructiveRateLimiter,
  asyncHandler(bulkRejectPhotos)
);

/**
 * @swagger
 * /admin/photos/{photoId}/approve:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Approve a photo
 *     description: Approve a photo for public display after moderation review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to approve
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     responses:
 *       200:
 *         description: Photo approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Photo approved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     is_approved:
 *                       type: boolean
 *                       example: true
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/photos/:photoId/approve',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(approvePhoto)
);

/**
 * @swagger
 * /admin/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Reject and delete a photo
 *     description: Reject and permanently delete an inappropriate photo with audit trail logging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to reject and delete
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for photo rejection (logged in audit trail)
 *                 example: 'Inappropriate content violating community guidelines'
 *     responses:
 *       200:
 *         description: Photo rejected and deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Photo rejected and deleted successfully'
 *       400:
 *         description: Validation error - reason is required
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/photos/:photoId',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(rejectPhoto)
);

// ============================================
// USER MANAGEMENT ROUTES (Phase 5 - Task 5.1)
// ============================================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: Get all users with filters and pagination
 *     description: Retrieve paginated list of users with advanced filtering, sorting, and search capabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches name, email, profile_id, mobile)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: is_profile_verified
 *         schema:
 *           type: boolean
 *         description: Filter by profile verification status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, MODERATOR]
 *         description: Filter by role
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female, Other]
 *         description: Filter by gender
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, last_active_at, profile_completion_percentage, full_name]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 */
router.get(
  '/users',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(adminController.getAllUsers)
);

/**
 * @swagger
 * /admin/users/analytics:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: Get user analytics and statistics
 *     description: Retrieve dashboard analytics including user counts and activity metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                       properties:
 *                         total_users:
 *                           type: integer
 *                         active_users:
 *                           type: integer
 *                         verified_users:
 *                           type: integer
 *                         inactive_users:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 */
router.get(
  '/users/analytics',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(adminController.getAnalytics)
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: Get detailed user information
 *     description: Retrieve complete user profile with all sections, photos, preferences, and statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(adminController.getUserDetails)
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     tags:
 *       - Admin - User Management
 *     summary: Update user account status
 *     description: Activate, deactivate, or suspend user account with reason. Revokes tokens and cancels interests for deactivated users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - reason
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 description: New account status
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for status change (logged in audit trail)
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role or cannot modify another admin
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:id/status',
  authenticateToken,
  authorizeRole(['ADMIN']),
  adminWriteRateLimiter,
  asyncHandler(adminController.updateUserStatus)
);

/**
 * @swagger
 * /admin/users/{id}/verify:
 *   put:
 *     tags:
 *       - Admin - User Management
 *     summary: Verify or unverify user profile
 *     description: Manually verify or unverify a user's profile. Logged in audit trail.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_profile_verified
 *             properties:
 *               is_profile_verified:
 *                 type: boolean
 *                 description: Verification status to set
 *     responses:
 *       200:
 *         description: Profile verification updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:id/verify',
  authenticateToken,
  authorizeRole(['ADMIN']),
  adminWriteRateLimiter,
  asyncHandler(adminController.verifyUserProfile)
);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin - User Management
 *     summary: Delete user (soft delete)
 *     description: Soft delete user account. Marks as inactive, revokes tokens, cancels interests, but preserves data for audit. Admins cannot delete other admins.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Deletion reason (mandatory, logged in audit trail)
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role or cannot delete admin accounts
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  authenticateToken,
  authorizeRole(['ADMIN']),
  adminDestructiveRateLimiter,
  asyncHandler(adminController.deleteUser)
);

/**
 * @swagger
 * /admin/users/export:
 *   post:
 *     tags:
 *       - Admin - User Management
 *     summary: Export users data (async)
 *     description: Queue user data export job. Returns job ID. File will be generated asynchronously and admin will be notified.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [CSV, JSON]
 *                 default: CSV
 *                 description: Export format
 *               filters:
 *                 type: object
 *                 description: Optional filters to apply to export
 *                 properties:
 *                   is_active:
 *                     type: boolean
 *                   is_profile_verified:
 *                     type: boolean
 *                   role:
 *                     type: string
 *                     enum: [USER, ADMIN, MODERATOR]
 *     responses:
 *       202:
 *         description: Export job queued successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role
 */
router.post(
  '/users/export',
  authenticateToken,
  authorizeRole(['ADMIN']),
  adminWriteRateLimiter,
  asyncHandler(adminController.exportUsers)
);

/**
 * @swagger
 * /admin/users/bulk:
 *   post:
 *     tags:
 *       - Admin - User Management
 *     summary: Perform bulk operations on users
 *     description: Execute bulk actions (activate, deactivate, suspend, verify) on multiple users. Max 100 users per request.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - user_ids
 *               - reason
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ACTIVATE, DEACTIVATE, SUSPEND, VERIFY_PROFILE]
 *                 description: Bulk action to perform
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 100
 *                 description: Array of user IDs (max 100)
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for bulk action (logged in audit trail)
 *     responses:
 *       200:
 *         description: Bulk operation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: integer
 *                       description: Number of successful operations
 *                     failed:
 *                       type: integer
 *                       description: Number of failed operations
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           reason:
 *                             type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role
 */
router.post(
  '/users/bulk',
  authenticateToken,
  authorizeRole(['ADMIN']),
  adminDestructiveRateLimiter,
  asyncHandler(adminController.bulkOperation)
);

// ============================================
// STATISTICS ROUTES (Task 5.2)
// ============================================

/**
 * @swagger
 * /admin/statistics/dashboard:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get aggregated dashboard statistics
 *     description: Get all key statistics at once for admin dashboard (heavily cached)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/dashboard',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getDashboard)
);

/**
 * @swagger
 * /admin/statistics/users/summary:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get user summary with breakdowns
 *     description: Get total users with breakdowns by status, verification, role, and completion
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/summary',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUserSummary)
);

/**
 * @swagger
 * /admin/statistics/users/by-gender:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get user distribution by gender
 *     description: Get user counts and percentages by gender with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: is_profile_verified
 *         schema:
 *           type: boolean
 *         description: Filter by profile verification status
 *     responses:
 *       200:
 *         description: Gender distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/by-gender',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUsersByGender)
);

/**
 * @swagger
 * /admin/statistics/users/by-religion:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get user distribution by religion
 *     description: Get user counts and percentages by religion with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female, Other]
 *         description: Filter by gender
 *     responses:
 *       200:
 *         description: Religion distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/by-religion',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUsersByReligion)
);

/**
 * @swagger
 * /admin/statistics/users/by-location:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get geographic distribution
 *     description: Get user distribution by state and top N cities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: top_cities
 *         schema:
 *           type: integer
 *           minimum: 5
 *           maximum: 20
 *           default: 10
 *         description: Number of top cities to return
 *     responses:
 *       200:
 *         description: Location distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/by-location',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUsersByLocation)
);

/**
 * @swagger
 * /admin/statistics/users/by-age:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get age distribution
 *     description: Get user distribution by age buckets and average age by gender
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Age distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/by-age',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUsersByAge)
);

/**
 * @swagger
 * /admin/statistics/users/by-marital-status:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get marital status distribution
 *     description: Get user distribution by marital status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marital status distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/by-marital-status',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getUsersByMaritalStatus)
);

/**
 * @swagger
 * /admin/statistics/users/profile-completion:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get profile completion statistics
 *     description: Get average profile completion and distribution by buckets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/profile-completion',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getProfileCompletion)
);

/**
 * @swagger
 * /admin/statistics/users/verification:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get verification statistics
 *     description: Get email, mobile, and profile verification counts and percentages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/verification',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getVerificationStats)
);

/**
 * @swagger
 * /admin/statistics/registrations:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get registration trends
 *     description: Get registration time series with optional grouping by gender, religion, created_by, or completion_bucket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period granularity
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [none, gender, religion, created_by, completion_bucket]
 *           default: none
 *         description: Optional grouping dimension
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601)
 *     responses:
 *       200:
 *         description: Registration trends retrieved successfully
 *       400:
 *         description: Validation error (date range exceeds limits)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/registrations',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getRegistrationTrends)
);

/**
 * @swagger
 * /admin/statistics/users/active/summary:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get active users summary
 *     description: Get count of users active within specified window (DAU/WAU/MAU)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: window
 *         schema:
 *           type: string
 *           enum: ['1d', '7d', '30d']
 *           default: '7d'
 *         description: Activity window (1d = daily, 7d = weekly, 30d = monthly)
 *     responses:
 *       200:
 *         description: Active users summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/active/summary',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getActiveUsersSummary)
);

/**
 * @swagger
 * /admin/statistics/users/active/trend:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get active users trend
 *     description: Get time series of active users over specified period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: window
 *         schema:
 *           type: string
 *           enum: ['1d', '7d', '30d']
 *           default: '7d'
 *         description: Activity window
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period granularity for trend
 *     responses:
 *       200:
 *         description: Active users trend retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/active/trend',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getActiveUsersTrend)
);

/**
 * @swagger
 * /admin/statistics/users/active/demographics:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get active users demographics
 *     description: Get demographic breakdown of active users by gender and age
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: window
 *         schema:
 *           type: string
 *           enum: ['1d', '7d', '30d']
 *           default: '7d'
 *         description: Activity window
 *     responses:
 *       200:
 *         description: Active users demographics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/active/demographics',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getActiveUsersDemographics)
);

/**
 * @swagger
 * /admin/statistics/users/engagement:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get user engagement metrics
 *     description: Get aggregate counts for profile views, interests, messages, and shortlists
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/engagement',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getEngagementMetrics)
);

/**
 * @swagger
 * /admin/statistics/users/retention:
 *   get:
 *     tags:
 *       - Admin Statistics
 *     summary: Get retention metrics
 *     description: Get Day 1, Day 7, and Day 30 retention rates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retention metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/statistics/users/retention',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  adminReadRateLimiter,
  asyncHandler(statisticsController.getRetentionMetrics)
);

// ============================================
// REPORT MANAGEMENT ROUTES (Phase 5 - Task 5.4) ✅
// ============================================

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     tags:
 *       - Admin Reports
 *     summary: Get all user reports with filters
 *     description: Retrieve all user reports with comprehensive filtering, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, ACTION_TAKEN, RESOLVED, DISMISSED, ESCALATED]
 *         description: Filter by report status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity level
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_PHOTO, INAPPROPRIATE_CONTENT, SPAM, SCAM, UNDERAGE, MARRIED, DUPLICATE_PROFILE, OFFENSIVE_BEHAVIOR, OTHER]
 *         description: Filter by report category
 *       - in: query
 *         name: reported_by
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by reporter user ID
 *       - in: query
 *         name: reported_user
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by reported user ID
 *       - in: query
 *         name: created_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter reports created from this date
 *       - in: query
 *         name: created_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter reports created until this date
 *       - in: query
 *         name: has_action
 *         schema:
 *           type: boolean
 *         description: Filter reports with action taken
 *       - in: query
 *         name: escalated
 *         schema:
 *           type: boolean
 *         description: Show only escalated reports
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in reason, notes, reporter/reported user names
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, severity]
 *           default: severity
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Reports retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/reports',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  reportReadRateLimiter,
  asyncHandler(reportController.getAllReports)
);

/**
 * @swagger
 * /admin/reports/statistics:
 *   get:
 *     tags:
 *       - Admin Reports
 *     summary: Get report statistics
 *     description: Get overview statistics for reports dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         open:
 *                           type: integer
 *                         in_review:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         escalated:
 *                           type: integer
 *                         today:
 *                           type: integer
 *                     by_severity:
 *                       type: object
 *                     by_category:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 */
router.get(
  '/reports/statistics',
  authenticateToken,
  authorizeRole(['ADMIN']),
  reportReadRateLimiter,
  asyncHandler(reportController.getReportStatistics)
);

/**
 * @swagger
 * /admin/reports/{id}:
 *   get:
 *     tags:
 *       - Admin Reports
 *     summary: Get detailed report information
 *     description: Retrieve complete report details including reporter info, reported user info, action history, and related reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Report details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     category:
 *                       type: string
 *                     severity:
 *                       type: string
 *                     status:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     admin_notes:
 *                       type: string
 *                     action_taken:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     resolved_at:
 *                       type: string
 *                       format: date-time
 *                     reporter:
 *                       type: object
 *                       description: Reporter user snapshot
 *                     reported:
 *                       type: object
 *                       description: Reported user snapshot with moderation history
 *                     resolver:
 *                       type: object
 *                       description: Admin who resolved the report
 *                     actions:
 *                       type: array
 *                       description: Action history on this report
 *                     reported_user_stats:
 *                       type: object
 *                       description: Statistics about reported user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin/Moderator role
 *       404:
 *         description: Report not found
 */
router.get(
  '/reports/:id',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  reportReadRateLimiter,
  asyncHandler(reportController.getReportDetails)
);

/**
 * @swagger
 * /admin/reports/{id}/status:
 *   put:
 *     tags:
 *       - Admin Reports
 *     summary: Update report status
 *     description: Update the status of a report. Moderators have limited transitions - can only move OPEN to IN_REVIEW, IN_REVIEW to ESCALATED. Admins have full access.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_REVIEW, ACTION_TAKEN, RESOLVED, DISMISSED, ESCALATED]
 *                 description: New report status
 *               admin_notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional admin notes about the status change
 *           examples:
 *             markInReview:
 *               summary: Mark as in review
 *               value:
 *                 status: IN_REVIEW
 *                 admin_notes: Investigating the reported profile for authenticity
 *             markResolved:
 *               summary: Mark as resolved
 *               value:
 *                 status: RESOLVED
 *                 admin_notes: Action taken - user warned and content removed
 *             escalate:
 *               summary: Escalate to senior admin
 *               value:
 *                 status: ESCALATED
 *                 admin_notes: Multiple similar reports - needs senior review
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - Invalid status or transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Moderators cannot perform this transition
 *       404:
 *         description: Report not found
 */
router.put(
  '/reports/:id/status',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  reportStatusUpdateRateLimiter,
  asyncHandler(reportController.updateReportStatus)
);

/**
 * @swagger
 * /admin/reports/{id}/action:
 *   put:
 *     tags:
 *       - Admin Reports
 *     summary: Take moderation action on reported user
 *     description: Execute moderation actions on reported user (ADMIN only). Automatically updates report status to ACTION_TAKEN and creates action log entry.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [NO_ACTION, WARN_USER, SUSPEND_USER, DEACTIVATE_USER, DELETE_CONTENT, RESTRICT_FEATURES, FLAG_USER]
 *                 description: Moderation action to take
 *               metadata:
 *                 type: object
 *                 properties:
 *                   suspension_days:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 365
 *                     description: Days to suspend (for SUSPEND_USER)
 *                   content_type:
 *                     type: string
 *                     enum: [photo, message, bio, all]
 *                     description: Type of content to delete (for DELETE_CONTENT)
 *                   content_ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     description: Specific content IDs to delete (for DELETE_CONTENT)
 *                   restricted_features:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [chat, interest, upload, search]
 *                     description: Features to restrict (for RESTRICT_FEATURES)
 *                   restriction_days:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 90
 *                     description: Days to restrict features (for RESTRICT_FEATURES)
 *                   notes:
 *                     type: string
 *                     maxLength: 1000
 *                     description: Additional notes about the action
 *               admin_notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Admin notes about why this action was taken
 *           examples:
 *             warnUser:
 *               summary: Warn user
 *               value:
 *                 action: WARN_USER
 *                 admin_notes: First offense - sending warning
 *             suspendUser:
 *               summary: Suspend user for 7 days
 *               value:
 *                 action: SUSPEND_USER
 *                 metadata:
 *                   suspension_days: 7
 *                   notes: Multiple harassment reports
 *                 admin_notes: User suspended for 7 days due to harassment complaints
 *             deleteContent:
 *               summary: Delete inappropriate photos
 *               value:
 *                 action: DELETE_CONTENT
 *                 metadata:
 *                   content_type: photo
 *                   content_ids: [123, 456]
 *                 admin_notes: Removed inappropriate photos
 *             deactivateUser:
 *               summary: Deactivate user account
 *               value:
 *                 action: DEACTIVATE_USER
 *                 admin_notes: Serious violations - profile verification fraud
 *     responses:
 *       200:
 *         description: Action executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       type: object
 *                       description: Updated report object
 *                     action_result:
 *                       type: object
 *                       description: Result of the action execution
 *       400:
 *         description: Bad request - Invalid action or report already resolved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires Admin role
 *       404:
 *         description: Report not found
 */
router.put(
  '/reports/:id/action',
  authenticateToken,
  authorizeRole(['ADMIN']), // ADMIN only for taking actions
  reportUserActionRateLimiter,
  asyncHandler(reportController.takeReportAction)
);

export default router;
