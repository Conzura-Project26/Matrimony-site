/**
 * Search Routes
 * Handles all search-related endpoints
 * 
 * @swagger
 * tags:
 *   - name: Search
 *     description: Profile search and discovery APIs
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/authorization.js';
import { checkFeatureRestriction } from '../middleware/checkFeatureRestrictions.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  simpleSearch,
  advancedSearch,
  getProfileById,
} from '../controllers/searchController.js';

const router = express.Router();

// ============================================
// SEARCH ROUTES
// ============================================

/**
 * @swagger
 * /search/profiles:
 *   get:
 *     tags:
 *       - Search
 *     summary: Simple profile search (GET)
 *     description: Search profiles with basic filters using query parameters. Suitable for simple searches with limited filters.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search keyword (searches in name, occupation, company, location, about_me)
 *       - in: query
 *         name: mother_tongue
 *         schema:
 *           type: string
 *         description: Mother tongue filter (single value)
 *       - in: query
 *         name: min_height
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 250
 *         description: Minimum height in centimeters
 *       - in: query
 *         name: max_height
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 250
 *         description: Maximum height in centimeters
 *       - in: query
 *         name: rasi
 *         schema:
 *           type: string
 *         description: Rasi (Moon Sign) filter
 *       - in: query
 *         name: nakshatra
 *         schema:
 *           type: string
 *         description: Nakshatra (Birth Star) filter
 *     responses:
 *       200:
 *         description: Search results returned successfully
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
 *                   example: "Found 15 profiles"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       profile_id:
 *                         type: string
 *                         example: "MAT00001234"
 *                       full_name:
 *                         type: string
 *                         example: "John Doe"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       gender:
 *                         type: string
 *                         example: "MALE"
 *                       height_cm:
 *                         type: integer
 *                         example: 175
 *                       marital_status:
 *                         type: string
 *                         example: "NEVER_MARRIED"
 *                       mother_tongue:
 *                         type: string
 *                         example: "Hindi"
 *                       city:
 *                         type: string
 *                         example: "Mumbai"
 *                       state:
 *                         type: string
 *                         example: "Maharashtra"
 *                       religion:
 *                         type: string
 *                         example: "Hindu"
 *                       caste:
 *                         type: string
 *                         example: "Brahmin"
 *                       occupation:
 *                         type: string
 *                         example: "Software Engineer"
 *                       qualification:
 *                         type: string
 *                         example: "B.Tech"
 *                       photo_url:
 *                         type: string
 *                         example: "https://example.com/photo.jpg"
 *                       is_verified:
 *                         type: boolean
 *                         example: true
 *                       profile_completion:
 *                         type: integer
 *                         example: 85
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     per_page:
 *                       type: integer
 *                       example: 20
 *                     has_more:
 *                       type: boolean
 *                       example: true
 *                 filters:
 *                   type: object
 *                   description: Applied search filters
 *                 execution_time_ms:
 *                   type: integer
 *                   example: 245
 *       400:
 *         description: Bad request - validation error or missing filters
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
router.get(
  '/profiles',
  authenticateToken,
  checkFeatureRestriction('SEARCH'),
  authorizePermission(['search_profiles']),
  asyncHandler(simpleSearch)
);

/**
 * @swagger
 * /search/advanced:
 *   post:
 *     tags:
 *       - Search
 *     summary: Advanced profile search (POST)
 *     description: Search profiles with complex filters using request body. Supports multiple values for each filter.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Page number for pagination
 *               keyword:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Search keyword (full-text search across multiple fields)
 *               mother_tongue:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Array of mother tongues (matches if ANY matches)
 *               min_height:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 250
 *                 description: Minimum height in centimeters
 *               max_height:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 250
 *                 description: Maximum height in centimeters
 *               rasi:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 12
 *                 description: Array of Rasi (Moon Signs) to filter by
 *               nakshatra:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 27
 *                 description: Array of Nakshatras (Birth Stars) to filter by
 *             example:
 *               page: 1
 *               keyword: "engineer"
 *               mother_tongue: ["Hindi", "English", "Punjabi"]
 *               min_height: 160
 *               max_height: 180
 *               rasi: ["Mesha (Aries)", "Simha (Leo)"]
 *               nakshatra: ["Ashwini", "Bharani"]
 *     responses:
 *       200:
 *         description: Search results returned successfully
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
 *                   example: "Found 12 profiles matching your criteria"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     has_more:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *                 execution_time_ms:
 *                   type: integer
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
router.post(
  '/advanced',
  authenticateToken,
  checkFeatureRestriction('SEARCH'),
  authorizePermission(['search_profiles']),
  asyncHandler(advancedSearch)
);

/**
 * @swagger
 * /search/profile/{profileId}:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search profile by custom profile ID
 *     description: Retrieve a single profile by its custom human-readable profile ID (e.g., MAT00001234)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 5
 *           maxLength: 20
 *         description: Custom profile ID (e.g., MAT00001234)
 *         example: MAT00001234
 *     responses:
 *       200:
 *         description: Profile found successfully
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
 *                   example: "Profile found"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_id:
 *                       type: string
 *                       example: "MAT00001234"
 *                     full_name:
 *                       type: string
 *                       example: "Jane Smith"
 *                     age:
 *                       type: integer
 *                       example: 26
 *                     gender:
 *                       type: string
 *                       example: "FEMALE"
 *                     height_cm:
 *                       type: integer
 *                       example: 165
 *                     occupation:
 *                       type: string
 *                       example: "Doctor"
 *                     photo_url:
 *                       type: string
 *                 execution_time_ms:
 *                   type: integer
 *                   example: 45
 *       400:
 *         description: Invalid profile ID format
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
router.get(
  '/profile/:profileId',
  authenticateToken,
  authorizePermission(['search_profiles']),
  asyncHandler(getProfileById)
);

export default router;
