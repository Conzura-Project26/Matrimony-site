import prisma from '../config/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';
import { ResetPeriod, FeatureType } from '../types/enums.js';

class FeatureService {
  /**
   * Get all features
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of features
   */
  async getAllFeatures(filters = {}) {
    try {
      const where = {};

      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters.value_type) {
        where.value_type = filters.value_type;
      }

      const features = await prisma.feature.findMany({
        where,
        orderBy: { code: 'asc' },
      });

      return features;
    } catch (error) {
      logger.error('Error fetching features:', error);
      throw error;
    }
  }

  /**
   * Create a new feature
   * @param {Object} featureData - Feature data
   * @param {String} createdBy - Admin user ID
   * @returns {Promise<Object>} Created feature
   */
  async createFeature(featureData, createdBy) {
    try {
      const existingFeature = await prisma.feature.findUnique({
        where: { code: featureData.code.toUpperCase() },
      });

      if (existingFeature) {
        throw new BadRequestError(`Feature with code ${featureData.code} already exists`);
      }

      const feature = await prisma.$transaction(async (tx) => {
        const newFeature = await tx.feature.create({
          data: {
            code: featureData.code.toUpperCase(),
            display_name: featureData.display_name,
            description: featureData.description,
            value_type: featureData.value_type,
            reset_period: featureData.reset_period,
            is_active: true,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: createdBy,
            action: `FEATURE_CREATED: ${newFeature.code}`,
          },
        });

        return newFeature;
      });

      logger.info(`Feature created: ${feature.code} by admin ${createdBy}`);

      return feature;
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      logger.error('Error creating feature:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a feature
   * @param {String} userId - User UUID
   * @param {String} featureCode - Feature code
   * @returns {Promise<Object>} { has_access, limit, used, remaining }
   */
  async checkFeatureAccess(userId, featureCode) {
    try {
      // Get user's current active subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          user_id: userId,
          status: 'ACTIVE',
          end_date: {
            gte: new Date(),
          },
        },
        include: {
          plan: {
            include: {
              plan_features: {
                include: {
                  feature: true,
                },
                where: {
                  feature: {
                    code: featureCode.toUpperCase(),
                  },
                },
              },
            },
          },
        },
        orderBy: {
          end_date: 'desc',
        },
      });

      // No active subscription or plan doesn't have feature
      if (!subscription || !subscription.plan || subscription.plan.plan_features.length === 0) {
        return {
          has_access: false,
          limit: 0,
          used: 0,
          remaining: 0,
          message: 'Feature not available in your plan',
        };
      }

      const planFeature = subscription.plan.plan_features[0];
      const feature = planFeature.feature;

      // If feature is boolean type
      if (feature.value_type === 'BOOLEAN') {
        return {
          has_access: planFeature.value_boolean === true,
          limit: null,
          used: null,
          remaining: null,
          message: planFeature.value_boolean ? 'Feature enabled' : 'Feature disabled',
        };
      }

      // If feature is string type (e.g., "unlimited", "priority")
      if (feature.value_type === 'STRING') {
        const isUnlimited = planFeature.value_string?.toLowerCase() === 'unlimited';
        return {
          has_access: true,
          limit: isUnlimited ? -1 : null,
          used: null,
          remaining: null,
          value: planFeature.value_string,
          message: isUnlimited ? 'Unlimited access' : planFeature.value_string,
        };
      }

      // If feature is numeric with limits
      if (feature.value_type === 'NUMBER') {
        const limit = planFeature.value_number;

        // Unlimited (-1)
        if (limit === -1) {
          return {
            has_access: true,
            limit: -1,
            used: 0,
            remaining: -1,
            message: 'Unlimited access',
          };
        }

        // Get usage window
        const { window_start, window_end } = this._getUsageWindow(feature.reset_period);

        // Get current usage
        const usage = await prisma.featureUsage.findFirst({
          where: {
            user_id: userId,
            feature_id: feature.id,
            window_start,
            window_end,
          },
        });

        const used = usage?.used_count || 0;
        const remaining = Math.max(0, limit - used);

        return {
          has_access: remaining > 0,
          limit,
          used,
          remaining,
          reset_period: feature.reset_period,
          window_end,
          message: remaining > 0 ? `${remaining} remaining` : 'Limit reached',
        };
      }

      return {
        has_access: false,
        message: 'Invalid feature type',
      };
    } catch (error) {
      logger.error('Error checking feature access:', error);
      throw error;
    }
  }

  /**
   * Increment feature usage
   * @param {String} userId - User UUID
   * @param {String} featureCode - Feature code
   * @param {Number} increment - Amount to increment (default 1)
   * @returns {Promise<Object>} Updated usage
   */
  async incrementFeatureUsage(userId, featureCode, increment = 1) {
    try {
      // Check access first
      const access = await this.checkFeatureAccess(userId, featureCode);

      if (!access.has_access) {
        throw new BadRequestError(access.message);
      }

      // If unlimited, no need to track
      if (access.limit === -1) {
        return {
          success: true,
          message: 'Unlimited access',
        };
      }

      // Get feature
      const feature = await prisma.feature.findUnique({
        where: { code: featureCode.toUpperCase() },
      });

      if (!feature) {
        throw new NotFoundError('Feature not found');
      }

      const { window_start, window_end } = this._getUsageWindow(feature.reset_period);

      // Upsert usage
      const usage = await prisma.featureUsage.upsert({
        where: {
          user_id_feature_id_window_start: {
            user_id: userId,
            feature_id: feature.id,
            window_start,
          },
        },
        update: {
          used_count: {
            increment,
          },
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          feature_id: feature.id,
          used_count: increment,
          window_start,
          window_end,
        },
      });

      const remaining = Math.max(0, access.limit - usage.used_count);

      return {
        success: true,
        used: usage.used_count,
        limit: access.limit,
        remaining,
        window_end,
      };
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) throw error;
      logger.error('Error incrementing feature usage:', error);
      throw error;
    }
  }

  /**
   * Reset feature usage for a user (admin function)
   * @param {String} userId - User UUID
   * @param {String} featureCode - Feature code
   * @param {String} resetBy - Admin user ID
   * @returns {Promise<Object>} Reset result
   */
  async resetFeatureUsage(userId, featureCode, resetBy) {
    try {
      const feature = await prisma.feature.findUnique({
        where: { code: featureCode.toUpperCase() },
      });

      if (!feature) {
        throw new NotFoundError('Feature not found');
      }

      const { window_start, window_end } = this._getUsageWindow(feature.reset_period);

      await prisma.$transaction(async (tx) => {
        await tx.featureUsage.deleteMany({
          where: {
            user_id: userId,
            feature_id: feature.id,
            window_start,
            window_end,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: resetBy,
            action: `FEATURE_USAGE_RESET: ${featureCode} for user ${userId}`,
          },
        });
      });

      logger.info(`Feature usage reset: ${featureCode} for user ${userId} by admin ${resetBy}`);

      return {
        success: true,
        message: 'Feature usage reset successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error resetting feature usage:', error);
      throw error;
    }
  }

  /**
   * Get feature usage statistics for a user
   * @param {String} userId - User UUID
   * @returns {Promise<Array>} Usage statistics
   */
  async getUserFeatureUsage(userId) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          user_id: userId,
          status: 'ACTIVE',
          end_date: {
            gte: new Date(),
          },
        },
        include: {
          plan: {
            include: {
              plan_features: {
                include: {
                  feature: true,
                },
              },
            },
          },
        },
      });

      if (!subscription || !subscription.plan) {
        return [];
      }

      const usageStats = [];

      for (const pf of subscription.plan.plan_features) {
        if (pf.feature.value_type === 'NUMBER' && pf.feature.reset_period !== 'NONE') {
          const access = await this.checkFeatureAccess(userId, pf.feature.code);
          usageStats.push({
            feature_code: pf.feature.code,
            feature_name: pf.feature.display_name,
            ...access,
          });
        }
      }

      return usageStats;
    } catch (error) {
      logger.error('Error getting user feature usage:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired usage windows (cron job)
   * @returns {Promise<Number>} Number of deleted records
   */
  async cleanupExpiredUsage() {
    try {
      const result = await prisma.featureUsage.deleteMany({
        where: {
          window_end: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired feature usage records`);

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired usage:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate usage window based on reset period
   * @private
   */
  _getUsageWindow(resetPeriod) {
    const now = new Date();
    let window_start, window_end;

    switch (resetPeriod) {
      case 'DAILY':
        window_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        window_end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;

      case 'WEEKLY':
        const dayOfWeek = now.getDay();
        window_start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        window_end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
        break;

      case 'MONTHLY':
        window_start = new Date(now.getFullYear(), now.getMonth(), 1);
        window_end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case 'YEARLY':
        window_start = new Date(now.getFullYear(), 0, 1);
        window_end = new Date(now.getFullYear() + 1, 0, 1);
        break;

      case 'NONE':
      default:
        window_start = new Date(0); // Epoch
        window_end = new Date('2099-12-31'); // Far future
        break;
    }

    return { window_start, window_end };
  }
}

export default new FeatureService();
