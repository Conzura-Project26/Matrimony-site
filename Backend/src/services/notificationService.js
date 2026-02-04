/**
 * Notification Service
 * Task 4.6: Notification System
 * 
 * Business Logic:
 * - Get notifications with filtering (type, read/unread)
 * - Cursor-based pagination (limit: 20, max: 50)
 * - Mark single notification as read
 * - Mark all notifications as read
 * - Get unread count
 * - Delete single notification
 * - Clear all notifications
 * - Auto-delete old notifications (90 days retention)
 * 
 * @module services/notificationService
 */

import prisma from '../config/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Notification Configuration
 */
export const NotificationConfig = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  RETENTION_DAYS: parseInt(process.env.NOTIFICATION_RETENTION_DAYS) || 90  // Configurable retention period
};

/**
 * Get user's notifications with filtering and cursor-based pagination
 * 
 * Filters:
 * - type: Filter by notification type (INTEREST_RECEIVED, MESSAGE_RECEIVED, etc.)
 * - unread: Filter by read status (true = unread only, false = read only)
 * 
 * Pagination:
 * - cursor: Last notification ID from previous page
 * - limit: Number of results (default: 20, max: 50)
 * 
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @param {string} filters.type - Notification type filter
 * @param {boolean} filters.unread - Read status filter
 * @param {number} filters.cursor - Cursor for pagination (last notification ID)
 * @param {number} filters.limit - Number of results
 * @returns {Promise<Object>} Notifications with pagination info
 */
export async function getNotifications(userId, filters = {}) {
  const { type, unread, cursor, limit = NotificationConfig.DEFAULT_LIMIT } = filters;

  // Validate limit
  const limitNum = Math.min(parseInt(limit) || NotificationConfig.DEFAULT_LIMIT, NotificationConfig.MAX_LIMIT);

  // Build where clause
  const where = {
    user_id: userId
  };

  // Filter by type
  if (type) {
    where.type = type;
  }

  // Filter by read status
  if (unread !== undefined) {
    where.is_read = unread === 'true' || unread === true ? false : true;
  }

  // Cursor-based pagination
  if (cursor) {
    where.id = {
      lt: parseInt(cursor)  // Get notifications with ID less than cursor (older notifications)
    };
  }

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      created_at: 'desc'  // Most recent first
    },
    take: limitNum + 1,  // Fetch one extra to check if there are more
    include: {
      related_user: {
        select: {
          id: true,
          full_name: true,
          profile_id: true,
          photos: {
            where: {
              is_primary: true,
              is_approved: true
            },
            select: {
              photo_url: true
            },
            take: 1
          }
        }
      }
    }
  });

  // Check if there are more results
  const hasMore = notifications.length > limitNum;
  const results = hasMore ? notifications.slice(0, limitNum) : notifications;

  // Get next cursor (ID of last notification)
  const nextCursor = results.length > 0 ? results[results.length - 1].id : null;

  // Format response
  const formattedNotifications = results.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    is_read: notification.is_read,
    created_at: notification.created_at,
    read_at: notification.read_at,
    related_user: notification.related_user ? {
      id: notification.related_user.id,
      full_name: notification.related_user.full_name,
      profile_id: notification.related_user.profile_id,
      primary_photo: notification.related_user.photos?.[0]?.photo_url || null
    } : null,
    related_id: notification.related_id
  }));

  return {
    success: true,
    data: formattedNotifications,
    pagination: {
      limit: limitNum,
      next_cursor: hasMore ? nextCursor : null,
      has_more: hasMore
    }
  };
}

/**
 * Get count of unread notifications for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Unread count
 */
export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: {
      user_id: userId,
      is_read: false
    }
  });

  return {
    success: true,
    data: {
      unread_count: count
    }
  };
}

/**
 * Mark a single notification as read
 * 
 * Validates:
 * - Notification exists
 * - Notification belongs to the user
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated notification
 */
export async function markAsRead(notificationId, userId) {
  // Fetch notification
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(notificationId) }
  });

  // Validate notification exists
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Validate ownership
  if (notification.user_id !== userId) {
    throw new ForbiddenError('You are not authorized to update this notification');
  }

  // Already read
  if (notification.is_read) {
    return {
      success: true,
      message: 'Notification already marked as read',
      data: {
        id: notification.id,
        is_read: true,
        read_at: notification.read_at
      }
    };
  }

  // Update notification
  const updated = await prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });

  logger.info('[NotificationService] Notification marked as read', {
    notificationId,
    userId
  });

  return {
    success: true,
    message: 'Notification marked as read',
    data: {
      id: updated.id,
      is_read: updated.is_read,
      read_at: updated.read_at
    }
  };
}

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
export async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });

  logger.info('[NotificationService] All notifications marked as read', {
    userId,
    updatedCount: result.count
  });

  return {
    success: true,
    message: `${result.count} notification(s) marked as read`,
    data: {
      updated_count: result.count
    }
  };
}

/**
 * Delete a single notification
 * 
 * Validates:
 * - Notification exists
 * - Notification belongs to the user
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteNotification(notificationId, userId) {
  // Fetch notification
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(notificationId) }
  });

  // Validate notification exists
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Validate ownership
  if (notification.user_id !== userId) {
    throw new ForbiddenError('You are not authorized to delete this notification');
  }

  // Delete notification
  await prisma.notification.delete({
    where: { id: parseInt(notificationId) }
  });

  logger.info('[NotificationService] Notification deleted', {
    notificationId,
    userId
  });

  return {
    success: true,
    message: 'Notification deleted successfully'
  };
}

/**
 * Clear all notifications for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
export async function clearAllNotifications(userId) {
  const result = await prisma.notification.deleteMany({
    where: {
      user_id: userId
    }
  });

  logger.info('[NotificationService] All notifications cleared', {
    userId,
    deletedCount: result.count
  });

  return {
    success: true,
    message: `${result.count} notification(s) deleted`,
    data: {
      deleted_count: result.count
    }
  };
}

/**
 * Auto-delete old notifications (90 days retention)
 * Called by cron job
 * 
 * @returns {Promise<Object>} Delete result
 */
export async function autoDeleteOldNotifications() {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - NotificationConfig.RETENTION_DAYS);

  const result = await prisma.notification.deleteMany({
    where: {
      created_at: {
        lt: retentionDate
      }
    }
  });

  logger.info('[NotificationService] Old notifications auto-deleted', {
    deletedCount: result.count,
    retentionDays: NotificationConfig.RETENTION_DAYS,
    cutoffDate: retentionDate
  });

  return {
    success: true,
    message: `Deleted ${result.count} old notifications`,
    data: {
      deleted_count: result.count,
      retention_days: NotificationConfig.RETENTION_DAYS
    }
  };
}

/**
 * Create daily profile view notification
 * Called by cron job at 9 PM daily
 * 
 * Logic:
 * - Count unique viewers in last 24 hours
 * - Create notification only if count > 0
 * - Same person viewing 10 times = count 1
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Created notification or null
 */
export async function createDailyProfileViewNotification(userId) {
  // Calculate 24 hours ago
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  // Get unique viewers in last 24 hours
  const uniqueViewers = await prisma.profileView.groupBy({
    by: ['viewer_id'],
    where: {
      viewed_user_id: userId,
      viewed_at: {
        gte: yesterday
      },
      viewer_id: {
        not: userId  // Exclude self-views
      }
    }
  });

  const viewCount = uniqueViewers.length;

  // Only create notification if there are views
  if (viewCount === 0) {
    return null;
  }

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      type: 'PROFILE_VIEW',
      title: 'Profile Views',
      message: `You have ${viewCount} new profile view${viewCount > 1 ? 's' : ''} today`,
      is_read: false
    }
  });

  logger.info('[NotificationService] Daily profile view notification created', {
    userId,
    viewCount,
    notificationId: notification.id
  });

  return notification;
}

/**
 * Generate daily profile view notifications for all users
 * Called by cron job at 9 PM daily
 * 
 * @returns {Promise<Object>} Result summary
 */
export async function generateDailyProfileViewNotifications() {
  try {
    // Get all active users who received profile views in last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const usersWithViews = await prisma.profileView.groupBy({
      by: ['viewed_user_id'],
      where: {
        viewed_at: {
          gte: yesterday
        }
      },
      _count: {
        viewer_id: true
      }
    });

    let notificationsCreated = 0;

    // Create notification for each user
    for (const user of usersWithViews) {
      const notification = await createDailyProfileViewNotification(user.viewed_user_id);
      if (notification) {
        notificationsCreated++;
      }
    }

    logger.info('[NotificationService] Daily profile view notifications generated', {
      totalUsers: usersWithViews.length,
      notificationsCreated
    });

    return {
      success: true,
      message: `Generated ${notificationsCreated} profile view notifications`,
      data: {
        notifications_created: notificationsCreated,
        users_processed: usersWithViews.length
      }
    };
  } catch (error) {
    logger.error('[NotificationService] Failed to generate daily profile view notifications', {
      error: error.message
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
  clearAllNotifications,
  autoDeleteOldNotifications,
  createDailyProfileViewNotification,
  generateDailyProfileViewNotifications,
  NotificationConfig
};
