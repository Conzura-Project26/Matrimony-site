/**
 * Roles and Role-Permissions Master Data
 * Defines user roles and their permission mappings
 */

export const roles = [
  {
    id: 1,
    role_name: 'User',
    description: 'Regular user with access to profile management, search, and communication features'
  },
  {
    id: 2,
    role_name: 'Moderator',
    description: 'Moderator with content moderation and report management capabilities'
  },
  {
    id: 3,
    role_name: 'Admin',
    description: 'Administrator with full system access and management capabilities'
  }
];

/**
 * Role-Permission Mappings
 * Maps which permissions belong to which roles
 */
export const rolePermissions = {
  User: [
    'view_profiles',
    'edit_own_profile',
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
  
  Moderator: [
    // All User permissions
    'view_profiles',
    'edit_own_profile',
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
  
  Admin: [
    // All User permissions
    'view_profiles',
    'edit_own_profile',
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
