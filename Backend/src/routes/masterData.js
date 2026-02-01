/**
 * Master Data Routes
 * Routes for accessing all master data (enums, religions, castes, etc.)
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllEnums,
  getAllReligions,
  getCastesByReligion,
  getSubCastesByCaste,
  getAllMasterData,
  getReligionHierarchy,
  getStates,
  getCities
} from '../controllers/masterDataController.js';

const router = express.Router();

/**
 * @swagger
 * /master/enums:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get all enum options
 *     description: Retrieve all enum values for Gender, MaritalStatus, ProfileCreatedBy, etc.
 *     responses:
 *       200:
 *         description: Enums retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enums'
 *       500:
 *         description: Server error
 */
router.get('/enums', authenticateToken, getAllEnums);

/**
 * @swagger
 * /master/religions:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get all religions
 *     description: Retrieve list of all religions
 *     responses:
 *       200:
 *         description: Religions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Religion'
 *       500:
 *         description: Server error
 */
router.get('/religions', authenticateToken, getAllReligions);

/**
 * @swagger
 * /master/castes/{religionId}:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get castes by religion
 *     description: Retrieve all castes for a specific religion
 *     parameters:
 *       - in: path
 *         name: religionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Religion UUID
 *         example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
 *     responses:
 *       200:
 *         description: Castes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Caste'
 *       400:
 *         description: Invalid religion ID
 *       500:
 *         description: Server error
 */
router.get('/castes/:religionId', authenticateToken, getCastesByReligion);

/**
 * @swagger
 * /master/sub-castes/{casteId}:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get sub-castes by caste
 *     description: Retrieve all sub-castes for a specific caste
 *     parameters:
 *       - in: path
 *         name: casteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Caste UUID
 *         example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
 *     responses:
 *       200:
 *         description: Sub-castes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubCaste'
 *       400:
 *         description: Invalid caste ID
 *       500:
 *         description: Server error
 */
router.get('/sub-castes/:casteId', authenticateToken, getSubCastesByCaste);

/**
 * @swagger
 * /master/all:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get all master data
 *     description: Retrieve all master data including enums and religions in a single request
 *     responses:
 *       200:
 *         description: All master data retrieved successfully
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
 *                     enums:
 *                       $ref: '#/components/schemas/Enums'
 *                     religions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Religion'
 *       500:
 *         description: Server error
 */
router.get('/all', authenticateToken, getAllMasterData);

/**
 * @swagger
 * /master/religions/{religionId}/hierarchy:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get religion hierarchy
 *     description: Get complete hierarchy of a religion including all castes and sub-castes
 *     parameters:
 *       - in: path
 *         name: religionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Religion UUID
 *         example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
 *     responses:
 *       200:
 *         description: Religion hierarchy retrieved successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     religion_name:
 *                       type: string
 *                       example: 'Hindu'
 *                     castes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           caste_name:
 *                             type: string
 *                             example: 'Brahmin'
 *                           sub_castes:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/SubCaste'
 *       400:
 *         description: Invalid religion ID
 *       404:
 *         description: Religion not found
 *       500:
 *         description: Server error
 */
router.get('/religions/:religionId/hierarchy', authenticateToken, getReligionHierarchy);

/**
 * @swagger
 * /master/states:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get all Indian states
 *     description: Retrieve list of all Indian states (cached, refreshed weekly)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Karnataka', 'Maharashtra', 'Tamil Nadu']
 *                 count:
 *                   type: integer
 *                   example: 36
 *                 message:
 *                   type: string
 *                   example: 'States retrieved successfully'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/states', authenticateToken, getStates);

/**
 * @swagger
 * /master/cities:
 *   get:
 *     tags:
 *       - Master Data
 *     summary: Get cities by state with optional search
 *     description: Retrieve cities for a specific state, with optional search filter (cached for performance)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State name (must be exact match from /master/states)
 *         example: 'Karnataka'
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional search query to filter cities (case-insensitive partial match)
 *         example: 'Bang'
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Bangalore', 'Bangarpet', 'Bangarapet']
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 message:
 *                   type: string
 *                   example: 'Cities in Karnataka matching "Bang" retrieved successfully'
 *                 filters:
 *                   type: object
 *                   properties:
 *                     state:
 *                       type: string
 *                       example: 'Karnataka'
 *                     search:
 *                       type: string
 *                       nullable: true
 *                       example: 'Bang'
 *       400:
 *         description: Bad request - State parameter required or invalid
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
 *                   example: 'State parameter is required'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/cities', authenticateToken, getCities);

export default router;
