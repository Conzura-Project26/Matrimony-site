/**
 * Photo Controller
 * Handles all photo management operations for users
 * 
 * Features:
 * - Upload photos (max 5 per user)
 * - Delete photos (own photos or admin/moderator)
 * - Get user photos
 * - Set primary/profile photo
 * - Photo approval workflow for moderators
 */

import prisma from '../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import logger from '../config/logger.js';
import { UTApi } from 'uploadthing/server';
import { updateProfileCompletionCache } from '../utils/profileCompletion.js';

// Initialize UploadThing API client for file deletion
const utapi = new UTApi();

/**
 * Upload Photo
 * POST /users/:userId/photos
 * 
 * @description User uploads a new photo (max 5 photos)
 * @access Private - User (own profile)
 */
export const uploadPhoto = async (req, res) => {
  const { userId } = req.params;
  const { fileUrl, visibility = 'PUBLIC' } = req.body;

  // Verify userId matches authenticated user (middleware should handle this)
  if (req.user.userId !== userId) {
    logger.warn('Upload attempt for different user', {
      authenticatedUser: req.user.userId,
      targetUser: userId,
      ip: req.ip,
    });
    throw new ForbiddenError('You can only upload photos to your own profile');
  }

  // Validate file URL
  if (!fileUrl || !fileUrl.startsWith('https://')) {
    throw new BadRequestError('Valid file URL is required');
  }

  // Validate visibility
  if (!['PUBLIC', 'PRIVATE'].includes(visibility)) {
    throw new BadRequestError('Visibility must be either PUBLIC or PRIVATE');
  }

  // Check photo count
  const existingPhotos = await prisma.userPhoto.count({
    where: { user_id: userId },
  });

  if (existingPhotos >= 5) {
    throw new BadRequestError('Maximum 5 photos allowed. Please delete a photo before uploading a new one.');
  }

  // Check if this should be the primary photo (first photo or no primary exists)
  const hasPrimaryPhoto = await prisma.userPhoto.findFirst({
    where: {
      user_id: userId,
      is_primary: true,
    },
  });

  const isPrimary = !hasPrimaryPhoto;

  // Create photo record
  const photo = await prisma.userPhoto.create({
    data: {
      user_id: userId,
      photo_url: fileUrl,
      visibility,
      is_primary: isPrimary,
      is_approved: false, // Requires moderation
    },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  logger.info('Photo uploaded successfully', {
    userId,
    photoId: photo.id,
    visibility,
    isPrimary,
    requiresApproval: true,
  });

  // Update profile completion cache
  await updateProfileCompletionCache(userId);

  res.status(201).json({
    success: true,
    message: 'Photo uploaded successfully. Awaiting moderation approval.',
    data: {
      id: photo.id,
      photo_url: photo.photo_url,
      visibility: photo.visibility,
      is_primary: photo.is_primary,
      is_approved: photo.is_approved,
      uploaded_at: photo.uploaded_at,
    },
  });
};

/**
 * Get User Photos
 * GET /users/:userId/photos
 * 
 * @description Retrieve all photos for a user
 * @access Public (but filters based on approval and visibility)
 */
export const getUserPhotos = async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.userId;
  const isOwner = requestingUserId === userId;
  const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(req.user?.role);

  // Build query filters
  const whereClause = {
    user_id: userId,
  };

  // Filter based on permissions
  if (!isOwner && !isAdminOrModerator) {
    // Unauthenticated users OR authenticated non-owners → only approved PUBLIC photos
    whereClause.is_approved = true;
    whereClause.visibility = 'PUBLIC';
  } else if (isOwner) {
    // Owner sees ALL their photos (approved/pending, public/private)
    // No additional filters needed
  }
  // Admin/Moderator sees all photos

  const photos = await prisma.userPhoto.findMany({
    where: whereClause,
    orderBy: [
      { is_primary: 'desc' }, // Primary photo first
      { uploaded_at: 'desc' }, // Then by upload date
    ],
    select: {
      id: true,
      photo_url: true,
      visibility: true,
      is_primary: true,
      is_approved: true,
      approved_by: true,
      uploaded_at: true,
      approver: isAdminOrModerator ? {
        select: {
          id: true,
          full_name: true,
        },
      } : false,
    },
  });

  logger.info('Photos retrieved', {
    userId,
    requestingUserId,
    photoCount: photos.length,
    isOwner,
  });

  res.json({
    success: true,
    message: 'Photos retrieved successfully',
    data: {
      total: photos.length,
      photos,
    },
  });
};

/**
 * Delete Photo
 * DELETE /users/:userId/photos/:photoId
 * 
 * @description Delete a photo (owner, admin, or moderator)
 * @access Private - User (own photos) or Admin/Moderator (any photos)
 */
export const deletePhoto = async (req, res) => {
  const { userId, photoId } = req.params;
  const { roleName, userId: requestingUserId } = req.user;

  // Find the photo
  const photo = await prisma.userPhoto.findUnique({
    where: { id: parseInt(photoId) },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  // Verify ownership or admin/moderator role
  const isOwner = photo.user_id === requestingUserId;
  const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(roleName);

  if (!isOwner && !isAdminOrModerator) {
    logger.warn('Unauthorized photo deletion attempt', {
      requestingUserId,
      photoId,
      photoOwnerId: photo.user_id,
      roleName,
      ip: req.ip,
    });
    throw new ForbiddenError('You do not have permission to delete this photo');
  }

  const wasPrimary = photo.is_primary;

  // Delete from UploadThing
  try {
    // Extract file key from URL (e.g., https://utfs.io/f/abc123.jpg -> abc123.jpg)
    const fileKey = photo.photo_url.split('/').pop();
    await utapi.deleteFiles(fileKey);
    
    logger.info('Photo deleted from UploadThing', {
      photoId,
      fileKey,
    });
  } catch (error) {
    logger.error('Failed to delete photo from UploadThing', {
      photoId,
      error: error.message,
    });
    // Continue with database deletion even if UploadThing deletion fails
  }

  // Delete from database
  await prisma.userPhoto.delete({
    where: { id: parseInt(photoId) },
  });

  // If deleted photo was primary, set another approved photo as primary
  if (wasPrimary) {
    const nextPhoto = await prisma.userPhoto.findFirst({
      where: {
        user_id: photo.user_id,
        is_approved: true,
      },
      orderBy: { uploaded_at: 'desc' },
    });

    if (nextPhoto) {
      await prisma.userPhoto.update({
        where: { id: nextPhoto.id },
        data: { is_primary: true },
      });

      logger.info('New primary photo set', {
        userId: photo.user_id,
        newPrimaryPhotoId: nextPhoto.id,
      });
    }
  }

  // Log to audit trail for admin/moderator deletions
  if (isAdminOrModerator && !isOwner) {
    await prisma.auditLog.create({
      data: {
        actor_id: requestingUserId,
        action: `Photo deleted by ${roleName}`,
        ip_address: req.ip,
      },
    });
  }

  logger.info('Photo deleted successfully', {
    photoId,
    deletedBy: requestingUserId,
    roleName,
    isOwnerDeletion: isOwner,
  });

  // Update profile completion cache
  await updateProfileCompletionCache(photo.user_id);

  res.json({
    success: true,
    message: 'Photo deleted successfully',
  });
};

/**
 * Set Primary Photo
 * PATCH /users/:userId/photos/:photoId/primary
 * 
 * @description Set a photo as the primary/profile photo
 * @access Private - User (own photos only)
 */
export const setPrimaryPhoto = async (req, res) => {
  const { userId, photoId } = req.params;
  const requestingUserId = req.user.userId;

  // Verify ownership
  if (requestingUserId !== userId) {
    throw new ForbiddenError('You can only set primary photo for your own profile');
  }

  // Find the photo
  const photo = await prisma.userPhoto.findUnique({
    where: { id: parseInt(photoId) },
  });

  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  if (photo.user_id !== userId) {
    throw new ForbiddenError('This photo does not belong to you');
  }

  // Note: Users can set any of their own photos as primary, even if not approved yet
  // This allows them to choose their profile photo before moderation

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Remove primary status from all other photos
    prisma.userPhoto.updateMany({
      where: {
        user_id: userId,
        is_primary: true,
      },
      data: {
        is_primary: false,
      },
    }),
    // Set this photo as primary
    prisma.userPhoto.update({
      where: { id: parseInt(photoId) },
      data: { is_primary: true },
    }),
  ]);

  logger.info('Primary photo updated', {
    userId,
    photoId,
  });

  res.json({
    success: true,
    message: 'Primary photo updated successfully',
  });
};

/**
 * Get Pending Photos (Moderator)
 * GET /admin/photos/pending
 * 
 * @description Get all photos awaiting approval
 * @access Private - Moderator/Admin only
 */
export const getPendingPhotos = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [photos, total] = await Promise.all([
    prisma.userPhoto.findMany({
      where: { is_approved: false },
      skip,
      take: parseInt(limit),
      orderBy: { uploaded_at: 'asc' }, // Oldest first (FIFO)
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            mobile_number: true,
          },
        },
      },
    }),
    prisma.userPhoto.count({
      where: { is_approved: false },
    }),
  ]);

  logger.info('Pending photos retrieved', {
    moderatorId: req.user.userId,
    count: photos.length,
    total,
    page,
  });

  res.json({
    success: true,
    message: 'Pending photos retrieved successfully',
    data: {
      photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

/**
 * Approve Photo (Moderator)
 * PATCH /admin/photos/:photoId/approve
 * 
 * @description Approve a photo for public display
 * @access Private - Moderator/Admin only
 */
export const approvePhoto = async (req, res) => {
  const { photoId } = req.params;
  const { userId: moderatorId } = req.user;

  // Find the photo
  const photo = await prisma.userPhoto.findUnique({
    where: { id: parseInt(photoId) },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  if (photo.is_approved) {
    throw new BadRequestError('Photo is already approved');
  }

  // Approve the photo
  const updatedPhoto = await prisma.userPhoto.update({
    where: { id: parseInt(photoId) },
    data: {
      is_approved: true,
      approved_by: moderatorId,
    },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      actor_id: moderatorId,
      action: `Photo approved for user: ${photo.user.full_name}`,
      ip_address: req.ip,
    },
  });

  logger.info('Photo approved', {
    photoId,
    userId: photo.user_id,
    moderatorId,
  });

  res.json({
    success: true,
    message: 'Photo approved successfully',
    data: updatedPhoto,
  });
};

/**
 * Reject/Delete Photo (Moderator)
 * DELETE /admin/photos/:photoId
 * 
 * @description Reject and delete an inappropriate photo
 * @access Private - Moderator/Admin only
 */
export const rejectPhoto = async (req, res) => {
  const { photoId } = req.params;
  const { reason = 'No reason provided' } = req.body;
  const { userId: moderatorId, roleName } = req.user;

  // Find the photo
  const photo = await prisma.userPhoto.findUnique({
    where: { id: parseInt(photoId) },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          mobile_number: true,
        },
      },
    },
  });

  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  // Delete from UploadThing
  try {
    const fileKey = photo.photo_url.split('/').pop();
    await utapi.deleteFiles(fileKey);
    
    logger.info('Rejected photo deleted from UploadThing', {
      photoId,
      fileKey,
    });
  } catch (error) {
    logger.error('Failed to delete rejected photo from UploadThing', {
      photoId,
      error: error.message,
    });
  }

  // Delete from database
  await prisma.userPhoto.delete({
    where: { id: parseInt(photoId) },
  });

  // Log rejection to audit trail with reason
  await prisma.auditLog.create({
    data: {
      actor_id: moderatorId,
      action: `Photo rejected and deleted - User: ${photo.user.full_name} (${photo.user.mobile_number}) - Reason: ${reason}`,
      ip_address: req.ip,
    },
  });

  logger.warn('Photo rejected and deleted', {
    photoId,
    userId: photo.user_id,
    moderatorId,
    roleName,
    reason,
  });

  res.json({
    success: true,
    message: 'Photo rejected and deleted successfully',
  });
};
