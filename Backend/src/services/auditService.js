/**
 * Audit Service
 * Phase 5 - Task 5.6: Audit Logging
 * 
 * Centralized service for audit logging with hybrid approach:
 * - Transactional logging for CRITICAL actions (part of DB transaction)
 * - Asynchronous logging for NON-CRITICAL actions (fire-and-forget)
 * - PII masking for all sensitive data
 * - IP address and user agent capture
 * - Retention: 12-24 months
 * 
 * CRITICAL ACTIONS (Transactional):
 * - Password changes
 * - Account deletion
 * - Admin moderation actions (suspend, deactivate, delete)
 * - Subscription purchases
 * - Report actions
 * 
 * NON-CRITICAL ACTIONS (Asynchronous):
 * - Login attempts
 * - Profile updates
 * - OTP requests
 * - Photo uploads
 * - Search activities
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { 
  AuditActionType, 
  AuditResourceType, 
  AuditAction,
  AuditStatus 
} from '../types/enums.js';

class AuditService {
  /**
   * CRITICAL ACTIONS - These require transactional logging
   * Failures in these audits should fail the parent transaction
   */
  static CRITICAL_ACTIONS = new Set([
    // Password & Security
    AuditAction.PASSWORD_CHANGED,
    AuditAction.PASSWORD_RESET_SUCCESS,
    
    // Account Lifecycle
    AuditAction.ACCOUNT_DELETION_REQUESTED,
    AuditAction.ACCOUNT_SELF_DEACTIVATED,
    
    // Admin Moderation
    AuditAction.ADMIN_USER_SUSPENDED,
    AuditAction.ADMIN_USER_DEACTIVATED,
    AuditAction.ADMIN_USER_DELETED,
    AuditAction.ADMIN_CONTENT_DELETED,
    AuditAction.ADMIN_FEATURES_RESTRICTED,
    
    // Subscriptions & Payments
    AuditAction.SUBSCRIPTION_PURCHASED,
    AuditAction.SUBSCRIPTION_MANUAL_OVERRIDE,
    
    // Report Actions
    AuditAction.ADMIN_REPORT_ACTION_TAKEN,
    AuditAction.ADMIN_USER_WARNED
  ]);

  /**
   * PII FIELDS - These should be masked in metadata
   */
  static PII_FIELDS = new Set([
    'password', 'password_hash', 'new_password', 'old_password',
    'otp_code', 'otp', 'token', 'refresh_token', 'access_token',
    'mobile_number', 'email', 'aadhaar', 'pan', 'ssn',
    'credit_card', 'debit_card', 'bank_account'
  ]);

  /**
   * Mask PII data in metadata
   * @private
   * @param {Object} metadata - Raw metadata object
   * @returns {Object} - Metadata with PII masked
   */
  static maskPII(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return metadata;
    }

    // Handle arrays separately to preserve array structure
    if (Array.isArray(metadata)) {
      return metadata.map(item => this.maskPII(item));
    }

    const masked = { ...metadata };
    
    for (const key of Object.keys(masked)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains PII field name
      if (this.PII_FIELDS.has(lowerKey) || 
          Array.from(this.PII_FIELDS).some(pii => lowerKey.includes(pii))) {
        masked[key] = '***MASKED***';
      }
      
      // Recursively mask nested objects/arrays
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskPII(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Determine if action is critical (requires transactional logging)
   * @private
   * @param {string} action - Action identifier
   * @returns {boolean}
   */
  static isCriticalAction(action) {
    return this.CRITICAL_ACTIONS.has(action);
  }

  /**
   * Create Audit Log (Main Entry Point)
   * Automatically routes to transactional or async based on action criticality
   * 
   * @param {Object} params - Audit log parameters
   * @param {string} params.action - Action performed (use AuditAction enum)
   * @param {string} params.actionType - Action type (use AuditActionType enum)
   * @param {string} [params.actorId] - User who performed the action (null for system actions)
   * @param {string} [params.targetUserId] - User affected by the action
   * @param {string} [params.resourceType] - Type of resource (use AuditResourceType enum)
   * @param {string} [params.resourceId] - ID of affected resource
   * @param {Object} [params.metadata] - Additional context (will be PII-masked)
   * @param {string} [params.ipAddress] - IP address of requester
   * @param {string} [params.userAgent] - User agent string
   * @param {string} [params.status=SUCCESS] - Status of action (use AuditStatus enum)
   * @param {Object} [params.tx] - Prisma transaction client (for transactional logging)
   * @returns {Promise<Object>} - Created audit log entry (or null for async)
   */
  static async log(params) {
    const {
      action,
      actionType,
      actorId = null,
      targetUserId = null,
      resourceType = null,
      resourceId = null,
      metadata = null,
      ipAddress = null,
      userAgent = null,
      status = AuditStatus.SUCCESS,
      tx = null
    } = params;

    // Validate required fields
    if (!action || !actionType) {
      logger.error('Audit log failed: Missing required fields (action, actionType)');
      return null;
    }

    // Mask PII in metadata
    const maskedMetadata = metadata ? this.maskPII(metadata) : null;

    const auditData = {
      actor_id: actorId,
      target_user_id: targetUserId,
      action_type: actionType,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: maskedMetadata,
      ip_address: ipAddress,
      user_agent: userAgent ? userAgent.substring(0, 500) : null, // Truncate to 500 chars
      status: status
    };

    // Route to appropriate logging method
    if (this.isCriticalAction(action)) {
      // CRITICAL: Use transactional logging
      return await this.logTransactional(auditData, tx);
    } else {
      // NON-CRITICAL: Use async logging
      return await this.logAsync(auditData);
    }
  }

  /**
   * Transactional Audit Log
   * Used for CRITICAL actions - failures will fail the parent transaction
   * MUST be called within a Prisma transaction
   * 
   * @param {Object} auditData - Audit log data
   * @param {Object} tx - Prisma transaction client
   * @returns {Promise<Object>} - Created audit log
   */
  static async logTransactional(auditData, tx) {
    try {
      // If no transaction provided, create one
      if (!tx) {
        return await prisma.$transaction(async (transaction) => {
          return await transaction.auditLog.create({
            data: auditData
          });
        });
      }

      // Use provided transaction
      const auditLog = await tx.auditLog.create({
        data: auditData
      });

      logger.info(`[AUDIT-TRANSACTIONAL] ${auditData.action_type}: ${auditData.action}`, {
        actor: auditData.actor_id,
        target: auditData.target_user_id,
        resource: auditData.resource_type,
        status: auditData.status
      });

      return auditLog;
    } catch (error) {
      logger.error(`[AUDIT-TRANSACTIONAL-FAILED] ${auditData.action}: ${error.message}`, {
        action: auditData.action,
        actor: auditData.actor_id,
        error: error.message
      });
      
      // Re-throw error to fail parent transaction
      throw error;
    }
  }

  /**
   * Asynchronous Audit Log
   * Used for NON-CRITICAL actions - fire-and-forget approach
   * Failures are logged but don't affect the parent operation
   * 
   * @param {Object} auditData - Audit log data
   * @returns {Promise<null>} - Returns null immediately (async)
   */
  static async logAsync(auditData) {
    // Fire and forget - don't await
    setImmediate(async () => {
      try {
        await prisma.auditLog.create({
          data: auditData
        });

        logger.info(`[AUDIT-ASYNC] ${auditData.action_type}: ${auditData.action}`, {
          actor: auditData.actor_id,
          target: auditData.target_user_id,
          resource: auditData.resource_type,
          status: auditData.status
        });
      } catch (error) {
        // Log failure but don't throw (async failures shouldn't affect parent operation)
        logger.error(`[AUDIT-ASYNC-FAILED] ${auditData.action}: ${error.message}`, {
          action: auditData.action,
          actor: auditData.actor_id,
          error: error.message,
          stack: error.stack
        });
      }
    });

    return null; // Return immediately
  }

  /**
   * Get Audit Logs with Filters (Admin Only)
   * Supports pagination, filtering, and sorting
   * 
   * @param {Object} filters - Filter criteria
   * @param {string} [filters.action_type] - Filter by action type
   * @param {string} [filters.action] - Filter by specific action
   * @param {string} [filters.actor_id] - Filter by actor (who performed)
   * @param {string} [filters.target_user_id] - Filter by target user
   * @param {string} [filters.resource_type] - Filter by resource type
   * @param {string} [filters.resource_id] - Filter by resource ID
   * @param {string} [filters.status] - Filter by status
   * @param {Date} [filters.date_from] - Start date filter
   * @param {Date} [filters.date_to] - End date filter
   * @param {string} [filters.ip_address] - Filter by IP address
   * @param {string} [filters.search] - Text search in action field
   * @param {number} [filters.page=1] - Page number
   * @param {number} [filters.limit=50] - Records per page (max 100)
   * @param {string} [filters.sort_by=created_at] - Sort field
   * @param {string} [filters.sort_order=desc] - Sort direction (asc/desc)
   * @returns {Promise<Object>} - Paginated audit logs with metadata
   */
  static async getAuditLogs(filters = {}) {
    const {
      action_type,
      action,
      actor_id,
      target_user_id,
      resource_type,
      resource_id,
      status,
      date_from,
      date_to,
      ip_address,
      search,
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    // Build WHERE clause
    const where = {};

    if (action_type) where.action_type = action_type;
    if (action) where.action = action;
    if (actor_id) where.actor_id = actor_id;
    if (target_user_id) where.target_user_id = target_user_id;
    if (resource_type) where.resource_type = resource_type;
    if (resource_id) where.resource_id = resource_id;
    if (status) where.status = status;
    if (ip_address) where.ip_address = ip_address;

    // Date range filter
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    // Text search in action field
    if (search) {
      where.action = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const orderBy = {};
    orderBy[sort_by] = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      // Get total count
      const total = await prisma.auditLog.count({ where });

      // Get paginated results with actor details
      const logs = await prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
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

      // Fetch target user details if target_user_id exists
      const logsWithTargetUser = await Promise.all(
        logs.map(async (log) => {
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

          return {
            ...log,
            target_user: targetUser
          };
        })
      );

      return {
        logs: logsWithTargetUser,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      logger.error(`Failed to fetch audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Audit Log Statistics
   * Returns summary statistics for audit logs
   * 
   * @param {Object} filters - Optional filters (date_from, date_to)
   * @returns {Promise<Object>} - Audit log statistics
   */
  static async getAuditStatistics(filters = {}) {
    const { date_from, date_to } = filters;

    const where = {};
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    try {
      // Total counts by action type
      const byActionType = await prisma.auditLog.groupBy({
        by: ['action_type'],
        where,
        _count: true
      });

      // Total counts by status
      const byStatus = await prisma.auditLog.groupBy({
        by: ['status'],
        where,
        _count: true
      });

      // Total counts by resource type
      const byResourceType = await prisma.auditLog.groupBy({
        by: ['resource_type'],
        where,
        _count: true
      });

      // Top actors (users with most actions)
      const topActors = await prisma.auditLog.groupBy({
        by: ['actor_id'],
        where: {
          ...where,
          actor_id: { not: null }
        },
        _count: true,
        orderBy: {
          _count: {
            actor_id: 'desc'
          }
        },
        take: 10
      });

      // Fetch actor details
      const actorIds = topActors.map(a => a.actor_id).filter(Boolean);
      const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          full_name: true,
          profile_id: true,
          role: {
            select: { role_name: true }
            }
        }
      });

      const actorsMap = actors.reduce((map, actor) => {
        map[actor.id] = actor;
        return map;
      }, {});

      const topActorsWithDetails = topActors.map(a => ({
        actor: actorsMap[a.actor_id] || { id: a.actor_id, full_name: 'Unknown' },
        count: a._count
      }));

      return {
        total_logs: await prisma.auditLog.count({ where }),
        by_action_type: byActionType,
        by_status: byStatus,
        by_resource_type: byResourceType.filter(r => r.resource_type !== null),
        top_actors: topActorsWithDetails,
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      };
    } catch (error) {
      logger.error(`Failed to fetch audit statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export Audit Logs (CSV format)
   * Admin only - for compliance and retention
   * 
   * @param {Object} filters - Same filters as getAuditLogs
   * @returns {Promise<string>} - CSV string
   */
  static async exportAuditLogs(filters = {}) {
    try {
      // Get all logs matching filters (no pagination)
      const { logs } = await this.getAuditLogs({ ...filters, limit: 100000, page: 1 });

      // Generate CSV
      const headers = [
        'ID', 'Timestamp', 'Action Type', 'Action', 
        'Actor ID', 'Actor Name', 'Actor Role',
        'Target User ID', 'Target User Name',
        'Resource Type', 'Resource ID',
        'Status', 'IP Address', 'Metadata'
      ];

      const rows = logs.map(log => [
        log.id,
        log.created_at.toISOString(),
        log.action_type,
        log.action,
        log.actor_id || 'SYSTEM',
        log.actor?.full_name || 'SYSTEM',
        log.actor?.role?.role_name || 'SYSTEM',
        log.target_user_id || '',
        log.target_user?.full_name || '',
        log.resource_type || '',
        log.resource_id || '',
        log.status,
        log.ip_address || '',
        log.metadata ? JSON.stringify(log.metadata) : ''
      ]);

      // Convert to CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      logger.info(`Audit logs exported: ${logs.length} records`);

      return csv;
    } catch (error) {
      logger.error(`Failed to export audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cleanup Old Audit Logs (Retention Policy)
   * Deletes audit logs older than specified months
   * Should be run as a scheduled job (cron)
   * 
   * @param {number} [retentionMonths=24] - Keep logs for this many months
   * @returns {Promise<number>} - Number of logs deleted
   */
  static async cleanupOldLogs(retentionMonths = 24) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

      const result = await prisma.auditLog.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Audit log cleanup: Deleted ${result.count} logs older than ${retentionMonths} months`);

      // Log the cleanup action itself
      await this.logAsync({
        action: AuditAction.SYSTEM_AUTO_CLEANUP,
        action_type: AuditActionType.SYSTEM_ACTION,
        resource_type: AuditResourceType.SYSTEM,
        metadata: {
          retention_months: retentionMonths,
          cutoff_date: cutoffDate.toISOString(),
          deleted_count: result.count
        },
        status: AuditStatus.SUCCESS
      });

      return result.count;
    } catch (error) {
      logger.error(`Failed to cleanup old audit logs: ${error.message}`);
      throw error;
    }
  }
}

export default AuditService;
