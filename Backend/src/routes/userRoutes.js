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
// COMPLETE PROFILE & VERIFICATION ROUTES (Task 2.10)
// ============================================

/**
 * @swagger
 * /users/{userId}/profile:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get complete user profile
 *     description: |
 *       Retrieve comprehensive profile with all sections including:
 *       - Basic info, Personal details, Caste details
 *       - Education details (all entries, sorted by year)
 *       - Professional details, Family details, Horoscope details
 *       - Photos (only approved, with metadata)
 *       - Partner preferences
 *       - Profile completion percentage
 *       - Verification status
 *       - Activity status and badges
 *       
 *       **Privacy**: Sensitive data (mobile, email, income, family details) visible only to:
 *       - Self
 *       - Admin
 *       - Connected users (future feature)
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
 *         description: Complete profile retrieved successfully
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
 *                   example: Complete profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     basic_info:
 *                       type: object
 *                       description: Basic user information
 *                     personal_details:
 *                       type: object
 *                       description: Personal details section
 *                     caste_details:
 *                       type: object
 *                       description: Caste and religion details
 *                     education_details:
 *                       type: array
 *                       description: All education entries (sorted by year desc)
 *                     professional_details:
 *                       type: object
 *                       description: Professional/career details
 *                     family_details:
 *                       type: object
 *                       description: Family details (sensitive - filtered)
 *                     horoscope_details:
 *                       type: object
 *                       description: Horoscope/astrology details
 *                     photos:
 *                       type: array
 *                       description: Approved photos with metadata
 *                     partner_preferences:
 *                       type: object
 *                       description: Partner preference criteria
 *                     profile_completion:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: integer
 *                           example: 85
 *                         status:
 *                           type: string
 *                           example: Almost Complete
 *                         readiness:
 *                           type: object
 *                           properties:
 *                             is_ready_for_matching:
 *                               type: boolean
 *                               example: true
 *                             is_complete:
 *                               type: boolean
 *                               example: false
 *                             status:
 *                               type: string
 *                               example: ready
 *                             message:
 *                               type: string
 *                             minimum_completion_required:
 *                               type: integer
 *                               example: 60
 *                     verification_status:
 *                       type: object
 *                       properties:
 *                         is_verified:
 *                           type: boolean
 *                           example: false
 *                         mobile_verified:
 *                           type: boolean
 *                           example: true
 *                         email_verified:
 *                           type: boolean
 *                           example: false
 *                         profile_verified:
 *                           type: boolean
 *                           example: false
 *                         verification_percentage:
 *                           type: integer
 *                           example: 33
 *                         pending_verifications:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["email", "profile_approval"]
 *                     activity_status:
 *                       type: object
 *                       properties:
 *                         last_active:
 *                           type: string
 *                           format: date-time
 *                         profile_last_updated:
 *                           type: string
 *                           format: date-time
 *                         account_age_days:
 *                           type: integer
 *                           example: 45
 *                         days_since_last_update:
 *                           type: integer
 *                           example: 2
 *                         activity_level:
 *                           type: string
 *                           example: active
 *                     badges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: verified
 *                           label:
 *                             type: string
 *                             example: Verified Profile
 *                           icon:
 *                             type: string
 *                             example: ✓
 *                           color:
 *                             type: string
 *                             example: blue
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Profile is not active
 *       404:
 *         description: User not found
 */
router.get('/:userId/profile',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getCompleteProfile(req, res))
);

/**
 * @swagger
 * /users/{userId}/verification-status:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get detailed verification status
 *     description: |
 *       Get comprehensive verification status breakdown showing:
 *       - Overall verification status (requires all 3 verifications)
 *       - Mobile verification status
 *       - Email verification status
 *       - Profile verification status (admin approval)
 *       - Verification percentage
 *       - Pending verifications
 *       - Next steps to complete verification
 *       
 *       **Authorization**: Only accessible by self or admin
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
 *         description: Verification status retrieved successfully
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
 *                   example: Verification status retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_verified:
 *                       type: boolean
 *                       example: false
 *                       description: True only when ALL three verifications are complete
 *                     mobile_verified:
 *                       type: boolean
 *                       example: true
 *                     email_verified:
 *                       type: boolean
 *                       example: false
 *                     profile_verified:
 *                       type: boolean
 *                       example: false
 *                     verification_percentage:
 *                       type: integer
 *                       example: 33
 *                       description: Percentage of completed verifications (0-100)
 *                     pending_verifications:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["email", "profile_approval"]
 *                     user_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                         mobile_number:
 *                           type: string
 *                         email:
 *                           type: string
 *                     verification_steps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           step:
 *                             type: string
 *                             example: mobile
 *                           label:
 *                             type: string
 *                             example: Mobile Verification
 *                           status:
 *                             type: string
 *                             enum: [verified, pending]
 *                             example: verified
 *                           verified_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           description:
 *                             type: string
 *                             example: Verify your mobile number via OTP
 *                     next_steps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: 
 *                         - "Verify your email address"
 *                         - "Wait for admin to review and verify your profile"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: You do not have permission to view verification status
 *       404:
 *         description: User not found
 */
router.get('/:userId/verification-status',
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getVerificationStatus(req, res))
);

// ============================================
// PROFILE COMPLETION ROUTES
// ============================================

/**
 * @swagger
 * /users/{userId}/completion-percentage:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get profile completion percentage (FAST - for Dashboard)
 *     description: |
 *       **⚡ OPTIMIZED FOR DASHBOARD** - Returns only cached completion percentage.
 *       
 *       **Performance:** 50-80ms (3-4x faster than full profile)
 *       
 *       **Use this endpoint when:**
 *       - Showing percentage on dashboard
 *       - Profile cards/lists
 *       - Any UI that only needs the number
 *       
 *       **Use `/profile-completion` when you need detailed breakdown**
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
 *         description: Success
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Profile completion percentage retrieved successfully"
 *               data:
 *                 completion_percentage: 75
 *                 status: "In Progress"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:userId/completion-percentage', 
  authenticateToken,
  asyncHandler((req, res) => userProfileController.getCompletionPercentage(req, res))
);

/**
 * @swagger
 * /users/{userId}/profile-completion:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get detailed profile completion status (with breakdown)
 *     description: |
 *       **⚠️ SLOWER** - Returns detailed breakdown. For dashboard use `/completion-percentage` instead.
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
 *     description: |
 *       Create partner preferences for matchmaking. All fields are optional - empty/null means "open to all".
 *       
 *       **Scoring Breakdown (85% Total Base Score):**
 *       - Age: Hard Filter (must match or profile excluded)
 *       - Religion: 17% | Caste: 11% | Education: 11% | Profession: 14% | Location: 17%
 *       - Height: 5% (soft) | Weight: 5% (soft) | Physical Status: 5%
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
 *               min_age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *                 description: Minimum age preference (Hard Filter)
 *                 example: 25
 *               max_age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *                 description: Maximum age preference (Hard Filter)
 *                 example: 35
 *               min_height:
 *                 type: integer
 *                 minimum: 120
 *                 maximum: 250
 *                 description: Minimum height in cm (Soft Score - 5%)
 *                 example: 160
 *               max_height:
 *                 type: integer
 *                 minimum: 120
 *                 maximum: 250
 *                 description: Maximum height in cm (Soft Score - 5%)
 *                 example: 180
 *               min_weight:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 200
 *                 description: Minimum weight in kg (Soft Score - 5%)
 *                 example: 50
 *               max_weight:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 200
 *                 description: Maximum weight in kg (Soft Score - 5%)
 *                 example: 70
 *               religion_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Religion IDs array (17% scoring). Empty = open to all
 *                 example: [1, 2]
 *               caste_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Caste IDs array (11% scoring). Empty = open to all
 *                 example: [5, 6]
 *               education_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Education qualifications array (11% scoring). Empty = open to all
 *                 example: ["Bachelor's Degree", "Master's Degree"]
 *               profession_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Profession/occupation array (14% scoring). Empty = open to all
 *                 example: ['Software Engineer', 'Doctor']
 *               location_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Work location array (17% scoring). Empty = open to all
 *                 example: ['Bangalore', 'Mumbai']
 *               physical_status:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Normal, Visually Impaired, Hearing Impaired, Mobility Impaired, Other]
 *                 description: Physical status array (5% scoring). Empty = open to all
 *                 example: ['Normal']
 *               marital_status_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never Married, Divorced, Widowed, Awaiting Divorce, Separated, Annulled]
 *                 description: Marital status preferences. Empty = open to all
 *                 example: ['Never Married', 'Divorced']
 *               mother_tongue_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mother tongue preferences. Empty = open to all
 *                 example: ['Hindi', 'English']
 *               diet_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Vegetarian, Non-Vegetarian, Eggetarian, Vegan]
 *                 description: Diet preferences. Empty = open to all
 *                 example: ['Vegetarian']
 *               drinking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never, Occasionally, Socially, Regularly]
 *                 description: Drinking habit preferences. Empty = open to all
 *                 example: ['Never', 'Occasionally']
 *               smoking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Never, Occasionally, Socially, Regularly]
 *                 description: Smoking habit preferences. Empty = open to all
 *                 example: ['Never']
 *               income_preference_min:
 *                 type: string
 *                 enum: [Below 2 Lakhs, 2 - 5 Lakhs, 5 - 10 Lakhs, 10 - 15 Lakhs, 15 - 20 Lakhs, 20 - 30 Lakhs, 30 - 50 Lakhs, Above 50 Lakhs]
 *                 description: Minimum income preference
 *                 example: '5 - 10 Lakhs'
 *               income_preference_max:
 *                 type: string
 *                 enum: [Below 2 Lakhs, 2 - 5 Lakhs, 5 - 10 Lakhs, 10 - 15 Lakhs, 15 - 20 Lakhs, 20 - 30 Lakhs, 30 - 50 Lakhs, Above 50 Lakhs]
 *                 description: Maximum income preference
 *                 example: '20 - 30 Lakhs'
 *           examples:
 *             comprehensivePreferences:
 *               summary: Comprehensive preferences with all fields
 *               value:
 *                 min_age: 25
 *                 max_age: 35
 *                 min_height: 160
 *                 max_height: 180
 *                 min_weight: 50
 *                 max_weight: 70
 *                 religion_preference: [1, 2]
 *                 caste_preference: [5, 6]
 *                 education_preference: ["Bachelor's Degree", "Master's Degree"]
 *                 profession_preference: ['Software Engineer', 'Doctor']
 *                 location_preference: ['Bangalore', 'Mumbai']
 *                 physical_status: ['Normal']
 *                 marital_status_preference: ['Never Married']
 *                 diet_preference: ['Vegetarian']
 *             basicPreferences:
 *               summary: Basic preferences (age and location only)
 *               value:
 *                 min_age: 25
 *                 max_age: 35
 *                 location_preference: ['Bangalore', 'Hyderabad']
 *     responses:
 *       201:
 *         description: Partner preferences created successfully
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
 *                   example: 'Partner preferences created successfully'
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error (e.g., min_age >= max_age, min_weight >= max_weight)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Partner preferences already exist - use PUT to update
 *   put:
 *     tags:
 *       - Profile Management
 *     summary: Update partner preferences
 *     description: |
 *       Update existing partner preferences (partial updates supported). Only provide fields you want to change.
 *       Empty arrays or null values mean "open to all" for that category.
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
 *               min_height:
 *                 type: integer
 *               max_height:
 *                 type: integer
 *               min_weight:
 *                 type: integer
 *               max_weight:
 *                 type: integer
 *               religion_preference:
 *                 type: array
 *                 items:
 *                   type: integer
 *               caste_preference:
 *                 type: array
 *                 items:
 *                   type: integer
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
 *               physical_status:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Normal, Visually Impaired, Hearing Impaired, Mobility Impaired, Other]
 *               marital_status_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               mother_tongue_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               diet_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               drinking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               smoking_habit_preference:
 *                 type: array
 *                 items:
 *                   type: string
 *               income_preference_min:
 *                 type: string
 *               income_preference_max:
 *                 type: string
 *           examples:
 *             updateAgeAndWeight:
 *               summary: Update age and weight range only
 *               value:
 *                 min_age: 28
 *                 max_age: 38
 *                 min_weight: 55
 *                 max_weight: 75
 *             updatePhysicalStatus:
 *               summary: Update physical status preference
 *               value:
 *                 physical_status: ['Normal', 'Visually Impaired']
 *     responses:
 *       200:
 *         description: Partner preferences updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner preferences not found - use POST to create
 *   get:
 *     tags:
 *       - Profile Management
 *     summary: Get partner preferences
 *     description: |
 *       Retrieve partner preferences for matchmaking.
 *       Returns all preference fields including weight and physical_status.
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
 *                   example: 'Partner preferences retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     partner_preferences:
 *                       type: object
 *                       properties:
 *                         min_age:
 *                           type: integer
 *                           example: 25
 *                         max_age:
 *                           type: integer
 *                           example: 35
 *                         min_height:
 *                           type: integer
 *                           example: 160
 *                         max_height:
 *                           type: integer
 *                           example: 180
 *                         min_weight:
 *                           type: integer
 *                           example: 50
 *                         max_weight:
 *                           type: integer
 *                           example: 70
 *                         religion_preference:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         caste_preference:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         education_preference:
 *                           type: array
 *                           items:
 *                             type: string
 *                         profession_preference:
 *                           type: array
 *                           items:
 *                             type: string
 *                         location_preference:
 *                           type: array
 *                           items:
 *                             type: string
 *                         physical_status:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['Normal']
 *                         marital_status_preference:
 *                           type: array
 *                           items:
 *                             type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         gender:
 *                           type: string
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
 *     description: |
 *       Calculate compatibility score based on user's partner preferences and target user's profile.
 *       
 *       **New Scoring System (85% Base Score):**
 *       - **Hard Filter:** Age (must match or profile excluded from results)
 *       - **Major Categories:** Religion (17%), Location (17%), Profession (14%), Caste (11%), Education (11%)
 *       - **Physical Attributes:** Height (5%), Weight (5%), Physical Status (5%)
 *       
 *       **Enhanced Scoring:** Add `?enhanced=true` query parameter for bonus scoring including marital status, diet, habits, etc.
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
 *       - in: query
 *         name: enhanced
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Use enhanced scoring with bonus attributes (marital status, diet, habits)
 *         example: false
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
 *                 message:
 *                   type: string
 *                   example: 'Match score calculated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     match_result:
 *                       type: object
 *                       properties:
 *                         match:
 *                           type: boolean
 *                           example: true
 *                         matchPercentage:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 100
 *                           example: 78
 *                         totalScore:
 *                           type: number
 *                           example: 66.5
 *                         maxScore:
 *                           type: integer
 *                           example: 85
 *                         breakdown:
 *                           type: object
 *                           properties:
 *                             age:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   example: pass
 *                                 isHardFilter:
 *                                   type: boolean
 *                                   example: true
 *                             religion:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 17
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 17
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             caste:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 11
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 11
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             education:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 0
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 11
 *                                 status:
 *                                   type: string
 *                                   example: no-match
 *                             profession:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 14
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 14
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             location:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 17
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 17
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             height:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 5
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 5
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             weight:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 2.5
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 5
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                             physical_status:
 *                               type: object
 *                               properties:
 *                                 score:
 *                                   type: number
 *                                   example: 5
 *                                 maxScore:
 *                                   type: integer
 *                                   example: 5
 *                                 status:
 *                                   type: string
 *                                   example: match
 *                         userAge:
 *                           type: integer
 *                           example: 28
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *       400:
 *         description: Partner preferences not found for user
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
