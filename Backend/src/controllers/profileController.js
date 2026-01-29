import prisma from '../config/prisma.js';
import {
  createFamilyDetailsSchema,
  updateFamilyDetailsSchema,
} from '../utils/validation.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors.js';
import { logAPI, logDatabase } from '../utils/logUtils.js';

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
}

export default new ProfileController();
