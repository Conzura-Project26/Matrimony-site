/**
 * UploadThing Configuration
 * Handles file uploads to UploadThing cloud storage
 * 
 * Features:
 * - 5MB max file size
 * - Image formats only (JPEG, PNG, WEBP, GIF, HEIC)
 * - 5 photos max per user
 */

import { createUploadthing } from 'uploadthing/express';
import prisma from './prisma.js';
import { BadRequestError, ForbiddenError } from '../utils/errors.js';
import logger from './logger.js';

const f = createUploadthing();

/**
 * UploadThing File Router
 * Defines upload endpoints and validation rules
 */
export const uploadRouter = {
  // Photo upload endpoint
  photoUploader: f({
    image: {
      maxFileSize: '5MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Verify authentication - req.user should be set by authenticateToken middleware
      if (!req.user || !req.user.userId) {
        logger.warn('Upload attempted without authentication', {
          ip: req.ip,
        });
        throw new ForbiddenError('Authentication required to upload photos');
      }

      const userId = req.user.userId;

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is_active: true },
      });

      if (!user) {
        logger.error('Upload failed - User not found', { userId });
        throw new ForbiddenError('User not found');
      }

      if (!user.is_active) {
        logger.warn('Upload failed - Inactive user', { userId });
        throw new ForbiddenError('Your account has been deactivated');
      }

      // Check if user has reached photo limit (5 photos max)
      const photoCount = await prisma.userPhoto.count({
        where: { user_id: userId },
      });

      if (photoCount >= 5) {
        logger.warn('Upload failed - Photo limit reached', {
          userId,
          currentCount: photoCount,
        });
        throw new BadRequestError('Maximum 5 photos allowed per user. Please delete a photo before uploading a new one.');
      }

      logger.info('Upload validation passed', {
        userId,
        currentPhotoCount: photoCount,
      });

      // Pass metadata to onUploadComplete
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This callback runs after the file is uploaded to UploadThing
      const { userId } = metadata;

      logger.info('File uploaded to UploadThing', {
        userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      });

      // The actual database insertion will be handled in the controller
      // We just return the file info here
      return { fileUrl: file.url, userId };
    }),
};
