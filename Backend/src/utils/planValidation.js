import { z } from 'zod';
import {
  BillingCycle,
  FeatureType,
  ResetPeriod,
  isValidBillingCycle,
  isValidFeatureType,
  isValidResetPeriod,
} from '../types/enums.js';

// Billing cycle enum - using values from enums.js
const BillingCycleEnum = z.enum([
  BillingCycle.MONTHLY,
  BillingCycle.QUARTERLY,
  BillingCycle.YEARLY,
], {
  errorMap: () => ({ message: 'Billing cycle must be MONTHLY, QUARTERLY, or YEARLY' }),
});

// Feature type enum - using values from enums.js
const FeatureTypeEnum = z.enum([
  FeatureType.BOOLEAN,
  FeatureType.NUMBER,
  FeatureType.STRING,
], {
  errorMap: () => ({ message: 'Feature type must be BOOLEAN, NUMBER, or STRING' }),
});

// Reset period enum - using values from enums.js
const ResetPeriodEnum = z.enum([
  ResetPeriod.NONE,
  ResetPeriod.DAILY,
  ResetPeriod.WEEKLY,
  ResetPeriod.MONTHLY,
  ResetPeriod.YEARLY,
], {
  errorMap: () => ({ message: 'Reset period must be NONE, DAILY, WEEKLY, MONTHLY, or YEARLY' }),
});

// Plan code validation (alphanumeric + underscore, uppercase)
const planCodeSchema = z
  .string()
  .min(2, 'Plan code must be at least 2 characters')
  .max(50, 'Plan code cannot exceed 50 characters')
  .regex(/^[A-Z0-9_]+$/, 'Plan code must be uppercase alphanumeric with underscores only')
  .refine((code) => !code.startsWith('_') && !code.endsWith('_'), {
    message: 'Plan code cannot start or end with underscore',
  });

// Price validation (in paise)
const priceAmountSchema = z
  .number()
  .int('Price must be an integer (in paise)')
  .min(0, 'Price cannot be negative')
  .max(10000000, 'Price cannot exceed ₹1,00,000 (10,000,000 paise)') // ₹100,000 max
  .refine((price) => {
    // Free plans must be exactly ₹0
    // Paid plans must be > ₹0
    return true; // This will be context-dependent in the controller
  });

// Duration validation
const durationDaysSchema = z
  .number()
  .int('Duration must be an integer')
  .min(1, 'Duration must be at least 1 day')
  .max(3650, 'Duration cannot exceed 10 years (3650 days)');

// Trial period validation
const trialPeriodSchema = z
  .number()
  .int('Trial period must be an integer')
  .min(1, 'Trial period must be at least 1 day')
  .max(90, 'Trial period cannot exceed 90 days')
  .optional()
  .nullable();

// Priority validation
const prioritySchema = z
  .number()
  .int('Priority must be an integer')
  .min(0, 'Priority must be at least 0')
  .max(100, 'Priority cannot exceed 100');

/**
 * Validation schema for creating a subscription plan
 */
const createPlanSchema = z
  .object({
    code: planCodeSchema,
    display_name: z
      .string()
      .min(3, 'Display name must be at least 3 characters')
      .max(100, 'Display name cannot exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional()
      .nullable(),
    price_amount: priceAmountSchema,
    currency: z.literal('INR', {
      errorMap: () => ({ message: 'Only INR currency is supported' }),
    }).default('INR'),
    billing_cycle: BillingCycleEnum.default('MONTHLY'),
    duration_days: durationDaysSchema,
    priority: prioritySchema,
    trial_period_days: trialPeriodSchema,
    features: z
      .array(
        z.object({
          feature_code: z.string().min(2).max(50),
          is_enabled: z.boolean().default(true),
          value_number: z.number().int().optional().nullable(),
          value_string: z.string().max(50).optional().nullable(),
          value_boolean: z.boolean().optional().nullable(),
        })
      )
      .optional()
      .default([]),
  })
  .strict()
  .refine(
    (data) => {
      // Free plans (priority 0) must have price_amount = 0
      if (data.priority === 0 && data.price_amount !== 0) {
        return false;
      }
      // Paid plans (priority > 0) must have price_amount > 0
      if (data.priority > 0 && data.price_amount === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Free plans (priority 0) must have ₹0 price. Paid plans must have price > ₹0',
      path: ['price_amount'],
    }
  )
  .refine(
    (data) => {
      // Trial periods only make sense for paid plans
      if (data.trial_period_days && data.price_amount === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Free plans cannot have trial periods',
      path: ['trial_period_days'],
    }
  )
  .refine(
    (data) => {
      // Validate duration_days matches billing_cycle
      const expectedDurations = {
        MONTHLY: 30,
        QUARTERLY: 90,
        YEARLY: 365,
      };
      
      // Allow some flexibility (±5 days)
      const expected = expectedDurations[data.billing_cycle];
      const diff = Math.abs(data.duration_days - expected);
      
      return diff <= 5;
    },
    {
      message: 'Duration days should approximately match billing cycle (MONTHLY~30, QUARTERLY~90, YEARLY~365)',
      path: ['duration_days'],
    }
  );

/**
 * Validation schema for updating a subscription plan
 * Note: code and price_amount cannot be updated (immutability)
 */
const updatePlanSchema = z
  .object({
    display_name: z
      .string()
      .min(3, 'Display name must be at least 3 characters')
      .max(100, 'Display name cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional()
      .nullable(),
    is_active: z.boolean().optional(),
    features: z
      .array(
        z.object({
          feature_code: z.string().min(2).max(50),
          is_enabled: z.boolean().default(true),
          value_number: z.number().int().optional().nullable(),
          value_string: z.string().max(50).optional().nullable(),
          value_boolean: z.boolean().optional().nullable(),
        })
      )
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Validation schema for creating a feature
 */
const createFeatureSchema = z
  .object({
    code: z
      .string()
      .min(2, 'Feature code must be at least 2 characters')
      .max(50, 'Feature code cannot exceed 50 characters')
      .regex(/^[A-Z0-9_]+$/, 'Feature code must be uppercase alphanumeric with underscores only'),
    display_name: z
      .string()
      .min(3, 'Display name must be at least 3 characters')
      .max(100, 'Display name cannot exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional()
      .nullable(),
    value_type: FeatureTypeEnum.default('BOOLEAN'),
    reset_period: ResetPeriodEnum.default('NONE'),
  })
  .strict();

/**
 * Validation schema for plan query parameters
 */
const getPlanQuerySchema = z.object({
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  billing_cycle: BillingCycleEnum.optional(),
  priority: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export {
  createPlanSchema,
  updatePlanSchema,
  createFeatureSchema,
  getPlanQuerySchema,
  BillingCycleEnum,
  FeatureTypeEnum,
  ResetPeriodEnum,
  planCodeSchema,
  priceAmountSchema,
  durationDaysSchema,
  trialPeriodSchema,
  prioritySchema,
};
