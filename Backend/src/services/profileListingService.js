import prisma from '../config/prisma.js';
import { calculateAge } from '../utils/preferenceMatching.js';
import logger from '../config/logger.js';

/**
 * Profile Listing Service
 * Handles complex profile search queries with filtering, sorting, and match scoring
 * Task 3.1: Profile Listing
 */

/**
 * Build WHERE clause for profile filtering
 * @param {Object} filters - Filter parameters
 * @param {String} currentUserId - Current authenticated user ID
 * @returns {Object} - Prisma where clause
 */
export const buildProfileWhereClause = (filters, currentUserId) => {
  const whereConditions = {
    AND: [
      // Exclude current user's own profile
      { id: { not: currentUserId } },
      
      // Only active users
      { is_active: true },
      
      // Minimum 60% profile completion
      { profile_completion_percentage: { gte: 60 } },
      
      // Has at least one approved photo
      {
        photos: {
          some: {
            is_approved: true,
          },
        },
      },
      
      // Exclude blocked users (bidirectional)
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
      },
    ],
  };

  // Gender filter (from partner preferences)
  if (filters.gender) {
    whereConditions.AND.push({ gender: filters.gender });
  }

  // Age range filter (calculate from date_of_birth)
  if (filters.min_age || filters.max_age) {
    const today = new Date();
    
    if (filters.max_age) {
      const minDateOfBirth = new Date(
        today.getFullYear() - filters.max_age,
        today.getMonth(),
        today.getDate()
      );
      whereConditions.AND.push({
        date_of_birth: { gte: minDateOfBirth },
      });
    }
    
    if (filters.min_age) {
      const maxDateOfBirth = new Date(
        today.getFullYear() - filters.min_age,
        today.getMonth(),
        today.getDate()
      );
      whereConditions.AND.push({
        date_of_birth: { lte: maxDateOfBirth },
      });
    }
  }

  // Location filters (OR match between personal and work locations)
  const locationConditions = [];
  
  if (filters.state) {
    locationConditions.push(
      { personal_details: { state: filters.state } },
      { professional_details: { work_state: filters.state } }
    );
  }
  
  if (filters.city) {
    locationConditions.push(
      { personal_details: { city: filters.city } },
      { professional_details: { work_city: filters.city } }
    );
  }
  
  if (filters.work_location_type) {
    locationConditions.push({
      professional_details: { work_location_type: filters.work_location_type },
    });
  }
  
  if (locationConditions.length > 0) {
    whereConditions.AND.push({ OR: locationConditions });
  }

  // Religion filter
  if (filters.religion_id) {
    whereConditions.AND.push({
      caste_details: { religion_id: parseInt(filters.religion_id) },
    });
  }

  // Caste filter
  if (filters.caste_id) {
    whereConditions.AND.push({
      caste_details: { caste_id: parseInt(filters.caste_id) },
    });
  }

  // Marital status filter
  if (filters.marital_status) {
    whereConditions.AND.push({
      personal_details: { marital_status: filters.marital_status },
    });
  }

  // Height range filter
  if (filters.min_height) {
    whereConditions.AND.push({
      personal_details: { height_cm: { gte: parseInt(filters.min_height) } },
    });
  }
  
  if (filters.max_height) {
    whereConditions.AND.push({
      personal_details: { height_cm: { lte: parseInt(filters.max_height) } },
    });
  }

  // Mother tongue filter
  if (filters.mother_tongue) {
    whereConditions.AND.push({
      personal_details: { mother_tongue: filters.mother_tongue },
    });
  }

  // Physical status filter
  if (filters.physical_status) {
    whereConditions.AND.push({
      personal_details: { physical_status: filters.physical_status },
    });
  }

  // Employment type filter
  if (filters.employment_type) {
    whereConditions.AND.push({
      professional_details: { employment_type: filters.employment_type },
    });
  }

  // Income range filter
  if (filters.income_range) {
    whereConditions.AND.push({
      professional_details: { annual_income_range: filters.income_range },
    });
  }

  // Education filter (qualification)
  if (filters.qualification) {
    whereConditions.AND.push({
      education_details: {
        some: {
          qualification: { contains: filters.qualification, mode: 'insensitive' },
        },
      },
    });
  }

  return whereConditions;
};

/**
 * Build ORDER BY clause for profile sorting
 * @param {String} sortBy - Sort option (newest, last_active, match_score)
 * @returns {Object|Array} - Prisma orderBy clause
 */
export const buildOrderByClause = (sortBy) => {
  switch (sortBy) {
    case 'last_active':
      return [
        { last_active_at: 'desc' },
        { created_at: 'desc' }, // Fallback for null values
      ];
    case 'match_score':
      // Match score sorting handled separately in controller
      return { created_at: 'desc' };
    case 'newest':
    default:
      return { created_at: 'desc' };
  }
};

/**
 * Format profile data for API response
 * @param {Object} profile - Raw profile data from database
 * @returns {Object} - Formatted profile object
 */
export const formatProfileForListing = (profile) => {
  // Calculate age from date_of_birth
  const age = calculateAge(profile.date_of_birth);

  // Get highest/latest qualification
  const latestEducation = profile.education_details?.[0];
  const qualification = latestEducation?.qualification || null;

  // Get primary photo (approved only)
  const primaryPhoto = profile.photos?.find(photo => photo.is_primary && photo.is_approved);
  const photoCount = profile.photos?.filter(photo => photo.is_approved).length || 0;

  return {
    profile_id: profile.profile_id,
    full_name: profile.full_name,
    age,
    gender: profile.gender,
    profile_completion_percentage: profile.profile_completion_percentage,
    
    // Personal details
    height_cm: profile.personal_details?.height_cm || null,
    marital_status: profile.personal_details?.marital_status || null,
    city: profile.personal_details?.city || null,
    state: profile.personal_details?.state || null,
    mother_tongue: profile.personal_details?.mother_tongue || null,
    physical_status: profile.personal_details?.physical_status || null,
    
    // Professional details
    occupation: profile.professional_details?.occupation || null,
    annual_income_range: profile.professional_details?.annual_income_range || null,
    employment_type: profile.professional_details?.employment_type || null,
    
    // Education
    qualification,
    
    // Caste details
    religion_name: profile.caste_details?.religion?.religion_name || null,
    caste_name: profile.caste_details?.caste?.caste_name || null,
    
    // Photos
    primary_photo: primaryPhoto?.photo_url || null,
    photo_count: photoCount,
    
    // Activity
    last_active_at: profile.last_active_at,
    created_at: profile.created_at,
  };
};

/**
 * Get user's partner preferences for auto-filtering
 * @param {String} userId - User ID
 * @returns {Object} - Partner preferences or empty object
 */
export const getUserPartnerPreferences = async (userId) => {
  try {
    const preferences = await prisma.partnerPreferences.findUnique({
      where: { user_id: userId },
      select: {
        min_age: true,
        max_age: true,
        min_height: true,
        max_height: true,
        religion_preference: true,
        caste_preference: true,
        education_preference: true,
        employment_type_preference: true,
        marital_status_preference: true,
        mother_tongue_preference: true,
        income_preference_min: true,
        income_preference_max: true,
        preferred_location: true,
      },
    });

    return preferences || {};
  } catch (error) {
    logger.error('Error fetching partner preferences', {
      userId,
      error: error.message,
    });
    return {};
  }
};

/**
 * Get user's gender to filter opposite gender
 * @param {String} userId - User ID
 * @returns {String|null} - Opposite gender or null
 */
export const getOppositeGender = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (!user) return null;

    // Return opposite gender for matching
    if (user.gender === 'MALE') return 'FEMALE';
    if (user.gender === 'FEMALE') return 'MALE';
    
    return null; // For 'OTHER' or undefined
  } catch (error) {
    logger.error('Error fetching user gender', {
      userId,
      error: error.message,
    });
    return null;
  }
};

/**
 * Log search query to search_logs table
 * @param {Object} logData - Search log data
 */
export const logSearchQuery = async (logData) => {
  try {
    await prisma.searchLog.create({
      data: {
        user_id: logData.userId,
        search_filters: logData.filters,
        result_count: logData.resultCount,
        execution_time_ms: logData.executionTime,
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent,
      },
    });
  } catch (error) {
    logger.error('Error logging search query', {
      error: error.message,
      userId: logData.userId,
    });
    // Don't throw - logging failure shouldn't break the search
  }
};
