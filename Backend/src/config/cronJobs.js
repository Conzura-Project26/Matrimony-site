/**
 * Cron Jobs Configuration
 * Task 4.6: Notification System
 * 
 * Scheduled Tasks:
 * 1. Daily Profile View Notifications - 9 PM daily
 * 2. Auto-delete Old Notifications - 90 days retention
 * 
 * Production Safeguards:
 * - Only runs if RUN_CRON_JOBS=true (prevents duplicate jobs in multi-instance setup)
 * - Configurable timezone via TIMEZONE environment variable
 * - Automatic retry on failure
 * 
 * @module config/cronJobs
 */

import cron from 'node-cron';
import notificationService from '../services/notificationService.js';
import { cleanupExpiredRestrictions } from '../middleware/checkFeatureRestrictions.js';
import logger from './logger.js';

/**
 * Retry a failed cron job with exponential backoff
 * @param {Function} jobFunction - The job function to retry
 * @param {string} jobName - Name of the job for logging
 * @param {number} maxRetries - Maximum retry attempts
 */
async function retryJob(jobFunction, jobName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[CronJobs] Attempting ${jobName} (attempt ${attempt}/${maxRetries})`);
      const result = await jobFunction();
      logger.info(`[CronJobs] ${jobName} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`[CronJobs] ${jobName} failed (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        stack: error.stack
      });
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        logger.info(`[CronJobs] Retrying ${jobName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`[CronJobs] ${jobName} failed after ${maxRetries} attempts`);
        throw error;
      }
    }
  }
}

/**
 * Initialize all cron jobs
 * Only runs if RUN_CRON_JOBS environment variable is set to 'true'
 * This prevents duplicate jobs when running multiple instances
 */
export function initializeCronJobs() {
  // Check if cron jobs should run (prevent duplicates in multi-instance setup)
  const shouldRunCronJobs = process.env.RUN_CRON_JOBS === 'true';
  
  if (!shouldRunCronJobs) {
    logger.info('[CronJobs] Cron jobs disabled (RUN_CRON_JOBS != true). Skipping initialization.');
    logger.info('[CronJobs] To enable cron jobs, set environment variable: RUN_CRON_JOBS=true');
    return;
  }

  logger.info('[CronJobs] RUN_CRON_JOBS=true, initializing scheduled tasks...');

  const timezone = process.env.TIMEZONE || 'Asia/Kolkata';
  logger.info(`[CronJobs] Using timezone: ${timezone}`);

  // ============================================
  // DAILY PROFILE VIEW NOTIFICATIONS
  // Runs every day at 9 PM (21:00)
  // ============================================
  cron.schedule('0 21 * * *', async () => {
    await retryJob(
      async () => {
        logger.info('[CronJobs] Starting daily profile view notifications generation...');
        const result = await notificationService.generateDailyProfileViewNotifications();
        logger.info('[CronJobs] Daily profile view notifications completed', {
          notificationsCreated: result.data.notifications_created,
          usersProcessed: result.data.users_processed
        });
        return result;
      },
      'Daily Profile View Notifications',
      3
    );
  }, {
    scheduled: true,
    timezone
  });

  logger.info('[CronJobs] Daily profile view notifications scheduled (9 PM daily)');

  // ============================================
  // AUTO-DELETE OLD NOTIFICATIONS
  // Runs every day at 2 AM (02:00)
  // Deletes notifications older than configured retention period
  // ============================================
  cron.schedule('0 2 * * *', async () => {
    await retryJob(
      async () => {
        logger.info('[CronJobs] Starting auto-delete old notifications...');
        const result = await notificationService.autoDeleteOldNotifications();
        logger.info('[CronJobs] Auto-delete old notifications completed', {
          deletedCount: result.data.deleted_count,
          retentionDays: result.data.retention_days
        });
        return result;
      },
      'Auto-delete Old Notifications',
      3
    );
  }, {
    scheduled: true,
    timezone
  });

  logger.info('[CronJobs] Auto-delete old notifications scheduled (2 AM daily)');

  // ============================================
  // CLEANUP EXPIRED FEATURE RESTRICTIONS
  // Runs every day at 3 AM (03:00)
  // Deactivates feature restrictions that have passed their expiry date
  // ============================================
  cron.schedule('0 3 * * *', async () => {
    await retryJob(
      async () => {
        logger.info('[CronJobs] Starting cleanup of expired feature restrictions...');
        const result = await cleanupExpiredRestrictions();
        logger.info('[CronJobs] Cleanup expired restrictions completed', {
          deactivatedCount: result
        });
        return result;
      },
      'Cleanup Expired Feature Restrictions',
      3
    );
  }, {
    scheduled: true,
    timezone
  });

  logger.info('[CronJobs] Cleanup expired restrictions scheduled (3 AM daily)');

  logger.info('[CronJobs] All scheduled tasks initialized successfully');
}

export default {
  initializeCronJobs
};
