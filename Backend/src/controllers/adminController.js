/**
 * Admin Controller
 * Phase 5 - Task 5.1: Admin User Management
 * 
 * Handles HTTP requests for admin user management operations
 */

import adminService from '../services/adminService.js';
import {
  adminGetUsersSchema,
  adminUpdateUserStatusSchema,
  adminDeleteUserSchema,
  adminVerifyProfileSchema,
  adminExportUsersSchema,
  adminBulkOperationSchema
} from '../utils/validation.js';
import logger from '../config/logger.js';

class AdminController {
  /**
   * Get all users with filters and pagination
   * GET /admin/users
   * Access: ADMIN + MODERATOR
   */
  async getAllUsers(req, res) {
    // Validate query parameters
    const filters = adminGetUsersSchema.parse(req.query);
    const currentAdminId = req.user.userId;

    const result = await adminService.getAllUsers(filters, currentAdminId);

    logger.info('Admin retrieved users list', {
      adminId: currentAdminId,
      resultCount: result.users.length,
      page: filters.page
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });
  }

  /**
   * Get detailed user information
   * GET /admin/users/:id
   * Access: ADMIN + MODERATOR
   */
  async getUserDetails(req, res) {
    const { id } = req.params;
    const currentAdminId = req.user.userId;

    const userDetails = await adminService.getUserDetails(id);

    logger.info('Admin retrieved user details', {
      adminId: currentAdminId,
      userId: id
    });

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: userDetails
    });
  }

  /**
   * Update user account status (ACTIVE, INACTIVE, SUSPENDED)
   * PUT /admin/users/:id/status
   * Access: ADMIN only
   */
  async updateUserStatus(req, res) {
    const { id } = req.params;
    const validatedData = adminUpdateUserStatusSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    const result = await adminService.updateUserStatus(
      id,
      validatedData.status,
      validatedData.reason,
      currentAdminId
    );

    logger.info('Admin updated user status', {
      adminId: currentAdminId,
      userId: id,
      status: validatedData.status
    });

    res.status(200).json({
      success: true,
      message: `User status updated to ${validatedData.status} successfully`,
      data: result
    });
  }

  /**
   * Delete user (soft delete)
   * DELETE /admin/users/:id
   * Access: ADMIN only
   */
  async deleteUser(req, res) {
    const { id } = req.params;
    const validatedData = adminDeleteUserSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    const result = await adminService.deleteUser(
      id,
      validatedData.reason,
      currentAdminId
    );

    logger.info('Admin deleted user', {
      adminId: currentAdminId,
      userId: id
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
  }

  /**
   * Verify or unverify user profile
   * PUT /admin/users/:id/verify
   * Access: ADMIN only
   */
  async verifyUserProfile(req, res) {
    const { id } = req.params;
    const validatedData = adminVerifyProfileSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    const result = await adminService.verifyUserProfile(
      id,
      validatedData.is_profile_verified,
      currentAdminId
    );

    logger.info('Admin updated profile verification', {
      adminId: currentAdminId,
      userId: id,
      isVerified: validatedData.is_profile_verified
    });

    res.status(200).json({
      success: true,
      message: `Profile ${validatedData.is_profile_verified ? 'verified' : 'unverified'} successfully`,
      data: result
    });
  }

  /**
   * Export users data
   * POST /admin/users/export
   * Access: ADMIN only
   */
  async exportUsers(req, res) {
    const validatedData = adminExportUsersSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    const result = await adminService.exportUsers(
      validatedData.format,
      validatedData.filters || {},
      currentAdminId
    );

    logger.info('Admin requested user export', {
      adminId: currentAdminId,
      format: validatedData.format,
      exportId: result.export_id
    });

    res.status(202).json({
      success: true,
      message: 'Export job queued successfully',
      data: result
    });
  }

  /**
   * Bulk operations on users
   * POST /admin/users/bulk
   * Access: ADMIN only
   */
  async bulkOperation(req, res) {
    const validatedData = adminBulkOperationSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    const result = await adminService.bulkOperation(
      validatedData.action,
      validatedData.user_ids,
      validatedData.reason,
      currentAdminId
    );

    logger.info('Admin completed bulk operation', {
      adminId: currentAdminId,
      action: validatedData.action,
      success: result.success,
      failed: result.failed
    });

    res.status(200).json({
      success: true,
      message: `Bulk operation completed: ${result.success} succeeded, ${result.failed} failed`,
      data: result
    });
  }

  /**
   * Get admin analytics/statistics
   * GET /admin/users/analytics
   * Access: ADMIN + MODERATOR
   */
  async getAnalytics(req, res) {
    const currentAdminId = req.user.userId;

    const analytics = await adminService.getAnalytics();

    logger.info('Admin retrieved analytics', {
      adminId: currentAdminId
    });

    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analytics
    });
  }
}

export default new AdminController();
