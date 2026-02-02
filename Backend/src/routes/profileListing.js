/**
 * Profile Routes
 * Task 3.1: Profile Listing with Advanced Filters
 * 
 * Routes:
 * - GET /profiles - Get all profiles with pagination, filters, and sorting
 * 
 * @swagger
 * tags:
 *   - name: Profile Listing
 *     description: Search and browse matrimonial profiles with advanced filtering
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import profileListingController from '../controllers/profileListingController.js';

const router = express.Router();

/**
 * @swagger
 * /profiles:
 *   get:
 *     tags:
 *       - Profile Listing
 *     summary: Get all profiles with advanced filtering
 *     description: |
 *       Retrieve paginated list of matrimonial profiles with comprehensive filtering options.
 *       
 *       **Auto-Applied Filters:**
 *       - Only active users (is_active = true)
 *       - Minimum 60% profile completion
 *       - At least one approved photo
 *       - Excludes your own profile
 *       
 *       **Partner Preference Auto-Fill:**
 *       - If you don't specify filters, your partner preferences are automatically applied
 *       - Your opposite gender is automatically filtered (if you're MALE, shows FEMALE profiles)
 *       
 *       **Match Score:**
 *       - Each profile includes a match_score based on your partner preferences
 *       - Score ranges from 0-100 (higher is better match)
 *       
 *       **Search Logging:**
 *       - All searches are logged with filters, result count, and execution time
 *       - Helps improve search algorithms and user experience
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # Pagination
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
 *         description: Number of profiles per page (max 100)
 *         example: 20
 *       
 *       # Sorting
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [newest, last_active, match_score]
 *           default: newest
 *         description: |
 *           Sort order for profiles:
 *           - `newest`: Recently registered users (created_at DESC)
 *           - `last_active`: Recently active users (last_active_at DESC)
 *           - `match_score`: Best matches first (based on your preferences)
 *         example: match_score
 *       
 *       # Basic Filters
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         description: Filter by gender (auto-applied from your opposite gender if not specified)
 *         example: FEMALE
 *       - in: query
 *         name: min_age
 *         schema:
 *           type: integer
 *           minimum: 18
 *           maximum: 100
 *         description: Minimum age (calculated from date_of_birth)
 *         example: 25
 *       - in: query
 *         name: max_age
 *         schema:
 *           type: integer
 *           minimum: 18
 *           maximum: 100
 *         description: Maximum age (calculated from date_of_birth)
 *         example: 35
 *       
 *       # Location Filters (OR match between personal and work locations)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state (matches living state OR work state)
 *         example: Maharashtra
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (matches living city OR work city)
 *         example: Mumbai
 *       - in: query
 *         name: work_state
 *         schema:
 *           type: string
 *         description: Filter specifically by work state
 *         example: Karnataka
 *       - in: query
 *         name: work_city
 *         schema:
 *           type: string
 *         description: Filter specifically by work city
 *         example: Bangalore
 *       - in: query
 *         name: work_location_type
 *         schema:
 *           type: string
 *           enum: [On-Site, Remote, Hybrid, Multiple Locations, Overseas]
 *         description: Filter by work location type
 *         example: Remote
 *       
 *       # Caste & Religion Filters
 *       - in: query
 *         name: religion_id
 *         schema:
 *           type: integer
 *         description: Filter by religion ID
 *         example: 1
 *       - in: query
 *         name: caste_id
 *         schema:
 *           type: integer
 *         description: Filter by caste ID
 *         example: 5
 *       
 *       # Personal Details Filters
 *       - in: query
 *         name: marital_status
 *         schema:
 *           type: string
 *           enum: [Never Married, Divorced, Widowed, Separated, Awaiting Divorce]
 *         description: Filter by marital status
 *         example: Never Married
 *       - in: query
 *         name: min_height
 *         schema:
 *           type: integer
 *           minimum: 120
 *           maximum: 250
 *         description: Minimum height in cm
 *         example: 160
 *       - in: query
 *         name: max_height
 *         schema:
 *           type: integer
 *           minimum: 120
 *           maximum: 250
 *         description: Maximum height in cm
 *         example: 180
 *       - in: query
 *         name: mother_tongue
 *         schema:
 *           type: string
 *         description: Filter by mother tongue
 *         example: Hindi
 *       
 *       # Professional Filters
 *       - in: query
 *         name: employment_type
 *         schema:
 *           type: string
 *           enum: [Salaried - Private, Salaried - Government, Business, Self-Employed, Not Working]
 *         description: Filter by employment type
 *         example: Salaried - Private
 *       - in: query
 *         name: income_range
 *         schema:
 *           type: string
 *         description: Filter by annual income range
 *         example: 5-10 Lakhs
 *       
 *       # Education Filter
 *       - in: query
 *         name: qualification
 *         schema:
 *           type: string
 *         description: Filter by qualification (partial match, case-insensitive)
 *         example: B.Tech
 *     
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
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
 *                   example: 'Profiles retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           profile_id:
 *                             type: string
 *                             example: 'MAT00001234'
 *                             description: Human-readable unique profile ID
 *                           full_name:
 *                             type: string
 *                             example: 'Priya Sharma'
 *                           age:
 *                             type: integer
 *                             example: 28
 *                             description: Calculated from date_of_birth
 *                           gender:
 *                             type: string
 *                             example: 'FEMALE'
 *                           profile_completion_percentage:
 *                             type: integer
 *                             example: 85
 *                           height_cm:
 *                             type: integer
 *                             example: 165
 *                             nullable: true
 *                           marital_status:
 *                             type: string
 *                             example: 'Never Married'
 *                             nullable: true
 *                           city:
 *                             type: string
 *                             example: 'Mumbai'
 *                             nullable: true
 *                           state:
 *                             type: string
 *                             example: 'Maharashtra'
 *                             nullable: true
 *                           mother_tongue:
 *                             type: string
 *                             example: 'Hindi'
 *                             nullable: true
 *                           occupation:
 *                             type: string
 *                             example: 'Software Engineer'
 *                             nullable: true
 *                           annual_income_range:
 *                             type: string
 *                             example: '5-10 Lakhs'
 *                             nullable: true
 *                           employment_type:
 *                             type: string
 *                             example: 'Salaried - Private'
 *                             nullable: true
 *                           qualification:
 *                             type: string
 *                             example: 'B.Tech Computer Science'
 *                             nullable: true
 *                             description: Highest/latest qualification
 *                           religion_name:
 *                             type: string
 *                             example: 'Hindu'
 *                             nullable: true
 *                           caste_name:
 *                             type: string
 *                             example: 'Maratha'
 *                             nullable: true
 *                           primary_photo:
 *                             type: string
 *                             format: uri
 *                             example: 'https://utfs.io/f/abc123xyz'
 *                             nullable: true
 *                             description: URL of approved primary photo
 *                           photo_count:
 *                             type: integer
 *                             example: 3
 *                             description: Total number of approved photos
 *                           match_score:
 *                             type: integer
 *                             example: 78
 *                             description: Match score based on your preferences (0-100)
 *                           last_active_at:
 *                             type: string
 *                             format: date-time
 *                             example: '2026-02-02T10:30:00.000Z'
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: '2026-01-15T08:20:00.000Z'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 150
 *                           description: Total number of profiles matching filters
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                           description: Profiles per page
 *                         totalPages:
 *                           type: integer
 *                           example: 8
 *                           description: Total pages available
 *                     filters_applied:
 *                       type: object
 *                       description: Summary of all filters applied to this search
 *                       example:
 *                         gender: 'FEMALE'
 *                         min_age: 25
 *                         max_age: 35
 *                         state: 'Maharashtra'
 *                     execution_time_ms:
 *                       type: integer
 *                       example: 245
 *                       description: Query execution time in milliseconds
 *             examples:
 *               successWithMatches:
 *                 summary: Successful search with matches
 *                 value:
 *                   success: true
 *                   message: 'Profiles retrieved successfully'
 *                   data:
 *                     profiles:
 *                       - profile_id: 'MAT00001234'
 *                         full_name: 'Priya Sharma'
 *                         age: 28
 *                         gender: 'FEMALE'
 *                         profile_completion_percentage: 85
 *                         height_cm: 165
 *                         marital_status: 'Never Married'
 *                         city: 'Mumbai'
 *                         state: 'Maharashtra'
 *                         mother_tongue: 'Hindi'
 *                         occupation: 'Software Engineer'
 *                         annual_income_range: '5-10 Lakhs'
 *                         employment_type: 'Salaried - Private'
 *                         qualification: 'B.Tech Computer Science'
 *                         religion_name: 'Hindu'
 *                         caste_name: 'Maratha'
 *                         primary_photo: 'https://utfs.io/f/abc123xyz'
 *                         photo_count: 3
 *                         match_score: 78
 *                         last_active_at: '2026-02-02T10:30:00.000Z'
 *                         created_at: '2026-01-15T08:20:00.000Z'
 *                     pagination:
 *                       total: 150
 *                       page: 1
 *                       limit: 20
 *                       totalPages: 8
 *                     filters_applied:
 *                       gender: 'FEMALE'
 *                       min_age: 25
 *                       max_age: 35
 *                       state: 'Maharashtra'
 *                     execution_time_ms: 245
 *               noMatches:
 *                 summary: No profiles found
 *                 value:
 *                   success: true
 *                   message: 'Profiles retrieved successfully'
 *                   data:
 *                     profiles: []
 *                     pagination:
 *                       total: 0
 *                       page: 1
 *                       limit: 20
 *                       totalPages: 0
 *                     filters_applied:
 *                       gender: 'FEMALE'
 *                       min_age: 35
 *                       max_age: 40
 *                       city: 'RareCity'
 *                     execution_time_ms: 89
 *       400:
 *         description: Bad request - Invalid parameters
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
 *                   example: 'Page and limit must be positive integers'
 *       401:
 *         description: Unauthorized - Authentication required
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
 *                   example: 'Access token required. Please login.'
 *       500:
 *         description: Server error
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
 *                   example: 'An unexpected error occurred'
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(profileListingController.getAllProfiles.bind(profileListingController))
);

export default router;
