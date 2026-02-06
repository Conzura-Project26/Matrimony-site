/**
 * Subscription Helper Utilities
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * Ensures all users have an active subscription (defaults to FREE)
 * 
 * @module utils/subscriptionHelper
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Get or create FREE plan subscription for a user
 * Ensures every user always has at least a FREE plan
 * 
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Active subscription
 */
export const ensureUserHasSubscription = async (userId) => {
  try {
    // Check if user has an active subscription
    let subscription = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        end_date: {
          gte: new Date()
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        end_date: 'desc'
      }
    });
    
    // If user has active subscription, return it
    if (subscription) {
      return subscription;
    }
    
    // Get FREE plan
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: {
        code: 'FREE',
        version: 1,
        is_active: true
      }
    });
    
    if (!freePlan) {
      logger.error('FREE plan not found in database. Please run seed script.');
      throw new Error('FREE plan not configured');
    }
    
    // Create FREE subscription for user
    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);  // 10 years for free plan
    
    subscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        plan_id: freePlan.id,
        plan_name: freePlan.display_name,  // Populate legacy field for backward compatibility
        status: 'ACTIVE',
        start_date: now,
        end_date: endDate,
        is_active: true,
        auto_renew: false
      },
      include: {
        plan: true
      }
    });
    
    logger.info(`Auto-assigned FREE plan to user ${userId}`);
    
    return subscription;
    
  } catch (error) {
    logger.error('Error ensuring user has subscription:', error);
    throw error;
  }
};

/**
 * Handle subscription expiration
 * When a paid subscription expires, downgrade user to FREE plan
 * 
 * @param {String} subscriptionId - Subscription ID
 * @returns {Promise<Object>} New subscription
 */
export const handleSubscriptionExpiry = async (subscriptionId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: true }
    });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // Mark current subscription as expired
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'EXPIRED',
        is_active: false
      }
    });
    
    logger.info(`Subscription expired: ${subscriptionId} (User: ${subscription.user_id}, Plan: ${subscription.plan.code})`);
    
    // If it was a paid plan, auto-downgrade to FREE
    if (subscription.plan.priority > 0) {
      const newSubscription = await ensureUserHasSubscription(subscription.user_id);
      logger.info(`User ${subscription.user_id} downgraded to FREE plan`);
      return newSubscription;
    }
    
    return subscription;
    
  } catch (error) {
    logger.error('Error handling subscription expiry:', error);
    throw error;
  }
};

/**
 * Check if user can access a specific plan feature
 * Utility function for manual feature checks
 * 
 * @param {String} userId - User UUID
 * @param {String} featureCode - Feature code
 * @returns {Promise<Object>} { hasAccess, limit, used, remaining, plan }
 */
export const checkUserFeatureAccess = async (userId, featureCode) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        end_date: {
          gte: new Date()
        }
      },
      include: {
        plan: {
          include: {
            plan_features: {
              include: {
                feature: true
              },
              where: {
                feature: {
                  code: featureCode
                },
                is_enabled: true
              }
            }
          }
        }
      }
    });
    
    if (!subscription || subscription.plan.plan_features.length === 0) {
      return {
        hasAccess: false,
        plan: subscription?.plan?.code || 'NONE',
        message: 'Feature not available in your plan'
      };
    }
    
    const planFeature = subscription.plan.plan_features[0];
    const feature = planFeature.feature;
    
    // Boolean feature
    if (feature.value_type === 'BOOLEAN') {
      return {
        hasAccess: planFeature.value_boolean === true,
        plan: subscription.plan.code,
        featureType: 'BOOLEAN',
        value: planFeature.value_boolean
      };
    }
    
    // String feature
    if (feature.value_type === 'STRING') {
      return {
        hasAccess: true,
        plan: subscription.plan.code,
        featureType: 'STRING',
        value: planFeature.value_string
      };
    }
    
    // Numeric feature with limits
    if (feature.value_type === 'NUMBER') {
      const limit = planFeature.value_number;
      
      if (limit === -1) {
        return {
          hasAccess: true,
          plan: subscription.plan.code,
          featureType: 'NUMBER',
          limit: -1,
          used: 0,
          remaining: -1,
          message: 'Unlimited'
        };
      }
      
      // Get usage
      const now = new Date();
      let window_start, window_end;
      
      if (feature.reset_period === 'DAILY') {
        window_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        window_end = new Date(window_start);
        window_end.setDate(window_end.getDate() + 1);
      } else if (feature.reset_period === 'MONTHLY') {
        window_start = new Date(now.getFullYear(), now.getMonth(), 1);
        window_end = new Date(window_start);
        window_end.setMonth(window_end.getMonth() + 1);
      }
      
      const usage = await prisma.featureUsage.findFirst({
        where: {
          user_id: userId,
          feature_id: feature.id,
          window_start: window_start
        }
      });
      
      const used = usage?.used_count || 0;
      const remaining = Math.max(0, limit - used);
      
      return {
        hasAccess: remaining > 0,
        plan: subscription.plan.code,
        featureType: 'NUMBER',
        limit: limit,
        used: used,
        remaining: remaining,
        resetPeriod: feature.reset_period,
        windowEnd: window_end
      };
    }
    
    return {
      hasAccess: false,
      plan: subscription.plan.code,
      message: 'Unknown feature type'
    };
    
  } catch (error) {
    logger.error('Error checking user feature access:', error);
    throw error;
  }
};

/**
 * Get user's current plan with all features
 * 
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Plan with features
 */
export const getUserPlanDetails = async (userId) => {
  try {
    const subscription = await ensureUserHasSubscription(userId);
    
    const planWithFeatures = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.plan_id },
      include: {
        plan_features: {
          include: {
            feature: true
          },
          where: {
            is_enabled: true
          }
        }
      }
    });
    
    // Format features
    const features = {};
    for (const pf of planWithFeatures.plan_features) {
      const value = pf.value_number !== null ? pf.value_number :
                   pf.value_boolean !== null ? pf.value_boolean :
                   pf.value_string !== null ? pf.value_string : null;
      
      features[pf.feature.code] = {
        display_name: pf.feature.display_name,
        value: value,
        type: pf.feature.value_type,
        reset_period: pf.feature.reset_period
      };
    }
    
    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date
      },
      plan: {
        id: planWithFeatures.id,
        code: planWithFeatures.code,
        display_name: planWithFeatures.display_name,
        priority: planWithFeatures.priority
      },
      features: features
    };
    
  } catch (error) {
    logger.error('Error getting user plan details:', error);
    throw error;
  }
};

export default {
  ensureUserHasSubscription,
  handleSubscriptionExpiry,
  checkUserFeatureAccess,
  getUserPlanDetails
};
