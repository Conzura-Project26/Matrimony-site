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
 * All subscription routes require authentication
 */
router.use(authenticateToken);

/**
 * @route GET /api/subscriptions/current
 * @desc Get current active subscription
 * @access Private
 */
router.get('/current', getCurrentSubscription);

/**
 * @route GET /api/subscriptions/history
 * @desc Get subscription history
 * @access Private
 */
router.get('/history', getSubscriptionHistory);

/**
 * @route POST /api/subscriptions/subscribe
 * @desc Subscribe to a new plan or upgrade
 * @access Private
 */
router.post('/subscribe', subscribeToPlan);

/**
 * @route POST /api/subscriptions/:subscriptionId/renew
 * @desc Renew subscription
 * @access Private
 */
router.post('/:subscriptionId/renew', renewSubscription);

/**
 * @route POST /api/subscriptions/:subscriptionId/cancel
 * @desc Cancel subscription
 * @access Private
 */
router.post('/:subscriptionId/cancel', cancelSubscription);

/**
 * @route PATCH /api/subscriptions/:subscriptionId/auto-renew
 * @desc Toggle auto-renew
 * @access Private
 */
router.patch('/:subscriptionId/auto-renew', toggleAutoRenew);

export default router;
