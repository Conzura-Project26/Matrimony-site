/**
 * Last Active Middleware
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * Updates user's last_active_at timestamp with throttling
 * Only updates on meaningful actions, max once per 5 minutes
 * 
 * @module middleware/lastActiveMiddleware
 */

import prisma from '../config/prisma.js';
import { LastActiveConfig } from '../types/enums.js';
import logger from '../config/logger.js';

// In-memory cache of last update times (user_id -> timestamp)
// This prevents DB queries on every request
const lastUpdateCache = new Map();

/**
 * Check if action is meaningful for last_active tracking
 * @param {string} action - The action being performed
 * @returns {boolean} True if meaningful
 */
const isMeaningfulAction = (action) => {
  return LastActiveConfig.MEANINGFUL_ACTIONS.includes(action);
};

/**
 * Check if enough time has passed since last update
 * @param {string} userId - User ID
 * @returns {boolean} True if should update
 */
const shouldUpdate = (userId) => {
  const lastUpdate = lastUpdateCache.get(userId);
  
  if (!lastUpdate) {
    return true; // Never updated
  }

  const now = Date.now();
  const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
  
  return minutesSinceUpdate >= LastActiveConfig.UPDATE_THROTTLE_MINUTES;
};

/**
 * Update last_active_at timestamp
 * @param {string} userId - User ID
 */
const updateLastActive = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { last_active_at: new Date() }
    });

    // Update cache
    lastUpdateCache.set(userId, Date.now());

    logger.debug('Updated last_active_at', { userId });
  } catch (error) {
    logger.error('Failed to update last_active_at', {
      error: error.message,
      userId
    });
    // Don't throw - this should never break the request
  }
};

/**
 * Middleware to track last active timestamp
 * Usage: Add to specific routes or globally
 * 
 * @param {string} action - The action being performed (LOGIN, PROFILE_VIEW, etc.)
 * @returns {Function} Express middleware
 */
export const trackLastActive = (action) => {
  return async (req, res, next) => {
    // Skip if no authenticated user
    if (!req.user || !req.user.id) {
      return next();
    }

    // Skip if not a meaningful action
    if (!isMeaningfulAction(action)) {
      return next();
    }

    // Skip if updated too recently
    if (!shouldUpdate(req.user.id)) {
      return next();
    }

    // Update asynchronously - don't block the request
    updateLastActive(req.user.id).catch(err => {
      logger.error('Error in trackLastActive', { error: err.message });
    });

    // Continue without waiting for update
    next();
  };
};

/**
 * Generic middleware that infers action from route
 * Auto-detects action type based on request path and method
 */
export const autoTrackLastActive = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next();
  }

  // Infer action from route
  let action = null;
  
  if (req.path.includes('/auth/login')) {
    action = 'LOGIN';
  } else if (req.path.includes('/profiles') && req.method === 'GET') {
    action = 'PROFILE_VIEW';
  } else if (req.path.includes('/search')) {
    action = 'SEARCH';
  } else if (req.path.includes('/messages')) {
    action = 'MESSAGE_SEND';
  } else if (req.path.includes('/interests')) {
    action = 'INTEREST_SEND';
  } else if (req.path.includes('/matches')) {
    action = 'MATCH_VIEW';
  }

  if (!action || !isMeaningfulAction(action)) {
    return next();
  }

  if (!shouldUpdate(req.user.id)) {
    return next();
  }

  // Update asynchronously
  updateLastActive(req.user.id).catch(err => {
    logger.error('Error in autoTrackLastActive', { error: err.message });
  });

  next();
};

/**
 * Cleanup function to prevent memory leaks
 * Should be called periodically (e.g., via cron job)
 * Removes entries older than 1 hour from cache
 */
export const cleanupCache = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let removed = 0;

  for (const [userId, timestamp] of lastUpdateCache.entries()) {
    if (timestamp < oneHourAgo) {
      lastUpdateCache.delete(userId);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info('Cleaned up last active cache', { removed });
  }
};

// Auto-cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

export default {
  trackLastActive,
  autoTrackLastActive,
  cleanupCache
};
