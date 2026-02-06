import asyncHandler from '../utils/asyncHandler.js';
import planService from '../services/planService.js';
import featureService from '../services/featureService.js';
import { createPlanSchema, updatePlanSchema, createFeatureSchema } from '../utils/planValidation.js';
import { ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * /api/admin/plans:
 *   post:
 *     tags:
 *       - Admin - Subscription Plans
 *     summary: Create a new subscription plan
 *     description: Admin only - Create a new subscription plan with features
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - display_name
 *               - price_amount
 *               - billing_cycle
 *               - duration_days
 *               - priority
 *             properties:
 *               code:
 *                 type: string
 *                 example: PLATINUM
 *                 description: Unique plan code (uppercase, alphanumeric + underscore)
 *               display_name:
 *                 type: string
 *                 example: Platinum Plan
 *               description:
 *                 type: string
 *                 example: Premium features with priority support
 *               price_amount:
 *                 type: integer
 *                 example: 499900
 *                 description: Price in paise (₹4999 = 499900 paise)
 *               currency:
 *                 type: string
 *                 example: INR
 *                 default: INR
 *               billing_cycle:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, YEARLY]
 *                 example: MONTHLY
 *               duration_days:
 *                 type: integer
 *                 example: 30
 *                 description: Duration in days
 *               priority:
 *                 type: integer
 *                 example: 3
 *                 description: Plan priority (0=Free, 1=Basic, 2=Premium, 3=Gold, etc.)
 *               trial_period_days:
 *                 type: integer
 *                 example: 7
 *                 description: Trial period in days (optional, only for paid plans)
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     feature_code:
 *                       type: string
 *                       example: MATCH_LIMIT
 *                     is_enabled:
 *                       type: boolean
 *                       default: true
 *                     value_number:
 *                       type: integer
 *                       example: -1
 *                       description: -1 for unlimited
 *                     value_string:
 *                       type: string
 *                       example: unlimited
 *                     value_boolean:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       409:
 *         description: Plan code already exists
 */
const createPlan = asyncHandler(async (req, res) => {
  // Validate request body
  const result = createPlanSchema.safeParse(req.body);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message);
  }

  const plan = await planService.createPlan(result.data, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Subscription plan created successfully',
    data: plan,
  });
});

/**
 * @swagger
 * /api/admin/plans/{planId}:
 *   put:
 *     tags:
 *       - Admin - Subscription Plans
 *     summary: Update a subscription plan
 *     description: Admin only - Update plan details (code and price cannot be changed)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 example: Updated Plan Name
 *               description:
 *                 type: string
 *                 example: Updated description
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     feature_code:
 *                       type: string
 *                     is_enabled:
 *                       type: boolean
 *                     value_number:
 *                       type: integer
 *                     value_string:
 *                       type: string
 *                     value_boolean:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Plan not found
 */
const updatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  // Validate request body
  const result = updatePlanSchema.safeParse(req.body);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message);
  }

  const plan = await planService.updatePlan(planId, result.data, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Subscription plan updated successfully',
    data: plan,
  });
});

/**
 * @swagger
 * /api/admin/plans/{planId}:
 *   delete:
 *     tags:
 *       - Admin - Subscription Plans
 *     summary: Deactivate a subscription plan
 *     description: Admin only - Soft delete (deactivate) a plan. Existing active subscriptions continue until end_date
 *     security:
 *       - bearerAuth: []
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
 *         description: Plan deactivated successfully
 *       400:
 *         description: Cannot deactivate (last active plan or already deactivated)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Plan not found
 */
const deactivatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await planService.deactivatePlan(planId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Subscription plan deactivated successfully. Existing subscriptions will continue until their end date.',
    data: plan,
  });
});

/**
 * @swagger
 * /api/admin/plans/{planId}/reactivate:
 *   patch:
 *     tags:
 *       - Admin - Subscription Plans
 *     summary: Reactivate a deactivated plan
 *     description: Admin only - Reactivate a previously deactivated plan
 *     security:
 *       - bearerAuth: []
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
 *         description: Plan reactivated successfully
 *       400:
 *         description: Plan is already active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Plan not found
 */
const reactivatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await planService.reactivatePlan(planId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Subscription plan reactivated successfully',
    data: plan,
  });
});

/**
 * @swagger
 * /api/admin/plans/{planId}/version:
 *   post:
 *     tags:
 *       - Admin - Subscription Plans
 *     summary: Create a new version of an existing plan
 *     description: Admin only - Create a new version for price changes or major updates. Previous version is deactivated
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Original plan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price_amount
 *             properties:
 *               price_amount:
 *                 type: integer
 *                 example: 599900
 *                 description: New price in paise
 *               display_name:
 *                 type: string
 *               description:
 *                 type: string
 *               billing_cycle:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, YEARLY]
 *               duration_days:
 *                 type: integer
 *               priority:
 *                 type: integer
 *               trial_period_days:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: New plan version created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Original plan not found
 */
const createPlanVersion = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const newVersion = await planService.createPlanVersion(planId, req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'New plan version created successfully. Previous version has been deactivated.',
    data: newVersion,
  });
});

/**
 * @swagger
 * /api/admin/features:
 *   get:
 *     tags:
 *       - Admin - Features
 *     summary: Get all features
 *     description: Admin/Moderator - Get all available features
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Features retrieved successfully
 *   post:
 *     tags:
 *       - Admin - Features
 *     summary: Create a new feature
 *     description: Admin only - Create a new feature that can be assigned to plans
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - display_name
 *               - value_type
 *             properties:
 *               code:
 *                 type: string
 *                 example: CONTACT_VIEW_LIMIT
 *               display_name:
 *                 type: string
 *                 example: Contact View Limit
 *               description:
 *                 type: string
 *                 example: Number of contacts that can be viewed per day
 *               value_type:
 *                 type: string
 *                 enum: [BOOLEAN, NUMBER, STRING]
 *                 example: NUMBER
 *               reset_period:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY, YEARLY]
 *                 example: DAILY
 *     responses:
 *       201:
 *         description: Feature created successfully
 */
const getAllFeatures = asyncHandler(async (req, res) => {
  const features = await featureService.getAllFeatures({
    is_active: req.query.is_active === 'false' ? false : true,
  });

  res.status(200).json({
    success: true,
    message: 'Features retrieved successfully',
    data: features,
  });
});

const createFeature = asyncHandler(async (req, res) => {
  // Validate request body
  const result = createFeatureSchema.safeParse(req.body);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message);
  }

  const feature = await featureService.createFeature(result.data, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Feature created successfully',
    data: feature,
  });
});

export default {
  createPlan,
  updatePlan,
  deactivatePlan,
  reactivatePlan,
  createPlanVersion,
  getAllFeatures,
  createFeature,
};
