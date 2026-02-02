/**
 * Shortlist Service
 * Phase 3 - Task 3.6: Shortlist Management
 * 
 * Features:
 * - Add profiles to shortlist
 * - Remove profiles from shortlist
 * - Get user's shortlist with pagination and sorting
 * - Get "Who shortlisted me" list
 * - Check if a profile is shortlisted (mutual status)
 * - Track shortlist counts on User model
 * - Integration with ViewSource.SHORTLIST
 * 
 * @module services/shortlistService
 */

import prisma from '../config/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number|null} Age in years
 */
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

/**
 * Format shortlisted profile data for API response (minimal card format)
 * @param {Object} user - User data from database
 * @param {Date} shortlistedAt - When profile was shortlisted
 * @param {boolean} isMutual - Whether both users have shortlisted each other
 * @returns {Object} Formatted profile data
 */
const formatShortlistedProfile = (user, shortlistedAt, isMutual = false) => {
  return {
    user_id: user.id,
    profile_id: user.profile_id,
    full_name: user.full_name,
    age: calculateAge(user.date_of_birth),
    gender: user.gender,
    height_cm: user.personal_details?.height_cm || null,
    occupation: user.professional_details?.occupation || null,
    city: user.personal_details?.city || null,
    state: user.personal_details?.state || null,
    religion: user.caste_details?.religion?.religion_name || null,
    caste: user.caste_details?.caste?.caste_name || null,
    education: user.education_details?.[0]?.qualification || user.highest_qualification || null,
    primary_photo: user.photos?.find(p => p.is_primary)?.photo_url || user.photos?.[0]?.photo_url || null,
    profile_completion: user.profile_completion_percentage,
    is_verified: user.is_profile_verified,
    shortlisted_at: shortlistedAt,
    is_mutual: isMutual
  };
};

/**
 * Check if user is blocked (placeholder for future blocking feature)
 * @param {string} userId - User ID
 * @param {string} targetUserId - Target user ID
 * @returns {Promise<boolean>} True if blocked
 */
const isBlocked = async (userId, targetUserId) => {
  // TODO: Implement blocking check when UserBlock model is added
  // For now, return false
  return false;
};

/**
 * Common user select for profile queries
 */
const userSelectForProfile = {
  id: true,
  profile_id: true,
  full_name: true,
  date_of_birth: true,
  gender: true,
  highest_qualification: true,
  profile_completion_percentage: true,
  is_profile_verified: true,
  is_active: true,
  personal_details: {
    select: {
      height_cm: true,
      city: true,
      state: true
    }
  },
  professional_details: {
    select: {
      occupation: true
    }
  },
  caste_details: {
    select: {
      religion: {
        select: {
          religion_name: true
        }
      },
      caste: {
        select: {
          caste_name: true
        }
      }
    }
  },
  education_details: {
    select: {
      qualification: true
    },
    orderBy: {
      year_of_passing: 'desc'
    },
    take: 1
  },
  photos: {
    where: {
      is_approved: true
    },
    select: {
      photo_url: true,
      is_primary: true
    },
    orderBy: [
      { is_primary: 'desc' },
      { uploaded_at: 'desc' }
    ],
    take: 1
  }
};

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Add a profile to user's shortlist
 * @param {string} userId - User ID who is shortlisting
 * @param {string} shortlistedUserId - User ID being shortlisted
 * @returns {Promise<Object>} Result with success status and message
 */
export const addToShortlist = async (userId, shortlistedUserId) => {
  // Validation: Cannot shortlist own profile
  if (userId === shortlistedUserId) {
    throw new BadRequestError('Cannot shortlist your own profile');
  }

  // Check if target user exists and is active
  const targetUser = await prisma.user.findUnique({
    where: { id: shortlistedUserId },
    select: {
      id: true,
      is_active: true,
      is_profile_verified: true
    }
  });

  if (!targetUser) {
    throw new NotFoundError('Profile not found');
  }

  if (!targetUser.is_active) {
    throw new BadRequestError('This profile is no longer active');
  }

  // Check if user is blocked by target user
  const blocked = await isBlocked(userId, shortlistedUserId);
  if (blocked) {
    throw new BadRequestError('Cannot shortlist this profile');
  }

  // Check if already shortlisted (prevent duplicates)
  const existingShortlist = await prisma.shortlistedProfile.findUnique({
    where: {
      user_id_shortlisted_user_id: {
        user_id: userId,
        shortlisted_user_id: shortlistedUserId
      }
    }
  });

  if (existingShortlist) {
    return {
      success: true,
      message: 'Already shortlisted',
      data: {
        user_id: shortlistedUserId,
        shortlisted_at: existingShortlist.created_at,
        is_new: false
      }
    };
  }

  // Add to shortlist in a transaction (with count updates)
  const result = await prisma.$transaction(async (tx) => {
    // Create shortlist entry
    const shortlist = await tx.shortlistedProfile.create({
      data: {
        user_id: userId,
        shortlisted_user_id: shortlistedUserId
      }
    });

    // Increment shortlist_count for the user who shortlisted
    await tx.user.update({
      where: { id: userId },
      data: {
        shortlist_count: {
          increment: 1
        }
      }
    });

    // Increment shortlisted_by_count for the user who was shortlisted
    await tx.user.update({
      where: { id: shortlistedUserId },
      data: {
        shortlisted_by_count: {
          increment: 1
        }
      }
    });

    return shortlist;
  });

  logger.info('Profile added to shortlist', {
    userId,
    shortlistedUserId
  });

  return {
    success: true,
    message: 'Profile added to shortlist',
    data: {
      user_id: shortlistedUserId,
      shortlisted_at: result.created_at,
      is_new: true
    }
  };
};

/**
 * Remove a profile from user's shortlist
 * @param {string} userId - User ID who is removing from shortlist
 * @param {string} shortlistedUserId - User ID being removed
 * @returns {Promise<Object>} Result with success status and message
 */
export const removeFromShortlist = async (userId, shortlistedUserId) => {
  // Check if shortlist entry exists
  const existingShortlist = await prisma.shortlistedProfile.findUnique({
    where: {
      user_id_shortlisted_user_id: {
        user_id: userId,
        shortlisted_user_id: shortlistedUserId
      }
    }
  });

  if (!existingShortlist) {
    return {
      success: true,
      message: 'Profile not in shortlist',
      data: {
        user_id: shortlistedUserId,
        was_removed: false
      }
    };
  }

  // Remove from shortlist in a transaction (with count updates)
  await prisma.$transaction(async (tx) => {
    // Delete shortlist entry
    await tx.shortlistedProfile.delete({
      where: {
        user_id_shortlisted_user_id: {
          user_id: userId,
          shortlisted_user_id: shortlistedUserId
        }
      }
    });

    // Decrement shortlist_count for the user who shortlisted
    await tx.user.update({
      where: { id: userId },
      data: {
        shortlist_count: {
          decrement: 1
        }
      }
    });

    // Decrement shortlisted_by_count for the user who was shortlisted
    await tx.user.update({
      where: { id: shortlistedUserId },
      data: {
        shortlisted_by_count: {
          decrement: 1
        }
      }
    });
  });

  logger.info('Profile removed from shortlist', {
    userId,
    shortlistedUserId
  });

  return {
    success: true,
    message: 'Profile removed from shortlist',
    data: {
      user_id: shortlistedUserId,
      was_removed: true
    }
  };
};

/**
 * Get user's shortlist with pagination and sorting
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated shortlist data
 */
export const getMyShortlist = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort_by = 'created_at', // created_at, match_score, last_active
    sort_order = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 per page

  // Build order by clause
  let orderBy = {};
  if (sort_by === 'created_at') {
    orderBy = { created_at: sort_order };
  } else if (sort_by === 'last_active') {
    orderBy = { shortlisted_user: { last_active_at: sort_order } };
  } else {
    orderBy = { created_at: sort_order };
  }

  // Get total count
  const total = await prisma.shortlistedProfile.count({
    where: {
      user_id: userId
    }
  });

  // Get shortlisted profiles
  const shortlists = await prisma.shortlistedProfile.findMany({
    where: {
      user_id: userId
    },
    select: {
      created_at: true,
      shortlisted_user: {
        select: userSelectForProfile
      },
      shortlisted_user_id: true
    },
    orderBy,
    skip,
    take
  });

  // Get all shortlisted user IDs to check for mutual shortlisting
  const shortlistedUserIds = shortlists.map(s => s.shortlisted_user_id);
  
  // Check which of these users have also shortlisted the current user (mutual shortlisting)
  const mutualShortlists = await prisma.shortlistedProfile.findMany({
    where: {
      user_id: { in: shortlistedUserIds },
      shortlisted_user_id: userId
    },
    select: {
      user_id: true
    }
  });

  // Create a Set of user IDs that have mutual shortlisting
  const mutualUserIds = new Set(mutualShortlists.map(ms => ms.user_id));

  // Format profiles with mutual status
  const profiles = shortlists
    .filter(s => s.shortlisted_user.is_active) // Filter out inactive users
    .map(s => {
      const isMutual = mutualUserIds.has(s.shortlisted_user_id);
      return formatShortlistedProfile(s.shortlisted_user, s.created_at, isMutual);
    });

  return {
    profiles,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / take),
      total_count: total,
      per_page: take,
      has_next: page * take < total,
      has_prev: page > 1
    }
  };
};

/**
 * Get "Who shortlisted me" with pagination and sorting
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated list of users who shortlisted me
 */
export const getShortlistedByMe = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  // Build order by clause
  let orderBy = {};
  if (sort_by === 'created_at') {
    orderBy = { created_at: sort_order };
  } else if (sort_by === 'last_active') {
    orderBy = { user: { last_active_at: sort_order } };
  } else {
    orderBy = { created_at: sort_order };
  }

  // Get total count
  const total = await prisma.shortlistedProfile.count({
    where: {
      shortlisted_user_id: userId
    }
  });

  // Get users who shortlisted me
  const shortlists = await prisma.shortlistedProfile.findMany({
    where: {
      shortlisted_user_id: userId
    },
    select: {
      created_at: true,
      user: {
        select: userSelectForProfile
      },
      user_id: true
    },
    orderBy,
    skip,
    take
  });

  // Get all user IDs who shortlisted me
  const shortlistedByUserIds = shortlists.map(s => s.user_id);
  
  // Check which of these users I have also shortlisted back (mutual shortlisting)
  const myShortlists = await prisma.shortlistedProfile.findMany({
    where: {
      user_id: userId,
      shortlisted_user_id: { in: shortlistedByUserIds }
    },
    select: {
      shortlisted_user_id: true
    }
  });

  // Create a Set of user IDs that I've shortlisted back
  const iShortlistedIds = new Set(myShortlists.map(ms => ms.shortlisted_user_id));

  // Format profiles with mutual status (called i_shortlisted_them in this context)
  const profiles = shortlists
    .filter(s => s.user.is_active) // Filter out inactive users
    .map(s => {
      const profile = formatShortlistedProfile(s.user, s.created_at, false);
      // Remove is_mutual and add context-specific fields
      delete profile.is_mutual;
      return {
        ...profile,
        shortlisted_me_at: s.created_at,
        i_shortlisted_them: iShortlistedIds.has(s.user_id)
      };
    });

  return {
    profiles,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / take),
      total_count: total,
      per_page: take,
      has_next: page * take < total,
      has_prev: page > 1
    }
  };
};

/**
 * Check if a profile is shortlisted (mutual status with timestamps)
 * @param {string} userId - Current user ID
 * @param {string} targetUserId - Target user ID to check
 * @returns {Promise<Object>} Shortlist status with timestamps
 */
export const checkShortlistStatus = async (userId, targetUserId) => {
  // Cannot check own profile
  if (userId === targetUserId) {
    throw new BadRequestError('Cannot check shortlist status for your own profile');
  }

  // Check if target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, is_active: true }
  });

  // If profile doesn't exist, return not shortlisted (graceful handling)
  if (!targetUser) {
    return {
      is_shortlisted: false,
      i_shortlisted_at: null,
      they_shortlisted_me: false,
      they_shortlisted_at: null,
      is_mutual: false
    };
  }

  // Check both directions in parallel
  const [iShortlisted, theyShortlisted] = await Promise.all([
    prisma.shortlistedProfile.findUnique({
      where: {
        user_id_shortlisted_user_id: {
          user_id: userId,
          shortlisted_user_id: targetUserId
        }
      },
      select: {
        created_at: true
      }
    }),
    prisma.shortlistedProfile.findUnique({
      where: {
        user_id_shortlisted_user_id: {
          user_id: targetUserId,
          shortlisted_user_id: userId
        }
      },
      select: {
        created_at: true
      }
    })
  ]);

  return {
    is_shortlisted: !!iShortlisted,
    i_shortlisted_at: iShortlisted?.created_at || null,
    they_shortlisted_me: !!theyShortlisted,
    they_shortlisted_at: theyShortlisted?.created_at || null,
    is_mutual: !!iShortlisted && !!theyShortlisted
  };
};

export default {
  addToShortlist,
  removeFromShortlist,
  getMyShortlist,
  getShortlistedByMe,
  checkShortlistStatus
};
