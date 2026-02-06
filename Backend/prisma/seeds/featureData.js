/**
 * Feature Definitions for Subscription Plans
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * This file defines all features with their types and reset periods
 */

export const features = [
  // ============================================
  // DAILY RESET FEATURES (Engagement Control)
  // ============================================
  {
    code: 'PROFILE_VIEW_LIMIT_DAILY',
    display_name: 'Daily Profile View Limit',
    description: 'Maximum number of profiles that can be viewed per day',
    value_type: 'NUMBER',
    reset_period: 'DAILY',
    is_active: true
  },
  {
    code: 'INTEREST_LIMIT_DAILY',
    display_name: 'Daily Interest Limit',
    description: 'Maximum number of interests that can be sent per day',
    value_type: 'NUMBER',
    reset_period: 'DAILY',
    is_active: true
  },
  {
    code: 'MESSAGE_LIMIT_DAILY',
    display_name: 'Daily Message Limit',
    description: 'Maximum number of new conversations that can be initiated per day',
    value_type: 'NUMBER',
    reset_period: 'DAILY',
    is_active: true
  },
  {
    code: 'DAILY_MATCH_LIMIT',
    display_name: 'Daily Match Limit',
    description: 'Number of recommended matches shown per day',
    value_type: 'NUMBER',
    reset_period: 'DAILY',
    is_active: true
  },

  // ============================================
  // MONTHLY RESET FEATURES (Monetization Control)
  // ============================================
  {
    code: 'CONTACT_VIEW_LIMIT_MONTHLY',
    display_name: 'Monthly Contact View Limit',
    description: 'Maximum number of contact details (phone/email) that can be viewed per month',
    value_type: 'NUMBER',
    reset_period: 'MONTHLY',
    is_active: true
  },

  // ============================================
  // BOOLEAN FEATURES (Premium Features)
  // ============================================
  {
    code: 'PROTECTED_PHOTO_ACCESS',
    display_name: 'Protected Photo Access',
    description: 'Ability to view protected photos before interest is accepted',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'ADVANCED_FILTERS',
    display_name: 'Advanced Search Filters',
    description: 'Access to advanced search filters (income, profession, lifestyle)',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'UNLIMITED_CHAT',
    display_name: 'Unlimited Chat',
    description: 'Unlimited messaging without daily limits',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'READ_RECEIPTS',
    display_name: 'Read Receipts',
    description: 'See when your messages are read',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'VIP_BADGE',
    display_name: 'VIP Badge',
    description: 'Display VIP badge on profile',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'PRIORITY_SUPPORT',
    display_name: 'Priority Support',
    description: 'Level of customer support (standard/priority/dedicated)',
    value_type: 'STRING',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'PROFILE_BOOST',
    display_name: 'Profile Boost',
    description: 'Boost profile visibility in search results',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'PRIORITY_MATCHING',
    display_name: 'Priority Matching',
    description: 'Get matched with premium profiles first',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  },
  {
    code: 'DEDICATED_MANAGER',
    display_name: 'Dedicated Relationship Manager',
    description: 'Personal relationship manager for matchmaking assistance',
    value_type: 'BOOLEAN',
    reset_period: 'NONE',
    is_active: true
  }
];
