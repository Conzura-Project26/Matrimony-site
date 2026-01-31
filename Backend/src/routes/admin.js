/**
 * Admin Routes
 * Handles administrative operations including photo moderation
 * 
 * Routes:
 * - GET    /admin/photos/pending - Get pending photos for moderation
 * - PATCH  /admin/photos/:photoId/approve - Approve a photo
 * - DELETE /admin/photos/:photoId - Reject/delete a photo
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/authorization.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
} from '../controllers/photoController.js';

const router = express.Router();

/**
 * @route   GET /admin/photos/pending
 * @desc    Get all photos awaiting moderation approval
 * @access  Private - Moderator/Admin only
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20)
 */
router.get(
  '/photos/pending',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(getPendingPhotos)
);

/**
 * @route   PATCH /admin/photos/:photoId/approve
 * @desc    Approve a photo for public display
 * @access  Private - Moderator/Admin only
 */
router.patch(
  '/photos/:photoId/approve',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(approvePhoto)
);

/**
 * @route   DELETE /admin/photos/:photoId
 * @desc    Reject and permanently delete an inappropriate photo
 * @access  Private - Moderator/Admin only
 * @body    reason - Reason for rejection (logged in audit trail)
 */
router.delete(
  '/photos/:photoId',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(rejectPhoto)
);

export default router;
