/**
 * Block Routes
 * Task 4.x: User Blocking System
 * 
 * API Endpoints:
 * - POST /blocks/:userId - Block a user
 * - DELETE /blocks/:userId - Unblock a user
 * - GET /blocks - Get list of blocked users
 * 
 * @module routes/blockRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import blockController from '../controllers/blockController.js';

const router = express.Router();

// All block routes require authentication
router.use(authenticateToken);

// ============================================
// BLOCK USER
// ============================================

/**
 * @swagger
 * /blocks/{userId}:
 *   post:
 *     tags:
 *       - Blocking
 *     summary: Block a user
 *     description: |
 *       Block another user to prevent any interaction.
 *       
 *       **Effects of Blocking:**
 *       - 🔒 **Bidirectional hiding**: Both users become invisible to each other
 *       - ❌ **Auto-rejects pending interests**: Any PENDING interests are rejected
 *       - ✅ **Preserves accepted interests**: Mutual interests remain (just hidden)
 *       - 🔍 **Search exclusion**: Blocked users won't appear in searches
 *       - 👤 **Profile access**: Returns 403/404 when trying to view each other's profiles
 *       - 🤫 **Silent operation**: Blocked user receives no notification
 *       - 📝 **Audit logged**: Action recorded with BLOCK_USER
 *       
 *       **Business Rules:**
 *       - Cannot block yourself
 *       - Can re-block after unblocking (no cooldown)
 *       - Unlimited blocks allowed
 *       - Blocking is immediate and reversible
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to block
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     responses:
 *       200:
 *         description: User blocked successfully
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
 *                   example: "User blocked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     blocked_user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *                     blocked_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T10:22:11.234Z"
 *                     rejected_interests_count:
 *                       type: integer
 *                       example: 2
 *                       description: Number of pending interests that were auto-rejected
 *       400:
 *         description: Validation error or already blocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User is already blocked"
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/:userId', asyncHandler(blockController.blockUser));

// ============================================
// UNBLOCK USER
// ============================================

/**
 * @swagger
 * /blocks/{userId}:
 *   delete:
 *     tags:
 *       - Blocking
 *     summary: Unblock a user
 *     description: |
 *       Remove block relationship with another user.
 *       
 *       **Effects of Unblocking:**
 *       - 🔓 **Restores visibility**: Users can see each other again
 *       - ✅ **Enables interaction**: Can send interests, view profiles
 *       - 🚫 **Does NOT restore rejected interests**: Previously rejected interests stay rejected
 *       - 🔄 **Immediate effect**: Changes apply instantly
 *       - 📝 **Audit logged**: Action recorded with UNBLOCK_USER
 *       
 *       **Business Rules:**
 *       - Can only unblock users you've blocked
 *       - Can re-block immediately after unblocking (no cooldown)
 *       - Soft delete (sets unblocked_at timestamp)
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to unblock
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     responses:
 *       200:
 *         description: User unblocked successfully
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
 *                   example: "User unblocked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     unblocked_user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *                     unblocked_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T11:30:45.678Z"
 *       404:
 *         description: Block relationship not found or already unblocked
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.delete('/:userId', asyncHandler(blockController.unblockUser));

// ============================================
// GET BLOCKED USERS
// ============================================

/**
 * @swagger
 * /blocks:
 *   get:
 *     tags:
 *       - Blocking
 *     summary: Get list of blocked users
 *     description: |
 *       Retrieve all users that the current user has blocked.
 *       Returns basic profile information and block timestamp.
 *       
 *       **Returned Information:**
 *       - User ID (UUID)
 *       - Full name
 *       - Profile ID (e.g., MAT00001234)
 *       - Age (if available)
 *       - Primary profile photo URL
 *       - Timestamp when blocked
 *       
 *       **Note:** Does NOT show users who have blocked you (privacy protection)
 *       
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users retrieved successfully
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
 *                   example: "Blocked users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *                           full_name:
 *                             type: string
 *                             example: "John Doe"
 *                           profile_id:
 *                             type: string
 *                             example: "MAT00001234"
 *                           age:
 *                             type: integer
 *                             nullable: true
 *                             example: 29
 *                           photo_url:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/photos/profile.jpg"
 *                       blocked_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-03T10:22:11.234Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', asyncHandler(blockController.getBlockedUsers));

export default router;
