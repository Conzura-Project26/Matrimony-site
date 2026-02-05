/**
 * Report Controller
 * Phase 5 - Task 5.4: Report Management
 * 
 * Handles HTTP requests for admin report management operations
 */

import reportService from '../services/reportService.js';
import {
  adminGetReportsSchema,
  adminUpdateReportStatusSchema,
  adminTakeReportActionSchema
} from '../utils/validation.js';
import logger from '../config/logger.js';

class ReportController {
  /**
   * Get all reports with filters and pagination
   * GET /admin/reports
   * Access: ADMIN + MODERATOR
   */
  async getAllReports(req, res) {
    const filters = adminGetReportsSchema.parse(req.query);
    const currentAdminId = req.user.userId;

    const result = await reportService.getAllReports(filters, currentAdminId);

    logger.info('Admin retrieved reports list', {
      adminId: currentAdminId,
      resultCount: result.reports.length,
      page: filters.page
    });

    res.status(200).json({
      success: true,
      message: 'Reports retrieved successfully',
      data: result
    });
  }

  /**
   * Get detailed report information
   * GET /admin/reports/:id
   * Access: ADMIN + MODERATOR
   */
  async getReportDetails(req, res) {
    const reportId = parseInt(req.params.id);
    const currentAdminId = req.user.userId;

    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const reportDetails = await reportService.getReportDetails(reportId);

    logger.info('Admin retrieved report details', {
      adminId: currentAdminId,
      reportId
    });

    res.status(200).json({
      success: true,
      message: 'Report details retrieved successfully',
      data: reportDetails
    });
  }

  /**
   * Update report status
   * PUT /admin/reports/:id/status
   * Access: ADMIN + MODERATOR (with restrictions)
   */
  async updateReportStatus(req, res) {
    const reportId = parseInt(req.params.id);
    const validatedData = adminUpdateReportStatusSchema.parse(req.body);
    const currentAdminId = req.user.userId;
    const currentAdminRole = req.user.role; // Should be 'ADMIN' or 'MODERATOR'

    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const result = await reportService.updateReportStatus(
      reportId,
      validatedData.status,
      validatedData.admin_notes,
      currentAdminId,
      currentAdminRole
    );

    logger.info('Report status updated', {
      adminId: currentAdminId,
      reportId,
      status: validatedData.status
    });

    res.status(200).json({
      success: true,
      message: `Report status updated to ${validatedData.status} successfully`,
      data: result
    });
  }

  /**
   * Take moderation action on reported user
   * PUT /admin/reports/:id/action
   * Access: ADMIN only
   */
  async takeReportAction(req, res) {
    const reportId = parseInt(req.params.id);
    const validatedData = adminTakeReportActionSchema.parse(req.body);
    const currentAdminId = req.user.userId;

    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const result = await reportService.takeReportAction(
      reportId,
      validatedData.action,
      validatedData.metadata,
      validatedData.admin_notes,
      currentAdminId
    );

    logger.info('Report action taken', {
      adminId: currentAdminId,
      reportId,
      action: validatedData.action
    });

    res.status(200).json({
      success: true,
      message: `Action ${validatedData.action} executed successfully`,
      data: result
    });
  }

  /**
   * Get report statistics (optional - for dashboard)
   * GET /admin/reports/statistics
   * Access: ADMIN + MODERATOR
   */
  async getReportStatistics(req, res) {
    const currentAdminId = req.user.userId;

    const stats = await reportService.getReportStatistics();

    logger.info('Admin retrieved report statistics', {
      adminId: currentAdminId
    });

    res.status(200).json({
      success: true,
      message: 'Report statistics retrieved successfully',
      data: stats
    });
  }
}

export default new ReportController();
