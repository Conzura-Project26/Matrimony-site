import prisma from '../config/prisma.js';
import { 
  personalDetailsSchema, 
  casteDetailsSchema,
  educationDetailsCreateSchema,
  educationDetailsUpdateSchema,
  MAX_EDUCATION_ENTRIES
} from '../utils/validation.js';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  ForbiddenError 
} from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * User Profile Controller
 * Handles personal details CRUD operations
 * Phase 2 - Task 2.1: Personal Details CRUD
 */
class UserProfileController {
  /**
   * Calculate profile completion percentage
   * @param {Object} user - User object with all details
   * @returns {number} - Completion percentage (0-100)
   */
  calculateProfileCompletion(user) {
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

    // Professional details - 10 points
    if (user.professional_details) {
      const professionalFields = [
        user.professional_details.occupation,
        user.professional_details.employment_type,
        user.professional_details.annual_income_range
      ];
      const professionalFilledCount = professionalFields.filter(field => field !== null && field !== undefined).length;
      sections.professional = (professionalFilledCount / professionalFields.length) * 10;
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

      // Define qualification hierarchy (higher rank = higher education)
      const qualificationRanks = {
        // Doctorate level
        'phd': 100, 'ph.d': 100, 'doctorate': 100, 'doctor of philosophy': 100,
        
        // Master's level
        'master': 90, 'masters': 90, 'msc': 90, 'mba': 90, 'mtech': 90, 'm.tech': 90,
        'ma': 90, 'm.a': 90, 'mca': 90, 'mcom': 90, 'm.com': 90,
        'post graduate': 90, 'postgraduate': 90, 'pg': 90,
        
        // Bachelor's level
        'bachelor': 80, 'bachelors': 80, 'btech': 80, 'b.tech': 80, 'be': 80, 'b.e': 80,
        'bsc': 80, 'b.sc': 80, 'ba': 80, 'b.a': 80, 'bca': 80, 'bcom': 80, 'b.com': 80,
        'graduate': 80, 'ug': 80, 'under graduate': 80, 'undergraduate': 80,
        
        // Diploma level
        'diploma': 70, 'certificate': 60,
        
        // School level
        'high school': 50, 'higher secondary': 50, '12th': 50, 'intermediate': 50
      };

      // Find highest ranked qualification
      let highestQual = educationEntries[0].qualification;
      let highestRank = 0;

      for (const entry of educationEntries) {
        const qual = entry.qualification.toLowerCase();
        
        // Check each keyword in the qualification string
        for (const [keyword, rank] of Object.entries(qualificationRanks)) {
          if (qual.includes(keyword) && rank > highestRank) {
            highestRank = rank;
            highestQual = entry.qualification;
          }
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
}

// Export single instance
const userProfileController = new UserProfileController();
export default userProfileController;
