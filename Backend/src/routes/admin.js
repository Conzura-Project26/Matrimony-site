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
 * @swagger
 * /admin/photos/pending:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get pending photos for moderation
 *     description: Retrieve all photos awaiting moderation approval with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Pending photos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Pending photos retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           file_url:
 *                             type: string
 *                             format: uri
 *                           visibility:
 *                             type: string
 *                             enum: [PUBLIC, PRIVATE, AUTHENTICATED]
 *                           is_approved:
 *                             type: boolean
 *                             example: false
 *                           uploaded_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               full_name:
 *                                 type: string
 *                               mobile_number:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       500:
 *         description: Server error
 */
router.get(
  '/photos/pending',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(getPendingPhotos)
);

/**
 * @swagger
 * /admin/photos/{photoId}/approve:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Approve a photo
 *     description: Approve a photo for public display after moderation review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to approve
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     responses:
 *       200:
 *         description: Photo approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Photo approved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     is_approved:
 *                       type: boolean
 *                       example: true
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/photos/:photoId/approve',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(approvePhoto)
);

/**
 * @swagger
 * /admin/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Reject and delete a photo
 *     description: Reject and permanently delete an inappropriate photo with audit trail logging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to reject and delete
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for photo rejection (logged in audit trail)
 *                 example: 'Inappropriate content violating community guidelines'
 *     responses:
 *       200:
 *         description: Photo rejected and deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Photo rejected and deleted successfully'
 *       400:
 *         description: Validation error - reason is required
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Requires Admin or Moderator role
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/photos/:photoId',
  authenticateToken,
  authorizeRole(['ADMIN', 'MODERATOR']),
  asyncHandler(rejectPhoto)
);

export default router;
