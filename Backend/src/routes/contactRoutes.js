/**
 * Contact Routes
 * Phase 6 - Task 6.2: Feature Gating - Contact Views
 * 
 * API Endpoints for viewing user contact details (phone/email)
 * Protected by subscription-based feature gating
 * 
 * @module routes/contactRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkFeatureAccess, attachFeatureUsageToResponse } from '../middleware/featureGating.js';
import { FeatureCode, FeatureFlag } from '../types/enums.js';
import asyncHandler from '../utils/asyncHandler.js';
import contactController from '../controllers/contactController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Attach feature usage info to all responses
router.use(attachFeatureUsageToResponse);

/**
 * @swagger
 * /contacts/history:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get my contact view history
 *     description: Shows how many contacts the user has viewed this month
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact view history retrieved
 */
router.get(
  '/history',
  asyncHandler(contactController.getContactViewHistory)
);

/**
 * @swagger
 * /contacts/{userId}:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: View user contact details (phone/email)
 *     description: |
 *       View contact details of another user. This is a **premium feature** with subscription-based limits.
 *       
 *       **Feature Gating:**
 *       - FREE plan: 0 views/month (blocked)
 *       - BASIC plan: 20 views/month
 *       - PREMIUM plan: 50 views/month
 *       - GOLD plan: Unlimited
 *       
 *       **Business Rules:**
 *       - Cannot view own contact
 *       - Cannot view blocked users
 *       - Must have active subscription
 *       - Usage tracked monthly (resets 1st of each month)
 *       
 *       **Phase 1 - Hard-gated** (High-value monetization feature)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user whose  contact to view
 *     responses:
 *       200:
 *         description: Contact details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Contact details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     profile_id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     mobile_number:
 *                       type: string
 *                     email:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                     is_verified:
 *                       type: boolean
 *                 feature_usage:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       type: string
 *                       example: "CONTACT_VIEW_LIMIT_MONTHLY"
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     used:
 *                       type: integer
 *                       example: 5
 *                     remaining:
 *                       type: integer
 *                       example: 15
 *                     reset_period:
 *                       type: string
 *                       example: "MONTHLY"
 *                     window_end:
 *                       type: string
 *                       format: date-time
 *                 warning:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "LIMIT_NEAR"
 *                     remaining:
 *                       type: integer
 *                       example: 2
 *       403:
 *         description: Feature limit reached or not available in plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   enum: [FEATURE_LIMIT_REACHED, FEATURE_NOT_AVAILABLE, PLAN_RESTRICTION]
 *                 message:
 *                   type: string
 *                   example: "You've reached your contact view limit"
 *                 feature:
 *                   type: string
 *                   example: "CONTACT_VIEW_LIMIT_MONTHLY"
 *                 limit:
 *                   type: object
 *                   properties:
 *                     monthly:
 *                       type: integer
 *                       example: 20
 *                 used:
 *                   type: object
 *                   properties:
 *                     monthly:
 *                       type: integer
 *                       example: 20
 *                 current_plan:
 *                   type: string
 *                   example: "BASIC"
 *                 upgrade_required:
 *                   type: boolean
 *                   example: true
 *                 recommended_plan:
 *                   type: string
 *                   example: "PREMIUM"
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId',
  checkFeatureAccess(FeatureCode.CONTACT_VIEW_LIMIT_MONTHLY, {
    increment: 1,              // Increment usage after check passes
    softGate: false,           // Hard-gate (block when limit reached)
    flagKey: FeatureFlag.GATE_CONTACT_VIEWS  // Phase 1 feature flag
  }),
  asyncHandler(contactController.viewContact)
);

export default router;
