/**
 * Permissions Master Data
 * Comprehensive permissions for role-based access control
 */

export const permissions = [
  // User Permissions
  { permission_name: 'view_profiles' },
  { permission_name: 'edit_own_profile' },
  { permission_name: 'upload_photo' },
  { permission_name: 'delete_own_photo' },
  { permission_name: 'send_interest' },
  { permission_name: 'accept_reject_interest' },
  { permission_name: 'send_message' },
  { permission_name: 'view_messages' },
  { permission_name: 'shortlist_profiles' },
  { permission_name: 'search_profiles' },
  { permission_name: 'view_own_profile_viewers' },
  { permission_name: 'report_user' },
  { permission_name: 'manage_subscription' },
  { permission_name: 'view_notifications' },

  // Moderator Permissions
  { permission_name: 'approve_photos' },
  { permission_name: 'reject_photos' },
  { permission_name: 'view_reports' },
  { permission_name: 'moderate_content' },
  { permission_name: 'update_report_status' },
  { permission_name: 'warn_users' },
  { permission_name: 'view_audit_logs' },
  { permission_name: 'view_all_photos_pending' },

  // Admin Permissions
  { permission_name: 'manage_users' },
  { permission_name: 'activate_deactivate_users' },
  { permission_name: 'delete_users' },
  { permission_name: 'verify_profiles' },
  { permission_name: 'manage_subscriptions' },
  { permission_name: 'view_analytics' },
  { permission_name: 'manage_master_data' },
  { permission_name: 'create_moderators' },
  { permission_name: 'manage_roles' },
  { permission_name: 'manage_permissions' },
  { permission_name: 'view_all_users' },
  { permission_name: 'view_user_details' },
  { permission_name: 'export_reports' },
  { permission_name: 'view_revenue_reports' },
  { permission_name: 'manual_subscription_activation' },
  { permission_name: 'process_refunds' }
];
