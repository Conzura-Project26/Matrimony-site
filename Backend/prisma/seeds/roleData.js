/**
 * Roles and Role-Permissions Master Data
 * Defines user roles and their permission mappings
 * 
 * IMPORTANT: 
 * - All permissions must be defined in permissionData.js first
 * - ADMIN role includes ALL permissions from USER and MODERATOR
 * - Permissions with 'own' prefix (e.g., create_own_*) mean users can only manage their own resources
 * - ADMIN can bypass 'own' restrictions using 'manage_*' permissions (e.g., manage_family_details)
 */

export const roles = [
  {
    id: 1,
    role_name: 'USER',
    description: 'Regular user with access to profile management, search, and communication features'
  },
  {
    id: 2,
    role_name: 'MODERATOR',
    description: 'Moderator with content moderation and report management capabilities'
  },
  {
    id: 3,
    role_name: 'ADMIN',
    description: 'Administrator with full system access and management capabilities'
  }
];

/**
 * Role-Permission Mappings
 * Maps which permissions belong to which roles
 */
export const rolePermissions = {
  USER: [
    'view_profiles',
    'edit_own_profile',
    'create_own_family_details',
    'edit_own_family_details',
    'view_family_details',
    'upload_photo',
    'delete_own_photo',
    'send_interest',
    'accept_reject_interest',
    'send_message',
    'view_messages',
    'shortlist_profiles',
    'search_profiles',
    'view_own_profile_viewers',
    'report_user',
    'manage_subscription',
    'view_notifications'
  ],
  
  MODERATOR: [
    // All User permissions
    'view_profiles',
    'edit_own_profile',
    'create_own_family_details',
    'edit_own_family_details',
    'view_family_details',
    'upload_photo',
    'delete_own_photo',
    'send_interest',
    'accept_reject_interest',
    'send_message',
    'view_messages',
    'shortlist_profiles',
    'search_profiles',
    'view_own_profile_viewers',
    'report_user',
    'manage_subscription',
    'view_notifications',
    
    // Additional Moderator permissions
    'approve_photos',
    'reject_photos',
    'view_reports',
    'moderate_content',
    'update_report_status',
    'warn_users',
    'view_audit_logs',
    'view_all_photos_pending'
  ],
  
  ADMIN: [
    // All User permissions
    'view_profiles',
    'edit_own_profile',
    'create_own_family_details',
    'edit_own_family_details',
    'view_family_details',
    'upload_photo',
    'delete_own_photo',
    'send_interest',
    'accept_reject_interest',
    'send_message',
    'view_messages',
    'shortlist_profiles',
    'search_profiles',
    'view_own_profile_viewers',
    'report_user',
    'manage_subscription',
    'view_notifications',
    
    // All Moderator permissions
    'approve_photos',
    'reject_photos',
    'view_reports',
    'moderate_content',
    'update_report_status',
    'warn_users',
    'view_audit_logs',
    'view_all_photos_pending',
    
    // Additional Admin permissions
    'manage_users',
    'activate_deactivate_users',
    'delete_users',
    'verify_profiles',
    'manage_family_details',
    'manage_subscriptions',
    'view_analytics',
    'manage_master_data',
    'create_moderators',
    'manage_roles',
    'manage_permissions',
    'view_all_users',
    'view_user_details',
    'export_reports',
    'view_revenue_reports',
    'manual_subscription_activation',
    'process_refunds'
  ]
};
