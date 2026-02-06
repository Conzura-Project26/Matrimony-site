import asyncHandler from '../utils/asyncHandler.js';
import subscriptionService from '../services/subscriptionService.js';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * tags:
 *   name: User Subscriptions
 *   description: User subscription management
 */

// Validation schemas
const subscribePlanSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  paymentDetails: z.object({
    transactionId: z.string().optional(),
    paymentMethod: z.string().optional(),
    amount: z.number().optional(),
  }).optional(),
});

const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

const toggleAutoRenewSchema = z.object({
  autoRenew: z.boolean(),
});

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     tags:
 *       - User Subscriptions
 *     summary: Get current active subscription
 *     description: Get the user's current active subscription with plan details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription details
 *       404:
 *         description: No active subscription found
 */
export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const subscription = await subscriptionService.getUserSubscription(userId);

  res.json({
    success: true,
    message: 'Current subscription retrieved successfully',
    data: subscription,
  });
});

/**
 * @swagger
 * /api/subscriptions/history:
 *   get:
 *     tags:
 *       - User Subscriptions
 *     summary: Get subscription history
 *     description: Get all subscriptions for the user (past and present)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription history
 */
export const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const history = await subscriptionService.getUserSubscriptionHistory(userId);

  res.json({
    success: true,
    message: 'Subscription history retrieved successfully',
    data: history,
  });
});

/**
 * @swagger
 * /api/subscriptions/subscribe:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Subscribe to a plan
 *     description: Subscribe or upgrade to a new subscription plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the plan to subscribe to
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   transactionId:
 *                     type: string
 *                   paymentMethod:
 *                     type: string
 *                   amount:
 *                     type: number
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Plan not found
 */
export const subscribeToPlan = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  // Validate request
  const validatedData = subscribePlanSchema.parse(req.body);

  const subscription = await subscriptionService.subscribeToPlan(
    userId,
    validatedData.planId,
    validatedData.paymentDetails
  );

  res.status(201).json({
    success: true,
    message: 'Subscribed to plan successfully',
    data: subscription,
  });
});

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/renew:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Renew subscription
 *     description: Manually renew an expired or expiring subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription renewed
 *       404:
 *         description: Subscription not found
 */
export const renewSubscription = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { subscriptionId } = req.params;

  const subscription = await subscriptionService.renewSubscription(
    userId,
    parseInt(subscriptionId)
  );

  res.json({
    success: true,
    message: 'Subscription renewed successfully',
    data: subscription,
  });
});

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/cancel:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Cancel subscription
 *     description: Cancel an active subscription (will revert to FREE plan)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       404:
 *         description: Subscription not found
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { subscriptionId } = req.params;

  const validatedData = cancelSubscriptionSchema.parse(req.body);

  const subscription = await subscriptionService.cancelSubscription(
    userId,
    parseInt(subscriptionId),
    validatedData.reason
  );

  res.json({
    success: true,
    message: 'Subscription cancelled successfully. Reverted to FREE plan.',
    data: subscription,
  });
});

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/auto-renew:
 *   patch:
 *     tags:
 *       - User Subscriptions
 *     summary: Toggle auto-renew
 *     description: Enable or disable auto-renewal for a subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - autoRenew
 *             properties:
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-renew setting updated
 *       404:
 *         description: Subscription not found
 */
export const toggleAutoRenew = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { subscriptionId } = req.params;

  const validatedData = toggleAutoRenewSchema.parse(req.body);

  const subscription = await subscriptionService.toggleAutoRenew(
    userId,
    parseInt(subscriptionId),
    validatedData.autoRenew
  );

  res.json({
    success: true,
    message: `Auto-renew ${validatedData.autoRenew ? 'enabled' : 'disabled'} successfully`,
    data: subscription,
  });
});
