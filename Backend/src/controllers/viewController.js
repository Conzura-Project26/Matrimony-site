/**
 * Profile View Controller
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * HTTP handlers for profile view tracking
 * 
 * @module controllers/viewController
 */

import viewService from '../services/viewService.js';
import { ViewSource } from '../types/enums.js';
import logger from '../config/logger.js';

/**
 * @route POST /profiles/:profileId/view
 * @desc Record a profile view
 * @access Private (logged-in users only)
 */
export const recordView = async (req, res, next) => {
  try {
    const viewerId = req.user.userId;
    const { profileId } = req.params;
    const {
      view_source = ViewSource.DIRECT,
      view_duration,
      search_log_id,
      ip_address,
      user_agent
    } = req.body;

    // Validate view_source enum
    const validSources = Object.values(ViewSource);
    if (view_source && !validSources.includes(view_source)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid view source',
        error: {
          field: 'view_source',
          validValues: validSources
        }
      });
    }

    await viewService.recordProfileView(viewerId, profileId, {
      viewSource: view_source,
      viewDuration: view_duration,
      searchLogId: search_log_id,
      ipAddress: ip_address || req.ip,
      userAgent: user_agent || req.get('user-agent')
    });

    // Silent success - 204 No Content
    res.status(204).send();
  } catch (error) {
    logger.error('Error recording profile view', {
      error: error.message,
      viewerId: req.user?.id,
      profileId: req.params.profileId
    });
    next(error);
  }
};

/**
 * @route GET /profile/viewers
 * @desc Get users who viewed my profile
 * @access Private (current user only)
 */
export const getMyViewers = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      from_date,
      to_date,
      mutual_interest,
      viewed_back
    } = req.query;

    const result = await viewService.getMyViewers(userId, {
      page,
      limit,
      fromDate: from_date,
      toDate: to_date,
      mutualInterest: mutual_interest,
      viewedBack: viewed_back
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching profile viewers', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * @route GET /profile/viewed
 * @desc Get profiles I viewed
 * @access Private (current user only)
 */
export const getMyViewedProfiles = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      from_date,
      to_date,
      interaction_status
    } = req.query;

    const result = await viewService.getMyViewedProfiles(userId, {
      page,
      limit,
      fromDate: from_date,
      toDate: to_date,
      interactionStatus: interaction_status
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching viewed profiles', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * @route GET /profile/viewers/count
 * @desc Get count of users who viewed my profile
 * @access Private (current user only)
 */
export const getViewersCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await viewService.getViewersCount(userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching viewers count', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * @route GET /profile/viewed/count
 * @desc Get count of profiles I viewed
 * @access Private (current user only)
 */
export const getViewedCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await viewService.getViewedCount(userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching viewed count', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

export default {
  recordView,
  getMyViewers,
  getMyViewedProfiles,
  getViewersCount,
  getViewedCount
};
