/**
 * Search Service
 * Business logic for profile search functionality
 * 
 * Features:
 * - Simple and advanced search
 * - Full-text keyword search with relevance weighting
 * - Multiple filter support (height, mother tongue, horoscope)
 * - Pagination with performance optimization
 * - Async search logging
 * - Privacy-aware results
 */

import prisma from '../config/prisma.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';

const RESULTS_PER_PAGE = 20;

/**
 * Generate unique profile ID for new users
 * Format: MAT + 8-digit number (e.g., MAT00001234)
 * 
 * @returns {Promise<string>} Unique profile ID
 */
export const generateProfileId = async () => {
  // Get the count of existing users to generate next ID
  const userCount = await prisma.user.count();
  const nextNumber = userCount + 1;
  
  // Pad with zeros to make 8 digits
  const paddedNumber = nextNumber.toString().padStart(8, '0');
  const profileId = `MAT${paddedNumber}`;
  
  // Check if this ID already exists (rare edge case)
  const existingProfile = await prisma.user.findUnique({
    where: { profile_id: profileId },
  });
  
  if (existingProfile) {
    // If exists, use timestamp-based ID as fallback
    const timestamp = Date.now().toString().slice(-8);
    return `MAT${timestamp}`;
  }
  
  return profileId;
};

/**
 * Build Prisma where clause from search filters
 * 
 * @param {Object} filters - Search filters
 * @param {string} currentUserId - ID of the user performing search
 * @returns {Object} Prisma where clause
 */
const buildSearchWhereClause = (filters, currentUserId) => {
  const where = {
    // Exclude current user from search results
    id: { not: currentUserId },
    
    // Only show active, verified profiles
    is_active: true,
    is_profile_verified: true,
    
    // Exclude blocked users (bidirectional)
    AND: [
      {
        NOT: {
          blocks_received: {
            some: {
              blocker_id: currentUserId,
              unblocked_at: null
            }
          }
        }
      },
      {
        NOT: {
          blocks_made: {
            some: {
              blocked_id: currentUserId,
              unblocked_at: null
            }
          }
        }
      }
    ]
  };

  // Height range filter
  if (filters.min_height !== undefined || filters.max_height !== undefined) {
    where.personal_details = where.personal_details || {};
    where.personal_details.height_cm = {};
    
    if (filters.min_height !== undefined) {
      where.personal_details.height_cm.gte = filters.min_height;
    }
    if (filters.max_height !== undefined) {
      where.personal_details.height_cm.lte = filters.max_height;
    }
  }

  // Mother tongue filter (multiple selection, match ANY)
  if (filters.mother_tongue && filters.mother_tongue.length > 0) {
    where.personal_details = where.personal_details || {};
    where.personal_details.mother_tongue = {
      in: filters.mother_tongue,
    };
  }

  // Rasi filter (multiple selection, match ANY)
  if (filters.rasi && filters.rasi.length > 0) {
    where.horoscope_details = where.horoscope_details || {};
    where.horoscope_details.rasi = {
      in: filters.rasi,
    };
  }

  // Nakshatra filter (multiple selection, match ANY)
  if (filters.nakshatra && filters.nakshatra.length > 0) {
    where.horoscope_details = where.horoscope_details || {};
    where.horoscope_details.nakshatra = {
      in: filters.nakshatra,
    };
  }

  // Keyword search - Full-text search across multiple fields
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    
    where.OR = [
      // Search in full name
      {
        full_name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      // Search in about_me
      {
        personal_details: {
          about_me: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
      // Search in occupation
      {
        professional_details: {
          occupation: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
      // Search in company name
      {
        professional_details: {
          company_name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
      // Search in city
      {
        personal_details: {
          city: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
      // Search in qualification
      {
        highest_qualification: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

/**
 * Select fields for privacy-aware profile summary
 * Only returns safe, non-sensitive data
 */
const getProfileSelectFields = () => ({
  id: true,
  profile_id: true,
  full_name: true,
  gender: true,
  date_of_birth: true,
  profile_created_by: true,
  is_active: true,
  is_mobile_verified: true,
  is_email_verified: true,
  is_profile_verified: true,
  highest_qualification: true,
  profile_completion_percentage: true,
  created_at: true,
  
  // Personal details (limited fields)
  personal_details: {
    select: {
      height_cm: true,
      marital_status: true,
      mother_tongue: true,
      about_me: true,
      body_type: true,
      complexion: true,
      city: true,
      state: true,
    },
  },
  
  // Caste details
  caste_details: {
    select: {
      religion: {
        select: {
          id: true,
          religion_name: true,
        },
      },
      caste: {
        select: {
          id: true,
          caste_name: true,
        },
      },
      sub_caste: {
        select: {
          id: true,
          sub_caste_name: true,
        },
      },
    },
  },
  
  // Professional details (limited)
  professional_details: {
    select: {
      occupation: true,
      employment_type: true,
      annual_income_range: true,
    },
  },
  
  // Horoscope details
  horoscope_details: {
    select: {
      rasi: true,
      nakshatra: true,
    },
  },
  
  // Only primary public photo
  photos: {
    where: {
      is_primary: true,
      is_approved: true,
      visibility: 'PUBLIC',
    },
    select: {
      photo_url: true,
      visibility: true,
    },
    take: 1,
  },
});

/**
 * Calculate age from date of birth
 * 
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
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
 * Format profile for response (privacy-aware)
 * 
 * @param {Object} profile - Raw profile from database
 * @returns {Object} Formatted profile summary
 */
const formatProfileForResponse = (profile) => {
  return {
    id: profile.id,  // UUID for interest/messaging operations
    profile_id: profile.profile_id,
    full_name: profile.full_name,
    age: calculateAge(profile.date_of_birth),
    gender: profile.gender,
    height_cm: profile.personal_details?.height_cm || null,
    marital_status: profile.personal_details?.marital_status || null,
    mother_tongue: profile.personal_details?.mother_tongue || null,
    city: profile.personal_details?.city || null,
    state: profile.personal_details?.state || null,
    religion: profile.caste_details?.religion?.religion_name || null,
    caste: profile.caste_details?.caste?.caste_name || null,
    occupation: profile.professional_details?.occupation || null,
    employment_type: profile.professional_details?.employment_type || null,
    annual_income_range: profile.professional_details?.annual_income_range || null,
    qualification: profile.highest_qualification || null,
    rasi: profile.horoscope_details?.rasi || null,
    nakshatra: profile.horoscope_details?.nakshatra || null,
    about_me: profile.personal_details?.about_me 
      ? profile.personal_details.about_me.substring(0, 200) + (profile.personal_details.about_me.length > 200 ? '...' : '')
      : null,
    photo_url: profile.photos?.[0]?.photo_url || null,
    is_verified: profile.is_profile_verified,
    profile_completion: profile.profile_completion_percentage || 0,
    created_at: profile.created_at,
  };
};

/**
 * Search profiles with filters
 * 
 * @param {Object} filters - Search filters
 * @param {number} page - Page number (1-based)
 * @param {string} currentUserId - ID of user performing search
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchProfiles = async (filters, page = 1, currentUserId) => {
  const startTime = Date.now();
  
  try {
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const take = RESULTS_PER_PAGE + 1; // Fetch one extra to check if there are more
    
    // Build where clause
    const where = buildSearchWhereClause(filters, currentUserId);
    
    // Execute search query
    const profiles = await prisma.user.findMany({
      where,
      select: getProfileSelectFields(),
      skip,
      take,
      orderBy: [
        { is_profile_verified: 'desc' }, // Verified profiles first
        { profile_completion_percentage: 'desc' }, // Then by completion
        { created_at: 'desc' }, // Most recent first
      ],
    });
    
    // Check if there are more results
    const hasMore = profiles.length > RESULTS_PER_PAGE;
    const results = hasMore ? profiles.slice(0, RESULTS_PER_PAGE) : profiles;
    
    // Format results for response
    const formattedResults = results.map(formatProfileForResponse);
    
    const executionTime = Date.now() - startTime;
    
    return {
      results: formattedResults,
      pagination: {
        current_page: page,
        per_page: RESULTS_PER_PAGE,
        has_more: hasMore,
      },
      execution_time_ms: executionTime,
      result_count: results.length,
    };
  } catch (error) {
    logger.error('Error in searchProfiles:', {
      error: error.message,
      stack: error.stack,
      filters,
      page,
      currentUserId,
    });
    throw error;
  }
};

/**
 * Search profile by custom profile ID
 * 
 * @param {string} profileId - Custom profile ID
 * @param {string} currentUserId - ID of user performing search
 * @returns {Promise<Object>} Profile details
 */
export const searchByProfileId = async (profileId, currentUserId) => {
  const startTime = Date.now();
  
  try {
    const profile = await prisma.user.findUnique({
      where: { profile_id: profileId },
      select: getProfileSelectFields(),
    });
    
    if (!profile) {
      throw new BadRequestError(`Profile with ID ${profileId} not found`);
    }
    
    // Check if profile is active and verified
    if (!profile.is_active || !profile.is_profile_verified) {
      throw new BadRequestError(`Profile with ID ${profileId} not found`);
    }
    
    // Format profile for response
    const formattedProfile = formatProfileForResponse(profile);
    
    const executionTime = Date.now() - startTime;
    
    return {
      profile: formattedProfile,
      execution_time_ms: executionTime,
    };
  } catch (error) {
    logger.error('Error in searchByProfileId:', {
      error: error.message,
      stack: error.stack,
      profileId,
      currentUserId,
    });
    throw error;
  }
};

/**
 * Log search activity asynchronously
 * Logs search filters, result count, execution time, and metadata
 * 
 * @param {Object} params - Search log parameters
 */
export const logSearch = async ({ userId, filters, resultCount, executionTimeMs, ipAddress, userAgent }) => {
  try {
    // Log asynchronously without blocking the response
    setImmediate(async () => {
      try {
        await prisma.searchLog.create({
          data: {
            user_id: userId || null,
            search_filters: filters,
            result_count: resultCount,
            execution_time_ms: executionTimeMs,
            ip_address: ipAddress || null,
            user_agent: userAgent || null,
          },
        });
        
        logger.info('Search logged successfully', {
          userId,
          resultCount,
          executionTimeMs,
          hasKeyword: !!filters.keyword,
        });
      } catch (error) {
        // Log error but don't throw - logging failure shouldn't affect user experience
        logger.error('Failed to log search:', {
          error: error.message,
          userId,
          filters,
        });
      }
    });
  } catch (error) {
    logger.error('Error initiating search log:', {
      error: error.message,
      userId,
    });
  }
};

/**
 * Get user's search history
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Number of recent searches to return
 * @returns {Promise<Array>} Recent search logs
 */
export const getUserSearchHistory = async (userId, limit = 10) => {
  try {
    const searchHistory = await prisma.searchLog.findMany({
      where: { user_id: userId },
      orderBy: { searched_at: 'desc' },
      take: limit,
      select: {
        id: true,
        search_filters: true,
        result_count: true,
        execution_time_ms: true,
        searched_at: true,
      },
    });
    
    return searchHistory;
  } catch (error) {
    logger.error('Error fetching user search history:', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

export default {
  generateProfileId,
  searchProfiles,
  searchByProfileId,
  logSearch,
  getUserSearchHistory,
};
