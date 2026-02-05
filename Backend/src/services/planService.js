import prisma from '../config/prisma.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';
import logger from '../config/logger.js';
import { BillingCycle, PlanCode } from '../types/enums.js';

class PlanService {
  /**
   * Get all active subscription plans
   * @param {Object} filters - Filter options (is_active, billing_cycle, priority)
   * @returns {Promise<Array>} List of plans with features
   */
  async getAllPlans(filters = {}) {
    try {
      const where = {
        version: 1, // Only latest version of each plan
      };

      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters.billing_cycle) {
        where.billing_cycle = filters.billing_cycle;
      }

      if (filters.priority !== undefined) {
        where.priority = filters.priority;
      }

      const plans = await prisma.subscriptionPlan.findMany({
        where,
        include: {
          plan_features: {
            include: {
              feature: true,
            },
            where: {
              is_enabled: true,
            },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { price_amount: 'asc' },
        ],
      });

      // Transform plans to include readable features
      return plans.map((plan) => this._transformPlanResponse(plan));
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get a single plan by ID
   * @param {String} planId - Plan UUID
   * @returns {Promise<Object>} Plan details with features
   */
  async getPlanById(planId) {
    try {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          plan_features: {
            include: {
              feature: true,
            },
          },
          plan_versions: {
            orderBy: { version: 'desc' },
            take: 5, // Last 5 versions
          },
        },
      });

      if (!plan) {
        throw new NotFoundError('Subscription plan not found');
      }

      return this._transformPlanResponse(plan);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error fetching plan by ID:', error);
      throw error;
    }
  }

  /**
   * Get a plan by code
   * @param {String} code - Plan code
   * @returns {Promise<Object>} Plan details
   */
  async getPlanByCode(code) {
    try {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: {
          code: code.toUpperCase(),
          version: 1, // Latest version
        },
        include: {
          plan_features: {
            include: {
              feature: true,
            },
          },
        },
      });

      if (!plan) {
        throw new NotFoundError(`Plan with code ${code} not found`);
      }

      return this._transformPlanResponse(plan);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error fetching plan by code:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription plan
   * @param {Object} planData - Plan creation data
   * @param {String} createdBy - Admin user ID
   * @returns {Promise<Object>} Created plan
   */
  async createPlan(planData, createdBy) {
    try {
      // Check if plan code already exists
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { code: planData.code.toUpperCase() },
      });

      if (existingPlan) {
        throw new ConflictError(`Plan with code ${planData.code} already exists`);
      }

      // Create plan with features in a transaction
      const plan = await prisma.$transaction(async (tx) => {
        // Create the plan
        const newPlan = await tx.subscriptionPlan.create({
          data: {
            code: planData.code.toUpperCase(),
            display_name: planData.display_name,
            description: planData.description,
            price_amount: planData.price_amount,
            currency: planData.currency || 'INR',
            billing_cycle: planData.billing_cycle,
            duration_days: planData.duration_days,
            priority: planData.priority,
            trial_period_days: planData.trial_period_days,
            is_active: true,
            version: 1,
          },
        });

        // Create plan features if provided
        if (planData.features && planData.features.length > 0) {
          await this._createPlanFeatures(tx, newPlan.id, planData.features);
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: createdBy,
            action: `PLAN_CREATED: ${newPlan.code} (${newPlan.display_name})`,
          },
        });

        return newPlan;
      });

      logger.info(`Plan created: ${plan.code} by admin ${createdBy}`);

      // Fetch complete plan with features
      return this.getPlanById(plan.id);
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      logger.error('Error creating plan:', error);
      throw error;
    }
  }

  /**
   * Update a subscription plan
   * Note: Price and code cannot be changed (create new version instead)
   * @param {String} planId - Plan UUID
   * @param {Object} updateData - Update data
   * @param {String} updatedBy - Admin user ID
   * @returns {Promise<Object>} Updated plan
   */
  async updatePlan(planId, updateData, updatedBy) {
    try {
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!existingPlan) {
        throw new NotFoundError('Subscription plan not found');
      }

      // Update plan in transaction
      const updatedPlan = await prisma.$transaction(async (tx) => {
        const updated = await tx.subscriptionPlan.update({
          where: { id: planId },
          data: {
            display_name: updateData.display_name,
            description: updateData.description,
            is_active: updateData.is_active,
            updated_at: new Date(),
            ...(updateData.is_active === false && {
              deactivated_at: new Date(),
              deactivated_by: updatedBy,
            }),
          },
        });

        // Update features if provided
        if (updateData.features) {
          await this._updatePlanFeatures(tx, planId, updateData.features);
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: updatedBy,
            action: `PLAN_UPDATED: ${existingPlan.code} - ${JSON.stringify(updateData)}`,
          },
        });

        return updated;
      });

      logger.info(`Plan updated: ${existingPlan.code} by admin ${updatedBy}`);

      // Return complete plan with features
      return this.getPlanById(updatedPlan.id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating plan:', error);
      throw error;
    }
  }

  /**
   * Deactivate a subscription plan (soft delete)
   * Existing subscriptions continue until end_date
   * @param {String} planId - Plan UUID
   * @param {String} deactivatedBy - Admin user ID
   * @returns {Promise<Object>} Deactivated plan
   */
  async deactivatePlan(planId, deactivatedBy) {
    try {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });

      if (!plan) {
        throw new NotFoundError('Subscription plan not found');
      }

      if (!plan.is_active) {
        throw new BadRequestError('Plan is already deactivated');
      }

      // Prevent deactivating if it's the only active plan
      const activePlansCount = await prisma.subscriptionPlan.count({
        where: {
          is_active: true,
          version: 1,
        },
      });

      if (activePlansCount <= 1) {
        throw new BadRequestError('Cannot deactivate the last active plan');
      }

      const deactivated = await prisma.$transaction(async (tx) => {
        const updated = await tx.subscriptionPlan.update({
          where: { id: planId },
          data: {
            is_active: false,
            deactivated_at: new Date(),
            deactivated_by: deactivatedBy,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: deactivatedBy,
            action: `PLAN_DEACTIVATED: ${plan.code} (${plan.subscriptions.length} active subscriptions will continue)`,
          },
        });

        return updated;
      });

      logger.info(
        `Plan deactivated: ${plan.code} by admin ${deactivatedBy}. ${plan.subscriptions.length} active subscriptions will continue until end_date`
      );

      return this._transformPlanResponse(deactivated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
      logger.error('Error deactivating plan:', error);
      throw error;
    }
  }

  /**
   * Reactivate a deactivated plan
   * @param {String} planId - Plan UUID
   * @param {String} reactivatedBy - Admin user ID
   * @returns {Promise<Object>} Reactivated plan
   */
  async reactivatePlan(planId, reactivatedBy) {
    try {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new NotFoundError('Subscription plan not found');
      }

      if (plan.is_active) {
        throw new BadRequestError('Plan is already active');
      }

      const reactivated = await prisma.$transaction(async (tx) => {
        const updated = await tx.subscriptionPlan.update({
          where: { id: planId },
          data: {
            is_active: true,
            deactivated_at: null,
            deactivated_by: null,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: reactivatedBy,
            action: `PLAN_REACTIVATED: ${plan.code}`,
          },
        });

        return updated;
      });

      logger.info(`Plan reactivated: ${plan.code} by admin ${reactivatedBy}`);

      return this.getPlanById(reactivated.id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
      logger.error('Error reactivating plan:', error);
      throw error;
    }
  }

  /**
   * Create a new version of an existing plan (for price changes)
   * @param {String} planId - Original plan ID
   * @param {Object} newPlanData - New plan data
   * @param {String} createdBy - Admin user ID
   * @returns {Promise<Object>} New plan version
   */
  async createPlanVersion(planId, newPlanData, createdBy) {
    try {
      const originalPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          plan_features: {
            include: {
              feature: true,
            },
          },
        },
      });

      if (!originalPlan) {
        throw new NotFoundError('Original plan not found');
      }

      // Create new version in transaction
      const newVersion = await prisma.$transaction(async (tx) => {
        // Deactivate old version
        await tx.subscriptionPlan.update({
          where: { id: planId },
          data: { is_active: false },
        });

        // Create new version
        const newPlan = await tx.subscriptionPlan.create({
          data: {
            code: originalPlan.code,
            display_name: newPlanData.display_name || originalPlan.display_name,
            description: newPlanData.description || originalPlan.description,
            price_amount: newPlanData.price_amount,
            currency: originalPlan.currency,
            billing_cycle: newPlanData.billing_cycle || originalPlan.billing_cycle,
            duration_days: newPlanData.duration_days || originalPlan.duration_days,
            priority: newPlanData.priority || originalPlan.priority,
            trial_period_days: newPlanData.trial_period_days ?? originalPlan.trial_period_days,
            is_active: true,
            version: originalPlan.version + 1,
            parent_plan_id: originalPlan.parent_plan_id || planId,
          },
        });

        // Copy or update features
        if (newPlanData.features) {
          await this._createPlanFeatures(tx, newPlan.id, newPlanData.features);
        } else {
          // Copy features from original plan
          for (const pf of originalPlan.plan_features) {
            await tx.planFeature.create({
              data: {
                plan_id: newPlan.id,
                feature_id: pf.feature_id,
                is_enabled: pf.is_enabled,
                value_number: pf.value_number,
                value_string: pf.value_string,
                value_boolean: pf.value_boolean,
              },
            });
          }
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            actor_id: createdBy,
            action: `PLAN_VERSION_CREATED: ${originalPlan.code} v${newPlan.version}`,
          },
        });

        return newPlan;
      });

      logger.info(`Plan version created: ${originalPlan.code} v${newVersion.version} by admin ${createdBy}`);

      return this.getPlanById(newVersion.id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error creating plan version:', error);
      throw error;
    }
  }

  /**
   * Helper: Create plan features
   * @private
   */
  async _createPlanFeatures(tx, planId, features) {
    for (const featureData of features) {
      // Find or create feature
      let feature = await tx.feature.findUnique({
        where: { code: featureData.feature_code.toUpperCase() },
      });

      if (!feature) {
        throw new BadRequestError(`Feature ${featureData.feature_code} does not exist`);
      }

      // Create plan feature
      await tx.planFeature.create({
        data: {
          plan_id: planId,
          feature_id: feature.id,
          is_enabled: featureData.is_enabled ?? true,
          value_number: featureData.value_number,
          value_string: featureData.value_string,
          value_boolean: featureData.value_boolean,
        },
      });
    }
  }

  /**
   * Helper: Update plan features
   * @private
   */
  async _updatePlanFeatures(tx, planId, features) {
    // Delete existing features
    await tx.planFeature.deleteMany({
      where: { plan_id: planId },
    });

    // Create new features
    await this._createPlanFeatures(tx, planId, features);
  }

  /**
   * Helper: Transform plan response for API
   * @private
   */
  _transformPlanResponse(plan) {
    const features = {};

    if (plan.plan_features) {
      plan.plan_features.forEach((pf) => {
        const featureCode = pf.feature.code;
        features[featureCode] = {
          enabled: pf.is_enabled,
          value:
            pf.value_number !== null
              ? pf.value_number
              : pf.value_string !== null
              ? pf.value_string
              : pf.value_boolean,
          type: pf.feature.value_type,
          reset_period: pf.feature.reset_period,
          display_name: pf.feature.display_name,
        };
      });
    }

    return {
      id: plan.id,
      code: plan.code,
      display_name: plan.display_name,
      description: plan.description,
      price: {
        amount: plan.price_amount,
        amount_inr: (plan.price_amount / 100).toFixed(2), // Convert paise to rupees
        currency: plan.currency,
        formatted: `₹${(plan.price_amount / 100).toLocaleString('en-IN')}`,
      },
      billing_cycle: plan.billing_cycle,
      duration_days: plan.duration_days,
      priority: plan.priority,
      trial_period_days: plan.trial_period_days,
      is_active: plan.is_active,
      version: plan.version,
      features,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      deactivated_at: plan.deactivated_at,
      ...(plan.plan_versions && { versions: plan.plan_versions }),
    };
  }
}

export default new PlanService();
