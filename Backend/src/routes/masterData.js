/**
 * Master Data Routes
 * Routes for accessing all master data (enums, religions, castes, etc.)
 */

import express from 'express';
import {
  getAllEnums,
  getAllReligions,
  getCastesByReligion,
  getSubCastesByCaste,
  getAllMasterData,
  getReligionHierarchy
} from '../controllers/masterDataController.js';

const router = express.Router();

/**
 * @route   GET /api/master/enums
 * @desc    Get all enum options (gender, marital status, etc.)
 * @access  Public
 */
router.get('/enums', getAllEnums);

/**
 * @route   GET /api/master/religions
 * @desc    Get all religions
 * @access  Public
 */
router.get('/religions', getAllReligions);

/**
 * @route   GET /api/master/castes/:religionId
 * @desc    Get castes by religion ID
 * @access  Public
 */
router.get('/castes/:religionId', getCastesByReligion);

/**
 * @route   GET /api/master/sub-castes/:casteId
 * @desc    Get sub-castes by caste ID
 * @access  Public
 */
router.get('/sub-castes/:casteId', getSubCastesByCaste);

/**
 * @route   GET /api/master/all
 * @desc    Get all master data (enums + religions)
 * @access  Public
 */
router.get('/all', getAllMasterData);

/**
 * @route   GET /api/master/religions/:religionId/hierarchy
 * @desc    Get religion with castes and sub-castes hierarchy
 * @access  Public
 */
router.get('/religions/:religionId/hierarchy', getReligionHierarchy);

export default router;
