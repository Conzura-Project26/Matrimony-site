import express from 'express';
import profileController from '../controllers/profileController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizePermission, checkOwnership } from '../middleware/authorization.js';

const router = express.Router();

/**
 * @swagger
 * /users/{userId}/family:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Create family details for a user
 *     description: Create family details for a user. Users can only create their own family details. ADMIN can create for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               father_occupation:
 *                 type: string
 *                 maxLength: 150
 *                 description: Father's occupation
 *                 example: 'Business Owner'
 *               mother_occupation:
 *                 type: string
 *                 maxLength: 150
 *                 description: Mother's occupation
 *                 example: 'Teacher'
 *               siblings_details:
 *                 type: string
 *                 description: Details about siblings (free text)
 *                 example: '2 brothers, 1 sister. Elder brother is married.'
 *               family_values:
 *                 type: string
 *                 enum: [Orthodox, Traditional, Moderate, Liberal, Progressive]
 *                 description: Family values orientation
 *                 example: 'Moderate'
 *           examples:
 *             complete:
 *               summary: Complete family details
 *               value:
 *                 father_occupation: 'Business Owner'
 *                 mother_occupation: 'Homemaker'
 *                 siblings_details: '1 brother (married), 1 sister (unmarried)'
 *                 family_values: 'Traditional'
 *             partial:
 *               summary: Partial family details
 *               value:
 *                 father_occupation: 'Doctor'
 *                 family_values: 'Moderate'
 *             empty:
 *               summary: Empty record (all optional)
 *               value: {}
 *     responses:
 *       201:
 *         description: Family details created successfully
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
 *                   example: 'Family details created successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     family_details:
 *                       $ref: '#/components/schemas/FamilyDetails'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User can only create their own family details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Family details already exist - use PUT to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/family',
  authenticateToken,
  authorizePermission(['create_own_family_details', 'manage_family_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'family details' }),
  asyncHandler((req, res) => profileController.createFamilyDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/family:
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update family details for a user
 *     description: Update family details for a user. Users can only update their own family details. ADMIN can update for any user. Supports partial updates.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               father_occupation:
 *                 type: string
 *                 maxLength: 150
 *                 description: Father's occupation
 *                 example: 'Business Owner'
 *               mother_occupation:
 *                 type: string
 *                 maxLength: 150
 *                 description: Mother's occupation
 *                 example: 'Teacher'
 *               siblings_details:
 *                 type: string
 *                 description: Details about siblings (free text)
 *                 example: '2 brothers, 1 sister. Elder brother is married.'
 *               family_values:
 *                 type: string
 *                 enum: [Orthodox, Traditional, Moderate, Liberal, Progressive]
 *                 description: Family values orientation
 *                 example: 'Moderate'
 *           examples:
 *             updateValues:
 *               summary: Update only family values
 *               value:
 *                 family_values: 'Liberal'
 *             updateSiblings:
 *               summary: Update siblings details
 *               value:
 *                 siblings_details: '2 brothers (both married), 1 younger sister'
 *             updateMultiple:
 *               summary: Update multiple fields
 *               value:
 *                 father_occupation: 'Retired Government Employee'
 *                 mother_occupation: 'Homemaker'
 *                 family_values: 'Traditional'
 *     responses:
 *       200:
 *         description: Family details updated successfully
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
 *                   example: 'Family details updated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     family_details:
 *                       $ref: '#/components/schemas/FamilyDetails'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User can only update their own family details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or family details not found - use POST to create
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:userId/family',
  authenticateToken,
  authorizePermission(['edit_own_family_details', 'manage_family_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'family details' }),
  asyncHandler((req, res) => profileController.updateFamilyDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/family:
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get family details for a user
 *     description: Get family details for a user. Users can view their own and others' family details for matchmaking purposes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     responses:
 *       200:
 *         description: Family details retrieved successfully
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
 *                   example: 'Family details retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     family_details:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/FamilyDetails'
 *                         - type: object
 *                           description: Empty object if no family details exist
 *                           example: {}
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                         gender:
 *                           type: string
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:userId/family',
  authenticateToken,
  authorizePermission(['view_family_details']),
  asyncHandler((req, res) => profileController.getFamilyDetails(req, res))
);

// ============================================
// HOROSCOPE DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/horoscope:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Create horoscope details for a user
 *     description: Create horoscope details for a user. Users can only create their own horoscope details. ADMIN can create for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rasi:
 *                 type: string
 *                 description: Rasi (Moon Sign/Zodiac)
 *                 enum:
 *                   - Mesha (Aries)
 *                   - Vrishabha (Taurus)
 *                   - Mithuna (Gemini)
 *                   - Karka (Cancer)
 *                   - Simha (Leo)
 *                   - Kanya (Virgo)
 *                   - Tula (Libra)
 *                   - Vrishchika (Scorpio)
 *                   - Dhanu (Sagittarius)
 *                   - Makara (Capricorn)
 *                   - Kumbha (Aquarius)
 *                   - Meena (Pisces)
 *                 example: 'Mesha (Aries)'
 *               nakshatra:
 *                 type: string
 *                 description: Nakshatra (Birth Star)
 *                 enum:
 *                   - Ashwini
 *                   - Bharani
 *                   - Krittika
 *                   - Rohini
 *                   - Mrigashira
 *                   - Ardra
 *                   - Punarvasu
 *                   - Pushya
 *                   - Ashlesha
 *                   - Magha
 *                   - Purva Phalguni
 *                   - Uttara Phalguni
 *                   - Hasta
 *                   - Chitra
 *                   - Swati
 *                   - Vishakha
 *                   - Anuradha
 *                   - Jyeshtha
 *                   - Mula
 *                   - Purva Ashadha
 *                   - Uttara Ashadha
 *                   - Shravana
 *                   - Dhanishta
 *                   - Shatabhisha
 *                   - Purva Bhadrapada
 *                   - Uttara Bhadrapada
 *                   - Revati
 *                 example: 'Ashwini'
 *               time_of_birth:
 *                 type: string
 *                 pattern: '^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$'
 *                 description: Time of birth in 12-hour format (HH:MM AM/PM)
 *                 example: '02:30 PM'
 *               place_of_birth:
 *                 type: string
 *                 maxLength: 150
 *                 description: Place of birth (city, state, country)
 *                 example: 'Chennai, Tamil Nadu, India'
 *           examples:
 *             complete:
 *               summary: Complete horoscope details
 *               value:
 *                 rasi: 'Mesha (Aries)'
 *                 nakshatra: 'Ashwini'
 *                 time_of_birth: '02:30 PM'
 *                 place_of_birth: 'Chennai, Tamil Nadu, India'
 *             partial:
 *               summary: Partial horoscope details (all fields optional)
 *               value:
 *                 rasi: 'Kanya (Virgo)'
 *                 place_of_birth: 'Mumbai, Maharashtra, India'
 *     responses:
 *       201:
 *         description: Horoscope details created successfully
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
 *                   example: 'Horoscope details created successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     horoscope_details:
 *                       $ref: '#/components/schemas/HoroscopeDetails'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *       400:
 *         description: Invalid request body or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions or inactive user
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - Horoscope details already exist (use PUT to update)
 */
router.post(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['create_own_horoscope_details', 'manage_horoscope_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'horoscope details' }),
  asyncHandler(async (req, res) => profileController.createHoroscopeDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/horoscope:
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update horoscope details for a user
 *     description: Update horoscope details for a user. Users can only update their own horoscope details. ADMIN can update for any user. All fields are optional for partial updates.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rasi:
 *                 type: string
 *                 description: Rasi (Moon Sign/Zodiac)
 *                 enum:
 *                   - Mesha (Aries)
 *                   - Vrishabha (Taurus)
 *                   - Mithuna (Gemini)
 *                   - Karka (Cancer)
 *                   - Simha (Leo)
 *                   - Kanya (Virgo)
 *                   - Tula (Libra)
 *                   - Vrishchika (Scorpio)
 *                   - Dhanu (Sagittarius)
 *                   - Makara (Capricorn)
 *                   - Kumbha (Aquarius)
 *                   - Meena (Pisces)
 *                 example: 'Simha (Leo)'
 *               nakshatra:
 *                 type: string
 *                 description: Nakshatra (Birth Star)
 *                 enum:
 *                   - Ashwini
 *                   - Bharani
 *                   - Krittika
 *                   - Rohini
 *                   - Mrigashira
 *                   - Ardra
 *                   - Punarvasu
 *                   - Pushya
 *                   - Ashlesha
 *                   - Magha
 *                   - Purva Phalguni
 *                   - Uttara Phalguni
 *                   - Hasta
 *                   - Chitra
 *                   - Swati
 *                   - Vishakha
 *                   - Anuradha
 *                   - Jyeshtha
 *                   - Mula
 *                   - Purva Ashadha
 *                   - Uttara Ashadha
 *                   - Shravana
 *                   - Dhanishta
 *                   - Shatabhisha
 *                   - Purva Bhadrapada
 *                   - Uttara Bhadrapada
 *                   - Revati
 *                 example: 'Magha'
 *               time_of_birth:
 *                 type: string
 *                 pattern: '^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$'
 *                 description: Time of birth in 12-hour format (HH:MM AM/PM)
 *                 example: '05:45 AM'
 *               place_of_birth:
 *                 type: string
 *                 maxLength: 150
 *                 description: Place of birth (city, state, country)
 *                 example: 'Bangalore, Karnataka, India'
 *           examples:
 *             updateTime:
 *               summary: Update only time of birth
 *               value:
 *                 time_of_birth: '11:30 PM'
 *             updateMultiple:
 *               summary: Update multiple fields
 *               value:
 *                 nakshatra: 'Rohini'
 *                 place_of_birth: 'Hyderabad, Telangana, India'
 *     responses:
 *       200:
 *         description: Horoscope details updated successfully
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
 *                   example: 'Horoscope details updated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     horoscope_details:
 *                       $ref: '#/components/schemas/HoroscopeDetails'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *       400:
 *         description: Invalid request body or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions or inactive user
 *       404:
 *         description: User or horoscope details not found (use POST to create)
 */
router.put(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['edit_own_horoscope_details', 'manage_horoscope_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'horoscope details' }),
  asyncHandler(async (req, res) => profileController.updateHoroscopeDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/horoscope:
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get horoscope details for a user
 *     description: Retrieve horoscope details for a user. All authenticated users can view horoscope details of any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     responses:
 *       200:
 *         description: Horoscope details retrieved successfully (or empty if not created yet)
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
 *                   example: 'Horoscope details retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     horoscope_details:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/HoroscopeDetails'
 *                         - type: object
 *                           description: Empty object if no horoscope details exist
 *                           example: {}
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                         gender:
 *                           type: string
 *             examples:
 *               withDetails:
 *                 summary: User with horoscope details
 *                 value:
 *                   success: true
 *                   message: 'Horoscope details retrieved successfully'
 *                   data:
 *                     horoscope_details:
 *                       user_id: '550e8400-e29b-41d4-a716-446655440000'
 *                       rasi: 'Mesha (Aries)'
 *                       nakshatra: 'Ashwini'
 *                       time_of_birth: '1970-01-01T09:00:00.000Z'
 *                       place_of_birth: 'Chennai, Tamil Nadu, India'
 *                     user:
 *                       id: '550e8400-e29b-41d4-a716-446655440000'
 *                       full_name: 'John Doe'
 *                       gender: 'Male'
 *               withoutDetails:
 *                 summary: User without horoscope details
 *                 value:
 *                   success: true
 *                   message: 'No horoscope details found for this user'
 *                   data:
 *                     horoscope_details: {}
 *                     user:
 *                       id: '550e8400-e29b-41d4-a716-446655440000'
 *                       full_name: 'Jane Smith'
 *                       gender: 'Female'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Inactive user
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['view_horoscope_details']),
  asyncHandler(async (req, res) => profileController.getHoroscopeDetails(req, res))
);

/**
 * @swagger
 * components:
 *   schemas:
 *     FamilyDetails:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID
 *         father_occupation:
 *           type: string
 *           nullable: true
 *           description: Father's occupation
 *           example: 'Business Owner'
 *         mother_occupation:
 *           type: string
 *           nullable: true
 *           description: Mother's occupation
 *           example: 'Teacher'
 *         siblings_details:
 *           type: string
 *           nullable: true
 *           description: Details about siblings
 *           example: '2 brothers, 1 sister. Elder brother is married.'
 *         family_values:
 *           type: string
 *           nullable: true
 *           enum: [Orthodox, Traditional, Moderate, Liberal, Progressive]
 *           description: Family values orientation
 *           example: 'Moderate'
 *     HoroscopeDetails:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID
 *         rasi:
 *           type: string
 *           nullable: true
 *           enum:
 *             - Mesha (Aries)
 *             - Vrishabha (Taurus)
 *             - Mithuna (Gemini)
 *             - Karka (Cancer)
 *             - Simha (Leo)
 *             - Kanya (Virgo)
 *             - Tula (Libra)
 *             - Vrishchika (Scorpio)
 *             - Dhanu (Sagittarius)
 *             - Makara (Capricorn)
 *             - Kumbha (Aquarius)
 *             - Meena (Pisces)
 *           description: Rasi (Moon Sign/Zodiac)
 *           example: 'Mesha (Aries)'
 *         nakshatra:
 *           type: string
 *           nullable: true
 *           enum:
 *             - Ashwini
 *             - Bharani
 *             - Krittika
 *             - Rohini
 *             - Mrigashira
 *             - Ardra
 *             - Punarvasu
 *             - Pushya
 *             - Ashlesha
 *             - Magha
 *             - Purva Phalguni
 *             - Uttara Phalguni
 *             - Hasta
 *             - Chitra
 *             - Swati
 *             - Vishakha
 *             - Anuradha
 *             - Jyeshtha
 *             - Mula
 *             - Purva Ashadha
 *             - Uttara Ashadha
 *             - Shravana
 *             - Dhanishta
 *             - Shatabhisha
 *             - Purva Bhadrapada
 *             - Uttara Bhadrapada
 *             - Revati
 *           description: Nakshatra (Birth Star)
 *           example: 'Ashwini'
 *         time_of_birth:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Time of birth (stored as DateTime, displayed in 12-hour format)
 *           example: '1970-01-01T14:30:00.000Z'
 *         place_of_birth:
 *           type: string
 *           nullable: true
 *           maxLength: 150
 *           description: Place of birth (city, state, country)
 *           example: 'Chennai, Tamil Nadu, India'
 */

// ============================================
// PARTNER PREFERENCES ROUTES (Phase 2 - Task 2.7)
// ============================================

/**
 * @swagger
 * /users/{userId}/preferences:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Create partner preferences for a user
 *     description: Create partner preferences for a user. Users can only create their own preferences. ADMIN can create for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               min_age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *               max_age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *               min_height:
 *                 type: integer
 *                 minimum: 120
 *                 maximum: 250
 *               max_height:
 *                 type: integer
 *                 minimum: 120
 *                 maximum: 250
 *               religion_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of religion IDs
 *               caste_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of caste IDs
 *               education_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               profession_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               location_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               marital_status_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never Married, Divorced, Widowed, Awaiting Divorce, Separated, Annulled]
 *               mother_tongue_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               income_preference_min:
 *                 type: string
 *                 enum: [Below 2 Lakhs, 2 - 5 Lakhs, 5 - 10 Lakhs, 10 - 15 Lakhs, 15 - 20 Lakhs, 20 - 30 Lakhs, 30 - 50 Lakhs, Above 50 Lakhs]
 *               income_preference_max:
 *                 type: string
 *                 enum: [Below 2 Lakhs, 2 - 5 Lakhs, 5 - 10 Lakhs, 10 - 15 Lakhs, 15 - 20 Lakhs, 20 - 30 Lakhs, 30 - 50 Lakhs, Above 50 Lakhs]
 *               diet_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Vegetarian, Non-Vegetarian, Eggetarian, Vegan]
 *               drinking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never, Occasionally, Socially, Regularly]
 *               smoking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never, Occasionally, Socially, Regularly]
 *     responses:
 *       201:
 *         description: Partner preferences created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Partner preferences already exist
 */
router.post(
  '/:userId/preferences',
  authenticateToken,
  authorizePermission(['create_own_partner_preferences', 'manage_partner_preferences']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'partner preferences' }),
  asyncHandler((req, res) => profileController.createPartnerPreferences(req, res))
);

/**
 * @swagger
 * /users/{userId}/preferences:
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update partner preferences for a user
 *     description: Update partner preferences for a user. Supports partial updates. Users can only update their own preferences. ADMIN can update for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               min_age:
 *                 type: integer
 *               max_age:
 *                 type: integer
 *               religion_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Partner preferences updated successfully
 *       404:
 *         description: Partner preferences not found
 */
router.put(
  '/:userId/preferences',
  authenticateToken,
  authorizePermission(['edit_own_partner_preferences', 'manage_partner_preferences']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'partner preferences' }),
  asyncHandler((req, res) => profileController.updatePartnerPreferences(req, res))
);

/**
 * @swagger
 * /users/{userId}/preferences:
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get partner preferences for a user
 *     description: Retrieve partner preferences. Viewable by user themselves, admins, and other users for matching purposes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Partner preferences retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId/preferences',
  authenticateToken,
  authorizePermission(['view_partner_preferences']),
  asyncHandler((req, res) => profileController.getPartnerPreferences(req, res))
);

/**
 * @swagger
 * /users/{userId}/preferences/match/{targetUserId}:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Calculate match score between user's preferences and target user's profile
 *     description: Calculate how well target user matches the specified user's partner preferences using weighted scoring algorithm.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User whose preferences to use
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User to check match against
 *       - in: query
 *         name: enhanced
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Use enhanced scoring with bonus attributes
 *     responses:
 *       200:
 *         description: Match score calculated successfully
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
 *                     match_result:
 *                       type: object
 *                       properties:
 *                         match:
 *                           type: boolean
 *                           description: Whether the match passed hard filters
 *                         matchPercentage:
 *                           type: integer
 *                           description: Overall match percentage (0-100)
 *                         totalScore:
 *                           type: number
 *                           description: Total score achieved
 *                         maxScore:
 *                           type: integer
 *                           description: Maximum possible score
 *                         breakdown:
 *                           type: object
 *                           description: Detailed breakdown by category
 *       404:
 *         description: User or preferences not found
 */
router.post(
  '/:userId/preferences/match/:targetUserId',
  authenticateToken,
  authorizePermission(['view_partner_preferences', 'search_profiles']),
  asyncHandler((req, res) => profileController.calculatePreferenceMatch(req, res))
);

export default router;
