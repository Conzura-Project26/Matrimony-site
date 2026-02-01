/**
 * Profile Completion Utility
 * Shared functions for calculating and caching profile completion percentage
 * 
 * This utility provides centralized profile completion logic that can be used
 * across multiple controllers (userProfileController, photoController, profileController)
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Calculate profile completion percentage
 * @param {Object} user - User object with all details
 * @returns {number} - Completion percentage (0-100)
 */
export function calculateProfileCompletion(user) {
  const sections = {
    basic: 0, // From User model
    personal: 0,
    caste: 0,
    education: 0,
    professional: 0,
    family: 0,
    horoscope: 0,
    photos: 0,
    preferences: 0
  };

  // Basic info (User model) - 20 points
  const basicFields = [
    user.full_name,
    user.gender,
    user.date_of_birth,
    user.mobile_number,
    user.email
  ];
  const basicFilledCount = basicFields.filter(field => field !== null && field !== undefined).length;
  sections.basic = (basicFilledCount / basicFields.length) * 20;

  // Personal details - 20 points
  if (user.personal_details) {
    const personalFields = [
      user.personal_details.height_cm,
      user.personal_details.weight_kg,
      user.personal_details.marital_status,
      user.personal_details.physical_status,
      user.personal_details.mother_tongue,
      user.personal_details.complexion,
      user.personal_details.body_type,
      user.personal_details.blood_group,
      user.personal_details.diet_preference,
      user.personal_details.drinking_habit,
      user.personal_details.smoking_habit,
      user.personal_details.about_me
    ];
    const personalFilledCount = personalFields.filter(field => field !== null && field !== undefined).length;
    sections.personal = (personalFilledCount / personalFields.length) * 20;
  }

  // Caste details - 10 points (Special case for Hindu religion)
  if (user.caste_details) {
    const isHindu = user.caste_details.religion_id === 1; // Hindu religion ID is 1
    
    if (isHindu) {
      // Hindu: religion filled = 4%, caste filled = +6%
      if (user.caste_details.religion_id) {
        sections.caste += 4;
      }
      if (user.caste_details.caste_id) {
        sections.caste += 6;
      }
    } else {
      // Other religions: religion filled = 10%
      if (user.caste_details.religion_id) {
        sections.caste = 10;
      }
    }
  }

  // Education details - 10 points (Graduated scoring - Task 2.3)
  // No education: 0%, 1 partial: 5%, 1 full: 7%, 2+ partial: 8%, 2+ full: 10%
  if (user.education_details && user.education_details.length > 0) {
    const educationCount = user.education_details.length;
    
    // Check how many are fully filled (all 3 fields present)
    const fullyFilledCount = user.education_details.filter(edu => 
      edu.qualification && 
      edu.institution_name && 
      edu.year_of_passing
    ).length;
    
    if (educationCount === 1) {
      // Single education entry
      sections.education = fullyFilledCount === 1 ? 7 : 5;
    } else {
      // Multiple education entries (2+)
      sections.education = fullyFilledCount >= 2 ? 10 : 8;
    }
  }

  // Professional details - 10 points (Weighted scoring - Task 2.4)
  // Core fields (8 pts): occupation=3, employment_type=3, income=2
  // Enrichment fields (2 pts): company_name=1, work_location=1
  if (user.professional_details) {
    let professionalScore = 0;
    
    // Core fields (critical for matching)
    if (user.professional_details.occupation) {
      professionalScore += 3;
    }
    if (user.professional_details.employment_type) {
      professionalScore += 3;
    }
    if (user.professional_details.annual_income_range) {
      professionalScore += 2;
    }
    
    // Enrichment fields (quality enhancers)
    if (user.professional_details.company_name) {
      professionalScore += 1;
    }
    if (user.professional_details.work_location) {
      professionalScore += 1;
    }
    
    sections.professional = professionalScore;
  }

  // Family details - 10 points
  if (user.family_details) {
    const familyFields = [
      user.family_details.father_occupation,
      user.family_details.mother_occupation,
      user.family_details.family_values
    ];
    const familyFilledCount = familyFields.filter(field => field !== null && field !== undefined).length;
    sections.family = (familyFilledCount / familyFields.length) * 10;
  }

  // Horoscope details - 5 points
  if (user.horoscope_details) {
    const horoscopeFields = [
      user.horoscope_details.rasi,
      user.horoscope_details.nakshatra
    ];
    const horoscopeFilledCount = horoscopeFields.filter(field => field !== null && field !== undefined).length;
    sections.horoscope = (horoscopeFilledCount / horoscopeFields.length) * 5;
  }

  // Photos - 10 points
  if (user.photos && user.photos.length > 0) {
    sections.photos = 10;
  }

  // Partner preferences - 5 points
  if (user.partner_preferences) {
    sections.preferences = 5;
  }

  // Calculate total
  const totalCompletion = Object.values(sections).reduce((sum, value) => sum + value, 0);
  return Math.round(totalCompletion);
}

/**
 * Update cached profile completion percentage
 * Called automatically after any profile update
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Updated completion percentage
 */
export async function updateProfileCompletionCache(userId) {
  try {
    // Fetch complete user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        personal_details: true,
        caste_details: true,
        education_details: true,
        professional_details: true,
        family_details: true,
        horoscope_details: true,
        photos: true,
        partner_preferences: true
      }
    });

    if (!user) {
      logger.error('Cannot update profile completion cache - user not found', { userId });
      return 0;
    }

    // Calculate completion percentage
    const completionPercentage = calculateProfileCompletion(user);

    // Update cached value in database
    await prisma.user.update({
      where: { id: userId },
      data: { profile_completion_percentage: completionPercentage }
    });

    logger.info('Profile completion cache updated', {
      userId,
      completionPercentage
    });

    return completionPercentage;
  } catch (error) {
    logger.error('Failed to update profile completion cache', {
      error: error.message,
      userId
    });
    // Return 0 on error but don't throw - cache update failure shouldn't break main operation
    return 0;
  }
}

/**
 * Get profile completion percentage (uses cache)
 * Falls back to calculation if cache is missing
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Completion percentage (0-100)
 */
export async function getProfileCompletionPercentage(userId) {
  try {
    // First, try to get cached value
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile_completion_percentage: true }
    });

    if (user && user.profile_completion_percentage !== null) {
      return user.profile_completion_percentage;
    }

    // Cache miss or null - calculate and cache
    logger.warn('Profile completion cache miss - recalculating', { userId });
    return await updateProfileCompletionCache(userId);
  } catch (error) {
    logger.error('Failed to get profile completion percentage', {
      error: error.message,
      userId
    });
    return 0;
  }
}
