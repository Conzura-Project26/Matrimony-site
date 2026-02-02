/**
 * Matchmaking Routes
 * Phase 3 - Task 3.4: Matchmaking Algorithm
 * 
 * API Endpoints:
 * - GET  /profiles/recommended       - Get recommended profiles
 * - GET  /profiles/daily-matches     - Get daily curated matches
 * - GET  /profiles/new-matches       - Get new matches
 * - GET  /profiles/new-matches/count - Get count of unseen matches
 * - POST /matches/:matchId/view      - Record match view
 * 
 * @swagger
 * tags:
 *   - name: Matchmaking
 *     description: AI-powered matchmaking and recommendations
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import matchmakingController from '../controllers/matchmakingController.js';

const router = express.Router();

// All matchmaking routes require authentication
router.use(authenticateToken);

// ============================================
// GET RECOMMENDED PROFILES
// ============================================

/**
 * @swagger
 * /profiles/recommended:
 *   get:
 *     tags:
 *       - Matchmaking
 *     summary: Get recommended profiles based on partner preferences
 *     description: |
 *       Returns AI-curated profile recommendations based on user's partner preferences.
 *       Uses bidirectional scoring for mutual compatibility.
 *       
 *       **Features:**
 *       - Enhanced scoring algorithm (up to 100% match)
 *       - Excludes profiles with existing interests
 *       - Filters by profile completion (≥70%)
 *       - Pagination support
 *       - Controlled randomness for variety
 *       
 *       **Response includes minimal card data only (contact info hidden)**
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
 *         description: Number of results per page
 *       - in: query
 *         name: min_score
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           default: 50
 *         description: Minimum match score threshold (%)
 *       - in: query
 *         name: regenerate
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force regenerate matches (ignores cache)
 *     responses:
 *       200:
 *         description: Recommendations fetched successfully
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
 *                   example: 'Recommended profiles fetched successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           match_id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           profile_id:
 *                             type: string
 *                             example: 'MAT00001234'
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
 *                           match_score:
 *                             type: integer
 *                             description: Match percentage (0-100)
 *                           primary_photo:
 *                             type: string
 *                             nullable: true
 *                           is_viewed:
 *                             type: boolean
 *                           profile_completion:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       400:
 *         description: Invalid query parameters or insufficient profile completion
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/profiles/recommended', asyncHandler(matchmakingController.getRecommended));

// ============================================
// GET DAILY MATCHES
// ============================================

/**
 * @swagger
 * /profiles/daily-matches:
 *   get:
 *     tags:
 *       - Matchmaking
 *     summary: Get daily curated matches
 *     description: |
 *       Returns 10 high-quality matches curated daily for the user.
 *       Refreshes at midnight IST. Minimum 60% match score.
 *       
 *       **Features:**
 *       - Fixed count of 10 matches per day
 *       - Higher quality threshold (≥60% match)
 *       - Expires at end of day
 *       - Tracks viewed vs. new matches
 *       - 30-day cooldown before re-showing
 *       
 *       **Response shows which matches are new today**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily matches fetched successfully
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
 *                   example: 'Daily matches fetched successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Same structure as recommended profiles
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total daily matches
 *                         new:
 *                           type: integer
 *                           description: Unviewed matches
 *                         viewed:
 *                           type: integer
 *                           description: Already viewed matches
 *                         refresh_time:
 *                           type: string
 *                           example: 'Daily at midnight'
 *       400:
 *         description: Insufficient profile completion
 *       401:
 *         description: Unauthorized
 */
router.get('/profiles/daily-matches', asyncHandler(matchmakingController.getDailyMatches));

// ============================================
// GET NEW MATCHES
// ============================================

/**
 * @swagger
 * /profiles/new-matches:
 *   get:
 *     tags:
 *       - Matchmaking
 *     summary: Get new matches since last check
 *     description: |
 *       Returns profiles that haven't been shown to the user before.
 *       "New" is relative to user's last activity, not a fixed time window.
 *       
 *       **Features:**
 *       - Shows only unseen profiles
 *       - User-relative, not time-relative
 *       - Minimum 40% match score
 *       - Pagination support
 *       - Tracks user's last check timestamp
 *       
 *       **Note:** Contact information is always hidden in responses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: New matches fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/profiles/new-matches', asyncHandler(matchmakingController.getNewMatches));

// ============================================
// GET NEW MATCHES COUNT
// ============================================

/**
 * @swagger
 * /profiles/new-matches/count:
 *   get:
 *     tags:
 *       - Matchmaking
 *     summary: Get count of unseen new matches
 *     description: |
 *       Returns the count of new matches for notification badge.
 *       Lightweight endpoint for frequent polling.
 *       
 *       **Use case:** Display notification badge showing "X new matches"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count fetched successfully
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
 *                   example: 'New matches count fetched successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *                       description: Number of unseen matches
 *                     last_checked:
 *                       type: string
 *                       format: date-time
 *                       description: Current server timestamp
 *       401:
 *         description: Unauthorized
 */
router.get('/profiles/new-matches/count', asyncHandler(matchmakingController.getNewMatchesCount));

// ============================================
// RECORD MATCH VIEW
// ============================================

/**
 * @swagger
 * /matches/{matchId}/view:
 *   post:
 *     tags:
 *       - Matchmaking
 *     summary: Record match profile view
 *     description: |
 *       Tracks when a user views a match profile for analytics.
 *       Updates match interaction history and marks as viewed.
 *       
 *       **Analytics tracked:**
 *       - View timestamp
 *       - User engagement patterns
 *       - Match quality assessment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Match ID (UUID)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     responses:
 *       200:
 *         description: View recorded successfully
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
 *                   example: 'Match view recorded successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     interaction_id:
 *                       type: string
 *                       format: uuid
 *                     viewed_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid match ID format
 *       404:
 *         description: Match not found
 *       401:
 *         description: Unauthorized
 */
router.post('/matches/:matchId/view', asyncHandler(matchmakingController.recordView));

export default router;
