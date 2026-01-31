import express from 'express';
import userProfileController from '../../controllers/userProfileController.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: User profile management APIs (Personal Details CRUD)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PersonalDetails:
 *       type: object
 *       properties:
 *         height_cm:
 *           type: integer
 *           minimum: 120
 *           maximum: 250
 *           description: Height in centimeters
 *           example: 170
 *         weight_kg:
 *           type: integer
 *           minimum: 30
 *           maximum: 200
 *           description: Weight in kilograms
 *           example: 65
 *         marital_status:
 *           type: string
 *           enum: [Never Married, Divorced, Widowed, Awaiting Divorce, Separated, Annulled]
 *           example: Never Married
 *         physical_status:
 *           type: string
 *           enum: [Normal, Visually Impaired, Hearing Impaired, Mobility Impaired, Other]
 *           example: Normal
 *         mother_tongue:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Hindi
 *         complexion:
 *           type: string
 *           enum: [Very Fair, Fair, Wheatish, Wheatish Brown, Dark]
 *           example: Fair
 *         body_type:
 *           type: string
 *           enum: [Slim, Average, Athletic, Heavy]
 *           example: Average
 *         blood_group:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *           example: O+
 *         diet_preference:
 *           type: string
 *           enum: [Vegetarian, Non-Vegetarian, Eggetarian, Vegan]
 *           example: Vegetarian
 *         drinking_habit:
 *           type: string
 *           enum: [Never, Occasionally, Socially, Regularly]
 *           example: Never
 *         smoking_habit:
 *           type: string
 *           enum: [Never, Occasionally, Socially, Regularly]
 *           example: Never
 *         about_me:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Brief introduction about yourself
 *           example: I am a software engineer with a passion for technology and travel.
 *     
 *     PersonalDetailsResponse:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         height_cm:
 *           type: integer
 *         weight_kg:
 *           type: integer
 *         marital_status:
 *           type: string
 *         physical_status:
 *           type: string
 *         mother_tongue:
 *           type: string
 *         complexion:
 *           type: string
 *         body_type:
 *           type: string
 *         blood_group:
 *           type: string
 *         diet_preference:
 *           type: string
 *         drinking_habit:
 *           type: string
 *         smoking_habit:
 *           type: string
 *         about_me:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     ProfileCompletion:
 *       type: object
 *       properties:
 *         percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         status:
 *           type: string
 *           enum: [Just Started, In Progress, Almost Complete, Complete]
 */

/**
 * @swagger
 * /users/{userId}/personal:
 *   post:
 *     tags:
 *       - User Profile
 *     summary: Create personal details
 *     description: Create new personal details for a user. Returns error if details already exist. Users can create their own details. Admins can create details for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalDetails'
 *           examples:
 *             complete:
 *               summary: Complete personal details
 *               value:
 *                 height_cm: 170
 *                 weight_kg: 65
 *                 marital_status: Never Married
 *                 physical_status: Normal
 *                 mother_tongue: Hindi
 *                 complexion: Fair
 *                 body_type: Average
 *                 blood_group: O+
 *                 diet_preference: Vegetarian
 *                 drinking_habit: Never
 *                 smoking_habit: Never
 *                 about_me: I am a software engineer with a passion for technology and travel. Looking for a life partner who shares similar values.
 *             partial:
 *               summary: Partial details
 *               value:
 *                 height_cm: 175
 *                 weight_kg: 70
 *                 marital_status: Never Married
 *     responses:
 *       201:
 *         description: Personal details created successfully
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
 *                   example: Personal details created successfully
 *                 data:
 *                   $ref: '#/components/schemas/PersonalDetailsResponse'
 *       400:
 *         description: Validation error or details already exist
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
 *                   example: Personal details already exist. Use PUT to update.
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - No permission to modify this user's details
 *       404:
 *         description: User not found
 * 
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update personal details
 *     description: Update existing personal details. Returns error if details don't exist. Users can update their own details. Admins can update details for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalDetails'
 *           examples:
 *             partial_update:
 *               summary: Partial update
 *               value:
 *                 height_cm: 180
 *                 weight_kg: 75
 *                 about_me: Updated description
 *     responses:
 *       200:
 *         description: Personal details updated successfully
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
 *                   example: Personal details updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/PersonalDetailsResponse'
 *       400:
 *         description: Validation error or details don't exist
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
 *                   example: Personal details do not exist. Use POST to create first.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 * 
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get personal details with user info
 *     description: Retrieve complete personal details along with basic user information and profile completion percentage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     responses:
 *       200:
 *         description: Personal details retrieved successfully
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
 *                     user_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                         gender:
 *                           type: string
 *                         date_of_birth:
 *                           type: string
 *                           format: date
 *                         age:
 *                           type: integer
 *                         mobile_number:
 *                           type: string
 *                         email:
 *                           type: string
 *                         profile_created_by:
 *                           type: string
 *                         is_mobile_verified:
 *                           type: boolean
 *                         is_email_verified:
 *                           type: boolean
 *                         is_profile_verified:
 *                           type: boolean
 *                         is_active:
 *                           type: boolean
 *                     personal_details:
 *                       allOf:
 *                         - $ref: '#/components/schemas/PersonalDetailsResponse'
 *                         - type: object
 *                           properties:
 *                             height_display:
 *                               type: string
 *                               example: 5 ft 7 in (170 cm)
 *                     profile_completion:
 *                       $ref: '#/components/schemas/ProfileCompletion'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/:userId/personal', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createPersonalDetails(req, res))
);

router.put('/:userId/personal', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updatePersonalDetails(req, res))
);

router.get('/:userId/personal', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getPersonalDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/profile-completion:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get detailed profile completion status
 *     description: Get detailed breakdown of profile completion percentage with section-wise completion status and next suggested steps
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     responses:
 *       200:
 *         description: Profile completion status retrieved successfully
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
 *                     overall_completion:
 *                       type: integer
 *                       example: 45
 *                     status:
 *                       type: string
 *                       example: In Progress
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         basic_info:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: boolean
 *                             fields:
 *                               type: object
 *                         personal_details:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: boolean
 *                             fields_filled:
 *                               type: integer
 *                             total_fields:
 *                               type: integer
 *                         caste_details:
 *                           type: object
 *                         education_details:
 *                           type: object
 *                         professional_details:
 *                           type: object
 *                         family_details:
 *                           type: object
 *                         horoscope_details:
 *                           type: object
 *                         photos:
 *                           type: object
 *                         partner_preferences:
 *                           type: object
 *                     next_steps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - Complete your personal details (height, weight, etc.)
 *                         - Add your education qualifications
 *                         - Upload your profile photos
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only view own completion status
 *       404:
 *         description: User not found
 */
router.get('/:userId/profile-completion', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getProfileCompletion(req, res))
);

// ============================================
// CASTE DETAILS ROUTES (Phase 2 - Task 2.2)
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     CasteDetails:
 *       type: object
 *       properties:
 *         religion_id:
 *           type: integer
 *           description: Religion ID
 *           example: 1
 *         caste_id:
 *           type: integer
 *           description: Caste ID (must belong to the religion)
 *           example: 5
 *         sub_caste_id:
 *           type: integer
 *           description: Sub-caste ID (must belong to the caste)
 *           example: 12
 *         community_details:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *           description: Additional community or gothra details
 *           example: Belongs to Kashyap Gothra, follows traditional customs
 *     
 *     CasteDetailsResponse:
 *       type: object
 *       properties:
 *         religion_id:
 *           type: integer
 *         religion_name:
 *           type: string
 *         caste_id:
 *           type: integer
 *         caste_name:
 *           type: string
 *         sub_caste_id:
 *           type: integer
 *         sub_caste_name:
 *           type: string
 *         community_details:
 *           type: string
 */

/**
 * @swagger
 * /users/{userId}/caste:
 *   post:
 *     tags:
 *       - User Profile
 *     summary: Create caste details
 *     description: Create new caste details for a user. Returns error if details already exist. All fields optional. Users can create their own details. Admins can create details for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CasteDetails'
 *           examples:
 *             complete:
 *               summary: Complete caste details
 *               value:
 *                 religion_id: 1
 *                 caste_id: 5
 *                 sub_caste_id: 12
 *                 community_details: Belongs to Kashyap Gothra, follows traditional customs
 *             religion_only:
 *               summary: Religion only
 *               value:
 *                 religion_id: 2
 *             with_caste:
 *               summary: Religion and caste
 *               value:
 *                 religion_id: 1
 *                 caste_id: 8
 *     responses:
 *       201:
 *         description: Caste details created successfully
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
 *                   example: Caste details created successfully
 *                 data:
 *                   $ref: '#/components/schemas/CasteDetailsResponse'
 *       400:
 *         description: Validation error, details already exist, or hierarchy error
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
 *                   examples:
 *                     - Caste details already exist. Use PUT to update.
 *                     - Selected caste does not belong to your current religion.
 *                     - Selected religion is no longer active. Please choose another.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found or selected religion/caste/sub-caste not found
 * 
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update caste details
 *     description: Update existing caste details. If religion changes, caste and sub-caste are auto-cleared. Returns error if details don't exist. Users can update their own details. Admins can update details for any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CasteDetails'
 *           examples:
 *             change_religion:
 *               summary: Change religion (auto-clears caste)
 *               value:
 *                 religion_id: 3
 *             update_caste:
 *               summary: Update caste only
 *               value:
 *                 caste_id: 10
 *             add_subcaste:
 *               summary: Add sub-caste
 *               value:
 *                 sub_caste_id: 25
 *     responses:
 *       200:
 *         description: Caste details updated successfully
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
 *                   examples:
 *                     - Caste details updated successfully
 *                     - Religion updated. Caste and sub-caste have been reset. Please select caste again for the new religion.
 *                 data:
 *                   $ref: '#/components/schemas/CasteDetailsResponse'
 *       400:
 *         description: Validation error or details don't exist
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
 *                   examples:
 *                     - Caste details do not exist. Use POST to create first.
 *                     - Selected caste does not belong to your current religion.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 * 
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get caste details with user info
 *     description: Retrieve complete caste details with religion/caste/sub-caste names along with basic user information and profile completion percentage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID)
 *     responses:
 *       200:
 *         description: Caste details retrieved successfully
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
 *                     user_info:
 *                       type: object
 *                       description: Basic user information
 *                     caste_details:
 *                       allOf:
 *                         - $ref: '#/components/schemas/CasteDetailsResponse'
 *                         - type: object
 *                           example:
 *                             religion_id: 1
 *                             religion_name: Hinduism
 *                             caste_id: 5
 *                             caste_name: Brahmin
 *                             sub_caste_id: 12
 *                             sub_caste_name: Iyer
 *                             community_details: Belongs to Kashyap Gothra
 *                     profile_completion:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: integer
 *                         status:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

router.post('/:userId/caste', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createCasteDetails(req, res))
);

router.put('/:userId/caste', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updateCasteDetails(req, res))
);

router.get('/:userId/caste', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getCasteDetails(req, res))
);

// ============================================
// EDUCATION DETAILS ROUTES (Phase 2 - Task 2.3)
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     EducationDetails:
 *       type: object
 *       required:
 *         - highest_qualification
 *         - institution_name
 *         - year_of_passing
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated education entry ID
 *           example: 1
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID (auto-populated)
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         highest_qualification:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           description: Qualification name (free text)
 *           example: "Bachelor of Engineering in Computer Science"
 *         institution_name:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Name of educational institution
 *           example: "Anna University, Chennai"
 *         year_of_passing:
 *           type: integer
 *           minimum: 1950
 *           description: Year of passing/completion (birth_year + 15 to current_year + 5)
 *           example: 2020
 *     
 *     EducationDetailsUpdate:
 *       type: object
 *       properties:
 *         highest_qualification:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           description: Qualification name (optional for update)
 *           example: "Master of Computer Applications"
 *         institution_name:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Institution name (optional for update)
 *           example: "Indian Institute of Technology, Madras"
 *         year_of_passing:
 *           type: integer
 *           description: Year of passing (optional for update)
 *           example: 2022
 *
 *     EducationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           description: Total number of education entries
 *           example: 2
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EducationDetails'
 */

/**
 * @swagger
 * /users/{userId}/education:
 *   post:
 *     summary: Create education entry
 *     description: |
 *       Add a new education qualification for a user.
 *       
 *       **Authorization:**
 *       - User can add their own education
 *       - Admin can add for any user
 *       - Moderators CANNOT add education entries
 *       
 *       **Validation Rules:**
 *       - All 3 fields are mandatory (qualification, institution, year)
 *       - Year must be between (birth_year + 15) and (current_year + 5)
 *       - Maximum 5 education entries per user
 *       - Duplicate entries (same qualification + institution + year) are prevented
 *       
 *       **Business Logic:**
 *       - Creates audit log
 *       - Updates profile completion percentage
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - highest_qualification
 *               - institution_name
 *               - year_of_passing
 *             properties:
 *               highest_qualification:
 *                 type: string
 *                 example: "Bachelor of Technology in Electronics"
 *               institution_name:
 *                 type: string
 *                 example: "National Institute of Technology, Trichy"
 *               year_of_passing:
 *                 type: integer
 *                 example: 2019
 *           examples:
 *             bachelor_degree:
 *               summary: Bachelor's Degree
 *               value:
 *                 highest_qualification: "Bachelor of Engineering in Computer Science"
 *                 institution_name: "Anna University, Chennai"
 *                 year_of_passing: 2020
 *             master_degree:
 *               summary: Master's Degree
 *               value:
 *                 highest_qualification: "Master of Business Administration"
 *                 institution_name: "Indian Institute of Management, Bangalore"
 *                 year_of_passing: 2022
 *             phd:
 *               summary: PhD/Doctorate
 *               value:
 *                 highest_qualification: "Doctor of Philosophy in Artificial Intelligence"
 *                 institution_name: "Indian Institute of Science, Bangalore"
 *                 year_of_passing: 2025
 *     responses:
 *       201:
 *         description: Education entry created successfully
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
 *                   example: "Education entry created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EducationDetails'
 *       400:
 *         description: Validation error or business rule violation
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
 *             examples:
 *               max_entries:
 *                 summary: Maximum entries limit reached
 *                 value:
 *                   success: false
 *                   message: "Maximum 5 education entries allowed per user"
 *               duplicate:
 *                 summary: Duplicate entry
 *                 value:
 *                   success: false
 *                   message: "Duplicate education entry. This qualification, institution, and year combination already exists."
 *               invalid_year:
 *                 summary: Invalid year of passing
 *                 value:
 *                   success: false
 *                   message: "Year of passing cannot be before 2012 (15 years after birth year 1997)"
 *               missing_fields:
 *                 summary: Required fields missing
 *                 value:
 *                   success: false
 *                   message: "Qualification must be at least 2 characters, Institution name must be at least 3 characters"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User lacks permission to modify education
 *       404:
 *         description: User not found
 */
router.post('/:userId/education', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createEducation(req, res))
);

/**
 * @swagger
 * /users/{userId}/education/{eduId}:
 *   put:
 *     summary: Update education entry
 *     description: |
 *       Update an existing education qualification.
 *       
 *       **Authorization:**
 *       - User can update their own education
 *       - Admin can update any user's education
 *       - Moderators CANNOT update education entries
 *       
 *       **Validation Rules:**
 *       - Partial updates allowed (PATCH-style)
 *       - At least one field must be provided
 *       - Year validation applies if year is updated
 *       - Duplicate check applies for the final combination
 *       - eduId must belong to the specified userId
 *       
 *       **Business Logic:**
 *       - Creates audit log
 *       - Does NOT trigger profile re-verification
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: path
 *         name: eduId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education entry ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EducationDetailsUpdate'
 *           examples:
 *             update_qualification:
 *               summary: Update only qualification
 *               value:
 *                 highest_qualification: "Master of Science in Data Science"
 *             update_institution:
 *               summary: Update only institution
 *               value:
 *                 institution_name: "Stanford University"
 *             update_year:
 *               summary: Update only year
 *               value:
 *                 year_of_passing: 2023
 *             update_all:
 *               summary: Update all fields
 *               value:
 *                 highest_qualification: "Doctor of Philosophy in Machine Learning"
 *                 institution_name: "Massachusetts Institute of Technology"
 *                 year_of_passing: 2026
 *     responses:
 *       200:
 *         description: Education entry updated successfully
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
 *                   example: "Education entry updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EducationDetails'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Education entry does not belong to user or lacks permission
 *       404:
 *         description: User or education entry not found
 */
router.put('/:userId/education/:eduId', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updateEducation(req, res))
);

/**
 * @swagger
 * /users/{userId}/education/{eduId}:
 *   delete:
 *     summary: Delete education entry
 *     description: |
 *       Remove an education qualification from user's profile.
 *       
 *       **Authorization:**
 *       - User can delete their own education
 *       - Admin can delete any user's education
 *       - Moderators CANNOT delete education entries
 *       
 *       **Validation Rules:**
 *       - eduId must belong to the specified userId
 *       
 *       **Business Logic:**
 *       - Creates audit log
 *       - Updates profile completion percentage (reduces accordingly)
 *       - Permanent deletion (no soft delete)
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: path
 *         name: eduId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education entry ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Education entry deleted successfully
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
 *                   example: "Education entry deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Education entry does not belong to user or lacks permission
 *       404:
 *         description: User or education entry not found
 */
router.delete('/:userId/education/:eduId', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.deleteEducation(req, res))
);

/**
 * @swagger
 * /users/{userId}/education:
 *   get:
 *     summary: Get all education entries
 *     description: |
 *       Retrieve all education qualifications for a user.
 *       
 *       **Authorization:**
 *       - Public access (anyone can view)
 *       - Useful for profile browsing
 *       
 *       **Response Format:**
 *       - Returns array of education entries
 *       - Sorted by year_of_passing DESC (most recent first)
 *       - Includes total count
 *       
 *       **Business Logic:**
 *       - No authentication required (public endpoint)
 *       - Empty array if no education entries
 *     tags: [User Profile]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Education entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EducationListResponse'
 *             examples:
 *               multiple_entries:
 *                 summary: User with multiple education entries
 *                 value:
 *                   success: true
 *                   count: 3
 *                   data:
 *                     - id: 3
 *                       user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                       highest_qualification: "Doctor of Philosophy in Computer Science"
 *                       institution_name: "Indian Institute of Science, Bangalore"
 *                       year_of_passing: 2025
 *                     - id: 2
 *                       user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                       highest_qualification: "Master of Technology in AI"
 *                       institution_name: "IIT Madras"
 *                       year_of_passing: 2022
 *                     - id: 1
 *                       user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                       highest_qualification: "Bachelor of Engineering"
 *                       institution_name: "Anna University"
 *                       year_of_passing: 2020
 *               no_entries:
 *                 summary: User with no education entries
 *                 value:
 *                   success: true
 *                   count: 0
 *                   data: []
 *       404:
 *         description: User not found
 */
router.get('/:userId/education', 
  asyncHandler((req, res) => userProfileController.getAllEducation(req, res))
);

// ============================================
// PROFESSIONAL DETAILS ROUTES (Phase 2 - Task 2.4)
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ProfessionalDetails:
 *       type: object
 *       properties:
 *         occupation:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           description: Free text occupation (hybrid approach - internally mapped to categories)
 *           example: Software Engineer
 *         employment_type:
 *           type: string
 *           enum:
 *             - Government Job
 *             - Private Job
 *             - Business
 *             - Self-Employed
 *             - Freelancer / Consultant
 *             - Homemaker
 *             - Student
 *             - Retired
 *             - Not Working
 *           example: Private Job
 *         company_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           description: Company name (recommended for Government Job and Private Job)
 *           example: Google India
 *         designation:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           description: Job title or designation
 *           example: Senior Software Engineer
 *         years_of_experience:
 *           type: integer
 *           minimum: 0
 *           maximum: 60
 *           description: Total years of work experience
 *           example: 5
 *         annual_income_range:
 *           type: string
 *           enum:
 *             - Below 2 Lakhs
 *             - 2 - 5 Lakhs
 *             - 5 - 10 Lakhs
 *             - 10 - 15 Lakhs
 *             - 15 - 20 Lakhs
 *             - 20 - 30 Lakhs
 *             - 30 - 50 Lakhs
 *             - Above 50 Lakhs
 *           example: 20 - 30 Lakhs
 *         work_location:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           description: Work location (city/state - free text)
 *           example: Bangalore, Karnataka
 *       example:
 *         occupation: Software Engineer
 *         employment_type: Private Job
 *         company_name: Google India
 *         designation: Senior Software Engineer
 *         years_of_experience: 5
 *         annual_income_range: 20 - 30 Lakhs
 *         work_location: Bangalore, Karnataka
 *
 *     ProfessionalDetailsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Professional details retrieved successfully
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 full_name:
 *                   type: string
 *                   example: John Doe
 *                 profile_completion:
 *                   type: integer
 *                   example: 65
 *             professional_details:
 *               $ref: '#/components/schemas/ProfessionalDetails'
 */

/**
 * @swagger
 * /users/{userId}/professional:
 *   post:
 *     summary: Create professional details
 *     description: |
 *       Create professional details for a user. Fails if professional details already exist (409 Conflict).
 *       
 *       **Authorization:** Self + Admin only (NO Moderator)
 *       
 *       **Profile Completion Scoring (10 points):**
 *       - Core fields (8 pts): occupation=3pts, employment_type=3pts, annual_income_range=2pts
 *       - Enrichment fields (2 pts): company_name=1pt, work_location=1pt
 *       
 *       **Validation:**
 *       - All fields optional but recommended
 *       - Sanitization to prevent XSS/SQL injection
 *       - Only alphanumeric and basic punctuation allowed (.,&-/()')
 *       
 *       **Business Logic:**
 *       - company_name recommended for "Private Job" and "Government Job"
 *       - Any income range allowed regardless of employment type
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfessionalDetails'
 *           examples:
 *             software_engineer:
 *               summary: Software Engineer in Private Job
 *               value:
 *                 occupation: Software Engineer
 *                 employment_type: Private Job
 *                 company_name: Google India
 *                 designation: Senior Software Engineer
 *                 years_of_experience: 5
 *                 annual_income_range: 20 - 30 Lakhs
 *                 work_location: Bangalore, Karnataka
 *             business_owner:
 *               summary: Business Owner (no company name)
 *               value:
 *                 occupation: Entrepreneur
 *                 employment_type: Business
 *                 designation: Founder & CEO
 *                 years_of_experience: 10
 *                 annual_income_range: 30 - 50 Lakhs
 *                 work_location: Mumbai, Maharashtra
 *             government_employee:
 *               summary: Government Employee
 *               value:
 *                 occupation: Civil Engineer
 *                 employment_type: Government Job
 *                 company_name: Public Works Department
 *                 designation: Assistant Engineer
 *                 years_of_experience: 3
 *                 annual_income_range: 5 - 10 Lakhs
 *                 work_location: Chennai, Tamil Nadu
 *     responses:
 *       201:
 *         description: Professional details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalDetailsResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_characters:
 *                 summary: Invalid characters in occupation
 *                 value:
 *                   success: false
 *                   message: "Occupation contains invalid characters. Only letters, numbers, and basic punctuation (.,&-/()')  are allowed"
 *               field_too_long:
 *                 summary: Company name exceeds max length
 *                 value:
 *                   success: false
 *                   message: "Company name cannot exceed 200 characters"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User lacks permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "You do not have permission to modify this user's professional details"
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict - Professional details already exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Professional details already exist. Use PUT or PATCH to update."
 *       500:
 *         description: Internal server error
 */
router.post('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createProfessionalDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/professional:
 *   put:
 *     summary: Update professional details (full replacement)
 *     description: |
 *       Update professional details with full replacement. Requires at least one field.
 *       
 *       **Authorization:** Self + Admin only (NO Moderator)
 *       
 *       **Audit Logging:** Records before/after values for all changed fields
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfessionalDetails'
 *           examples:
 *             update_all_fields:
 *               summary: Update all fields
 *               value:
 *                 occupation: Senior Software Architect
 *                 employment_type: Private Job
 *                 company_name: Microsoft India
 *                 designation: Principal Engineer
 *                 years_of_experience: 8
 *                 annual_income_range: 30 - 50 Lakhs
 *                 work_location: Hyderabad, Telangana
 *             update_single_field:
 *               summary: Update only designation
 *               value:
 *                 designation: Lead Software Engineer
 *     responses:
 *       200:
 *         description: Professional details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalDetailsResponse'
 *       400:
 *         description: Validation error or no fields provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_fields:
 *                 summary: No fields provided
 *                 value:
 *                   success: false
 *                   message: "At least one field is required to update professional details"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or professional details not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               user_not_found:
 *                 summary: User does not exist
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *               details_not_found:
 *                 summary: Professional details not created yet
 *                 value:
 *                   success: false
 *                   message: "Professional details do not exist. Use POST to create first."
 *       500:
 *         description: Internal server error
 */
router.put('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updateProfessionalDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/professional:
 *   patch:
 *     summary: Patch professional details (partial update)
 *     description: |
 *       Update specific fields without full replacement. Requires at least one field.
 *       
 *       **Authorization:** Self + Admin only (NO Moderator)
 *       
 *       **Use Case:** Update individual fields like changing company or location
 *       
 *       **Audit Logging:** Records before/after values for changed fields only
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfessionalDetails'
 *           examples:
 *             update_company:
 *               summary: Update only company name
 *               value:
 *                 company_name: Amazon India
 *             update_location_income:
 *               summary: Update location and income
 *               value:
 *                 work_location: Pune, Maharashtra
 *                 annual_income_range: 20 - 30 Lakhs
 *             promotion_update:
 *               summary: Update after promotion
 *               value:
 *                 designation: Engineering Manager
 *                 annual_income_range: 30 - 50 Lakhs
 *     responses:
 *       200:
 *         description: Professional details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalDetailsResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or professional details not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.patchProfessionalDetails(req, res))
);

/**
 * @swagger
 * /users/{userId}/professional:
 *   get:
 *     summary: Get professional details
 *     description: |
 *       Retrieve professional details for a user.
 *       
 *       **Authorization:** Authenticated users only (no public access)
 *       
 *       **Returns:** User info + professional details + profile completion percentage
 *       
 *       **Use Case:** Viewing professional profile during matchmaking
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Professional details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalDetailsResponse'
 *             examples:
 *               complete_profile:
 *                 summary: Complete professional profile
 *                 value:
 *                   success: true
 *                   message: Professional details retrieved successfully
 *                   data:
 *                     user:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       full_name: John Doe
 *                       profile_completion: 72
 *                     professional_details:
 *                       user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                       occupation: Software Engineer
 *                       employment_type: Private Job
 *                       company_name: Google India
 *                       designation: Senior Software Engineer
 *                       years_of_experience: 5
 *                       annual_income_range: 20 - 30 Lakhs
 *                       work_location: Bangalore, Karnataka
 *                       created_at: "2026-01-30T10:15:00Z"
 *                       updated_at: "2026-01-30T10:15:00Z"
 *               partial_profile:
 *                 summary: Partial professional profile
 *                 value:
 *                   success: true
 *                   message: Professional details retrieved successfully
 *                   data:
 *                     user:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       full_name: Jane Smith
 *                       profile_completion: 55
 *                     professional_details:
 *                       user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                       occupation: Teacher
 *                       employment_type: Government Job
 *                       company_name: null
 *                       designation: null
 *                       years_of_experience: null
 *                       annual_income_range: 5 - 10 Lakhs
 *                       work_location: null
 *                       created_at: "2026-01-30T10:15:00Z"
 *                       updated_at: "2026-01-30T10:15:00Z"
 *       401:
 *         description: Unauthorized - User must be logged in
 *       404:
 *         description: User or professional details not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               user_not_found:
 *                 summary: User does not exist
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *               details_not_found:
 *                 summary: Professional details not created yet
 *                 value:
 *                   success: false
 *                   message: "Professional details not found for this user"
 *       500:
 *         description: Internal server error
 */
router.get('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getProfessionalDetails(req, res))
);

export default router;
