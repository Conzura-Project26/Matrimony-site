import prisma from '../config/prisma.js';
import { 
  personalDetailsSchema, 
  casteDetailsSchema,
  educationDetailsCreateSchema,
  educationDetailsUpdateSchema,
  professionalDetailsCreateSchema,
  professionalDetailsUpdateSchema,
  professionalDetailsPatchSchema,
  MAX_EDUCATION_ENTRIES
} from '../utils/validation.js';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  ForbiddenError,
  ConflictError
} from '../utils/errors.js';
import logger from '../config/logger.js';
import { validateCityInState, getAllStates } from '../services/locationService.js';
import { 
  calculateProfileCompletion, 
  updateProfileCompletionCache as updateCache, 
  getProfileCompletionPercentage 
} from '../utils/profileCompletion.js';

/**
 * User Profile Controller
 * Handles personal details CRUD operations
 * Phase 2 - Task 2.1: Personal Details CRUD
 */
class UserProfileController {
  /**
   * Update cached profile completion percentage
   * Wrapper method that delegates to the shared utility function
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Updated completion percentage
   */
  async updateProfileCompletionCache(userId) {
    return await updateCache(userId);
  }

  /**
   * Check if requester has permission to modify user's personal details
   * @param {Object} requester - The user making the request (from JWT)
   * @param {Object} targetUser - The user whose details are being modified
   * @returns {boolean} - True if authorized
   */
  canModifyPersonalDetails(requester, targetUser) {
    // User can modify their own details
    if (requester.userId === targetUser.id) {
      return true;
    }

    // Only Admin can modify other user's details (not Moderator)
    // Admin has 'manage_users' permission
    if (requester.role === 'ADMIN') {
      return true;
    }

    // Parent/Guardian who created the profile can modify
    // Note: We would need to track who created the profile in a separate field
    // For now, we'll just allow the above cases
    
    return false;
  }

  /**
   * Create audit log entry
   * @param {string} actorId - User ID who performed the action
   * @param {string} action - Description of the action
   * @param {string} ipAddress - IP address of the request
   */
  async createAuditLog(actorId, action, ipAddress) {
    try {
      await prisma.auditLog.create({
        data: {
          actor_id: actorId,
          action: action,
          ip_address: ipAddress
        }
      });
    } catch (error) {
      // Log error but don't throw - audit log failure shouldn't break the main operation
      logger.error('Audit log creation failed', { 
        error: error.message,
        actorId,
        action
      });
    }
  }

  /**
   * Create Personal Details (POST only)
   * POST /users/:userId/personal
   */
  async createPersonalDetails(req, res) {
    const { userId } = req.params;
    const personalData = req.body;

    // Validate request body
    const validation = personalDetailsSchema.safeParse(personalData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Additional validation: If city is provided, validate it against the state
    if (validation.data.city && validation.data.state) {
      const isValidCity = await validateCityInState(validation.data.state, validation.data.city);
      if (!isValidCity) {
        throw new BadRequestError(`City "${validation.data.city}" is not valid for state "${validation.data.state}"`);
      }
    }

    // Additional validation: If state is provided, validate it exists
    if (validation.data.state) {
      const states = await getAllStates();
      if (!states.includes(validation.data.state)) {
        throw new BadRequestError(`Invalid state: "${validation.data.state}"`);
      }
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        personal_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if personal details already exist
    if (targetUser.personal_details) {
      throw new BadRequestError('Personal details already exist. Use PUT to update.');
    }

    // Check authorization
    if (!this.canModifyPersonalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s personal details');
    }

    // Create personal details
    const personalDetails = await prisma.userPersonalDetails.create({
      data: {
        user_id: userId,
        ...validation.data
      }
    });

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Created personal details for user ${userId}`,
      ipAddress
    );

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    logger.info('Personal details created', {
      userId: userId,
      createdBy: req.user.userId,
      fieldsCreated: Object.keys(validation.data)
    });

    res.status(201).json({
      success: true,
      message: 'Personal details created successfully',
      data: personalDetails
    });
  }

  /**
   * Update Personal Details (PUT only)
   * PUT /users/:userId/personal
   */
  async updatePersonalDetails(req, res) {
    const { userId } = req.params;
    const personalData = req.body;

    // Validate request body
    const validation = personalDetailsSchema.safeParse(personalData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Additional validation: If city is provided, validate it against the state
    if (validation.data.city && validation.data.state) {
      const isValidCity = await validateCityInState(validation.data.state, validation.data.city);
      if (!isValidCity) {
        throw new BadRequestError(`City "${validation.data.city}" is not valid for state "${validation.data.state}"`);
      }
    }

    // Additional validation: If state is provided, validate it exists
    if (validation.data.state) {
      const states = await getAllStates();
      if (!states.includes(validation.data.state)) {
        throw new BadRequestError(`Invalid state: "${validation.data.state}"`);
      }
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        personal_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if personal details exist
    if (!targetUser.personal_details) {
      throw new BadRequestError('Personal details do not exist. Use POST to create first.');
    }

    // Check authorization
    if (!this.canModifyPersonalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s personal details');
    }

    // Update personal details
    const personalDetails = await prisma.userPersonalDetails.update({
      where: { user_id: userId },
      data: validation.data
    });

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Updated personal details for user ${userId}`,
      ipAddress
    );

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    logger.info('Personal details updated', {
      userId: userId,
      updatedBy: req.user.userId,
      fieldsUpdated: Object.keys(validation.data)
    });

    res.status(200).json({
      success: true,
      message: 'Personal details updated successfully',
      data: personalDetails
    });
  }

  /**
   * Get Personal Details with User Info
   * GET /users/:userId/personal
   */
  async getPersonalDetails(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        personal_details: true,
        caste_details: {
          include: {
            religion: true,
            caste: true,
            sub_caste: true
          }
        },
        education_details: true,
        professional_details: true,
        family_details: true,
        horoscope_details: true,
        photos: {
          where: { is_approved: true },
          select: {
            id: true,
            photo_url: true,
            visibility: true,
            uploaded_at: true
          }
        },
        partner_preferences: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user can view this profile
    // Basic privacy check - users can view their own profile
    // Admin can view full details of any user
    const canViewFull = req.user.userId === userId || req.user.role === 'ADMIN';

    // Calculate profile completion
    const profileCompletion = this.calculateProfileCompletion(user);

    // Format response with readable enum values
    const response = {
      // Basic user info
      user_info: {
        id: user.id,
        full_name: user.full_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        age: Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)),
        mobile_number: canViewFull ? user.mobile_number : undefined,
        email: canViewFull ? user.email : undefined,
        profile_created_by: user.profile_created_by,
        is_mobile_verified: user.is_mobile_verified,
        is_email_verified: user.is_email_verified,
        is_profile_verified: user.is_profile_verified,
        is_active: user.is_active,
        created_at: user.created_at
      },

      // Personal details
      personal_details: user.personal_details ? {
        height_cm: user.personal_details.height_cm,
        height_display: user.personal_details.height_cm 
          ? `${Math.floor(user.personal_details.height_cm / 30.48)} ft ${Math.round((user.personal_details.height_cm % 30.48) / 2.54)} in (${user.personal_details.height_cm} cm)`
          : null,
        weight_kg: user.personal_details.weight_kg,
        marital_status: user.personal_details.marital_status,
        physical_status: user.personal_details.physical_status,
        mother_tongue: user.personal_details.mother_tongue,
        complexion: user.personal_details.complexion,
        state: user.personal_details.state,
        city: user.personal_details.city,
        body_type: user.personal_details.body_type,
        blood_group: user.personal_details.blood_group,
        diet_preference: user.personal_details.diet_preference,
        drinking_habit: user.personal_details.drinking_habit,
        smoking_habit: user.personal_details.smoking_habit,
        about_me: user.personal_details.about_me,
        created_at: user.personal_details.created_at,
        updated_at: user.personal_details.updated_at
      } : null,

      // Profile completion
      profile_completion: {
        percentage: profileCompletion,
        status: profileCompletion === 100 ? 'Complete' : 
                profileCompletion >= 80 ? 'Almost Complete' :
                profileCompletion >= 50 ? 'In Progress' : 'Just Started'
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });
  }

  /**
   * Get Profile Completion Percentage (FAST - Dashboard)
   * GET /users/:userId/completion-percentage
   * 
   * Optimized endpoint for dashboard - returns ONLY cached percentage
   * Uses database cache for 3-4x faster response (50-80ms vs 200-300ms)
   */
  async getCompletionPercentage(req, res) {
    const { userId } = req.params;

    // Only user themselves or admins can view
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view this information');
    }

    // Get cached percentage (ultra-fast - single SELECT query)
    const percentage = await getProfileCompletionPercentage(userId);

    res.status(200).json({
      success: true,
      message: 'Profile completion percentage retrieved successfully',
      data: {
        completion_percentage: percentage,
        status: percentage === 100 ? 'Complete' : 
                percentage >= 80 ? 'Almost Complete' :
                percentage >= 50 ? 'In Progress' : 'Just Started'
      }
    });
  }

  /**
   * Get Profile Completion Status
   * GET /users/:userId/profile-completion
   */
  async getProfileCompletion(req, res) {
    const { userId } = req.params;

    // Check if user exists
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
      throw new NotFoundError('User not found');
    }

    // Only user themselves or admins can view completion details
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view this information');
    }

    const profileCompletion = this.calculateProfileCompletion(user);

    // Detailed breakdown
    const breakdown = {
      basic_info: {
        completed: !!(user.full_name && user.gender && user.date_of_birth && user.mobile_number),
        fields: {
          full_name: !!user.full_name,
          gender: !!user.gender,
          date_of_birth: !!user.date_of_birth,
          mobile_number: !!user.mobile_number,
          email: !!user.email
        }
      },
      personal_details: {
        completed: !!user.personal_details,
        fields_filled: user.personal_details ? 
          Object.keys(user.personal_details).filter(key => 
            user.personal_details[key] !== null && 
            user.personal_details[key] !== undefined &&
            !['user_id', 'created_at', 'updated_at'].includes(key)
          ).length : 0,
        total_fields: 12
      },
      caste_details: {
        completed: !!(user.caste_details?.religion_id && user.caste_details?.caste_id)
      },
      education_details: {
        completed: user.education_details && user.education_details.length > 0
      },
      professional_details: {
        completed: !!user.professional_details
      },
      family_details: {
        completed: !!user.family_details
      },
      horoscope_details: {
        completed: !!user.horoscope_details
      },
      photos: {
        completed: user.photos && user.photos.length > 0,
        count: user.photos ? user.photos.length : 0
      },
      partner_preferences: {
        completed: !!user.partner_preferences
      }
    };

    res.status(200).json({
      success: true,
      data: {
        overall_completion: profileCompletion,
        status: profileCompletion === 100 ? 'Complete' : 
                profileCompletion >= 80 ? 'Almost Complete' :
                profileCompletion >= 50 ? 'In Progress' : 'Just Started',
        breakdown: breakdown,
        next_steps: this.getNextSteps(breakdown)
      }
    });
  }

  /**
   * Get suggested next steps for profile completion
   * @param {Object} breakdown - Profile completion breakdown
   * @returns {Array} - Array of suggested next steps
   */
  getNextSteps(breakdown) {
    const steps = [];

    if (!breakdown.personal_details.completed) {
      steps.push('Complete your personal details (height, weight, etc.)');
    }
    if (!breakdown.caste_details.completed) {
      steps.push('Add your caste and religious details');
    }
    if (!breakdown.education_details.completed) {
      steps.push('Add your education qualifications');
    }
    if (!breakdown.professional_details.completed) {
      steps.push('Add your professional details');
    }
    if (!breakdown.photos.completed) {
      steps.push('Upload your profile photos');
    }
    if (!breakdown.partner_preferences.completed) {
      steps.push('Set your partner preferences');
    }
    if (!breakdown.family_details.completed) {
      steps.push('Add your family details');
    }

    return steps.slice(0, 3); // Return top 3 suggestions
  }

  // ============================================
  // CASTE DETAILS CRUD (Phase 2 - Task 2.2)
  // ============================================

  /**
   * Create Caste Details (POST only)
   * POST /users/:userId/caste
   */
  async createCasteDetails(req, res) {
    const { userId } = req.params;
    const casteData = req.body;

    // Validate request body
    const validation = casteDetailsSchema.safeParse(casteData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        caste_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if caste details already exist
    if (targetUser.caste_details) {
      throw new BadRequestError('Caste details already exist. Use PUT to update.');
    }

    // Check authorization
    if (!this.canModifyPersonalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s caste details');
    }

    // Validate hierarchical relationships and active status
    await this.validateCasteHierarchy(validation.data);

    // Create caste details
    const casteDetails = await prisma.userCasteDetails.create({
      data: {
        user_id: userId,
        ...validation.data
      }
    });

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Created caste details for user ${userId}`,
      ipAddress
    );

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    logger.info('Caste details created', {
      userId: userId,
      createdBy: req.user.userId,
      fieldsCreated: Object.keys(validation.data)
    });

    res.status(201).json({
      success: true,
      message: 'Caste details created successfully',
      data: casteDetails
    });
  }

  /**
   * Update Caste Details (PUT only)
   * PUT /users/:userId/caste
   */
  async updateCasteDetails(req, res) {
    const { userId } = req.params;
    const casteData = req.body;

    // Validate request body
    const validation = casteDetailsSchema.safeParse(casteData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists and get current caste details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        caste_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if caste details exist
    if (!targetUser.caste_details) {
      throw new BadRequestError('Caste details do not exist. Use POST to create first.');
    }

    // Check authorization
    if (!this.canModifyPersonalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s caste details');
    }

    const currentCasteDetails = targetUser.caste_details;
    let updateData = { ...validation.data };
    let customMessage = 'Caste details updated successfully';

    // Check if religion is being changed
    if (validation.data.religion_id && validation.data.religion_id !== currentCasteDetails.religion_id) {
      // Religion is changing - auto-clear caste and sub_caste
      updateData.caste_id = null;
      updateData.sub_caste_id = null;
      customMessage = 'Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.';
      
      // Validate only religion
      await this.validateReligionExists(validation.data.religion_id);
    } else {
      // Religion not changing - validate caste belongs to current religion
      const religionId = validation.data.religion_id || currentCasteDetails.religion_id;
      const casteId = validation.data.caste_id !== undefined ? validation.data.caste_id : currentCasteDetails.caste_id;
      
      // If caste_id is being updated and user has existing sub_caste_id, validate compatibility
      if (validation.data.caste_id !== undefined && 
          currentCasteDetails.sub_caste_id && 
          validation.data.sub_caste_id === undefined) {
        // User is updating caste but not providing new sub_caste
        // Check if existing sub_caste belongs to the new caste
        const existingSubCaste = await prisma.subCaste.findUnique({
          where: { id: currentCasteDetails.sub_caste_id }
        });
        
        if (existingSubCaste && existingSubCaste.caste_id !== validation.data.caste_id) {
          // Auto-clear sub_caste when changing caste
          updateData.sub_caste_id = null;
          customMessage = 'Caste updated. Sub-caste has been reset as it does not belong to the new caste. Please select sub-caste again.';
        }
      }
      
      // Validate hierarchical relationships with current religion
      await this.validateCasteHierarchy({
        religion_id: religionId,
        caste_id: casteId,
        sub_caste_id: validation.data.sub_caste_id
      }, currentCasteDetails);
    }

    // Update caste details
    const casteDetails = await prisma.userCasteDetails.update({
      where: { user_id: userId },
      data: updateData
    });

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Updated caste details for user ${userId}`,
      ipAddress
    );

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    logger.info('Caste details updated', {
      userId: userId,
      updatedBy: req.user.userId,
      fieldsUpdated: Object.keys(updateData)
    });

    res.status(200).json({
      success: true,
      message: customMessage,
      data: casteDetails
    });
  }

  /**
   * Get Caste Details with User Info
   * GET /users/:userId/caste
   */
  async getCasteDetails(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        caste_details: {
          include: {
            religion: true,
            caste: true,
            sub_caste: true
          }
        },
        personal_details: true,
        education_details: true,
        professional_details: true,
        family_details: true,
        horoscope_details: true,
        photos: {
          where: { is_approved: true },
          select: {
            id: true,
            photo_url: true,
            visibility: true,
            uploaded_at: true
          }
        },
        partner_preferences: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user can view this profile
    const canViewFull = req.user.userId === userId || req.user.role === 'ADMIN';

    // Calculate profile completion
    const profileCompletion = this.calculateProfileCompletion(user);

    // Format response with readable values
    const response = {
      // Basic user info
      user_info: {
        id: user.id,
        full_name: user.full_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        age: Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)),
        mobile_number: canViewFull ? user.mobile_number : undefined,
        email: canViewFull ? user.email : undefined,
        profile_created_by: user.profile_created_by,
        is_mobile_verified: user.is_mobile_verified,
        is_email_verified: user.is_email_verified,
        is_profile_verified: user.is_profile_verified,
        is_active: user.is_active,
        created_at: user.created_at
      },

      // Caste details with full names
      caste_details: user.caste_details ? {
        religion_id: user.caste_details.religion_id,
        religion_name: user.caste_details.religion?.religion_name || null,
        caste_id: user.caste_details.caste_id,
        caste_name: user.caste_details.caste?.caste_name || null,
        sub_caste_id: user.caste_details.sub_caste_id,
        sub_caste_name: user.caste_details.sub_caste?.sub_caste_name || null,
        community_details: user.caste_details.community_details
      } : null,

      // Profile completion
      profile_completion: {
        percentage: profileCompletion,
        status: profileCompletion === 100 ? 'Complete' : 
                profileCompletion >= 80 ? 'Almost Complete' :
                profileCompletion >= 50 ? 'In Progress' : 'Just Started'
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });
  }

  /**
   * Validate caste hierarchy and active status
   * @param {Object} data - Caste data to validate
   * @param {Object} existingData - Existing caste details (for updates)
   */
  async validateCasteHierarchy(data, existingData = null) {
    const { religion_id, caste_id, sub_caste_id } = data;

    // If religion_id is provided, validate it
    if (religion_id) {
      await this.validateReligionExists(religion_id);
    }

    // If caste_id is provided, validate it
    if (caste_id) {
      const currentReligionId = religion_id || existingData?.religion_id;
      
      if (!currentReligionId) {
        throw new BadRequestError('Religion must be set before selecting a caste');
      }

      const caste = await prisma.caste.findUnique({
        where: { id: caste_id },
        include: { religion: true }
      });

      if (!caste) {
        throw new NotFoundError('Selected caste not found');
      }

      if (!caste.is_active) {
        throw new BadRequestError('Selected caste is no longer active. Please choose another.');
      }

      if (caste.religion_id !== currentReligionId) {
        throw new BadRequestError('Selected caste does not belong to your current religion.');
      }
    }

    // If sub_caste_id is provided, validate it
    if (sub_caste_id) {
      // Use the caste_id from the update data, or fall back to existing
      const currentCasteId = caste_id !== undefined ? caste_id : existingData?.caste_id;
      
      if (!currentCasteId) {
        throw new BadRequestError('Caste must be set before selecting a sub-caste');
      }

      const subCaste = await prisma.subCaste.findUnique({
        where: { id: sub_caste_id }
      });

      if (!subCaste) {
        throw new NotFoundError('Selected sub-caste not found');
      }

      if (!subCaste.is_active) {
        throw new BadRequestError('Selected sub-caste is no longer active. Please choose another.');
      }

      if (subCaste.caste_id !== currentCasteId) {
        throw new BadRequestError('Selected sub-caste does not belong to your current caste.');
      }
    }
  }

  /**
   * Validate religion exists and is active
   * @param {number} religionId 
   */
  async validateReligionExists(religionId) {
    const religion = await prisma.religion.findUnique({
      where: { id: religionId }
    });

    if (!religion) {
      throw new NotFoundError('Selected religion not found');
    }

    if (!religion.is_active) {
      throw new BadRequestError('Selected religion is no longer active. Please choose another.');
    }
  }

  // ============================================
  // EDUCATION DETAILS CRUD (Phase 2 - Task 2.3)
  // ============================================

  /**
   * Check if requester has permission to modify user's education details
   * @param {Object} requester - The user making the request (from JWT)
   * @param {string} targetUserId - The user ID whose details are being modified
   * @returns {boolean} - True if authorized
   */
  canModifyEducation(requester, targetUserId) {
    // User can modify their own education
    console.log("uid-req",requester.userId)
    console.log("uid-tar",targetUserId)
    if (requester.userId === targetUserId) {
      return true;
    }

    // Only Admin can modify other user's education (NOT Moderator)
    if (requester.role === 'ADMIN') {
      return true;
    }
    
    return false;
  }

  /**
   * Validate year of passing is within acceptable range
   * @param {number} year - Year of passing
   * @param {Date} dateOfBirth - User's date of birth
   * @returns {boolean} - True if valid
   */
  validateYearOfPassing(year, dateOfBirth) {
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(dateOfBirth).getFullYear();
    const minYear = birthYear + 15; // User must be at least 15 when graduating
    const maxYear = currentYear + 5; // Allow up to 5 years in future (expected graduation)

    if (year < minYear) {
      throw new BadRequestError(
        `Year of passing cannot be before ${minYear} (15 years after birth year ${birthYear})`
      );
    }

    if (year > maxYear) {
      throw new BadRequestError(
        `Year of passing cannot be after ${maxYear} (current year + 5)`
      );
    }

    return true;
  }

  /**
   * Calculate and update highest qualification in users table (cached field)
   * This is called after create/update/delete education operations
   * 
   * Qualification ranking (highest to lowest):
   * - PhD/Doctorate > Master's/PG > Bachelor's/UG > Diploma/Certificate
   * 
   * @param {string} userId - User ID
   */
  async updateHighestQualification(userId) {
    try {
      // Get all education entries for user
      const educationEntries = await prisma.userEducationDetails.findMany({
        where: { user_id: userId },
        select: { qualification: true }
      });

      if (educationEntries.length === 0) {
        // No education entries, set to null
        await prisma.user.update({
          where: { id: userId },
          data: { highest_qualification: null }
        });
        return;
      }

      // Define qualification hierarchy based on EducationLevel enum
      // Higher rank = higher education
      const qualificationRanks = {
        'Doctorate/PhD': 100,
        "Master's Degree": 90,
        "Bachelor's Degree": 80,
        'Professional Degree': 75,
        'Diploma': 70,
        'High School': 60
      };

      // Find highest ranked qualification
      let highestQual = educationEntries[0].qualification;
      let highestRank = qualificationRanks[highestQual] || 0;

      for (const entry of educationEntries) {
        const rank = qualificationRanks[entry.qualification] || 0;
        
        if (rank > highestRank) {
          highestRank = rank;
          highestQual = entry.qualification;
        }
      }

      // Update users table with highest qualification
      await prisma.user.update({
        where: { id: userId },
        data: { highest_qualification: highestQual }
      });

      logger.info('Highest qualification updated', {
        userId,
        highestQualification: highestQual
      });
    } catch (error) {
      // Log error but don't throw - cache update failure shouldn't break main operation
      logger.error('Failed to update highest qualification cache', {
        error: error.message,
        userId
      });
    }
  }

  /**
   * Check for duplicate education entry
   * @param {string} userId - User ID
   * @param {string} qualification - Qualification name
   * @param {string} institution - Institution name
   * @param {number} year - Year of passing
   * @param {number} excludeId - Education ID to exclude (for updates)
   * @returns {Promise<boolean>} - True if duplicate exists
   */
  async checkDuplicateEducation(userId, qualification, institution, year, excludeId = null) {
    const whereClause = {
      user_id: userId,
      qualification: qualification,
      institution_name: institution,
      year_of_passing: year
    };

    if (excludeId) {
      whereClause.NOT = { id: excludeId };
    }

    const duplicate = await prisma.userEducationDetails.findFirst({
      where: whereClause
    });

    return duplicate !== null;
  }

  /**
   * Create Education Entry
   * POST /users/:userId/education
   */
  async createEducation(req, res) {
    const { userId } = req.params;
    const educationData = req.body;

    // Validate request body
    const validation = educationDetailsCreateSchema.safeParse(educationData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        date_of_birth: true,
        education_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check authorization
    console.log("req-user",req.user)
    if (!this.canModifyEducation(req.user, userId)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s education details');
    }

    // Check maximum entries limit
    if (targetUser.education_details.length >= MAX_EDUCATION_ENTRIES) {
      throw new BadRequestError(
        `Maximum ${MAX_EDUCATION_ENTRIES} education entries allowed per user`
      );
    }

    const { qualification, institution_name, year_of_passing } = validation.data;

    // Validate year of passing
    this.validateYearOfPassing(year_of_passing, targetUser.date_of_birth);

    // Check for duplicate entry
    const isDuplicate = await this.checkDuplicateEducation(
      userId,
      qualification,
      institution_name,
      year_of_passing
    );

    if (isDuplicate) {
      throw new BadRequestError(
        'Duplicate education entry. This qualification, institution, and year combination already exists.'
      );
    }

    // Create education entry
    const education = await prisma.userEducationDetails.create({
      data: {
        user_id: userId,
        qualification,
        institution_name,
        year_of_passing
      }
    });

    // Update highest qualification cache in users table
    await this.updateHighestQualification(userId);

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Created education entry (ID: ${education.id}) for user ${userId}`,
      ipAddress
    );

    logger.info('Education entry created', {
      userId: userId,
      educationId: education.id,
      createdBy: req.user.userId,
      qualification: qualification
    });

    res.status(201).json({
      success: true,
      message: 'Education entry created successfully',
      data: education
    });
  }

  /**
   * Update Education Entry
   * PUT /users/:userId/education/:eduId
   */
  async updateEducation(req, res) {
    const { userId, eduId } = req.params;
    const educationData = req.body;

    // Validate request body
    const validation = educationDetailsUpdateSchema.safeParse(educationData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        date_of_birth: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check authorization
    if (!this.canModifyEducation(req.user, userId)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s education details');
    }

    // Check if education entry exists and belongs to the user
    const existingEducation = await prisma.userEducationDetails.findUnique({
      where: { id: parseInt(eduId) }
    });

    if (!existingEducation) {
      throw new NotFoundError('Education entry not found');
    }

    if (existingEducation.user_id !== userId) {
      throw new ForbiddenError('This education entry does not belong to the specified user');
    }

    // Validate year of passing if provided
    if (validation.data.year_of_passing) {
      this.validateYearOfPassing(validation.data.year_of_passing, targetUser.date_of_birth);
    }

    // Check for duplicate entry (if qualification, institution, or year is being changed)
    if (validation.data.qualification || 
        validation.data.institution_name || 
        validation.data.year_of_passing) {
      
      const finalQualification = validation.data.qualification || existingEducation.qualification;
      const finalInstitution = validation.data.institution_name || existingEducation.institution_name;
      const finalYear = validation.data.year_of_passing || existingEducation.year_of_passing;

      const isDuplicate = await this.checkDuplicateEducation(
        userId,
        finalQualification,
        finalInstitution,
        finalYear,
        parseInt(eduId) // Exclude current entry from duplicate check
      );

      if (isDuplicate) {
        throw new BadRequestError(
          'Duplicate education entry. This qualification, institution, and year combination already exists.'
        );
      }
    }

    // Update education entry
    const updatedEducation = await prisma.userEducationDetails.update({
      where: { id: parseInt(eduId) },
      data: validation.data
    });

    // Update highest qualification cache in users table
    await this.updateHighestQualification(userId);

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Updated education entry (ID: ${eduId}) for user ${userId}`,
      ipAddress
    );

    logger.info('Education entry updated', {
      userId: userId,
      educationId: eduId,
      updatedBy: req.user.userId,
      fieldsUpdated: Object.keys(validation.data)
    });

    res.status(200).json({
      success: true,
      message: 'Education entry updated successfully',
      data: updatedEducation
    });
  }

  /**
   * Delete Education Entry
   * DELETE /users/:userId/education/:eduId
   */
  async deleteEducation(req, res) {
    const { userId, eduId } = req.params;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check authorization
    if (!this.canModifyEducation(req.user, userId)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s education details');
    }

    // Check if education entry exists and belongs to the user
    const existingEducation = await prisma.userEducationDetails.findUnique({
      where: { id: parseInt(eduId) }
    });

    if (!existingEducation) {
      throw new NotFoundError('Education entry not found');
    }

    if (existingEducation.user_id !== userId) {
      throw new ForbiddenError('This education entry does not belong to the specified user');
    }

    // Delete education entry
    await prisma.userEducationDetails.delete({
      where: { id: parseInt(eduId) }
    });

    // Update highest qualification cache in users table
    await this.updateHighestQualification(userId);

    // Update profile completion cache
    await this.updateProfileCompletionCache(userId);

    // Create audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createAuditLog(
      req.user.userId,
      `Deleted education entry (ID: ${eduId}) for user ${userId}`,
      ipAddress
    );

    logger.info('Education entry deleted', {
      userId: userId,
      educationId: eduId,
      deletedBy: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Education entry deleted successfully'
    });
  }

  /**
   * Get All Education Entries
   * GET /users/:userId/education
   */
  async getAllEducation(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get all education entries for the user
    // Sort by year_of_passing DESC (most recent first)
    const educationEntries = await prisma.userEducationDetails.findMany({
      where: { user_id: userId },
      orderBy: { year_of_passing: 'desc' }
    });

    logger.info('Education entries retrieved', {
      userId: userId,
      count: educationEntries.length,
      requestedBy: req.user?.userId || 'public'
    });

    res.status(200).json({
      success: true,
      count: educationEntries.length,
      data: educationEntries
    });
  }

  // ============================================
  // PROFESSIONAL DETAILS CRUD (Phase 2 - Task 2.4)
  // ============================================

  /**
   * Check if requester has permission to modify user's professional details
   * Authorization: Self + Admin only (NO Moderator)
   * @param {Object} requester - The user making the request (from JWT)
   * @param {Object} targetUser - The user whose details are being modified
   * @returns {boolean} - True if authorized
   */
  canModifyProfessionalDetails(requester, targetUser) {
    // User can modify their own details
    if (requester.userId === targetUser.id) {
      return true;
    }

    // Admin can modify any user's details
    if (requester.role === 'Admin') {
      return true;
    }

    // Moderator CANNOT modify professional details (different from personal details)
    return false;
  }

  /**
   * Create Audit Log with enhanced structure for professional details
   * @param {String} actorId - User ID performing the action
   * @param {String} action - Action performed
   * @param {String} ipAddress - IP address of the request
   * @param {Object} changes - Optional changes object for detailed logging
   */
  async createProfessionalAuditLog(actorId, userId, action, ipAddress, changes = null) {
    const logEntry = {
      action: action,
      user_id: userId,
      performed_by: actorId,
      ip_address: ipAddress,
      timestamp: new Date().toISOString()
    };

    if (changes) {
      logEntry.changes = changes;
    }

    await prisma.auditLog.create({
      data: {
        actor_id: actorId,
        action: JSON.stringify(logEntry),
        ip_address: ipAddress
      }
    });
  }

  /**
   * Create Professional Details (POST /users/:userId/professional)
   * Fails if professional details already exist (409 Conflict)
   * All fields optional but recommended for profile completion
   */
  async createProfessionalDetails(req, res) {
    const { userId } = req.params;
    const professionalData = req.body;

    // Validate request body
    const validation = professionalDetailsCreateSchema.safeParse(professionalData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        professional_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if professional details already exist (Strict one-to-one)
    if (targetUser.professional_details) {
      throw new ConflictError('Professional details already exist. Use PUT or PATCH to update.');
    }

    // Check authorization (Self + Admin only)
    if (!this.canModifyProfessionalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s professional details');
    }

    // Create professional details
    const professionalDetails = await prisma.userProfessionalDetails.create({
      data: {
        user_id: userId,
        ...validation.data
      }
    });

    // Create enhanced audit log
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createProfessionalAuditLog(
      req.user.userId,
      userId,
      'PROFESSIONAL_DETAILS_CREATED',
      ipAddress,
      {
        created_fields: Object.keys(validation.data)
      }
    );

    // Update profile completion cache
    const profileCompletion = await this.updateProfileCompletionCache(userId);

    logger.info('Professional details created', {
      userId: userId,
      createdBy: req.user.userId,
      fieldsCreated: Object.keys(validation.data)
    });

    res.status(201).json({
      success: true,
      message: 'Professional details created successfully',
      data: {
        user: {
          id: userId,
          profile_completion: profileCompletion
        },
        professional_details: professionalDetails
      }
    });
  }

  /**
   * Update Professional Details - Full Replacement (PUT /users/:userId/professional)
   * Requires at least one field
   */
  async updateProfessionalDetails(req, res) {
    const { userId } = req.params;
    const professionalData = req.body;

    // Validate request body
    const validation = professionalDetailsUpdateSchema.safeParse(professionalData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        professional_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if professional details exist
    if (!targetUser.professional_details) {
      throw new NotFoundError('Professional details do not exist. Use POST to create first.');
    }

    // Check authorization (Self + Admin only)
    if (!this.canModifyProfessionalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s professional details');
    }

    // Capture before state for audit logging
    const beforeState = { ...targetUser.professional_details };

    // Update professional details
    const professionalDetails = await prisma.userProfessionalDetails.update({
      where: { user_id: userId },
      data: validation.data
    });

    // Create detailed audit log showing what changed
    const changes = {};
    Object.keys(validation.data).forEach(key => {
      if (beforeState[key] !== validation.data[key]) {
        changes[key] = {
          from: beforeState[key],
          to: validation.data[key]
        };
      }
    });

    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createProfessionalAuditLog(
      req.user.userId,
      userId,
      'PROFESSIONAL_DETAILS_UPDATED',
      ipAddress,
      changes
    );

    // Update profile completion cache
    const profileCompletion = await this.updateProfileCompletionCache(userId);

    logger.info('Professional details updated', {
      userId: userId,
      updatedBy: req.user.userId,
      fieldsUpdated: Object.keys(validation.data)
    });

    res.status(200).json({
      success: true,
      message: 'Professional details updated successfully',
      data: {
        user: {
          id: userId,
          profile_completion: profileCompletion
        },
        professional_details: professionalDetails
      }
    });
  }

  /**
   * Patch Professional Details - Partial Update (PATCH /users/:userId/professional)
   * Allows updating individual fields without full replacement
   */
  async patchProfessionalDetails(req, res) {
    const { userId } = req.params;
    const professionalData = req.body;

    // Validate request body (same schema as PUT)
    const validation = professionalDetailsPatchSchema.safeParse(professionalData);
    if (!validation.success) {
      const errorMessage = validation.error.errors && validation.error.errors.length > 0
        ? validation.error.errors.map(e => e.message).join(', ')
        : validation.error.message || 'Validation failed';
      throw new BadRequestError(errorMessage);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        professional_details: true
      }
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check if professional details exist
    if (!targetUser.professional_details) {
      throw new NotFoundError('Professional details do not exist. Use POST to create first.');
    }

    // Check authorization (Self + Admin only)
    if (!this.canModifyProfessionalDetails(req.user, targetUser)) {
      throw new ForbiddenError('You do not have permission to modify this user\'s professional details');
    }

    // Capture before state for audit logging
    const beforeState = { ...targetUser.professional_details };

    // Update only provided fields
    const professionalDetails = await prisma.userProfessionalDetails.update({
      where: { user_id: userId },
      data: validation.data
    });

    // Create detailed audit log showing what changed
    const changes = {};
    Object.keys(validation.data).forEach(key => {
      if (beforeState[key] !== validation.data[key]) {
        changes[key] = {
          from: beforeState[key],
          to: validation.data[key]
        };
      }
    });

    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.createProfessionalAuditLog(
      req.user.userId,
      userId,
      'PROFESSIONAL_DETAILS_PATCHED',
      ipAddress,
      changes
    );

    // Update profile completion cache
    const profileCompletion = await this.updateProfileCompletionCache(userId);

    logger.info('Professional details patched', {
      userId: userId,
      patchedBy: req.user.userId,
      fieldsPatched: Object.keys(validation.data)
    });

    res.status(200).json({
      success: true,
      message: 'Professional details updated successfully',
      data: {
        user: {
          id: userId,
          profile_completion: profileCompletion
        },
        professional_details: professionalDetails
      }
    });
  }

  /**
   * Get Professional Details (GET /users/:userId/professional)
   * Authenticated access only - user must be logged in
   * Returns 404 if professional details don't exist
   */
  async getProfessionalDetails(req, res) {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professional_details: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if professional details exist
    if (!user.professional_details) {
      throw new NotFoundError('Professional details not found for this user');
    }

    logger.info('Professional details retrieved', {
      userId: userId,
      requestedBy: req.user.userId
    });

    // Calculate profile completion
    const userWithAllDetails = await prisma.user.findUnique({
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

    const profileCompletion = this.calculateProfileCompletion(userWithAllDetails);

    res.status(200).json({
      success: true,
      message: 'Professional details retrieved successfully',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          profile_completion: profileCompletion
        },
        professional_details: user.professional_details
      }
    });
  }

  // ============================================
  // COMPLETE PROFILE & VERIFICATION (Phase 2 - Task 2.10)
  // ============================================

  /**
   * Helper: Check if requester can view sensitive data
   * Sensitive data visible to: Self, Admin, Connected users (future feature)
   * @param {String} requesterId - User making the request
   * @param {String} targetUserId - Profile being viewed
   * @param {String} requesterRole - Role of requester (ADMIN, USER, etc.)
   * @returns {Boolean}
   */
  canViewSensitiveData(requesterId, targetUserId, requesterRole) {
    // User viewing their own profile
    if (requesterId === targetUserId) {
      return true;
    }

    // Admin can view all
    if (requesterRole === 'ADMIN') {
      return true;
    }

    // TODO: Add "connected users" check when connection/interest feature is implemented
    // For now, only self and admin can view sensitive data
    return false;
  }

  /**
   * Helper: Calculate verification status
   * Profile is verified when ALL three conditions are met:
   * - is_mobile_verified = true
   * - is_email_verified = true  
   * - is_profile_verified = true (admin approval)
   * 
   * @param {Object} user - User object
   * @returns {Object} - Verification status details
   */
  calculateVerificationStatus(user) {
    const isMobileVerified = user.is_mobile_verified || false;
    const isEmailVerified = user.is_email_verified || false;
    const isProfileVerified = user.is_profile_verified || false;

    const isFullyVerified = isMobileVerified && isEmailVerified && isProfileVerified;

    return {
      is_verified: isFullyVerified,
      mobile_verified: isMobileVerified,
      email_verified: isEmailVerified,
      profile_verified: isProfileVerified,
      verification_percentage: Math.round(
        ((isMobileVerified ? 1 : 0) + 
         (isEmailVerified ? 1 : 0) + 
         (isProfileVerified ? 1 : 0)) / 3 * 100
      ),
      pending_verifications: [
        !isMobileVerified ? 'mobile' : null,
        !isEmailVerified ? 'email' : null,
        !isProfileVerified ? 'profile_approval' : null
      ].filter(Boolean)
    };
  }

  /**
   * Helper: Calculate profile badges
   * @param {Object} user - User with all details
   * @param {Number} profileCompletion - Profile completion percentage
   * @param {Object} verificationStatus - Verification status
   * @returns {Array} - Array of badge objects
   */
  calculateProfileBadges(user, profileCompletion, verificationStatus) {
    const badges = [];
    const now = new Date();
    const accountAge = Math.floor((now - new Date(user.created_at)) / (1000 * 60 * 60 * 24)); // Days

    // Verified Profile Badge
    if (verificationStatus.is_verified) {
      badges.push({
        type: 'verified',
        label: 'Verified Profile',
        icon: '✓',
        color: 'blue'
      });
    }

    // Complete Profile Badge
    if (profileCompletion === 100) {
      badges.push({
        type: 'complete',
        label: 'Complete Profile',
        icon: '★',
        color: 'gold'
      });
    }

    // Recently Joined Badge (within 30 days)
    if (accountAge <= 30) {
      badges.push({
        type: 'new',
        label: 'Recently Joined',
        icon: '🆕',
        color: 'green'
      });
    }

    // Active User Badge (updated within 7 days)
    const daysSinceUpdate = Math.floor((now - new Date(user.updated_at)) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 7) {
      badges.push({
        type: 'active',
        label: 'Active User',
        icon: '🔥',
        color: 'orange'
      });
    }

    return badges;
  }

  /**
   * Helper: Calculate activity status
   * @param {Object} user - User object
   * @returns {Object} - Activity status details
   */
  calculateActivityStatus(user) {
    const now = new Date();
    const updatedAt = new Date(user.updated_at);
    const createdAt = new Date(user.created_at);

    const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    const accountAge = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    let activityLevel = 'inactive';
    if (daysSinceUpdate === 0) {
      activityLevel = 'very_active'; // Updated today
    } else if (daysSinceUpdate <= 3) {
      activityLevel = 'active'; // Updated within 3 days
    } else if (daysSinceUpdate <= 7) {
      activityLevel = 'moderately_active'; // Updated within a week
    } else if (daysSinceUpdate <= 30) {
      activityLevel = 'less_active'; // Updated within a month
    }

    return {
      last_active: user.updated_at,
      profile_last_updated: user.updated_at,
      account_age_days: accountAge,
      days_since_last_update: daysSinceUpdate,
      activity_level: activityLevel
    };
  }

  /**
   * Helper: Get profile readiness for matchmaking
   * @param {Number} profileCompletion - Profile completion percentage
   * @param {Object} verificationStatus - Verification status
   * @returns {Object} - Readiness details
   */
  getProfileReadiness(profileCompletion, verificationStatus) {
    const isReadyForMatching = profileCompletion >= 60 && verificationStatus.mobile_verified;
    const isComplete = profileCompletion === 100;

    let status = 'incomplete';
    let message = 'Your profile needs more information to start matching.';

    if (isComplete && verificationStatus.is_verified) {
      status = 'complete_verified';
      message = 'Your profile is complete and verified! You can start matching.';
    } else if (isComplete) {
      status = 'complete_unverified';
      message = 'Your profile is complete but pending verification.';
    } else if (isReadyForMatching) {
      status = 'ready';
      message = 'Your profile is ready for matching! Complete remaining fields for better matches.';
    } else if (profileCompletion >= 30) {
      status = 'in_progress';
      message = 'Keep going! Add more details to unlock matching.';
    }

    return {
      is_ready_for_matching: isReadyForMatching,
      is_complete: isComplete,
      status: status,
      message: message,
      minimum_completion_required: 60
    };
  }

  /**
   * Get Complete Profile
   * GET /users/:userId/profile
   * 
   * Authorization: Self, Any authenticated user, Admin
   * Returns comprehensive profile with all sections
   * Sensitive data filtered based on permissions
   */
  async getCompleteProfile(req, res) {
    const { userId } = req.params;

    // Fetch complete user profile with all relationships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        personal_details: true,
        caste_details: {
          include: {
            religion: true,
            caste: true,
            sub_caste: true
          }
        },
        education_details: {
          orderBy: { year_of_passing: 'desc' } // Latest first
        },
        professional_details: true,
        family_details: true,
        horoscope_details: true,
        photos: {
          where: { is_approved: true }, // Only approved photos
          orderBy: [
            { is_primary: 'desc' }, // Primary photo first
            { uploaded_at: 'desc' }  // Then by upload date
          ]
        },
        partner_preferences: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ForbiddenError('This profile is not active');
    }

    // Determine privacy level
    const canViewSensitive = this.canViewSensitiveData(
      req.user.userId,
      userId,
      req.user.role
    );

    // Get cached profile completion percentage
    const profileCompletion = await getProfileCompletionPercentage(userId);
    
    // Calculate other metrics
    const verificationStatus = this.calculateVerificationStatus(user);
    const activityStatus = this.calculateActivityStatus(user);
    const profileReadiness = this.getProfileReadiness(profileCompletion, verificationStatus);
    const badges = this.calculateProfileBadges(user, profileCompletion, verificationStatus);

    // Calculate age
    const age = Math.floor(
      (new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Format horoscope time_of_birth
    let formattedTimeOfBirth = null;
    if (user.horoscope_details?.time_of_birth) {
      const date = new Date(user.horoscope_details.time_of_birth);
      let hours = date.getUTCHours();
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      formattedTimeOfBirth = `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
    }

    // Build response with nested structure
    const response = {
      // Basic User Info
      basic_info: {
        id: user.id,
        full_name: user.full_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        age: age,
        profile_created_by: user.profile_created_by,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Sensitive data - filtered
        mobile_number: canViewSensitive ? user.mobile_number : null,
        email: canViewSensitive ? user.email : null
      },

      // Personal Details
      personal_details: user.personal_details ? {
        height_cm: user.personal_details.height_cm,
        height_display: user.personal_details.height_cm 
          ? `${Math.floor(user.personal_details.height_cm / 30.48)} ft ${Math.round((user.personal_details.height_cm % 30.48) / 2.54)} in (${user.personal_details.height_cm} cm)`
          : null,
        weight_kg: user.personal_details.weight_kg,
        marital_status: user.personal_details.marital_status,
        physical_status: user.personal_details.physical_status,
        mother_tongue: user.personal_details.mother_tongue,
        complexion: user.personal_details.complexion,
        body_type: user.personal_details.body_type,
        blood_group: user.personal_details.blood_group,
        diet_preference: user.personal_details.diet_preference,
        drinking_habit: user.personal_details.drinking_habit,
        smoking_habit: user.personal_details.smoking_habit,
        about_me: user.personal_details.about_me,
        // Location - show only state/city (not exact address)
        state: user.personal_details.state,
        city: user.personal_details.city,
        created_at: user.personal_details.created_at,
        updated_at: user.personal_details.updated_at
      } : null,

      // Caste Details
      caste_details: user.caste_details ? {
        religion_id: user.caste_details.religion_id,
        religion_name: user.caste_details.religion?.religion_name || null,
        caste_id: user.caste_details.caste_id,
        caste_name: user.caste_details.caste?.caste_name || null,
        sub_caste_id: user.caste_details.sub_caste_id,
        sub_caste_name: user.caste_details.sub_caste?.sub_caste_name || null,
        community_details: user.caste_details.community_details
      } : null,

      // Education Details (all entries, sorted by year desc)
      education_details: user.education_details.length > 0 ? user.education_details : null,

      // Professional Details
      professional_details: user.professional_details ? {
        occupation: user.professional_details.occupation,
        employment_type: user.professional_details.employment_type,
        company_name: user.professional_details.company_name,
        designation: user.professional_details.designation,
        years_of_experience: user.professional_details.years_of_experience,
        work_location: user.professional_details.work_location,
        // Sensitive: Income visible only to connected users
        annual_income_range: canViewSensitive ? user.professional_details.annual_income_range : null,
        created_at: user.professional_details.created_at,
        updated_at: user.professional_details.updated_at
      } : null,

      // Family Details - Sensitive (visible to connected users only)
      family_details: canViewSensitive && user.family_details ? {
        father_occupation: user.family_details.father_occupation,
        mother_occupation: user.family_details.mother_occupation,
        siblings_details: user.family_details.siblings_details,
        family_values: user.family_details.family_values
      } : null,

      // Horoscope Details
      horoscope_details: user.horoscope_details ? {
        rasi: user.horoscope_details.rasi,
        nakshatra: user.horoscope_details.nakshatra,
        time_of_birth: formattedTimeOfBirth,
        place_of_birth: user.horoscope_details.place_of_birth
      } : null,

      // Photos (only approved, with full metadata)
      photos: user.photos.length > 0 ? user.photos.map(photo => ({
        id: photo.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary,
        is_approved: photo.is_approved,
        visibility: photo.visibility,
        uploaded_at: photo.uploaded_at
      })) : [],

      // Partner Preferences
      partner_preferences: user.partner_preferences ? {
        min_age: user.partner_preferences.min_age,
        max_age: user.partner_preferences.max_age,
        min_height: user.partner_preferences.min_height,
        max_height: user.partner_preferences.max_height,
        min_weight: user.partner_preferences.min_weight,
        max_weight: user.partner_preferences.max_weight,
        religion_preference: user.partner_preferences.religion_preference,
        caste_preference: user.partner_preferences.caste_preference,
        education_preference: user.partner_preferences.education_preference,
        employment_type_preference: user.partner_preferences.employment_type_preference,
        income_preference_min: user.partner_preferences.income_preference_min,
        income_preference_max: user.partner_preferences.income_preference_max,
        marital_status_preference: user.partner_preferences.marital_status_preference,
        mother_tongue_preference: user.partner_preferences.mother_tongue_preference,
        diet_preference: user.partner_preferences.diet_preference,
        drinking_habit_preference: user.partner_preferences.drinking_habit_preference,
        smoking_habit_preference: user.partner_preferences.smoking_habit_preference,
        physical_status: user.partner_preferences.physical_status,
        preferred_location: user.partner_preferences.preferred_location,
        created_at: user.partner_preferences.created_at,
        updated_at: user.partner_preferences.updated_at
      } : null,

      // Profile Completion
      profile_completion: {
        percentage: profileCompletion,
        status: profileCompletion === 100 ? 'Complete' : 
                profileCompletion >= 80 ? 'Almost Complete' :
                profileCompletion >= 50 ? 'In Progress' : 'Just Started',
        readiness: profileReadiness
      },

      // Verification Status
      verification_status: verificationStatus,

      // Activity Status
      activity_status: activityStatus,

      // Profile Badges
      badges: badges
    };

    logger.info('Complete profile retrieved', {
      userId: userId,
      requestedBy: req.user.userId,
      canViewSensitive: canViewSensitive,
      profileCompletion: profileCompletion
    });

    res.status(200).json({
      success: true,
      message: 'Complete profile retrieved successfully',
      data: response
    });
  }

  /**
   * Get Verification Status
   * GET /users/:userId/verification-status
   * 
   * Authorization: Self, Admin
   * Returns detailed verification status breakdown
   */
  async getVerificationStatus(req, res) {
    const { userId } = req.params;

    // Check authorization - only self or admin
    if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to view verification status');
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        is_mobile_verified: true,
        is_email_verified: true,
        is_profile_verified: true,
        mobile_number: true,
        email: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const verificationStatus = this.calculateVerificationStatus(user);

    // Add detailed information
    const detailedStatus = {
      ...verificationStatus,
      user_info: {
        id: user.id,
        full_name: user.full_name,
        mobile_number: user.mobile_number,
        email: user.email || 'Not provided'
      },
      verification_steps: [
        {
          step: 'mobile',
          label: 'Mobile Verification',
          status: user.is_mobile_verified ? 'verified' : 'pending',
          verified_at: null, // TODO: Add verified_at timestamp field to schema
          description: 'Verify your mobile number via OTP'
        },
        {
          step: 'email',
          label: 'Email Verification',
          status: user.is_email_verified ? 'verified' : 'pending',
          verified_at: null,
          description: user.email ? 'Verify your email address via link' : 'Add email first, then verify'
        },
        {
          step: 'profile',
          label: 'Profile Verification',
          status: user.is_profile_verified ? 'verified' : 'pending',
          verified_at: null,
          description: 'Admin will review and verify your profile'
        }
      ],
      next_steps: verificationStatus.pending_verifications.map(verification => {
        if (verification === 'mobile') {
          return 'Verify your mobile number by requesting OTP';
        } else if (verification === 'email') {
          return user.email ? 'Verify your email address' : 'Add email and verify it';
        } else if (verification === 'profile_approval') {
          return 'Wait for admin to review and verify your profile';
        }
        return '';
      }).filter(Boolean)
    };

    logger.info('Verification status retrieved', {
      userId: userId,
      requestedBy: req.user.userId,
      isVerified: verificationStatus.is_verified
    });

    res.status(200).json({
      success: true,
      message: 'Verification status retrieved successfully',
      data: detailedStatus
    });
  }
}

// Export single instance
const userProfileController = new UserProfileController();
export default userProfileController;
