/**
 * Profile View Routes
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * @module routes/viewRoutes
 */

import express from 'express';
import viewController from '../controllers/viewController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/authorization.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /profiles/{profileId}/view:
 *   post:
 *     summary: Record a profile view
 *     description: Track when a user views another user's profile. Silent operation with rate limiting (max 3 views per hour per profile pair). Self-views and blocked users are rejected.
 *     tags:
 *       - Profile Views
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the profile being viewed
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               view_source:
 *                 type: string
 *                 enum: [SEARCH, MATCH, RECOMMENDATION, DIRECT, SHORTLIST, INTEREST]
 *                 default: DIRECT
 *                 description: How the user arrived at this profile
 *               view_duration:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 600
 *                 description: How long the profile was viewed (seconds, max 10 minutes)
 *               search_log_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional link to search session
 *     responses:
 *       204:
 *         description: View recorded successfully (silent success)
 *       400:
 *         description: Invalid request (self-view, invalid params)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (blocked user or inactive profile)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded (max 3 per hour)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/profiles/:profileId/view',
  authorizePermission(['view_profiles']),
  viewController.recordView
);

/**
 * @swagger
 * /profile/viewers:
 *   get:
 *     summary: Get who viewed my profile
 *     description: Returns deduplicated list of users who viewed the current user's profile, ordered by most recent view. Shows only one entry per viewer with their latest view time and total view count.
 *     tags:
 *       - Profile Views
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of viewers per page (max 50)
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter views from this date onwards
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter views up to this date
 *     responses:
 *       200:
 *         description: List of profile viewers
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
 *                     viewers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ViewerProfile'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total_views:
 *                           type: integer
 *                           description: Total number of view events (including repeats)
 *                         unique_viewers:
 *                           type: integer
 *                           description: Number of unique users who viewed
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Missing view_profiles permission
 */
router.get(
  '/profile/viewers',
  authorizePermission(['view_profiles']),
  viewController.getMyViewers
);

/**
 * @swagger
 * /profile/viewed:
 *   get:
 *     summary: Get profiles I viewed
 *     description: Returns deduplicated list of profiles the current user has viewed, ordered by most recent view. Shows interaction status if available.
 *     tags:
 *       - Profile Views
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of profiles per page (max 50)
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter views from this date onwards
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter views up to this date
 *       - in: query
 *         name: interaction_status
 *         schema:
 *           type: boolean
 *         description: Include interaction status (interest sent/received)
 *     responses:
 *       200:
 *         description: List of viewed profiles
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
 *                         $ref: '#/components/schemas/ViewedProfile'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Missing view_profiles permission
 */
router.get(
  '/profile/viewed',
  authorizePermission(['view_profiles']),
  viewController.getMyViewedProfiles
);

/**
 * @swagger
 * /profile/viewers/count:
 *   get:
 *     summary: Get viewers count
 *     description: Returns total and unique viewer counts for the current user's profile
 *     tags:
 *       - Profile Views
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Viewer counts
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
 *                     total_views:
 *                       type: integer
 *                       description: Total number of view events
 *                       example: 45
 *                     unique_viewers:
 *                       type: integer
 *                       description: Number of unique users who viewed
 *                       example: 23
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/profile/viewers/count',
  authorizePermission(['view_profiles']),
  viewController.getViewersCount
);

/**
 * @swagger
 * /profile/viewed/count:
 *   get:
 *     summary: Get viewed profiles count
 *     description: Returns count of unique profiles the current user has viewed
 *     tags:
 *       - Profile Views
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Viewed profiles count
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
 *                     total_profiles_viewed:
 *                       type: integer
 *                       description: Number of unique profiles viewed
 *                       example: 12
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/profile/viewed/count',
  authorizePermission(['view_profiles']),
  viewController.getViewedCount
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ViewerProfile:
 *       type: object
 *       properties:
 *         viewer_id:
 *           type: string
 *           format: uuid
 *           description: User ID of the viewer
 *         profile_id:
 *           type: string
 *           description: Human-readable profile ID (e.g., "SV123456")
 *         full_name:
 *           type: string
 *           description: Full name of the viewer
 *         age:
 *           type: integer
 *           nullable: true
 *           description: Calculated age
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         height_cm:
 *           type: integer
 *           nullable: true
 *           description: Height in centimeters
 *         occupation:
 *           type: string
 *           nullable: true
 *           description: Current occupation
 *         city:
 *           type: string
 *           nullable: true
 *         state:
 *           type: string
 *           nullable: true
 *         primary_photo:
 *           type: string
 *           nullable: true
 *           description: URL of primary profile photo
 *         viewed_at:
 *           type: string
 *           format: date-time
 *           description: When they last viewed your profile
 *         view_count:
 *           type: integer
 *           description: How many times they viewed your profile
 *         last_active:
 *           type: string
 *           nullable: true
 *           enum: ["Active now", "Active today", "Active this week", "Active X days ago"]
 *           description: Human-readable last active status
 *         profile_completion:
 *           type: integer
 *           description: Profile completion percentage
 *         is_verified:
 *           type: boolean
 *           description: Whether profile is verified
 * 
 *     ViewedProfile:
 *       allOf:
 *         - $ref: '#/components/schemas/ViewerProfile'
 *         - type: object
 *           properties:
 *             interaction_status:
 *               type: string
 *               nullable: true
 *               enum: [PENDING, ACCEPTED, REJECTED, null]
 *               description: Interest status with this profile (if any)
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         hasMore:
 *           type: boolean
 *           description: Whether there are more pages
 */

export default router;
