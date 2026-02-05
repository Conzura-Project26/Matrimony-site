import prisma from '../config/prisma.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware to check if user has active feature restrictions
 * @param {String} feature - The feature to check ('CHAT', 'INTEREST', 'UPLOAD', 'SEARCH')
 * @returns {Function} Express middleware
 */
export const checkFeatureRestriction = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Check for active restrictions on this feature
      const restriction = await prisma.userFeatureRestriction.findFirst({
        where: {
          user_id: userId,
          feature: feature,
          is_active: true,
          OR: [
            { expires_at: null }, // Permanent restriction
            { expires_at: { gt: new Date() } } // Not yet expired
          ]
        }
      });

      if (restriction) {
        const expiryMessage = restriction.expires_at 
          ? ` until ${restriction.expires_at.toISOString()}`
          : ' permanently';
        
        throw new ForbiddenError(
          `Your ${feature.toLowerCase()} feature has been restricted${expiryMessage}. Reason: ${restriction.reason || 'Violation of community guidelines'}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any active feature restrictions
 * Returns restriction info without blocking request
 */
export const getUserRestrictions = async (userId) => {
  const restrictions = await prisma.userFeatureRestriction.findMany({
    where: {
      user_id: userId,
      is_active: true,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ]
    },
    select: {
      feature: true,
      expires_at: true,
      reason: true
    }
  });

  return restrictions;
};

/**
 * Cleanup expired restrictions (run as cron job)
 */
export const cleanupExpiredRestrictions = async () => {
  const result = await prisma.userFeatureRestriction.updateMany({
    where: {
      is_active: true,
      expires_at: { lte: new Date() }
    },
    data: {
      is_active: false
    }
  });

  console.log(`Deactivated ${result.count} expired feature restrictions`);
  return result.count;
};
