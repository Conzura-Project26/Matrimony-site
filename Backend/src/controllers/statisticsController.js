/**
 * Statistics Controller
 * Phase 5 - Task 5.2: User Statistics
 */

import statisticsService from '../services/statisticsService.js';
import logger from '../config/logger.js';
import {
  statsRegistrationsSchema,
  statsActiveUsersSchema,
  statsActiveUsersTrendSchema,
  statsLocationSchema
} from '../utils/validation.js';

class StatisticsController {
  /**
   * @route   GET /admin/statistics/dashboard
   * @desc    Get aggregated dashboard statistics
   * @access  Admin/Moderator
   */
  async getDashboard(req, res, next) {
    try {
      logger.info('Admin dashboard statistics requested', { admin_id: req.user.id });

      const data = await statisticsService.getDashboard();

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          cache_status: 'MISS', // TODO: Implement Redis caching
          last_updated: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/summary
   * @desc    Get user summary with breakdowns
   * @access  Admin/Moderator
   */
  async getUserSummary(req, res, next) {
    try {
      logger.info('User summary statistics requested', { admin_id: req.user.id });

      const data = await statisticsService.getUserSummary();

      res.json({
        success: true,
        message: 'User summary retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/by-gender
   * @desc    Get user distribution by gender
   * @access  Admin/Moderator
   */
  async getUsersByGender(req, res, next) {
    try {
      logger.info('Gender distribution requested', { admin_id: req.user.id, filters: req.query });

      const filters = {};
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
      }
      if (req.query.is_profile_verified !== undefined) {
        filters.is_profile_verified = req.query.is_profile_verified === 'true';
      }

      const data = await statisticsService.getUsersByGender(filters);

      res.json({
        success: true,
        message: 'Gender distribution retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          filters
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/by-religion
   * @desc    Get user distribution by religion
   * @access  Admin/Moderator
   */
  async getUsersByReligion(req, res, next) {
    try {
      logger.info('Religion distribution requested', { admin_id: req.user.id, filters: req.query });

      const filters = {};
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
      }
      if (req.query.gender) {
        filters.gender = req.query.gender;
      }

      const data = await statisticsService.getUsersByReligion(filters);

      res.json({
        success: true,
        message: 'Religion distribution retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString(),
          filters
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/by-location
   * @desc    Get geographic distribution
   * @access  Admin/Moderator
   */
  async getUsersByLocation(req, res, next) {
    try {
      const { top_cities = 10 } = statsLocationSchema.parse(req.query);

      logger.info('Location distribution requested', { admin_id: req.user.id, top_cities });

      const data = await statisticsService.getUsersByLocation(top_cities);

      res.json({
        success: true,
        message: 'Location distribution retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/by-age
   * @desc    Get age distribution
   * @access  Admin/Moderator
   */
  async getUsersByAge(req, res, next) {
    try {
      logger.info('Age distribution requested', { admin_id: req.user.id });

      const data = await statisticsService.getUsersByAge();

      res.json({
        success: true,
        message: 'Age distribution retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/by-marital-status
   * @desc    Get marital status distribution
   * @access  Admin/Moderator
   */
  async getUsersByMaritalStatus(req, res, next) {
    try {
      logger.info('Marital status distribution requested', { admin_id: req.user.id });

      const data = await statisticsService.getUsersByMaritalStatus();

      res.json({
        success: true,
        message: 'Marital status distribution retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/profile-completion
   * @desc    Get profile completion statistics
   * @access  Admin/Moderator
   */
  async getProfileCompletion(req, res, next) {
    try {
      logger.info('Profile completion stats requested', { admin_id: req.user.id });

      const data = await statisticsService.getProfileCompletion();

      res.json({
        success: true,
        message: 'Profile completion statistics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/verification
   * @desc    Get verification statistics
   * @access  Admin/Moderator
   */
  async getVerificationStats(req, res, next) {
    try {
      logger.info('Verification stats requested', { admin_id: req.user.id });

      const data = await statisticsService.getVerificationStats();

      res.json({
        success: true,
        message: 'Verification statistics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/registrations
   * @desc    Get registration trends
   * @access  Admin/Moderator
   */
  async getRegistrationTrends(req, res, next) {
    try {
      const { period = 'daily', group_by = 'none', from, to } = statsRegistrationsSchema.parse(req.query);

      logger.info('Registration trends requested', { admin_id: req.user.id, period, group_by, from, to });

      const data = await statisticsService.getRegistrationTrends(period, group_by, from, to);

      res.json({
        success: true,
        message: 'Registration trends retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/active/summary
   * @desc    Get active users summary
   * @access  Admin/Moderator
   */
  async getActiveUsersSummary(req, res, next) {
    try {
      const { window = '7d' } = statsActiveUsersSchema.parse(req.query);

      logger.info('Active users summary requested', { admin_id: req.user.id, window });

      const data = await statisticsService.getActiveUsersSummary(window);

      res.json({
        success: true,
        message: 'Active users summary retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/active/trend
   * @desc    Get active users trend
   * @access  Admin/Moderator
   */
  async getActiveUsersTrend(req, res, next) {
    try {
      const { window = '7d', period = 'daily' } = statsActiveUsersTrendSchema.parse(req.query);

      logger.info('Active users trend requested', { admin_id: req.user.id, window, period });

      const data = await statisticsService.getActiveUsersTrend(window, period);

      res.json({
        success: true,
        message: 'Active users trend retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/active/demographics
   * @desc    Get active users demographics
   * @access  Admin/Moderator
   */
  async getActiveUsersDemographics(req, res, next) {
    try {
      const { window = '7d' } = statsActiveUsersSchema.parse(req.query);

      logger.info('Active users demographics requested', { admin_id: req.user.id, window });

      const data = await statisticsService.getActiveUsersDemographics(window);

      res.json({
        success: true,
        message: 'Active users demographics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/engagement
   * @desc    Get engagement metrics
   * @access  Admin/Moderator
   */
  async getEngagementMetrics(req, res, next) {
    try {
      logger.info('Engagement metrics requested', { admin_id: req.user.id });

      const data = await statisticsService.getEngagementMetrics();

      res.json({
        success: true,
        message: 'Engagement metrics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /admin/statistics/users/retention
   * @desc    Get retention metrics
   * @access  Admin/Moderator
   */
  async getRetentionMetrics(req, res, next) {
    try {
      logger.info('Retention metrics requested', { admin_id: req.user.id });

      const data = await statisticsService.getRetentionMetrics();

      res.json({
        success: true,
        message: 'Retention metrics retrieved successfully',
        data,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StatisticsController();
