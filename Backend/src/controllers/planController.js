import asyncHandler from '../utils/asyncHandler.js';
import planService from '../services/planService.js';
import { getPlanQuerySchema } from '../utils/planValidation.js';
import { ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * /api/plans:
 *   get:
 *     tags:
 *       - Subscription Plans
 *     summary: Get all subscription plans
 *     description: Retrieve all available subscription plans with their features. Public endpoint.
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (default true)
 *       - in: query
 *         name: billing_cycle
 *         schema:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, YEARLY]
 *         description: Filter by billing cycle
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *         description: Filter by priority level
 *     responses:
 *       200:
 *         description: List of subscription plans
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
 *                   example: Subscription plans retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Invalid query parameters
 */
const getAllPlans = asyncHandler(async (req, res) => {
  // Validate query parameters
  const result = getPlanQuerySchema.safeParse(req.query);

  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const filters = {
    is_active: result.data.is_active ?? true, // Default to active plans only
    billing_cycle: result.data.billing_cycle,
    priority: result.data.priority,
  };

  const plans = await planService.getAllPlans(filters);

  res.status(200).json({
    success: true,
    message: 'Subscription plans retrieved successfully',
    data: plans,
  });
});

/**
 * @swagger
 * /api/plans/{planId}:
 *   get:
 *     tags:
 *       - Subscription Plans
 *     summary: Get a specific subscription plan
 *     description: Retrieve detailed information about a specific subscription plan including all features and version history
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan UUID
 *     responses:
 *       200:
 *         description: Plan details
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
 *                   example: Plan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Plan not found
 */
const getPlanById = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await planService.getPlanById(planId);

  res.status(200).json({
    success: true,
    message: 'Plan retrieved successfully',
    data: plan,
  });
});

/**
 * @swagger
 * /api/plans/code/{code}:
 *   get:
 *     tags:
 *       - Subscription Plans
 *     summary: Get plan by code
 *     description: Retrieve a plan using its unique code (e.g., FREE, BASIC, PREMIUM, GOLD)
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan code
 *         example: GOLD
 *     responses:
 *       200:
 *         description: Plan details
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
 *                   example: Plan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Plan not found
 */
const getPlanByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const plan = await planService.getPlanByCode(code);

  res.status(200).json({
    success: true,
    message: 'Plan retrieved successfully',
    data: plan,
  });
});

export default {
  getAllPlans,
  getPlanById,
  getPlanByCode,
};
