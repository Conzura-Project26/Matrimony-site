/**
 * Feature Gating Middleware
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * Enforces subscription-based feature limits with phased rollout support
 * 
 * Features:
 * - Daily limits (profile views, interests, messages)
 * - Monthly limits (contact views)
 * - Boolean features (protected photos, advanced filters)
 * - Feature flags for phased rollout
 * - Logging mode for Phase 0
 * - Admin bypass
 * - Structured error responses
 * 
 * @module middleware/featureGating
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { ForbiddenError } from '../utils/errors.js';
import { FeatureCode, FeatureFlag, FeatureGatingError, FeatureLimits } from '../types/enums.js';

// ============================================
// FEATURE FLAGS (Phased Rollout Control)
// ============================================
const activeFeatureFlags = new Set([
  // FeatureFlag.LOGGING_ONLY,  // Disable logging-only mode for testing
  
  // Phase 1 - Hard-gating enabled
  FeatureFlag.GATE_CONTACT_VIEWS,
  FeatureFlag.GATE_PROTECTED_PHOTOS,
  FeatureFlag.GATE_ADVANCED_FILTERS,
  
  // Phase 2 - Soft-gating
  FeatureFlag.GATE_INTERESTS,
  FeatureFlag.GATE_MESSAGING,
  FeatureFlag.GATE_PROFILE_VIEWS,
  
  // Phase 3
  FeatureFlag.GATE_DAILY_MATCHES
]);

/**
 * Check if a feature flag is enabled
 */
export const isFeatureFlagEnabled = (flag) => {
  return activeFeatureFlags.has(flag);
};

/**
 * Enable a feature flag (runtime control)
 */
export const enableFeatureFlag = (flag) => {
  activeFeatureFlags.add(flag);
  logger.info(`Feature flag ENABLED: ${flag}`);
};

/**
 * Disable a feature flag (runtime control)
 */
export const disableFeatureFlag = (flag) => {
  activeFeatureFlags.delete(flag);
  logger.info(`Feature flag DISABLED: ${flag}`);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get usage window boundaries based on reset period
 */
const getUsageWindow = (resetPeriod) => {
  const now = new Date();
  let window_start, window_end;
  
  if (resetPeriod === 'DAILY') {
    // Today midnight to tomorrow midnight (UTC)
    window_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    window_end = new Date(window_start);
    window_end.setDate(window_end.getDate() + 1);
  } else if (resetPeriod === 'MONTHLY') {
    // 1st of current month to 1st of next month
    window_start = new Date(now.getFullYear(), now.getMonth(), 1);
    window_end = new Date(window_start);
    window_end.setMonth(window_end.getMonth() + 1);
  } else {
    // No reset period
    window_start = new Date(0);
    window_end = new Date('2099-12-31');
  }
  
  return { window_start, window_end };
};

/**
 * Get user's active subscription with plan features
 */
const getUserSubscription = async (userId) => {
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
              is_enabled: true
            }
          }
        }
      }
    },
    orderBy: {
      end_date: 'desc'
    }
  });
  
  return subscription;
};

/**
 * Get feature configuration for user's plan
 */
const getFeatureConfig = (subscription, featureCode) => {
  if (!subscription || !subscription.plan) {
    return null;
  }
  
  const planFeature = subscription.plan.plan_features.find(
    pf => pf.feature.code === featureCode
  );
  
  return planFeature || null;
};

/**
 * Get current usage for a feature
 */
const getCurrentUsage = async (userId, featureId, window_start, window_end) => {
  const usage = await prisma.featureUsage.findFirst({
    where: {
      user_id: userId,
      feature_id: featureId,
      window_start: window_start,
      window_end: window_end
    }
  });
  
  return usage?.used_count || 0;
};

/**
 * Increment feature usage
 */
const incrementUsage = async (userId, featureId, window_start, window_end, increment = 1) => {
  logger.debug(`incrementUsage called with userId=${userId}, featureId=${featureId}, increment=${increment}`);
  
  if (!userId) {
    logger.error('incrementUsage: userId is null/undefined!');
    throw new Error('userId is required for incrementUsage');
  }
  
  const usage = await prisma.featureUsage.upsert({
    where: {
      user_id_feature_id_window_start: {
        user_id: userId,
        feature_id: featureId,
        window_start: window_start
      }
    },
    update: {
      used_count: {
        increment: increment
      },
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      feature_id: featureId,
      used_count: increment,
      window_start: window_start,
      window_end: window_end
    }
  });
  
  return usage;
};

/**
 * Get recommended plan for upgrade
 */
const getRecommendedPlan = (currentPlanCode) => {
  const planHierarchy = ['FREE', 'BASIC', 'PREMIUM', 'GOLD'];
  const currentIndex = planHierarchy.indexOf(currentPlanCode);
  
  if (currentIndex < planHierarchy.length - 1) {
    return planHierarchy[currentIndex + 1];
  }
  
  return 'GOLD';  // Already at top
};

/**
 * Get detailed upgrade information
 */
const getUpgradeDetails = (currentPlanCode, featureType = 'feature') => {
  const suggestedPlan = getRecommendedPlan(currentPlanCode);
  
  const benefits = {
    BASIC: {
      contacts: '30 contact views per month',
      general: 'Access to basic features'
    },
    PREMIUM: {
      contacts: '75 contact views per month',
      advanced_search: 'Advanced search filters',
      protected_photos: 'View protected photos',
      general: 'All advanced features'
    },
    GOLD: {
      contacts: 'Unlimited contact views',
      advanced_search: 'Advanced search filters',
      protected_photos: 'View protected photos',
      general: 'All premium features with unlimited access'
    }
  };
  
  const messages = {
    BASIC: 'Upgrade to BASIC plan to continue accessing this feature',
    PREMIUM: 'Upgrade to PREMIUM plan to unlock advanced features',
    GOLD: 'Upgrade to GOLD plan for unlimited access'
  };
  
  return {
    suggested_plan: suggestedPlan,
    upgrade_message: messages[suggestedPlan] || `Upgrade to ${suggestedPlan} plan`,
    benefit_increase: benefits[suggestedPlan]?.[featureType] || benefits[suggestedPlan]?.general || 'Enhanced features'
  };
};

// ============================================
// MAIN FEATURE GATING MIDDLEWARE
// ============================================

/**
 * Check if user has access to a feature and enforce limits
 * 
 * @param {String} featureCode - Feature code from FeatureCode enum
 * @param {Object} options - Options { increment: 1, softGate: false, flagKey: null }
 * @returns {Function} Express middleware
 */
export const checkFeatureAccess = (featureCode, options = {}) => {
  const {
    increment = 0,        // Whether to increment usage (0 = check only, 1 = increment)
    softGate = false,     // Soft-gate: warn but allow
    flagKey = null        // Feature flag to check
  } = options;
  
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;  // JWT uses userId, some places use id
      const userRole = req.user.role;
      
      if (!userId) {
        logger.error('No userId found in req.user:', req.user);
        throw new Error('User ID not found in request');
      }
      
      // Admin bypass (always allow)
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        logger.debug(`Feature access granted: ${featureCode} (Admin bypass for user ${userId})`);
        return next();
      }
      
      // Check feature flag
      if (flagKey && !isFeatureFlagEnabled(flagKey)) {
        // Feature gating not enabled yet, allow action
        logger.debug(`Feature gating disabled: ${featureCode} (Flag ${flagKey} not active)`);
        return next();
      }
      
      // Get user's subscription
      const subscription = await getUserSubscription(userId);
      
      if (!subscription) {
        logger.warn(`No active subscription for user ${userId}`);
        
        // In logging mode, just log and allow
        if (isFeatureFlagEnabled(FeatureFlag.LOGGING_ONLY)) {
          logger.info(`[LOGGING MODE] Would block: ${featureCode} - No subscription (User: ${userId})`);
          return next();
        }
        
        throw new ForbiddenError('No active subscription found', {
          error_code: FeatureGatingError.NO_ACTIVE_SUBSCRIPTION,
          feature: featureCode,
          upgrade_required: true,
          recommended_plan: 'BASIC'
        });
      }
      
      // Get feature configuration
      const planFeature = getFeatureConfig(subscription, featureCode);
      
      if (!planFeature) {
        logger.warn(`Feature ${featureCode} not found in plan ${subscription.plan.code}`);
        
        // In logging mode, just log and allow
        if (isFeatureFlagEnabled(FeatureFlag.LOGGING_ONLY)) {
          logger.info(`[LOGGING MODE] Would block: ${featureCode} - Not available (User: ${userId}, Plan: ${subscription.plan.code})`);
          return next();
        }
        
        const upgradeInfo = getUpgradeDetails(subscription.plan.code);
        throw new ForbiddenError(`Feature not available in your ${subscription.plan.display_name}`, {
          error_code: FeatureGatingError.FEATURE_NOT_AVAILABLE,
          feature: featureCode,
          current_plan: subscription.plan.code,
          upgrade_required: true,
          ...upgradeInfo
        });
      }
      
      const feature = planFeature.feature;
      
      // ====================================
      // BOOLEAN FEATURES
      // ====================================
      if (feature.value_type === 'BOOLEAN') {
        const hasAccess = planFeature.value_boolean === true;
        
        if (!hasAccess) {
          logger.info(`Feature blocked: ${featureCode} (Boolean false) for user ${userId}`);
          
          // In logging mode, just log and allow
          if (isFeatureFlagEnabled(FeatureFlag.LOGGING_ONLY)) {
            logger.info(`[LOGGING MODE] Would block: ${featureCode} - Boolean false (User: ${userId})`);
            return next();
          }
          
          const featureTypeMap = {
            'advanced_search': 'advanced_search',
            'view_protected_photos': 'protected_photos'
          };
          const upgradeInfo = getUpgradeDetails(subscription.plan.code, featureTypeMap[featureCode] || 'general');
          throw new ForbiddenError(`This feature requires ${upgradeInfo.suggested_plan} plan`, {
            error_code: FeatureGatingError.PLAN_RESTRICTION,
            feature: featureCode,
            current_plan: subscription.plan.code,
            upgrade_required: true,
            ...upgradeInfo
          });
        }
        
        logger.debug(`Feature access granted: ${featureCode} (Boolean true)`);
        return next();
      }
      
      // ====================================
      // STRING FEATURES
      // ====================================
      if (feature.value_type === 'STRING') {
        req.featureValue = planFeature.value_string;
        logger.debug(`Feature access granted: ${featureCode} (String: ${planFeature.value_string})`);
        return next();
      }
      
      // ====================================
      // NUMERIC FEATURES WITH LIMITS
      // ====================================
      if (feature.value_type === 'NUMBER') {
        const limit = planFeature.value_number;
        
        // Unlimited access
        if (limit === -1) {
          logger.debug(`Feature access granted: ${featureCode} (Unlimited)`);
          return next();
        }
        
        // Get usage window
        const { window_start, window_end } = getUsageWindow(feature.reset_period);
        
        // Get current usage
        const used = await getCurrentUsage(userId, feature.id, window_start, window_end);
        const remaining = Math.max(0, limit - used);
        
        logger.debug(`Feature usage: ${featureCode} - Used: ${used}/${limit}, Remaining: ${remaining}`);
        
        // Check if limit reached
        if (remaining <= 0) {
          logger.info(`Feature limit reached: ${featureCode} (${used}/${limit}) for user ${userId}`);
          
          // In logging mode, just log and allow
          if (isFeatureFlagEnabled(FeatureFlag.LOGGING_ONLY)) {
            logger.info(`[LOGGING MODE] Would block: ${featureCode} - Limit reached ${used}/${limit} (User: ${userId})`);
            return next();
          }
          
          // Soft-gate: warn but allow
          if (softGate) {
            req.featureWarning = {
              type: 'LIMIT_REACHED',
              feature: featureCode,
              limit: limit,
              used: used,
              reset_period: feature.reset_period,
              window_end: window_end
            };
            logger.info(`[SOFT GATE] Allowing action with warning: ${featureCode}`);
            return next();
          }
          
          // Hard block
          throw new ForbiddenError(`You've reached your ${featureCode.toLowerCase().replace(/_/g, ' ')} limit`, {
            error_code: FeatureGatingError.FEATURE_LIMIT_REACHED,
            feature: featureCode,
            limit: {
              [feature.reset_period.toLowerCase()]: limit
            },
            used: {
              [feature.reset_period.toLowerCase()]: used
            },
            reset_period: feature.reset_period,
            window_end: window_end,
            current_plan: subscription.plan.code,
            upgrade_required: true,
            ...getUpgradeDetails(subscription.plan.code, 'contacts')
          });
        }
        
        // Increment usage if requested
        if (increment > 0) {
          await incrementUsage(userId, feature.id, window_start, window_end, increment);
          logger.debug(`Feature usage incremented: ${featureCode} (${used + increment}/${limit})`);
        }
        
        // Attach usage info to request
        req.featureUsage = {
          feature: featureCode,
          limit: limit,
          used: used + increment,
          remaining: remaining - increment,
          reset_period: feature.reset_period,
          window_end: window_end
        };
        
        // Warn if approaching limit
        if (remaining - increment <= 3 && remaining - increment > 0) {
          req.featureWarning = {
            type: 'LIMIT_NEAR',
            feature: featureCode,
            remaining: remaining - increment
          };
        }
        
        logger.debug(`Feature access granted: ${featureCode} (${used + increment}/${limit})`);
        return next();
      }
      
      // Unknown feature type
      logger.error(`Unknown feature type: ${feature.value_type} for ${featureCode}`);
      return next();
      
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return next(error);
      }
      
      logger.error(`Error in feature gating middleware for ${featureCode}:`, error);
      return next(error);
    }
  };
};

/**
 * Middleware to include feature usage info in response
 */
export const attachFeatureUsageToResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (body) => {
    if (req.featureUsage) {
      body.feature_usage = req.featureUsage;
    }
    
    if (req.featureWarning) {
      body.warning = req.featureWarning;
    }
    
    return originalJson(body);
  };
  
  next();
};

export default {
  checkFeatureAccess,
  attachFeatureUsageToResponse,
  isFeatureFlagEnabled,
  enableFeatureFlag,
  disableFeatureFlag
};
