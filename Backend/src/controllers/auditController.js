/**
 * Audit Controller
 * Phase 5 - Task 5.6: Audit Logging
 * 
 * Handles audit log retrieval, filtering, export, and statistics
 * Access: ADMIN only
 */

import AuditService from '../services/auditService.js';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { getAuditContext } from '../middleware/auditContext.js';
import { 
  AuditActionType, 
  AuditAction, 
  AuditResourceType 
} from '../types/enums.js';
import { 
  getAuditLogsSchema,
  getAuditStatisticsSchema 
} from '../utils/validation.js';

class AuditController {
  /**
   * Get Audit Logs with Filters
   * GET /admin/audit-logs
   * Access: ADMIN only
   * 
   * Query Parameters:
   * - action_type: Filter by action type
   * - action: Filter by specific action
   * - actor_id: Filter by actor
   * - target_user_id: Filter by target user
   * - resource_type: Filter by resource type
   * - resource_id: Filter by resource ID
   * - status: Filter by status
   * - date_from: Start date (ISO format)
   * - date_to: End date (ISO format)
   * - ip_address: Filter by IP
   * - search: Text search in action field
   * - page: Page number (default: 1)
   * - limit: Records per page (default: 50, max: 100)
   * - sort_by: Sort field (default: created_at)
   * - sort_order: Sort direction (default: desc)
   */
  async getAuditLogs(req, res) {
    try {
      // Validate query parameters
      const validatedQuery = getAuditLogsSchema.parse(req.query);

      // Get audit logs from service
      const result = await AuditService.getAuditLogs(validatedQuery);

      // Log this admin action (async)
      const { ipAddress, userAgent } = getAuditContext(req);
      await AuditService.log({
        action: AuditAction.ADMIN_USER_EXPORTED, // Reusing export action for viewing logs
        actionType: AuditActionType.ADMIN_ACTION,
        actorId: req.user.userId,
        resourceType: AuditResourceType.SYSTEM,
        metadata: {
          filters: validatedQuery,
          result_count: result.logs.length
        },
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Failed to retrieve audit logs: ${error.message}`);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Audit Log Statistics
   * GET /admin/audit-logs/statistics
   * Access: ADMIN only
   * 
   * Query Parameters:
   * - date_from: Start date (ISO format)
   * - date_to: End date (ISO format)
   */
  async getAuditStatistics(req, res) {
    try {
      // Validate query parameters
      const validatedQuery = getAuditStatisticsSchema.parse(req.query);

      // Get statistics from service
      const statistics = await AuditService.getAuditStatistics(validatedQuery);

      // Log this admin action (async)
      const { ipAddress, userAgent } = getAuditContext(req);
      await AuditService.log({
        action: AuditAction.ADMIN_USER_EXPORTED, // Reusing for statistics view
        actionType: AuditActionType.ADMIN_ACTION,
        actorId: req.user.userId,
        resourceType: AuditResourceType.SYSTEM,
        metadata: {
          action: 'view_statistics',
          filters: validatedQuery
        },
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      logger.error(`Failed to retrieve audit statistics: ${error.message}`);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Export Audit Logs (CSV)
   * GET /admin/audit-logs/export
   * Access: ADMIN only
   * 
   * Query Parameters: Same as getAuditLogs (except page/limit)
   * Returns: CSV file download
   */
  async exportAuditLogs(req, res) {
    try {
      // Validate query parameters (reuse same schema)
      const validatedQuery = getAuditLogsSchema.parse({
        ...req.query,
        page: 1,
        limit: 100000 // Large limit for export
      });

      // Generate CSV from service
      const csv = await AuditService.exportAuditLogs(validatedQuery);

      // Log this admin action (async)
      const { ipAddress, userAgent } = getAuditContext(req);
      await AuditService.log({
        action: AuditAction.ADMIN_USER_EXPORTED,
        actionType: AuditActionType.ADMIN_ACTION,
        actorId: req.user.userId,
        resourceType: AuditResourceType.SYSTEM,
        metadata: {
          action: 'export_audit_logs',
          filters: validatedQuery,
          format: 'CSV'
        },
        ipAddress,
        userAgent
      });

      // Set headers for file download
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.status(200).send(csv);
    } catch (error) {
      logger.error(`Failed to export audit logs: ${error.message}`);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Audit Log by ID
   * GET /admin/audit-logs/:id
   * Access: ADMIN only
   * 
   * Returns detailed information for a single audit log entry
   */
  async getAuditLogById(req, res) {
    try {
      const { id } = req.params;
      const logId = parseInt(id);

      if (isNaN(logId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid audit log ID'
        });
      }

      // Fetch single audit log
      const log = await prisma.auditLog.findUnique({
        where: { id: logId },
        include: {
          actor: {
            select: {
              id: true,
              full_name: true,
              email: true,
              profile_id: true,
              role: {
                select: {
                  role_name: true
                }
              }
            }
          }
        }
      });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }

      // Fetch target user if exists
      let targetUser = null;
      if (log.target_user_id) {
        targetUser = await prisma.user.findUnique({
          where: { id: log.target_user_id },
          select: {
            id: true,
            full_name: true,
            email: true,
            profile_id: true
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Audit log retrieved successfully',
        data: {
          ...log,
          target_user: targetUser
        }
      });
    } catch (error) {
      logger.error(`Failed to retrieve audit log: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit log',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cleanup Old Audit Logs (Manual Trigger)
   * DELETE /admin/audit-logs/cleanup
   * Access: ADMIN only (Super Admin recommended)
   * 
   * Body: { retention_months: 24 }
   */
  async cleanupOldLogs(req, res) {
    try {
      const { retention_months = 24 } = req.body;

      // Validate retention months (12-36 range)
      if (retention_months < 12 || retention_months > 36) {
        return res.status(400).json({
          success: false,
          message: 'Retention months must be between 12 and 36'
        });
      }

      // Perform cleanup
      const deletedCount = await AuditService.cleanupOldLogs(retention_months);

      // Log this admin action (transactional - critical operation)
      const { ipAddress, userAgent } = getAuditContext(req);
      await AuditService.log({
        action: AuditAction.SYSTEM_AUTO_CLEANUP,
        actionType: AuditActionType.ADMIN_ACTION,
        actorId: req.user.userId,
        resourceType: AuditResourceType.SYSTEM,
        metadata: {
          retention_months,
          deleted_count: deletedCount,
          manually_triggered: true
        },
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        message: `Audit logs cleanup completed`,
        data: {
          deleted_count: deletedCount,
          retention_months: retention_months
        }
      });
    } catch (error) {
      logger.error(`Failed to cleanup audit logs: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup audit logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default new AuditController();
