/**
 * Profile View Service
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * Features:
 * - Record profile views with rate limiting
 * - Get "Who viewed my profile" (deduplicated)
 * - Get "Profiles I viewed"
 * - View analytics and caching
 * - Integration with search logs
 * - Blocked user handling
 * 
 * @module services/viewService
 */

import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import {
  ViewSource,
  ViewRateLimitConfig,
  ViewDisplayConfig,
  ViewAnalyticsConfig
} from '../types/enums.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if viewer is blocked by the viewed user
 * @param {string} viewerId - Viewer user ID
 * @param {string} viewedUserId - Viewed user ID
 * @returns {Promise<boolean>} True if blocked
 */
const isBlocked = async (viewerId, viewedUserId) => {
  // Check if blocking system exists (future feature)
  // For now, return false
  // TODO: Implement blocking check when UserBlock model is added
  return false;
};

/**
 * Check rate limiting for profile views
 * @param {string} viewerId - Viewer user ID
 * @param {string} viewedUserId - Viewed user ID
 * @returns {Promise<boolean>} True if rate limit exceeded
 */
const isRateLimitExceeded = async (viewerId, viewedUserId) => {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - ViewRateLimitConfig.RATE_LIMIT_WINDOW_HOURS);

  const recentViews = await prisma.profileView.count({
    where: {
      viewer_id: viewerId,
      viewed_user_id: viewedUserId,
      viewed_at: {
        gte: windowStart
      }
    }
  });

  return recentViews >= ViewRateLimitConfig.MAX_VIEWS_PER_HOUR;
};

/**
 * Get last active display text
 * @param {Date} lastActiveAt - Last active timestamp
 * @returns {string} Human-readable last active text
 */
const getLastActiveDisplay = (lastActiveAt) => {
  if (!lastActiveAt) {
    return null;
  }

  const now = new Date();
  const diffMs = now - new Date(lastActiveAt);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < ViewDisplayConfig.ACTIVE_NOW_THRESHOLD_MINUTES) {
    return 'Active now';
  }

  if (diffHours < ViewDisplayConfig.ACTIVE_TODAY_THRESHOLD_HOURS) {
    return 'Active today';
  }

  if (diffDays < ViewDisplayConfig.ACTIVE_THIS_WEEK_THRESHOLD_DAYS) {
    return 'Active this week';
  }

  if (diffDays <= ViewDisplayConfig.HIDE_AFTER_DAYS) {
    return `Active ${diffDays} days ago`;
  }

  return null; // Don't show if > 30 days
};

/**
 * Format viewer profile data for API response
 * @param {Object} viewer - Viewer user data
 * @param {Date} viewedAt - When they viewed
 * @param {number} viewCount - Total views from this viewer
 * @returns {Object} Formatted viewer data
 */
const formatViewerProfile = (viewer, viewedAt, viewCount) => {
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return {
    viewer_id: viewer.id,
    profile_id: viewer.profile_id,
    full_name: viewer.full_name,
    age: calculateAge(viewer.date_of_birth),
    gender: viewer.gender,
    height_cm: viewer.personal_details?.height_cm || null,
    occupation: viewer.professional_details?.occupation || null,
    city: viewer.personal_details?.city || null,
    state: viewer.personal_details?.state || null,
    primary_photo: viewer.photos?.[0]?.photo_url || null,
    viewed_at: viewedAt,
    view_count: viewCount,
    last_active: getLastActiveDisplay(viewer.last_active_at),
    profile_completion: viewer.profile_completion_percentage,
    is_verified: viewer.is_profile_verified
  };
};

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Record a profile view
 * @param {string} viewerId - User who is viewing
 * @param {string} viewedUserId - User being viewed
 * @param {Object} options - View options
 * @returns {Promise<Object>} Created view record
 */
export const recordProfileView = async (viewerId, viewedUserId, options = {}) => {
  const {
    viewSource = ViewSource.DIRECT,
    viewDuration = null,
    searchLogId = null,
    ipAddress = null,
    userAgent = null
  } = options;

  // Validation: Cannot view own profile
  if (viewerId === viewedUserId) {
    throw new BadRequestError('Cannot view your own profile');
  }

  // Check if viewer is blocked
  const blocked = await isBlocked(viewerId, viewedUserId);
  if (blocked) {
    throw new ForbiddenError('You are blocked from viewing this profile');
  }

  // Check if viewed user exists and is active
  const viewedUser = await prisma.user.findUnique({
    where: { id: viewedUserId },
    select: {
      id: true,
      is_active: true,
      is_profile_verified: true
    }
  });

  if (!viewedUser) {
    throw new NotFoundError('Profile not found');
  }

  if (!viewedUser.is_active) {
    throw new ForbiddenError('This profile is no longer active');
  }

  // Check rate limiting
  const rateLimitExceeded = await isRateLimitExceeded(viewerId, viewedUserId);
  if (rateLimitExceeded) {
    logger.warn('Profile view rate limit exceeded', {
      viewerId,
      viewedUserId,
      window: `${ViewRateLimitConfig.RATE_LIMIT_WINDOW_HOURS}h`
    });
    // Silent fail - don't throw error, just return existing view
    return { success: true, rateLimited: true };
  }

  // Cap view duration
  const cappedDuration = viewDuration && viewDuration > 0
    ? Math.min(viewDuration, ViewRateLimitConfig.MAX_DURATION_SECONDS)
    : null;

  // Create view record
  const view = await prisma.profileView.create({
    data: {
      viewer_id: viewerId,
      viewed_user_id: viewedUserId,
      view_source: viewSource,
      view_duration_seconds: cappedDuration,
      search_log_id: searchLogId,
      ip_address: ViewAnalyticsConfig.TRACK_IP_ADDRESS ? ipAddress : null,
      user_agent: ViewAnalyticsConfig.TRACK_USER_AGENT ? userAgent : null
    }
  });

  // Increment cached view count (async, non-blocking)
  prisma.user.update({
    where: { id: viewedUserId },
    data: {
      profile_views_count: {
        increment: 1
      }
    }
  }).catch(err => {
    logger.error('Failed to update view count cache', { error: err.message, viewedUserId });
  });

  logger.info('Profile view recorded', {
    viewerId,
    viewedUserId,
    viewSource,
    viewId: view.id
  });

  return { success: true, view_id: view.id };
};

/**
 * Get profiles that viewed current user (deduplicated)
 * @param {string} userId - Current user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated viewers list
 */
export const getMyViewers = async (userId, options = {}) => {
  const {
    page = 1,
    limit = ViewDisplayConfig.DEFAULT_VIEWERS_PER_PAGE,
    fromDate = null,
    toDate = null,
    mutualInterest = null,
    viewedBack = null
  } = options;

  // Validate pagination
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), ViewDisplayConfig.MAX_VIEWERS_PER_PAGE);

  if (pageNum < 1 || limitNum < 1) {
    throw new BadRequestError('Invalid pagination parameters');
  }

  // Build where clause
  const where = {
    viewed_user_id: userId
  };

  // Date range filter
  if (fromDate || toDate) {
    where.viewed_at = {};
    if (fromDate) where.viewed_at.gte = new Date(fromDate);
    if (toDate) where.viewed_at.lte = new Date(toDate);
  }

  // Get unique viewers with their latest view
  // Strategy: Group by viewer_id, get max(viewed_at) for each
  const viewersQuery = await prisma.$queryRaw`
    SELECT DISTINCT ON (viewer_id)
      viewer_id,
      viewed_at,
      COUNT(*) OVER (PARTITION BY viewer_id) as view_count
    FROM profile_views
    WHERE viewed_user_id = ${userId}::uuid
      ${fromDate ? Prisma.sql`AND viewed_at >= ${new Date(fromDate)}` : Prisma.empty}
      ${toDate ? Prisma.sql`AND viewed_at <= ${new Date(toDate)}` : Prisma.empty}
    ORDER BY viewer_id, viewed_at DESC
    LIMIT ${limitNum}
    OFFSET ${(pageNum - 1) * limitNum}
  `;

  // Get viewer IDs
  const viewerIds = viewersQuery.map(v => v.viewer_id);

  if (viewerIds.length === 0) {
    return {
      viewers: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        hasMore: false
      },
      stats: {
        total_views: 0,
        unique_viewers: 0
      }
    };
  }

  // Fetch full viewer profiles
  const viewers = await prisma.user.findMany({
    where: {
      id: { in: viewerIds },
      is_active: true  // Only show active users
    },
    include: {
      personal_details: true,
      professional_details: true,
      photos: {
        where: {
          is_primary: true,
          is_approved: true
        },
        take: 1
      }
    }
  });

  // Format response
  const formattedViewers = viewersQuery.map(viewRecord => {
    const viewer = viewers.find(u => u.id === viewRecord.viewer_id);
    if (!viewer) return null; // Viewer deactivated
    return formatViewerProfile(viewer, viewRecord.viewed_at, parseInt(viewRecord.view_count));
  }).filter(Boolean);

  // Get total stats
  const totalViews = await prisma.profileView.count({ where });
  const uniqueViewers = await prisma.profileView.findMany({
    where,
    select: { viewer_id: true },
    distinct: ['viewer_id']
  });

  return {
    viewers: formattedViewers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: uniqueViewers.length,
      hasMore: pageNum * limitNum < uniqueViewers.length
    },
    stats: {
      total_views: totalViews,
      unique_viewers: uniqueViewers.length
    }
  };
};

/**
 * Get profiles that current user viewed
 * @param {string} userId - Current user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated viewed profiles list
 */
export const getMyViewedProfiles = async (userId, options = {}) => {
  const {
    page = 1,
    limit = ViewDisplayConfig.DEFAULT_VIEWERS_PER_PAGE,
    fromDate = null,
    toDate = null,
    interactionStatus = null
  } = options;

  // Validate pagination
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), ViewDisplayConfig.MAX_VIEWERS_PER_PAGE);

  if (pageNum < 1 || limitNum < 1) {
    throw new BadRequestError('Invalid pagination parameters');
  }

  // Build where clause
  const where = {
    viewer_id: userId
  };

  if (fromDate || toDate) {
    where.viewed_at = {};
    if (fromDate) where.viewed_at.gte = new Date(fromDate);
    if (toDate) where.viewed_at.lte = new Date(toDate);
  }

  // Get unique viewed profiles with latest view
  const viewedQuery = await prisma.$queryRaw`
    SELECT DISTINCT ON (viewed_user_id)
      viewed_user_id,
      viewed_at,
      COUNT(*) OVER (PARTITION BY viewed_user_id) as view_count
    FROM profile_views
    WHERE viewer_id = ${userId}::uuid
      ${fromDate ? Prisma.sql`AND viewed_at >= ${new Date(fromDate)}` : Prisma.empty}
      ${toDate ? Prisma.sql`AND viewed_at <= ${new Date(toDate)}` : Prisma.empty}
    ORDER BY viewed_user_id, viewed_at DESC
    LIMIT ${limitNum}
    OFFSET ${(pageNum - 1) * limitNum}
  `;

  const viewedUserIds = viewedQuery.map(v => v.viewed_user_id);

  if (viewedUserIds.length === 0) {
    return {
      profiles: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        hasMore: false
      }
    };
  }

  // Fetch full profiles
  const profiles = await prisma.user.findMany({
    where: {
      id: { in: viewedUserIds },
      is_active: true
    },
    include: {
      personal_details: true,
      professional_details: true,
      photos: {
        where: {
          is_primary: true,
          is_approved: true
        },
        take: 1
      }
    }
  });

  // Check interaction status if requested
  let interactionMap = {};
  if (interactionStatus) {
    const interests = await prisma.interest.findMany({
      where: {
        sender_id: userId,
        receiver_id: { in: viewedUserIds }
      },
      select: {
        receiver_id: true,
        status: true
      }
    });
    interactionMap = interests.reduce((acc, interest) => {
      acc[interest.receiver_id] = interest.status;
      return acc;
    }, {});
  }

  // Format response
  const formattedProfiles = viewedQuery.map(viewRecord => {
    const profile = profiles.find(u => u.id === viewRecord.viewed_user_id);
    if (!profile) return null;
    
    const formatted = formatViewerProfile(profile, viewRecord.viewed_at, parseInt(viewRecord.view_count));
    formatted.interaction_status = interactionMap[profile.id] || null;
    return formatted;
  }).filter(Boolean);

  // Get total count
  const totalCount = await prisma.profileView.findMany({
    where,
    select: { viewed_user_id: true },
    distinct: ['viewed_user_id']
  });

  return {
    profiles: formattedProfiles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount.length,
      hasMore: pageNum * limitNum < totalCount.length
    }
  };
};

/**
 * Get total viewers count for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} View counts
 */
export const getViewersCount = async (userId) => {
  const [totalViews, uniqueViewers] = await Promise.all([
    prisma.profileView.count({
      where: { viewed_user_id: userId }
    }),
    prisma.profileView.findMany({
      where: { viewed_user_id: userId },
      select: { viewer_id: true },
      distinct: ['viewer_id']
    })
  ]);

  return {
    total_views: totalViews,
    unique_viewers: uniqueViewers.length
  };
};

/**
 * Get total viewed profiles count for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Viewed counts
 */
export const getViewedCount = async (userId) => {
  const uniqueViewed = await prisma.profileView.findMany({
    where: { viewer_id: userId },
    select: { viewed_user_id: true },
    distinct: ['viewed_user_id']
  });

  return {
    total_profiles_viewed: uniqueViewed.length
  };
};

export default {
  recordProfileView,
  getMyViewers,
  getMyViewedProfiles,
  getViewersCount,
  getViewedCount
};
