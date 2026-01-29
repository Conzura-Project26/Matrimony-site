/**
 * Permissions Master Data
 * Comprehensive permissions for role-based access control
 * 
 * IMPORTANT: This is a FLAT LIST of all permissions in the system.
 * The comments below are for ORGANIZATIONAL purposes only.
 * Actual role-to-permission assignments are defined in roleData.js
 * 
 * A permission can be assigned to multiple roles (e.g., 'view_profiles' is assigned to USER, MODERATOR, and ADMIN)
 */

export const permissions = [
  // ============================================
  // PROFILE & USER MANAGEMENT PERMISSIONS
  // ============================================
  { permission_name: 'view_profiles' },                    // USER, MODERATOR, ADMIN
  { permission_name: 'edit_own_profile' },                 // USER, MODERATOR, ADMIN
  
  // Family Details Permissions (Phase 2)
  { permission_name: 'create_own_family_details' },        // USER, MODERATOR, ADMIN
  { permission_name: 'edit_own_family_details' },          // USER, MODERATOR, ADMIN
  { permission_name: 'view_family_details' },              // USER, MODERATOR, ADMIN (for matchmaking)
  
  // Photo Management
  { permission_name: 'upload_photo' },                     // USER, MODERATOR, ADMIN
  { permission_name: 'delete_own_photo' },                 // USER, MODERATOR, ADMIN
  
  // Communication & Interaction
  { permission_name: 'send_interest' },                    // USER, MODERATOR, ADMIN
  { permission_name: 'accept_reject_interest' },           // USER, MODERATOR, ADMIN
  { permission_name: 'send_message' },                     // USER, MODERATOR, ADMIN
  { permission_name: 'view_messages' },                    // USER, MODERATOR, ADMIN
  { permission_name: 'shortlist_profiles' },               // USER, MODERATOR, ADMIN
  { permission_name: 'search_profiles' },                  // USER, MODERATOR, ADMIN
  { permission_name: 'view_own_profile_viewers' },         // USER, MODERATOR, ADMIN
  { permission_name: 'report_user' },                      // USER, MODERATOR, ADMIN
  { permission_name: 'manage_subscription' },              // USER, MODERATOR, ADMIN
  { permission_name: 'view_notifications' },               // USER, MODERATOR, ADMIN

  // ============================================
  // MODERATION PERMISSIONS
  // ============================================
  { permission_name: 'approve_photos' },                   // MODERATOR, ADMIN
  { permission_name: 'reject_photos' },                    // MODERATOR, ADMIN
  { permission_name: 'view_reports' },                     // MODERATOR, ADMIN
  { permission_name: 'moderate_content' },                 // MODERATOR, ADMIN
  { permission_name: 'update_report_status' },             // MODERATOR, ADMIN
  { permission_name: 'warn_users' },                       // MODERATOR, ADMIN
  { permission_name: 'view_audit_logs' },                  // MODERATOR, ADMIN
  { permission_name: 'view_all_photos_pending' },          // MODERATOR, ADMIN

  // ============================================
  // ADMIN-ONLY PERMISSIONS
  // ============================================
  { permission_name: 'manage_users' },                     // ADMIN only
  { permission_name: 'activate_deactivate_users' },        // ADMIN only
  { permission_name: 'delete_users' },                     // ADMIN only
  { permission_name: 'verify_profiles' },                  // ADMIN only
  { permission_name: 'manage_family_details' },            // ADMIN only (can manage any user's family details)
  { permission_name: 'manage_subscriptions' },             // ADMIN only
  { permission_name: 'view_analytics' },                   // ADMIN only
  { permission_name: 'manage_master_data' },               // ADMIN only
  { permission_name: 'create_moderators' },                // ADMIN only
  { permission_name: 'manage_roles' },                     // ADMIN only
  { permission_name: 'manage_permissions' },               // ADMIN only
  { permission_name: 'view_all_users' },                   // ADMIN only
  { permission_name: 'view_user_details' },                // ADMIN only
  { permission_name: 'export_reports' },                   // ADMIN only
  { permission_name: 'view_revenue_reports' },             // ADMIN only
  { permission_name: 'manual_subscription_activation' },   // ADMIN only
  { permission_name: 'process_refunds' },                  // ADMIN only
];
