/**
 * Notification Controller
 * Task 4.6: Notification System
 * 
 * Endpoints:
 * - GET    /notifications                 - Get notifications with filters & pagination
 * - GET    /notifications/unread/count    - Get unread count
 * - PUT    /notifications/:id/read        - Mark single notification as read
 * - PUT    /notifications/mark-all-read   - Mark all notifications as read
 * - DELETE /notifications/:id             - Delete single notification
 * - DELETE /notifications/clear-all       - Clear all notifications
 * 
 * @module controllers/notificationController
 */

import notificationService from '../services/notificationService.js';
import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Create audit log entry
 * @param {string} actorId - User ID who performed the action
 * @param {string} action - Description of the action
 * @param {string} ipAddress - IP address of the request
 */
async function createAuditLog(actorId, action, ipAddress) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_id: actorId,
        action: action,
        ip_address: ipAddress
      }
    });
  } catch (error) {
    logger.error('Audit log creation failed', {
      error: error.message,
      actorId,
      action
    });
  }
}

/**
 * Get Notifications with Filtering and Pagination
 * GET /notifications
 * 
 * Query Params:
 * - type: Filter by notification type (optional)
 * - unread: Filter by read status (optional, true/false)
 * - cursor: Last notification ID for pagination (optional)
 * - limit: Number of results (default: 20, max: 50)
 * 
 * @route GET /notifications
 * @access Private (Authenticated users only)
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const { type, unread, cursor, limit } = req.query;

    logger.info('[NotificationController] Get notifications request', {
      userId,
      type,
      unread,
      cursor,
      limit
    });

    const result = await notificationService.getNotifications(userId, {
      type,
      unread,
      cursor,
      limit
    });

    // Audit log
    await createAuditLog(
      userId,
      `Retrieved notifications (type: ${type || 'all'}, unread: ${unread || 'all'})`,
      req.ip
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Get notifications failed', {
      error: error.message,
      userId: req.user?.userId
    });
    throw error;
  }
}

/**
 * Get Unread Notification Count
 * GET /notifications/unread/count
 * 
 * @route GET /notifications/unread/count
 * @access Private (Authenticated users only)
 */
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId;

    logger.info('[NotificationController] Get unread count request', { userId });

    const result = await notificationService.getUnreadCount(userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Get unread count failed', {
      error: error.message,
      userId: req.user?.userId
    });
    throw error;
  }
}

/**
 * Mark Notification as Read
 * PUT /notifications/:id/read
 * 
 * @route PUT /notifications/:id/read
 * @access Private (Authenticated users only, own notifications only)
 */
export async function markAsRead(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    logger.info('[NotificationController] Mark as read request', {
      userId,
      notificationId: id
    });

    const result = await notificationService.markAsRead(id, userId);

    // Audit log
    await createAuditLog(
      userId,
      `Marked notification ${id} as read`,
      req.ip
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Mark as read failed', {
      error: error.message,
      userId: req.user?.userId,
      notificationId: req.params.id
    });
    throw error;
  }
}

/**
 * Mark All Notifications as Read
 * PUT /notifications/mark-all-read
 * 
 * @route PUT /notifications/mark-all-read
 * @access Private (Authenticated users only)
 */
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId;

    logger.info('[NotificationController] Mark all as read request', { userId });

    const result = await notificationService.markAllAsRead(userId);

    // Audit log
    await createAuditLog(
      userId,
      'Marked all notifications as read',
      req.ip
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Mark all as read failed', {
      error: error.message,
      userId: req.user?.userId
    });
    throw error;
  }
}

/**
 * Delete Single Notification
 * DELETE /notifications/:id
 * 
 * @route DELETE /notifications/:id
 * @access Private (Authenticated users only, own notifications only)
 */
export async function deleteNotification(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    logger.info('[NotificationController] Delete notification request', {
      userId,
      notificationId: id
    });

    const result = await notificationService.deleteNotification(id, userId);

    // Audit log
    await createAuditLog(
      userId,
      `Deleted notification ${id}`,
      req.ip
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Delete notification failed', {
      error: error.message,
      userId: req.user?.userId,
      notificationId: req.params.id
    });
    throw error;
  }
}

/**
 * Clear All Notifications
 * DELETE /notifications/clear-all
 * 
 * @route DELETE /notifications/clear-all
 * @access Private (Authenticated users only)
 */
export async function clearAllNotifications(req, res) {
  try {
    const userId = req.user.userId;

    logger.info('[NotificationController] Clear all notifications request', { userId });

    const result = await notificationService.clearAllNotifications(userId);

    // Audit log
    await createAuditLog(
      userId,
      'Cleared all notifications',
      req.ip
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('[NotificationController] Clear all notifications failed', {
      error: error.message,
      userId: req.user?.userId
    });
    throw error;
  }
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};
