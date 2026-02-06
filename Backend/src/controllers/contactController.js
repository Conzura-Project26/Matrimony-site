/**
 * Contact View Endpoint (Example implementation)
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * This demonstrates how to implement feature gating for contact views
 * 
 * @module controllers/contactController
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { FeatureCode } from '../types/enums.js';

class ContactController {
  /**
   * View contact details (phone/email) of a user
   * GET /contacts/:userId
   * 
   * Protected by:
   * - Authentication
   * - Feature Gating: CONTACT_VIEW_LIMIT_MONTHLY
   * 
   * Limits:
   * - FREE: 0 per month (blocked)
   * - BASIC: 20 per month
   * - PREMIUM: 50 per month
   * - GOLD: Unlimited
   */
  async viewContact(req, res) {
    const viewerId = req.user.userId || req.user.id;
    const { userId } = req.params;
    
    // Validate: can't view own contact
    if (viewerId === userId) {
      throw new ForbiddenError('Cannot view your own contact details');
    }
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        mobile_number: true,
        email: true,
        profile_id: true,
        is_active: true,
        is_profile_verified: true,
        personal_details: {
          select: {
            city: true,
            state: true
          }
        }
      }
    });
    
    if (!user || !user.is_active) {
      throw new NotFoundError('User not found');
    }
    
    // Check blocks (optional, depends on your logic)
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blocker_id: userId, blocked_id: viewerId },
          { blocker_id: viewerId, blocked_id: userId }
        ],
        unblocked_at: null
      }
    });
    
    if (isBlocked) {
      throw new ForbiddenError('Cannot view contact details');
    }
    
    // Feature gating middleware has already checked and incremented usage
    // See: checkFeatureAccess(FeatureCode.CONTACT_VIEW_LIMIT_MONTHLY, { increment: 1 })
    
    // Log the contact view
    logger.info(`Contact viewed: ${userId} by ${viewerId}`);
    
    res.status(200).json({
      success: true,
      message: 'Contact details retrieved successfully',
      data: {
        user_id: user.id,
        profile_id: user.profile_id,
        full_name: user.full_name,
        mobile_number: user.mobile_number,
        email: user.email,
        location: {
          city: user.personal_details?.city,
          state: user.personal_details?.state
        },
        is_verified: user.is_profile_verified
      },
      // Feature usage info attached by middleware
      feature_usage: req.featureUsage,
      warning: req.featureWarning
    });
  }
  
  /**
   * Get my contact view history
   * GET /contacts/history
   * 
   * Shows which contacts the user has viewed
   */
  async getContactViewHistory(req, res) {
    const userId = req.user.userId || req.user.id;
    
    // Get feature usage for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const feature = await prisma.feature.findUnique({
      where: { code: FeatureCode.CONTACT_VIEW_LIMIT_MONTHLY }
    });
    
    if (!feature) {
      throw new Error('Contact view feature not configured');
    }
    
    const usage = await prisma.featureUsage.findFirst({
      where: {
        user_id: userId,
        feature_id: feature.id,
        window_start: monthStart,
        window_end: monthEnd
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Contact view history retrieved',
      data: {
        current_month: {
          used: usage?.used_count || 0,
          period: {
            start: monthStart,
            end: monthEnd
          }
        }
      }
    });
  }
}

export default new ContactController();
