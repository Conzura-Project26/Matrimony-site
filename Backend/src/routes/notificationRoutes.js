/**
 * Notification Routes
 * Task 4.6: Notification System
 * 
 * API Endpoints:
 * - GET    /notifications                 - Get notifications with filters & pagination
 * - GET    /notifications/unread/count    - Get unread count
 * - PUT    /notifications/:id/read        - Mark single notification as read
 * - PUT    /notifications/mark-all-read   - Mark all notifications as read
 * - DELETE /notifications/:id             - Delete single notification
 * - DELETE /notifications/clear-all       - Clear all notifications
 * 
 * @module routes/notificationRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import notificationController from '../controllers/notificationController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for notification endpoints
// Prevents abuse of notification API
const notificationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// All notification routes require authentication
router.use(authenticateToken);

// Apply rate limiting to all notification routes
router.use(notificationRateLimiter);

// ============================================
// GET NOTIFICATIONS WITH FILTERS & PAGINATION
// ============================================

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notifications with filtering and pagination
 *     description: |
 *       Retrieve user's notifications with optional filtering by type and read status.
 *       Uses cursor-based pagination for efficient data retrieval.
 *       
 *       **Features:**
 *       - ✅ Filter by notification type
 *       - ✅ Filter by read/unread status
 *       - ✅ Cursor-based pagination
 *       - ✅ Default limit: 20, Max limit: 50
 *       - ✅ Sorted by created_at DESC (newest first)
 *       
 *       **Authorization:**
 *       - Users can only access their own notifications
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INTEREST_RECEIVED, INTEREST_ACCEPTED, INTEREST_REJECTED, MESSAGE_RECEIVED, PROFILE_VIEW, MATCH_FOUND]
 *         description: Filter by notification type (optional)
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true = unread only, false = read only)
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Last notification ID from previous page (for pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of notifications to retrieve (max 50)
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 123
 *                       type:
 *                         type: string
 *                         example: INTEREST_RECEIVED
 *                       title:
 *                         type: string
 *                         example: New Interest Received
 *                       message:
 *                         type: string
 *                         example: John Doe sent you an interest
 *                       is_read:
 *                         type: boolean
 *                         example: false
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       read_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       related_user:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           profile_id:
 *                             type: string
 *                           primary_photo:
 *                             type: string
 *                             nullable: true
 *                       related_id:
 *                         type: integer
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     next_cursor:
 *                       type: integer
 *                       nullable: true
 *                       example: 100
 *                     has_more:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/', asyncHandler(notificationController.getNotifications));

// ============================================
// GET UNREAD COUNT
// ============================================

/**
 * @swagger
 * /notifications/unread/count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get count of unread notifications
 *     description: |
 *       Get the total count of unread notifications for the authenticated user.
 *       Useful for displaying notification badges.
 *       
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread_count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/unread/count', asyncHandler(notificationController.getUnreadCount));

// ============================================
// MARK NOTIFICATION AS READ
// ============================================

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     description: |
 *       Mark a single notification as read for the authenticated user.
 *       
 *       **Authorization:**
 *       - Users can only mark their own notifications as read
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                   example: Notification marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     is_read:
 *                       type: boolean
 *                       example: true
 *                     read_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not your notification
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', asyncHandler(notificationController.markAsRead));

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     description: |
 *       Mark all unread notifications as read for the authenticated user.
 *       
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                   example: 5 notification(s) marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated_count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.put('/mark-all-read', asyncHandler(notificationController.markAllAsRead));

// ============================================
// DELETE NOTIFICATION
// ============================================

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a single notification
 *     description: |
 *       Delete a specific notification for the authenticated user.
 *       
 *       **Authorization:**
 *       - Users can only delete their own notifications
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
 *                   example: Notification deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not your notification
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

// ============================================
// CLEAR ALL NOTIFICATIONS
// ============================================

/**
 * @swagger
 * /notifications/clear-all:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Clear all notifications
 *     description: |
 *       Delete all notifications for the authenticated user.
 *       This action cannot be undone.
 *       
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
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
 *                   example: 10 notification(s) deleted
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.delete('/clear-all', asyncHandler(notificationController.clearAllNotifications));

export default router;
