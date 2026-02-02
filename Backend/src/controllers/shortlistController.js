/**
 * Shortlist Controller
 * Phase 3 - Task 3.6: Shortlist Management
 * 
 * HTTP handlers for shortlist operations
 * 
 * @module controllers/shortlistController
 */

import shortlistService from '../services/shortlistService.js';
import logger from '../config/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Validate UUID format (strict RFC 4122 v1-v5)
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * @route POST /shortlist/:userId
 * @desc Add a profile to user's shortlist
 * @access Private (authenticated users only)
 */
export const addToShortlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: targetUserId } = req.params;

    // Validate UUID format
    if (!isValidUUID(targetUserId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const result = await shortlistService.addToShortlist(userId, targetUserId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error adding to shortlist', {
      error: error.message,
      userId: req.user?.userId,
      targetUserId: req.params.userId
    });
    next(error);
  }
};

/**
 * @route DELETE /shortlist/:userId
 * @desc Remove a profile from user's shortlist
 * @access Private (authenticated users only)
 */
export const removeFromShortlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: targetUserId } = req.params;

    // Validate UUID format
    if (!isValidUUID(targetUserId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const result = await shortlistService.removeFromShortlist(userId, targetUserId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error removing from shortlist', {
      error: error.message,
      userId: req.user?.userId,
      targetUserId: req.params.userId
    });
    next(error);
  }
};

/**
 * @route GET /shortlist
 * @desc Get user's shortlist with pagination and sorting
 * @access Private (authenticated users only)
 */
export const getMyShortlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const result = await shortlistService.getMyShortlist(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching shortlist', {
      error: error.message,
      userId: req.user?.userId
    });
    next(error);
  }
};

/**
 * @route GET /shortlist/:userId/status
 * @desc Check if a profile is shortlisted (mutual status with timestamps)
 * @access Private (authenticated users only)
 */
export const checkShortlistStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: targetUserId } = req.params;

    // Validate UUID format
    if (!isValidUUID(targetUserId)) {
      throw new BadRequestError('Invalid user ID format');
    }

    const result = await shortlistService.checkShortlistStatus(userId, targetUserId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error checking shortlist status', {
      error: error.message,
      userId: req.user?.userId,
      targetUserId: req.params.userId
    });
    next(error);
  }
};

/**
 * @route GET /shortlisted-by
 * @desc Get "Who shortlisted me" list with pagination and sorting
 * @access Private (authenticated users only)
 */
export const getShortlistedByMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const result = await shortlistService.getShortlistedByMe(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching shortlisted-by list', {
      error: error.message,
      userId: req.user?.userId
    });
    next(error);
  }
};

export default {
  addToShortlist,
  removeFromShortlist,
  getMyShortlist,
  checkShortlistStatus,
  getShortlistedByMe
};
