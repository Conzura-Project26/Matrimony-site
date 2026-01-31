/**
 * Combined User Routes
 * Handles all user-related operations:
 * - Photo Management (upload, view, delete, set primary)
 * - Personal Details (create, update, view)
 * - Caste Details (create, update, view)
 * - Education Details (CRUD operations)
 * - Professional Details (CRUD operations)
 * - Family Details (create, update, view)
 * - Horoscope Details (create, update, view)
 * - Partner Preferences (create, update, view, match scoring)
 * - Profile Completion tracking
 * 
 * @swagger
 * tags:
 *   - name: Photo Management
 *     description: Photo upload, viewing, and moderation APIs
 *   - name: User Profile
 *     description: Personal details, caste, education, professional details
 *   - name: Profile Management
 *     description: Family, horoscope, partner preferences
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizePermission, checkOwnership } from '../middleware/authorization.js';
import asyncHandler from '../utils/asyncHandler.js';

// Controllers
import {
  uploadPhoto,
  getUserPhotos,
  deletePhoto,
  setPrimaryPhoto,
} from '../controllers/photoController.js';
import userProfileController from '../controllers/userProfileController.js';
import profileController from '../controllers/profileController.js';

const router = express.Router();

// ============================================
// PHOTO MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/photos:
 *   post:
 *     tags:
 *       - Photo Management
 *     summary: Upload a new photo
 *     description: Upload a photo URL (max 5 photos per user). First photo is automatically set as primary. Photo URL must be HTTPS.
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
 *             required:
 *               - file_url
 *             properties:
 *               file_url:
 *                 type: string
 *                 format: uri
 *                 pattern: '^https://'
 *                 description: HTTPS URL of uploaded photo (from UploadThing or similar service)
 *                 example: 'https://utfs.io/f/abc123xyz'
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, AUTHENTICATED]
 *                 default: PUBLIC
 *                 description: Who can view this photo
 *                 example: PUBLIC
 *           examples:
 *             publicPhoto:
 *               summary: Public photo upload
 *               value:
 *                 file_url: 'https://utfs.io/f/abc123xyz'
 *                 visibility: 'PUBLIC'
 *             privatePhoto:
 *               summary: Private photo upload
 *               value:
 *                 file_url: 'https://utfs.io/f/def456uvw'
 *                 visibility: 'PRIVATE'
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
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
 *                   example: 'Photo uploaded successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     file_url:
 *                       type: string
 *                       format: uri
 *                     visibility:
 *                       type: string
 *                       enum: [PUBLIC, PRIVATE, AUTHENTICATED]
 *                     is_primary:
 *                       type: boolean
 *                     is_approved:
 *                       type: boolean
 *                       example: false
 *                     uploaded_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or photo limit exceeded
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
 *                   example: 'Maximum 5 photos allowed per user'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Can only upload photos to own profile
 *       500:
 *         description: Server error
 */
router.post(
  '/:userId/photos',
  authenticateToken,
  checkOwnership('userId', { bypassRoles: [], resourceType: 'user profile' }),
  asyncHandler(uploadPhoto)
);

/**
 * @swagger
 * /users/{userId}/photos:
 *   get:
 *     tags:
 *       - Photo Management
 *     summary: Get all photos for a user
 *     description: |
 *       Get user photos with visibility filtering:
 *       - Unauthenticated: Only approved public photos
 *       - Authenticated (other users): Only approved public photos
 *       - Owner: All own photos (regardless of approval status)
 *       - Admin/Moderator: All photos
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
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
 *                   example: 'Photos retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       file_url:
 *                         type: string
 *                         format: uri
 *                       visibility:
 *                         type: string
 *                         enum: [PUBLIC, PRIVATE, AUTHENTICATED]
 *                       is_primary:
 *                         type: boolean
 *                       is_approved:
 *                         type: boolean
 *                       uploaded_at:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:userId/photos',
  (req, res, next) => {
    // Optional authentication - don't fail if no token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  asyncHandler(getUserPhotos)
);

/**
 * @swagger
 * /users/{userId}/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Photo Management
 *     summary: Delete a photo
 *     description: Delete a photo. Users can delete own photos. Admin/Moderator can delete any photo.
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
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to delete
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     responses:
 *       200:
 *         description: Photo deleted successfully
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
 *                   example: 'Photo deleted successfully'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Can only delete own photos (unless Admin/Moderator)
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:userId/photos/:photoId',
  authenticateToken,
  checkOwnership('photoId', { 
    bypassRoles: ['ADMIN', 'MODERATOR'], 
    resourceType: 'photo' 
  }),
  asyncHandler(deletePhoto)
);

/**
 * @swagger
 * /users/{userId}/photos/{photoId}/primary:
 *   patch:
 *     tags:
 *       - Photo Management
 *     summary: Set a photo as primary/profile photo
 *     description: Set a photo as the primary profile photo. Only one photo can be primary at a time. User can only set own photos as primary.
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
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Photo ID to set as primary
 *         example: '660e8400-e29b-41d4-a716-446655440001'
 *     responses:
 *       200:
 *         description: Primary photo set successfully
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
 *                   example: 'Primary photo set successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     is_primary:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Can only set own photos as primary
 *       404:
 *         description: Photo not found or doesn't belong to user
 *       500:
 *         description: Server error
 */
router.patch(
  '/:userId/photos/:photoId/primary',
  authenticateToken,
  checkOwnership('userId', { bypassRoles: [], resourceType: 'user profile' }),
  asyncHandler(setPrimaryPhoto)
);

// ============================================
// PERSONAL DETAILS ROUTES
// ============================================

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
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height_cm:
 *                 type: integer
 *                 minimum: 120
 *                 maximum: 250
 *                 example: 170
 *               weight_kg:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 200
 *                 example: 65
 *               marital_status:
 *                 type: string
 *                 enum: [Never Married, Divorced, Widowed, Awaiting Divorce, Separated, Annulled]
 *                 example: Never Married
 *               physical_status:
 *                 type: string
 *                 enum: [Normal, Visually Impaired, Hearing Impaired, Mobility Impaired, Other]
 *                 example: Normal
 *               mother_tongue:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Hindi
 *               complexion:
 *                 type: string
 *                 enum: [Very Fair, Fair, Wheatish, Wheatish Brown, Dark]
 *                 example: Fair
 *               body_type:
 *                 type: string
 *                 enum: [Slim, Average, Athletic, Heavy]
 *                 example: Average
 *               blood_group:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 example: O+
 *               diet_preference:
 *                 type: string
 *                 enum: [Vegetarian, Non-Vegetarian, Eggetarian, Vegan]
 *                 example: Vegetarian
 *               drinking_habit:
 *                 type: string
 *                 enum: [Never, Occasionally, Socially, Regularly]
 *                 example: Never
 *               smoking_habit:
 *                 type: string
 *                 enum: [Never, Occasionally, Socially, Regularly]
 *                 example: Never
 *               about_me:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: I am a software engineer with a passion for technology and travel.
 *     responses:
 *       201:
 *         description: Personal details created successfully
 *       400:
 *         description: Validation error or details already exist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update personal details
 *     description: Update existing personal details (partial updates supported)
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
 *               height_cm:
 *                 type: integer
 *               weight_kg:
 *                 type: integer
 *               marital_status:
 *                 type: string
 *               about_me:
 *                 type: string
 *     responses:
 *       200:
 *         description: Personal details updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get personal details with user info
 *     description: Retrieve complete personal details along with profile completion percentage
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
 *         description: Personal details retrieved successfully
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

// ============================================
// PROFILE COMPLETION ROUTE
// ============================================

/**
 * @swagger
 * /users/{userId}/profile-completion:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get detailed profile completion status
 *     description: Get section-wise completion breakdown and overall percentage
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
 *         description: Profile completion status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/profile-completion', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getProfileCompletion(req, res))
);

// ============================================
// CASTE DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/caste:
 *   post:
 *     tags:
 *       - User Profile
 *     summary: Create caste details
 *     description: Create caste/religion details for a user
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
 *               religion_id:
 *                 type: string
 *                 format: uuid
 *               caste_id:
 *                 type: string
 *                 format: uuid
 *               sub_caste:
 *                 type: string
 *               gothra:
 *                 type: string
 *     responses:
 *       201:
 *         description: Caste details created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update caste details
 *     description: Update existing caste/religion details
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
 *     responses:
 *       200:
 *         description: Caste details updated successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get caste details
 *     description: Retrieve caste/religion details with user info
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
 *         description: Caste details retrieved successfully
 *       401:
 *         description: Unauthorized
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
// EDUCATION DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/education:
 *   post:
 *     tags:
 *       - User Profile
 *     summary: Create education entry
 *     description: Add a new education entry (max 5 per user)
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
 *             required:
 *               - qualification
 *               - institution
 *             properties:
 *               qualification:
 *                 type: string
 *                 example: Bachelor of Engineering
 *               institution:
 *                 type: string
 *                 example: MIT
 *               year_of_passing:
 *                 type: integer
 *                 example: 2020
 *               specialization:
 *                 type: string
 *                 example: Computer Science
 *     responses:
 *       201:
 *         description: Education entry created successfully
 *       400:
 *         description: Validation error or limit exceeded
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get all education entries
 *     description: Retrieve all education records for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Education entries retrieved successfully
 */
router.post('/:userId/education', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createEducation(req, res))
);

/**
 * @swagger
 * /users/{userId}/education/{eduId}:
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update education entry
 *     description: Update an existing education record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: eduId
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
 *     responses:
 *       200:
 *         description: Education entry updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Education entry not found
 *   delete:
 *     tags:
 *       - User Profile
 *     summary: Delete education entry
 *     description: Remove an education record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: eduId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Education entry deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Education entry not found
 */
router.put('/:userId/education/:eduId', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updateEducation(req, res))
);

router.delete('/:userId/education/:eduId', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.deleteEducation(req, res))
);

router.get('/:userId/education', 
  asyncHandler((req, res) => userProfileController.getAllEducation(req, res))
);

// ============================================
// PROFESSIONAL DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/professional:
 *   post:
 *     tags:
 *       - User Profile
 *     summary: Create professional details
 *     description: Create professional/employment details for a user
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
 *               employment_type:
 *                 type: string
 *                 enum: [Employed, Self-Employed, Business, Unemployed, Student]
 *                 example: Employed
 *               occupation:
 *                 type: string
 *                 example: Software Engineer
 *               organization:
 *                 type: string
 *                 example: Tech Corp
 *               annual_income_min:
 *                 type: number
 *                 example: 500000
 *               annual_income_max:
 *                 type: number
 *                 example: 800000
 *               designation:
 *                 type: string
 *                 example: Senior Developer
 *               experience_years:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Professional details created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update professional details (full replacement)
 *     description: Replace all professional details with new values
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
 *     responses:
 *       200:
 *         description: Professional details updated successfully
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags:
 *       - User Profile
 *     summary: Patch professional details (partial update)
 *     description: Update specific fields without replacing all data
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
 *           examples:
 *             updateIncome:
 *               summary: Update only income
 *               value:
 *                 annual_income_min: 600000
 *                 annual_income_max: 900000
 *     responses:
 *       200:
 *         description: Professional details patched successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get professional details
 *     description: Retrieve professional/employment information
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
 *         description: Professional details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.createProfessionalDetails(req, res))
);

router.put('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.updateProfessionalDetails(req, res))
);

router.patch('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.patchProfessionalDetails(req, res))
);

router.get('/:userId/professional',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getProfessionalDetails(req, res))
);

// ============================================
// FAMILY DETAILS ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/family:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Create family details
 *     description: Create family details for a user. Users can create own family details. Admin can create for any user.
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
 *                 example: Business Owner
 *               mother_occupation:
 *                 type: string
 *                 maxLength: 150
 *                 example: Teacher
 *               siblings_details:
 *                 type: string
 *                 example: 2 brothers, 1 sister. Elder brother is married.
 *               family_values:
 *                 type: string
 *                 enum: [Orthodox, Traditional, Moderate, Liberal, Progressive]
 *                 example: Moderate
 *     responses:
 *       201:
 *         description: Family details created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Family details already exist - use PUT to update
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update family details
 *     description: Update existing family details (partial updates supported)
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
 *     responses:
 *       200:
 *         description: Family details updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Family details not found - use POST to create
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get family details
 *     description: Retrieve family details for matchmaking purposes
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
 *         description: Family details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/:userId/family',
  authenticateToken,
  authorizePermission(['create_own_family_details', 'manage_family_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'family details' }),
  asyncHandler((req, res) => profileController.createFamilyDetails(req, res))
);

router.put(
  '/:userId/family',
  authenticateToken,
  authorizePermission(['edit_own_family_details', 'manage_family_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'family details' }),
  asyncHandler((req, res) => profileController.updateFamilyDetails(req, res))
);

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
 *     summary: Create horoscope details
 *     description: Create horoscope/astrology details for a user
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
 *               rasi:
 *                 type: string
 *                 enum: [Mesha (Aries), Vrishabha (Taurus), Mithuna (Gemini), Karka (Cancer), Simha (Leo), Kanya (Virgo), Tula (Libra), Vrishchika (Scorpio), Dhanu (Sagittarius), Makara (Capricorn), Kumbha (Aquarius), Meena (Pisces)]
 *                 example: Mesha (Aries)
 *               nakshatra:
 *                 type: string
 *                 example: Ashwini
 *               birth_time:
 *                 type: string
 *                 format: time
 *                 example: '14:30:00'
 *               birth_place:
 *                 type: string
 *                 example: Mumbai, India
 *               manglik:
 *                 type: string
 *                 enum: [Yes, No, Anshik (Partial), Don't Know]
 *                 example: No
 *     responses:
 *       201:
 *         description: Horoscope details created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Horoscope details already exist
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update horoscope details
 *     description: Update existing horoscope/astrology details
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
 *     responses:
 *       200:
 *         description: Horoscope details updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Horoscope details not found
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get horoscope details
 *     description: Retrieve horoscope/astrology details
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
 *         description: Horoscope details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['create_own_horoscope_details', 'manage_horoscope_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'horoscope details' }),
  asyncHandler(async (req, res) => profileController.createHoroscopeDetails(req, res))
);

router.put(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['edit_own_horoscope_details', 'manage_horoscope_details']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'horoscope details' }),
  asyncHandler(async (req, res) => profileController.updateHoroscopeDetails(req, res))
);

router.get(
  '/:userId/horoscope',
  authenticateToken,
  authorizePermission(['view_horoscope_details']),
  asyncHandler(async (req, res) => profileController.getHoroscopeDetails(req, res))
);

// ============================================
// PARTNER PREFERENCES ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/preferences:
 *   post:
 *     tags:
 *       - Profile Management
 *     summary: Create partner preferences
 *     description: Create partner preferences for matchmaking. Users can create own preferences.
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
 *               age_min:
 *                 type: integer
 *                 minimum: 18
 *                 example: 25
 *               age_max:
 *                 type: integer
 *                 maximum: 100
 *                 example: 35
 *               height_min_cm:
 *                 type: integer
 *                 example: 160
 *               height_max_cm:
 *                 type: integer
 *                 example: 180
 *               marital_status:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Never Married', 'Divorced']
 *               religion_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               caste_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               education_level:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Bachelors', 'Masters']
 *               employment_type:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Employed', 'Self-Employed']
 *               income_min:
 *                 type: number
 *                 example: 500000
 *               income_max:
 *                 type: number
 *                 example: 2000000
 *     responses:
 *       201:
 *         description: Partner preferences created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Partner preferences already exist - use PUT to update
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update partner preferences
 *     description: Update existing partner preferences (partial updates supported)
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
 *           examples:
 *             updateAgeRange:
 *               summary: Update age range only
 *               value:
 *                 age_min: 28
 *                 age_max: 38
 *     responses:
 *       200:
 *         description: Partner preferences updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner preferences not found - use POST to create
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get partner preferences
 *     description: Retrieve partner preferences for matchmaking
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/:userId/preferences',
  authenticateToken,
  authorizePermission(['create_own_partner_preferences', 'manage_partner_preferences']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'partner preferences' }),
  asyncHandler((req, res) => profileController.createPartnerPreferences(req, res))
);

router.put(
  '/:userId/preferences',
  authenticateToken,
  authorizePermission(['edit_own_partner_preferences', 'manage_partner_preferences']),
  checkOwnership('userId', { bypassRoles: ['ADMIN'], resourceType: 'partner preferences' }),
  asyncHandler((req, res) => profileController.updatePartnerPreferences(req, res))
);

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
 *     summary: Calculate match score between user preferences and target user
 *     description: Calculate compatibility score based on user's partner preferences and target user's profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID with partner preferences
 *         example: '550e8400-e29b-41d4-a716-446655440000'
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Target user ID to match against
 *         example: '660e8400-e29b-41d4-a716-446655440001'
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     match_score:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 85.5
 *                     matching_criteria:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['age', 'education', 'religion']
 *                     non_matching_criteria:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['height']
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or target user not found
 */
router.post(
  '/:userId/preferences/match/:targetUserId',
  authenticateToken,
  authorizePermission(['view_partner_preferences', 'search_profiles']),
  asyncHandler((req, res) => profileController.calculatePreferenceMatch(req, res))
);

export default router;
