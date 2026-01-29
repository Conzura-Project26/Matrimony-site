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
 */

export default router;
