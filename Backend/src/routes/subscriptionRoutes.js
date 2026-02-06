import express from 'express';
import {
  getCurrentSubscription,
  getSubscriptionHistory,
  subscribeToPlan,
  renewSubscription,
  cancelSubscription,
  toggleAutoRenew,
} from '../controllers/userSubscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * All subscription routes require authentication
 */
router.use(authenticateToken);

/**
 * @swagger
 * /subscriptions/current:
 *   get:
 *     tags:
 *       - User Subscriptions
 *     summary: Get current active subscription
 *     description: Retrieve the user's current active subscription with plan details and features
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
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
 *                   example: Current subscription retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     planId:
 *                       type: string
 *                       format: uuid
 *                     planName:
 *                       type: string
 *                       example: Premium Monthly
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, CANCELLED, EXPIRED]
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     autoRenew:
 *                       type: boolean
 *                     plan:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                         price:
 *                           type: object
 *                         features:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: No active subscription found
 */
router.get('/current', getCurrentSubscription);

/**
 * @swagger
 * /subscriptions/history:
 *   get:
 *     tags:
 *       - User Subscriptions
 *     summary: Get subscription history
 *     description: Retrieve all subscriptions for the user (past and present)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
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
 *                   example: Subscription history retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       planName:
 *                         type: string
 *                       status:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/history', getSubscriptionHistory);

/**
 * @swagger
 * /subscriptions/subscribe:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Subscribe to a plan
 *     description: Subscribe or upgrade to a new subscription plan. Automatically cancels current subscription if upgrading.
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
 *                 description: UUID of the subscription plan
 *                 example: 54b366f5-30fe-403a-b041-9c828783782e
 *               paymentDetails:
 *                 type: object
 *                 description: Optional payment information
 *                 properties:
 *                   transactionId:
 *                     type: string
 *                     example: TXN1234567890
 *                   method:
 *                     type: string
 *                     example: credit_card
 *                   amount:
 *                     type: number
 *                     example: 2499
 *           example:
 *             planId: 54b366f5-30fe-403a-b041-9c828783782e
 *             paymentDetails:
 *               transactionId: TXN1234567890
 *               method: credit_card
 *     responses:
 *       201:
 *         description: Successfully subscribed to plan
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
 *                   example: Subscribed to plan successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 *       422:
 *         description: Cannot downgrade to FREE plan
 */
router.post('/subscribe', subscribeToPlan);

/**
 * @swagger
 * /subscriptions/{subscriptionId}/renew:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Renew subscription
 *     description: Manually renew an active or expired subscription for another billing cycle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Subscription renewed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 *       422:
 *         description: Auto-renew disabled or invalid status
 */
router.post('/:subscriptionId/renew', renewSubscription);

/**
 * @swagger
 * /subscriptions/{subscriptionId}/cancel:
 *   post:
 *     tags:
 *       - User Subscriptions
 *     summary: Cancel subscription
 *     description: Cancel current subscription and revert to FREE plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional cancellation reason
 *                 example: Too expensive
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 */
router.post('/:subscriptionId/cancel', cancelSubscription);

/**
 * @swagger
 * /subscriptions/{subscriptionId}/auto-renew:
 *   patch:
 *     tags:
 *       - User Subscriptions
 *     summary: Toggle auto-renew
 *     description: Enable or disable automatic renewal for subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *         example: 1
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
 *                 description: Enable or disable auto-renewal
 *                 example: true
 *     responses:
 *       200:
 *         description: Auto-renew setting updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 */
router.patch('/:subscriptionId/auto-renew', toggleAutoRenew);

export default router;
