import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Subscription Management Service
 * Handles user subscriptions: upgrades, renewals, cancellations
 */
class SubscriptionService {
  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
      include: {
        plan: {
          include: {
            plan_features: {
              include: {
                feature: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    return this._formatSubscription(subscription);
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(userId) {
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: userId },
      include: {
        plan: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return subscriptions.map((sub) => this._formatSubscription(sub));
  }

  /**
   * Subscribe/Upgrade to a new plan
   */
  async subscribeToPlan(userId, planId, paymentDetails = {}) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Subscription plan not found');
    }

    if (!plan.is_active) {
      throw new ValidationError('This plan is no longer available');
    }

    // Check current subscription
    const currentSub = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    // Validate upgrade (can't downgrade to FREE if on paid plan)
    if (currentSub && currentSub.plan.priority > 0 && plan.priority === 0) {
      throw new ValidationError('Cannot downgrade to FREE plan. Please cancel your current subscription.');
    }

    // Create subscription in transaction
    const newSubscription = await prisma.$transaction(async (tx) => {
      // Deactivate current subscription if exists
      if (currentSub) {
        await tx.subscription.update({
          where: { id: currentSub.id },
          data: {
            status: 'CANCELLED',
            is_active: false,
            cancelled_at: new Date(),
            cancellation_reason: 'Upgraded to new plan',
            updated_at: new Date(),
          },
        });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration_days);

      const trialEndDate = plan.trial_period_days
        ? new Date(startDate.getTime() + plan.trial_period_days * 24 * 60 * 60 * 1000)
        : null;

      // Create new subscription
      const subscription = await tx.subscription.create({
        data: {
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.display_name,
          start_date: startDate,
          end_date: endDate,
          trial_end_date: trialEndDate,
          status: 'ACTIVE',
          is_active: true,
          auto_renew: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          plan: {
            include: {
              plan_features: {
                include: {
                  feature: true,
                },
              },
            },
          },
        },
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          actor: {
            connect: { id: userId },
          },
          action: `SUBSCRIPTION_CREATED: ${plan.code} - ${plan.display_name} (Plan ID: ${plan.id}, Price: ₹${plan.price_amount / 100})`,
        },
      });

      return subscription;
    });

    logger.info(`User ${userId} subscribed to ${plan.code}`, {
      subscriptionId: newSubscription.id,
      planCode: plan.code,
      price: plan.price_amount,
    });

    return this._formatSubscription(newSubscription);
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId, subscriptionId) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (!subscription.auto_renew) {
      throw new ValidationError('Auto-renew is disabled for this subscription');
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'EXPIRED') {
      throw new ValidationError('Only active or expired subscriptions can be renewed');
    }

    // Calculate new dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscription.plan.duration_days);

    const renewed = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
        is_active: true,
        updated_at: new Date(),
      },
      include: {
        plan: {
          include: {
            plan_features: {
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Subscription ${subscriptionId} renewed for user ${userId}`);

    return this._formatSubscription(renewed);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, subscriptionId, reason = null) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new ValidationError('Only active subscriptions can be cancelled');
    }

    // FREE plan cannot be cancelled, just disable auto-renew
    if (subscription.plan.priority === 0) {
      throw new ValidationError('FREE plan cannot be cancelled. It will remain active.');
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          is_active: false,
          cancelled_at: new Date(),
          cancelled_by: userId,
          cancellation_reason: reason,
          auto_renew: false,
          updated_at: new Date(),
        },
        include: {
          plan: true,
        },
      });

      // Assign FREE plan after cancellation
      const freePlan = await tx.subscriptionPlan.findFirst({
        where: {
          code: 'FREE_MONTHLY',
          is_active: true,
        },
      });

      if (freePlan) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + freePlan.duration_days);

        await tx.subscription.create({
          data: {
            user_id: userId,
            plan_id: freePlan.id,
            plan_name: freePlan.display_name,
            start_date: startDate,
            end_date: endDate,
            status: 'ACTIVE',
            is_active: true,
            auto_renew: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          actor: {
            connect: { id: userId },
          },
          action: `SUBSCRIPTION_CANCELLED: ${subscription.plan.code} (Subscription ID: ${subscriptionId}, Reason: ${reason || 'Not specified'})`,
        },
      });

      return updated;
    });

    logger.info(`Subscription ${subscriptionId} cancelled for user ${userId}`, {
      reason,
      planCode: subscription.plan.code,
    });

    return this._formatSubscription(cancelled);
  }

  /**
   * Toggle auto-renew
   */
  async toggleAutoRenew(userId, subscriptionId, autoRenew) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new ValidationError('Can only modify active subscriptions');
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        auto_renew: autoRenew,
        updated_at: new Date(),
      },
      include: {
        plan: {
          include: {
            plan_features: {
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'} for subscription ${subscriptionId}`);

    return this._formatSubscription(updated);
  }

  /**
   * Format subscription for API response
   */
  _formatSubscription(subscription) {
    const formatted = {
      id: subscription.id,
      userId: subscription.user_id,
      planId: subscription.plan_id,
      planName: subscription.plan_name,
      status: subscription.status,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      trialEndDate: subscription.trial_end_date,
      autoRenew: subscription.auto_renew,
      cancelledAt: subscription.cancelled_at,
      cancellationReason: subscription.cancellation_reason,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
    };

    if (subscription.plan) {
      formatted.plan = {
        id: subscription.plan.id,
        code: subscription.plan.code,
        displayName: subscription.plan.display_name,
        description: subscription.plan.description,
        price: {
          amount: subscription.plan.price_amount,
          currency: subscription.plan.currency,
          formatted: `₹${(subscription.plan.price_amount / 100).toFixed(2)}`,
        },
        billingCycle: subscription.plan.billing_cycle,
        durationDays: subscription.plan.duration_days,
        priority: subscription.plan.priority,
        trialPeriodDays: subscription.plan.trial_period_days,
      };

      if (subscription.plan.plan_features) {
        formatted.plan.features = subscription.plan.plan_features.map((pf) => ({
          code: pf.feature.code,
          displayName: pf.feature.display_name,
          description: pf.feature.description,
          isEnabled: pf.is_enabled,
          valueType: pf.feature.value_type,
          valueNumber: pf.value_number,
          valueString: pf.value_string,
          valueBoolean: pf.value_boolean,
        }));
      }
    }

    return formatted;
  }

  /**
   * Check and expire subscriptions (cron job)
   */
  async expireSubscriptions() {
    const now = new Date();
    
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        end_date: {
          lt: now,
        },
      },
      include: {
        plan: true,
      },
    });

    for (const sub of expiredSubs) {
      try {
        if (sub.auto_renew && sub.plan.is_active) {
          // Auto-renew
          await this.renewSubscription(sub.user_id, sub.id);
          logger.info(`Auto-renewed subscription ${sub.id} for user ${sub.user_id}`);
        } else {
          // Mark as expired
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'EXPIRED',
              is_active: false,
              updated_at: new Date(),
            },
          });
          logger.info(`Expired subscription ${sub.id} for user ${sub.user_id}`);
        }
      } catch (error) {
        logger.error(`Error processing expired subscription ${sub.id}:`, error);
      }
    }

    logger.info(`Processed ${expiredSubs.length} expired subscriptions`);
    return expiredSubs.length;
  }
}

export default new SubscriptionService();
