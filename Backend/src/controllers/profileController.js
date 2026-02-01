import prisma from '../config/prisma.js';
import {
  createFamilyDetailsSchema,
  updateFamilyDetailsSchema,
  createHoroscopeDetailsSchema,
  updateHoroscopeDetailsSchema,
  partnerPreferencesSchema,
} from '../utils/validation.js';
import { getAllStates, validateCityInState } from '../services/locationService.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors.js';
import { logAPI, logDatabase } from '../utils/logUtils.js';
import { calculateMatchScore, calculateEnhancedMatchScore } from '../utils/preferenceMatching.js';
import { updateProfileCompletionCache } from '../utils/profileCompletion.js';

/**
 * Format horoscope details for API response
 * Converts ISO DateTime to 12-hour format with AM/PM for time_of_birth
 */
const formatHoroscopeResponse = (horoscopeDetails) => {
  if (!horoscopeDetails) return horoscopeDetails;
  
  let formattedTime = null;
  if (horoscopeDetails.time_of_birth) {
    const date = new Date(horoscopeDetails.time_of_birth);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const hoursStr = hours.toString().padStart(2, '0');
    
    formattedTime = `${hoursStr}:${minutes} ${period}`;
  }
  
  return {
    ...horoscopeDetails,
    time_of_birth: formattedTime,
  };
};

class ProfileController {
  /**
   * Create family details for a user
   * POST /users/:userId/family
   */
  async createFamilyDetails(req, res) {
    const { userId } = req.params;

    // Validate request body
    const familyData = createFamilyDetailsSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Create family details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot create family details for inactive user');
    }

    // Check if family details already exist
    const existingFamilyDetails = await prisma.userFamilyDetails.findUnique({
      where: { user_id: userId },
    });

    if (existingFamilyDetails) {
      logAPI.error('Create family details failed - already exists', new Error('Conflict'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new ConflictError(
        'Family details already exist for this user. Use PUT /users/:userId/family to update.'
      );
    }

    // Create family details
    const familyDetails = await prisma.userFamilyDetails.create({
      data: {
        user_id: userId,
        father_occupation: familyData.father_occupation,
        mother_occupation: familyData.mother_occupation,
        siblings_details: familyData.siblings_details,
        family_values: familyData.family_values,
      },
    });

    logAPI.success('Family details created successfully', {
      userId,
      createdBy: req.user.id,
      hasData: Object.keys(familyData).length > 0,
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(201).json({
      success: true,
      message: 'Family details created successfully',
      data: {
        family_details: familyDetails,
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Update family details for a user
   * PUT /users/:userId/family
   */
  async updateFamilyDetails(req, res) {
    const { userId } = req.params;

    // Validate request body
    const familyData = updateFamilyDetailsSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Update family details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot update family details for inactive user');
    }

    // Check if family details exist
    const existingFamilyDetails = await prisma.userFamilyDetails.findUnique({
      where: { user_id: userId },
    });

    if (!existingFamilyDetails) {
      logAPI.error('Update family details failed - not found', new Error('Not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError(
        'Family details not found for this user. Use POST /users/:userId/family to create.'
      );
    }

    // Update family details (partial update - only update provided fields)
    const updatedFamilyDetails = await prisma.userFamilyDetails.update({
      where: { user_id: userId },
      data: familyData,
    });

    logAPI.success('Family details updated successfully', {
      userId,
      updatedBy: req.user.id,
      fieldsUpdated: Object.keys(familyData),
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(200).json({
      success: true,
      message: 'Family details updated successfully',
      data: {
        family_details: updatedFamilyDetails,
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Get family details for a user
   * GET /users/:userId/family
   */
  async getFamilyDetails(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        full_name: true, 
        gender: true,
        is_active: true,
      },
    });

    if (!user) {
      logAPI.error('Get family details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot view family details for inactive user');
    }

    // Get family details
    const familyDetails = await prisma.userFamilyDetails.findUnique({
      where: { user_id: userId },
    });

    logAPI.success('Family details retrieved successfully', {
      userId,
      requestedBy: req.user.id,
      hasData: !!familyDetails,
    });

    // Return 200 with null if no family details exist (as per requirement)
    res.status(200).json({
      success: true,
      message: familyDetails 
        ? 'Family details retrieved successfully' 
        : 'No family details found for this user',
      data: {
        family_details: familyDetails || {},
        user: {
          id: user.id,
          full_name: user.full_name,
          gender: user.gender,
        },
      },
    });
  }

  // ============================================
  // HOROSCOPE DETAILS CRUD
  // ============================================

  /**
   * Create horoscope details for a user
   * POST /users/:userId/horoscope
   */
  async createHoroscopeDetails(req, res) {
    const { userId } = req.params;

    // Validate request body
    const horoscopeData = createHoroscopeDetailsSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Create horoscope details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot create horoscope details for inactive user');
    }

    // Check if horoscope details already exist
    const existingHoroscopeDetails = await prisma.userHoroscopeDetails.findUnique({
      where: { user_id: userId },
    });

    if (existingHoroscopeDetails) {
      logAPI.error('Create horoscope details failed - already exists', new Error('Conflict'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new ConflictError(
        'Horoscope details already exist for this user. Use PUT /users/:userId/horoscope to update.'
      );
    }

    // Create horoscope details
    const horoscopeDetails = await prisma.userHoroscopeDetails.create({
      data: {
        user_id: userId,
        rasi: horoscopeData.rasi,
        nakshatra: horoscopeData.nakshatra,
        time_of_birth: horoscopeData.time_of_birth,
        place_of_birth: horoscopeData.place_of_birth,
      },
    });

    logAPI.success('Horoscope details created successfully', {
      userId,
      createdBy: req.user.id,
      hasData: Object.keys(horoscopeData).length > 0,
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(201).json({
      success: true,
      message: 'Horoscope details created successfully',
      data: {
        horoscope_details: formatHoroscopeResponse(horoscopeDetails),
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Update horoscope details for a user
   * PUT /users/:userId/horoscope
   */
  async updateHoroscopeDetails(req, res) {
    const { userId } = req.params;

    // Validate request body
    const horoscopeData = updateHoroscopeDetailsSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Update horoscope details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot update horoscope details for inactive user');
    }

    // Check if horoscope details exist
    const existingHoroscopeDetails = await prisma.userHoroscopeDetails.findUnique({
      where: { user_id: userId },
    });

    if (!existingHoroscopeDetails) {
      logAPI.error('Update horoscope details failed - not found', new Error('Not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError(
        'Horoscope details not found for this user. Use POST /users/:userId/horoscope to create.'
      );
    }

    // Update horoscope details (partial update - only update provided fields)
    const updatedHoroscopeDetails = await prisma.userHoroscopeDetails.update({
      where: { user_id: userId },
      data: horoscopeData,
    });

    logAPI.success('Horoscope details updated successfully', {
      userId,
      updatedBy: req.user.id,
      fieldsUpdated: Object.keys(horoscopeData),
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(200).json({
      success: true,
      message: 'Horoscope details updated successfully',
      data: {
        horoscope_details: formatHoroscopeResponse(updatedHoroscopeDetails),
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Get horoscope details for a user
   * GET /users/:userId/horoscope
   */
  async getHoroscopeDetails(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        full_name: true, 
        gender: true,
        is_active: true,
      },
    });

    if (!user) {
      logAPI.error('Get horoscope details failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot view horoscope details for inactive user');
    }

    // Get horoscope details
    const horoscopeDetails = await prisma.userHoroscopeDetails.findUnique({
      where: { user_id: userId },
    });

    logAPI.success('Horoscope details retrieved successfully', {
      userId,
      requestedBy: req.user.id,
      hasData: !!horoscopeDetails,
    });

    // Return 200 with empty object if no horoscope details exist (as per requirement)
    res.status(200).json({
      success: true,
      message: horoscopeDetails 
        ? 'Horoscope details retrieved successfully' 
        : 'No horoscope details found for this user',
      data: {
        horoscope_details: horoscopeDetails ? formatHoroscopeResponse(horoscopeDetails) : {},
        user: {
          id: user.id,
          full_name: user.full_name,
          gender: user.gender,
        },
      },
    });
  }

  // ============================================
  // PARTNER PREFERENCES CRUD (Phase 2 - Task 2.7)
  // ============================================

  /**
   * Create partner preferences for a user
   * POST /users/:userId/preferences
   */
  async createPartnerPreferences(req, res) {
    const { userId } = req.params;

    // Validate request body
    const preferencesData = partnerPreferencesSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Create partner preferences failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot create partner preferences for inactive user');
    }

    // Check if partner preferences already exist
    const existingPreferences = await prisma.partnerPreferences.findUnique({
      where: { user_id: userId },
    });

    if (existingPreferences) {
      logAPI.error('Create partner preferences failed - already exists', new Error('Conflict'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new ConflictError(
        'Partner preferences already exist for this user. Use PUT /users/:userId/preferences to update.'
      );
    }

    // Validate religion IDs if provided
    if (preferencesData.religion_preference && preferencesData.religion_preference.length > 0) {
      const religions = await prisma.religion.findMany({
        where: { id: { in: preferencesData.religion_preference } },
        select: { id: true },
      });

      if (religions.length !== preferencesData.religion_preference.length) {
        throw new BadRequestError('One or more religion IDs are invalid');
      }
    }

    // Validate caste IDs if provided
    if (preferencesData.caste_preference && preferencesData.caste_preference.length > 0) {
      const castes = await prisma.caste.findMany({
        where: { id: { in: preferencesData.caste_preference } },
        select: { id: true },
      });

      if (castes.length !== preferencesData.caste_preference.length) {
        throw new BadRequestError('One or more caste IDs are invalid');
      }
    }

    // Validate preferred_location if provided
    if (preferencesData.preferred_location) {
      const validStates = await getAllStates();
      const locationData = preferencesData.preferred_location;

      // Validate each state and its cities
      for (const [state, cities] of Object.entries(locationData)) {
        // Check if state is valid
        if (!validStates.includes(state)) {
          throw new BadRequestError(`Invalid state: ${state}`);
        }

        // Validate each city belongs to the state
        if (cities && Array.isArray(cities)) {
          for (const city of cities) {
            const isValid = await validateCityInState(state, city);
            if (!isValid) {
              throw new BadRequestError(`City "${city}" is not valid for state "${state}"`);
            }
          }
        }
      }
    }

    // Create partner preferences
    const partnerPreferences = await prisma.partnerPreferences.create({
      data: {
        user_id: userId,
        ...preferencesData,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logAPI.success('Partner preferences created successfully', {
      userId,
      createdBy: req.user.id,
      hasData: Object.keys(preferencesData).length > 0,
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(201).json({
      success: true,
      message: 'Partner preferences created successfully',
      data: {
        partner_preferences: partnerPreferences,
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Update partner preferences for a user
   * PUT /users/:userId/preferences
   */
  async updatePartnerPreferences(req, res) {
    const { userId } = req.params;

    // Validate request body
    const preferencesData = partnerPreferencesSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, is_active: true },
    });

    if (!user) {
      logAPI.error('Update partner preferences failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot update partner preferences for inactive user');
    }

    // Check if partner preferences exist
    const existingPreferences = await prisma.partnerPreferences.findUnique({
      where: { user_id: userId },
    });

    if (!existingPreferences) {
      logAPI.error('Update partner preferences failed - not found', new Error('Not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError(
        'Partner preferences not found for this user. Use POST /users/:userId/preferences to create.'
      );
    }

    // Validate religion IDs if provided
    if (preferencesData.religion_preference && preferencesData.religion_preference.length > 0) {
      const religions = await prisma.religion.findMany({
        where: { id: { in: preferencesData.religion_preference } },
        select: { id: true },
      });

      if (religions.length !== preferencesData.religion_preference.length) {
        throw new BadRequestError('One or more religion IDs are invalid');
      }
    }

    // Validate caste IDs if provided
    if (preferencesData.caste_preference && preferencesData.caste_preference.length > 0) {
      const castes = await prisma.caste.findMany({
        where: { id: { in: preferencesData.caste_preference } },
        select: { id: true },
      });

      if (castes.length !== preferencesData.caste_preference.length) {
        throw new BadRequestError('One or more caste IDs are invalid');
      }
    }

    // Validate preferred_location if provided
    if (preferencesData.preferred_location) {
      const validStates = await getAllStates();
      const locationData = preferencesData.preferred_location;

      // Validate each state and its cities
      for (const [state, cities] of Object.entries(locationData)) {
        // Check if state is valid
        if (!validStates.includes(state)) {
          throw new BadRequestError(`Invalid state: ${state}`);
        }

        // Validate each city belongs to the state
        if (cities && Array.isArray(cities)) {
          for (const city of cities) {
            const isValid = await validateCityInState(state, city);
            if (!isValid) {
              throw new BadRequestError(`City "${city}" is not valid for state "${state}"`);
            }
          }
        }
      }
    }

    // Update partner preferences (partial update - only update provided fields)
    const updatedPreferences = await prisma.partnerPreferences.update({
      where: { user_id: userId },
      data: preferencesData,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    logAPI.success('Partner preferences updated successfully', {
      userId,
      updatedBy: req.user.id,
      fieldsUpdated: Object.keys(preferencesData),
    });

    // Update profile completion cache
    await updateProfileCompletionCache(userId);

    res.status(200).json({
      success: true,
      message: 'Partner preferences updated successfully',
      data: {
        partner_preferences: updatedPreferences,
        user: {
          id: user.id,
          full_name: user.full_name,
        },
      },
    });
  }

  /**
   * Get partner preferences for a user
   * GET /users/:userId/preferences
   */
  async getPartnerPreferences(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        gender: true,
        is_active: true,
      },
    });

    if (!user) {
      logAPI.error('Get partner preferences failed - user not found', new Error('User not found'), {
        userId,
        requestedBy: req.user.id,
      });
      throw new NotFoundError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Cannot view partner preferences for inactive user');
    }

    // Get partner preferences
    const partnerPreferences = await prisma.partnerPreferences.findUnique({
      where: { user_id: userId },
    });

    // Format preferred_location for display if it exists
    let formattedPreferences = partnerPreferences;
    if (partnerPreferences && partnerPreferences.preferred_location) {
      const locationData = partnerPreferences.preferred_location;
      const locationStrings = [];

      for (const [state, cities] of Object.entries(locationData)) {
        if (cities && Array.isArray(cities) && cities.length > 0) {
          cities.forEach(city => {
            locationStrings.push(`${city}, ${state}`);
          });
        } else {
          // State without specific cities - "Any city in State"
          locationStrings.push(`Any city in ${state}`);
        }
      }

      formattedPreferences = {
        ...partnerPreferences,
        preferred_location_display: locationStrings.join('; ')
      };
    }

    logAPI.success('Partner preferences retrieved successfully', {
      userId,
      requestedBy: req.user.id,
      hasData: !!partnerPreferences,
    });

    // Return 200 with empty object if no preferences exist (as per requirement)
    res.status(200).json({
      success: true,
      message: partnerPreferences
        ? 'Partner preferences retrieved successfully'
        : 'No partner preferences found for this user',
      data: {
        partner_preferences: formattedPreferences || {},
        user: {
          id: user.id,
          full_name: user.full_name,
          gender: user.gender,
        },
      },
    });
  }

  /**
   * Calculate match score between a user and partner preferences
   * POST /users/:userId/preferences/match/:targetUserId
   * 
   * This endpoint calculates how well targetUser matches userId's preferences
   */
  async calculatePreferenceMatch(req, res) {
    const { userId, targetUserId } = req.params;
    const { enhanced = false } = req.query; // Optional: use enhanced scoring

    // Get user's partner preferences
    const partnerPreferences = await prisma.partnerPreferences.findUnique({
      where: { user_id: userId },
    });

    if (!partnerPreferences) {
      throw new NotFoundError('Partner preferences not found for this user');
    }

    // Get target user's complete profile
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        personal_details: true,
        caste_details: true,
        education_details: {
          orderBy: { year_of_passing: 'desc' },
          take: 1,
        },
        professional_details: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    if (!targetUser.is_active) {
      throw new ForbiddenError('Cannot calculate match for inactive user');
    }

    // Calculate match score
    const matchResult = enhanced === 'true' || enhanced === true
      ? calculateEnhancedMatchScore(targetUser, partnerPreferences)
      : calculateMatchScore(targetUser, partnerPreferences);

    logAPI.success('Preference match calculated successfully', {
      userId,
      targetUserId,
      matchPercentage: matchResult.matchPercentage,
    });

    res.status(200).json({
      success: true,
      message: 'Match score calculated successfully',
      data: {
        match_result: matchResult,
        user: {
          id: targetUser.id,
          full_name: targetUser.full_name,
        },
      },
    });
  }
}

export default new ProfileController();
