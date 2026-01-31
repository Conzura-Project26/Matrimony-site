/**
 * User Routes
 * Handles user-related operations including photo management
 * 
 * Routes:
 * - POST   /users/:userId/photos - Upload photo
 * - GET    /users/:userId/photos - Get user photos
 * - DELETE /users/:userId/photos/:photoId - Delete photo
 * - PATCH  /users/:userId/photos/:photoId/primary - Set primary photo
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkOwnership } from '../middleware/authorization.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  uploadPhoto,
  getUserPhotos,
  deletePhoto,
  setPrimaryPhoto,
} from '../controllers/photoController.js';

const router = express.Router();

/**
 * @route   POST /users/:userId/photos
 * @desc    Upload a new photo
 * @access  Private - User (own profile only)
 * @middleware authenticateToken, checkOwnership
 */
router.post(
  '/:userId/photos',
  authenticateToken,
  checkOwnership('userId', { bypassRoles: [], resourceType: 'user profile' }),
  asyncHandler(uploadPhoto)
);

/**
 * @route   GET /users/:userId/photos
 * @desc    Get all photos for a user
 * @access  Public (filters applied based on authentication and approval status)
 * @note    Unauthenticated users see only approved public photos
 *          Authenticated users see their own photos (all) or others' approved public photos
 *          Admin/Moderator see all photos
 */
router.get(
  '/:userId/photos',
  (req, res, next) => {
    // Optional authentication - don't fail if no token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  asyncHandler(getUserPhotos)
);

/**
 * @route   DELETE /users/:userId/photos/:photoId
 * @desc    Delete a photo
 * @access  Private - User (own photos) or Admin/Moderator (any photos)
 * @middleware authenticateToken, checkOwnership (bypassed for Admin/Moderator)
 */
router.delete(
  '/:userId/photos/:photoId',
  authenticateToken,
  checkOwnership('photoId', { 
    bypassRoles: ['ADMIN', 'MODERATOR'], 
    resourceType: 'photo' 
  }),
  asyncHandler(deletePhoto)
);

/**
 * @route   PATCH /users/:userId/photos/:photoId/primary
 * @desc    Set a photo as primary/profile photo
 * @access  Private - User (own photos only)
 * @middleware authenticateToken, checkOwnership
 */
router.patch(
  '/:userId/photos/:photoId/primary',
  authenticateToken,
  checkOwnership('userId', { bypassRoles: [], resourceType: 'user profile' }),
  asyncHandler(setPrimaryPhoto)
);

export default router;
