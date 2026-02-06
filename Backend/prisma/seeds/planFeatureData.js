/**
 * Plan Feature Mappings
 * Phase 6 - Task 6.2: Feature Gating
 * 
 * Maps features to subscription plans with specific limits
 * -1 = Unlimited
 */

export const planFeatureMapping = {
  // ============================================
  // FREE PLAN (Priority 0)
  // ============================================
  FREE: {
    PROFILE_VIEW_LIMIT_DAILY: { is_enabled: true, value_number: 50 },
    CONTACT_VIEW_LIMIT_MONTHLY: { is_enabled: true, value_number: 5 },  // Give free users a taste
    INTEREST_LIMIT_DAILY: { is_enabled: true, value_number: 5 },
    MESSAGE_LIMIT_DAILY: { is_enabled: true, value_number: 10 },
    DAILY_MATCH_LIMIT: { is_enabled: true, value_number: 10 },
    
    // Boolean Features
    PROTECTED_PHOTO_ACCESS: { is_enabled: true, value_boolean: false },
    ADVANCED_FILTERS: { is_enabled: true, value_boolean: false },
    UNLIMITED_CHAT: { is_enabled: true, value_boolean: false },
    READ_RECEIPTS: { is_enabled: true, value_boolean: false },
    VIP_BADGE: { is_enabled: true, value_boolean: false },
    PROFILE_BOOST: { is_enabled: true, value_boolean: false },
    PRIORITY_MATCHING: { is_enabled: true, value_boolean: false },
    DEDICATED_MANAGER: { is_enabled: true, value_boolean: false },
    PRIORITY_SUPPORT: { is_enabled: true, value_string: 'standard' }
  },

  // ============================================
  // BASIC PLAN (Priority 1)
  // ============================================
  BASIC: {
    PROFILE_VIEW_LIMIT_DAILY: { is_enabled: true, value_number: 200 },
    CONTACT_VIEW_LIMIT_MONTHLY: { is_enabled: true, value_number: 30 },
    INTEREST_LIMIT_DAILY: { is_enabled: true, value_number: 15 },
    MESSAGE_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    DAILY_MATCH_LIMIT: { is_enabled: true, value_number: 20 },
    
    // Boolean Features
    PROTECTED_PHOTO_ACCESS: { is_enabled: true, value_boolean: false },
    ADVANCED_FILTERS: { is_enabled: true, value_boolean: false },
    UNLIMITED_CHAT: { is_enabled: true, value_boolean: true },
    READ_RECEIPTS: { is_enabled: true, value_boolean: true },
    VIP_BADGE: { is_enabled: true, value_boolean: false },
    PROFILE_BOOST: { is_enabled: true, value_boolean: false },
    PRIORITY_MATCHING: { is_enabled: true, value_boolean: false },
    DEDICATED_MANAGER: { is_enabled: true, value_boolean: false },
    PRIORITY_SUPPORT: { is_enabled: true, value_string: 'standard' }
  },

  // ============================================
  // PREMIUM PLAN (Priority 2)
  // ============================================
  PREMIUM: {
    PROFILE_VIEW_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    CONTACT_VIEW_LIMIT_MONTHLY: { is_enabled: true, value_number: 75 },
    INTEREST_LIMIT_DAILY: { is_enabled: true, value_number: 50 },
    MESSAGE_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    DAILY_MATCH_LIMIT: { is_enabled: true, value_number: 50 },
    
    // Boolean Features
    PROTECTED_PHOTO_ACCESS: { is_enabled: true, value_boolean: true },
    ADVANCED_FILTERS: { is_enabled: true, value_boolean: true },
    UNLIMITED_CHAT: { is_enabled: true, value_boolean: true },
    READ_RECEIPTS: { is_enabled: true, value_boolean: true },
    VIP_BADGE: { is_enabled: true, value_boolean: true },
    PROFILE_BOOST: { is_enabled: true, value_boolean: true },
    PRIORITY_MATCHING: { is_enabled: true, value_boolean: true },
    DEDICATED_MANAGER: { is_enabled: true, value_boolean: false },
    PRIORITY_SUPPORT: { is_enabled: true, value_string: 'priority' }
  },

  // ============================================
  // GOLD PLAN (Priority 3)
  // ============================================
  GOLD: {
    PROFILE_VIEW_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    CONTACT_VIEW_LIMIT_MONTHLY: { is_enabled: true, value_number: -1 },  // Unlimited
    INTEREST_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    MESSAGE_LIMIT_DAILY: { is_enabled: true, value_number: -1 },  // Unlimited
    DAILY_MATCH_LIMIT: { is_enabled: true, value_number: -1 },  // Unlimited
    
    // Boolean Features
    PROTECTED_PHOTO_ACCESS: { is_enabled: true, value_boolean: true },
    ADVANCED_FILTERS: { is_enabled: true, value_boolean: true },
    UNLIMITED_CHAT: { is_enabled: true, value_boolean: true },
    READ_RECEIPTS: { is_enabled: true, value_boolean: true },
    VIP_BADGE: { is_enabled: true, value_boolean: true },
    PROFILE_BOOST: { is_enabled: true, value_boolean: true },
    PRIORITY_MATCHING: { is_enabled: true, value_boolean: true },
    DEDICATED_MANAGER: { is_enabled: true, value_boolean: true },
    PRIORITY_SUPPORT: { is_enabled: true, value_string: 'dedicated' }
  }
};
