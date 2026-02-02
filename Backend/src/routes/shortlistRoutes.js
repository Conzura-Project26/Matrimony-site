/**
 * Shortlist Routes
 * Phase 3 - Task 3.6: Shortlist Management
 * 
 * API Endpoints:
 * - POST   /shortlist/:userId          - Add to shortlist
 * - DELETE /shortlist/:userId          - Remove from shortlist
 * - GET    /shortlist                  - Get my shortlist
 * - GET    /shortlist/:userId/status   - Check if shortlisted (mutual)
 * - GET    /shortlisted-by             - Get who shortlisted me
 * 
 * @module routes/shortlistRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import shortlistController from '../controllers/shortlistController.js';

const router = express.Router();

// All shortlist routes require authentication
router.use(authenticateToken);

// ============================================
// ADD TO SHORTLIST
// ============================================

/**
 * @swagger
 * /shortlist/{userId}:
 *   post:
 *     tags:
 *       - Shortlist Management
 *     summary: Add a profile to user's shortlist
 *     description: |
 *       Adds a profile to the authenticated user's shortlist.
 *       
 *       **Features:**
 *       - Prevents self-shortlisting
 *       - Checks if profile exists and is active
 *       - Prevents duplicate shortlisting (returns "Already shortlisted" message)
 *       - Cannot shortlist if blocked
 *       - Automatically updates shortlist counts on both users
 *       
 *       **Success Response:**
 *       - Returns success message with timestamp
 *       - If already shortlisted, returns existing timestamp with is_new: false
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the profile to shortlist
 *     responses:
 *       200:
 *         description: Successfully added to shortlist or already shortlisted
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
 *                   example: "Profile added to shortlist"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     shortlisted_at:
 *                       type: string
 *                       format: date-time
 *                     is_new:
 *                       type: boolean
 *       400:
 *         description: Bad request (self-shortlist, inactive profile, blocked)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.post('/shortlist/:userId', asyncHandler(shortlistController.addToShortlist));

// ============================================
// REMOVE FROM SHORTLIST
// ============================================

/**
 * @swagger
 * /shortlist/{userId}:
 *   delete:
 *     tags:
 *       - Shortlist Management
 *     summary: Remove a profile from user's shortlist
 *     description: |
 *       Removes a profile from the authenticated user's shortlist.
 *       
 *       **Features:**
 *       - If profile not in shortlist, returns "Profile not in shortlist" message
 *       - Automatically updates shortlist counts on both users
 *       - Does not throw error if already removed
 *       
 *       **Success Response:**
 *       - Returns success message with removal status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the profile to remove from shortlist
 *     responses:
 *       200:
 *         description: Successfully removed from shortlist or not in shortlist
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
 *                   example: "Profile removed from shortlist"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     was_removed:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.delete('/shortlist/:userId', asyncHandler(shortlistController.removeFromShortlist));

// ============================================
// GET MY SHORTLIST
// ============================================

/**
 * @swagger
 * /shortlist:
 *   get:
 *     tags:
 *       - Shortlist Management
 *     summary: Get authenticated user's shortlist
 *     description: |
 *       Returns paginated list of profiles shortlisted by the authenticated user.
 *       
 *       **Features:**
 *       - Pagination support (default 20 per page, max 100)
 *       - Sorting options: created_at, last_active
 *       - Sort order: asc or desc
 *       - Returns minimal card data (name, age, photo, city, occupation, etc.)
 *       - Automatically filters out inactive profiles
 *       
 *       **Profile Data Includes:**
 *       - Basic info: name, age, gender, profile_id
 *       - Physical: height
 *       - Professional: occupation
 *       - Location: city, state
 *       - Background: religion, caste, education
 *       - Media: primary photo
 *       - Metadata: profile completion, verification status, shortlisted_at
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Results per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, last_active]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Successfully retrieved shortlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           profile_id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           gender:
 *                             type: string
 *                           height_cm:
 *                             type: integer
 *                           occupation:
 *                             type: string
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           religion:
 *                             type: string
 *                           caste:
 *                             type: string
 *                           education:
 *                             type: string
 *                           primary_photo:
 *                             type: string
 *                           profile_completion:
 *                             type: integer
 *                           is_verified:
 *                             type: boolean
 *                           shortlisted_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_count:
 *                           type: integer
 *                         per_page:
 *                           type: integer
 *                         has_next:
 *                           type: boolean
 *                         has_prev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/shortlist', asyncHandler(shortlistController.getMyShortlist));

// ============================================
// CHECK SHORTLIST STATUS
// ============================================

/**
 * @swagger
 * /shortlist/{userId}/status:
 *   get:
 *     tags:
 *       - Shortlist Management
 *     summary: Check if a profile is shortlisted (mutual status)
 *     description: |
 *       Checks shortlist status between authenticated user and target profile.
 *       
 *       **Features:**
 *       - Checks if I shortlisted them
 *       - Checks if they shortlisted me
 *       - Returns timestamps for both directions
 *       - Indicates if mutual shortlist
 *       - Cannot check own profile
 *       
 *       **Use Cases:**
 *       - Display shortlist button state on profile page
 *       - Show mutual shortlist indicator
 *       - Track when shortlisting occurred
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the profile to check
 *     responses:
 *       200:
 *         description: Successfully retrieved shortlist status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_shortlisted:
 *                       type: boolean
 *                       description: Whether I shortlisted them
 *                     i_shortlisted_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: When I shortlisted them (null if not shortlisted)
 *                     they_shortlisted_me:
 *                       type: boolean
 *                       description: Whether they shortlisted me
 *                     they_shortlisted_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: When they shortlisted me (null if not shortlisted)
 *                     is_mutual:
 *                       type: boolean
 *                       description: Whether both users shortlisted each other
 *       400:
 *         description: Bad request (self-check)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/shortlist/:userId/status', asyncHandler(shortlistController.checkShortlistStatus));

// ============================================
// GET WHO SHORTLISTED ME
// ============================================

/**
 * @swagger
 * /shortlisted-by:
 *   get:
 *     tags:
 *       - Shortlist Management
 *     summary: Get list of users who shortlisted me
 *     description: |
 *       Returns paginated list of profiles who have shortlisted the authenticated user.
 *       
 *       **Features:**
 *       - Pagination support (default 20 per page, max 100)
 *       - Sorting options: created_at, last_active
 *       - Sort order: asc or desc
 *       - Returns minimal card data (same format as "Get my shortlist")
 *       - Automatically filters out inactive profiles
 *       
 *       **Use Cases:**
 *       - Show "Who's interested in my profile"
 *       - Enable reciprocal shortlisting
 *       - Track profile popularity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Results per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, last_active]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Successfully retrieved shortlisted-by list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           profile_id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           gender:
 *                             type: string
 *                           height_cm:
 *                             type: integer
 *                           occupation:
 *                             type: string
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           religion:
 *                             type: string
 *                           caste:
 *                             type: string
 *                           education:
 *                             type: string
 *                           primary_photo:
 *                             type: string
 *                           profile_completion:
 *                             type: integer
 *                           is_verified:
 *                             type: boolean
 *                           shortlisted_at:
 *                             type: string
 *                             format: date-time
 *                             description: When they shortlisted me
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         total_count:
 *                           type: integer
 *                         per_page:
 *                           type: integer
 *                         has_next:
 *                           type: boolean
 *                         has_prev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/shortlisted-by', asyncHandler(shortlistController.getShortlistedByMe));

export default router;
