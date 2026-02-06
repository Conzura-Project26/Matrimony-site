/**
 * Report Service
 * Phase 5 - Task 5.4: Report Management (Admin)
 * Phase 5 - Task 5.5: User Reporting
 * 
 * Business logic for:
 * - Admin report management operations (listing, status updates, action execution)
 * - User report submissions and viewing (Task 5.5)
 * - Pattern detection and auto-flagging
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { ReportStatus, ReportSeverity, ReportAction, ReportCategory } from '../types/enums.js';
import notificationService from './notificationService.js';

class ReportService {
  /**
   * Build WHERE clause for report filtering
   * @private
   */
  buildReportWhereClause(filters) {
    const where = {};

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Severity filter
    if (filters.severity) {
      where.severity = filters.severity;
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // User filters
    if (filters.reported_by) {
      where.reported_by = filters.reported_by;
    }
    if (filters.reported_user) {
      where.reported_user = filters.reported_user;
    }

    // Date filters
    if (filters.created_from || filters.created_to) {
      where.created_at = {};
      if (filters.created_from) {
        where.created_at.gte = new Date(filters.created_from);
      }
      if (filters.created_to) {
        where.created_at.lte = new Date(filters.created_to);
      }
    }

    // Boolean filters
    if (filters.has_action !== undefined) {
      if (filters.has_action) {
        where.action_taken = { not: null };
      } else {
        where.action_taken = null;
      }
    }

    if (filters.escalated !== undefined && filters.escalated) {
      where.status = ReportStatus.ESCALATED;
    }

    // Text search - searches reason and admin_notes
    if (filters.q) {
      const searchTerm = filters.q.trim();
      where.OR = [
        { reason: { contains: searchTerm, mode: 'insensitive' } },
        { admin_notes: { contains: searchTerm, mode: 'insensitive' } },
        {
          reporter: {
            OR: [
              { full_name: { contains: searchTerm, mode: 'insensitive' } },
              { profile_id: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        },
        {
          reported: {
            OR: [
              { full_name: { contains: searchTerm, mode: 'insensitive' } },
              { profile_id: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    return where;
  }

  /**
   * Build ORDER BY clause for report sorting
   * @private
   */
  buildReportOrderByClause(sortBy, sortOrder) {
    const orderBy = [];

    // Primary sort
    if (sortBy === 'severity') {
      // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
      orderBy.push({ severity: sortOrder });
      // Secondary sort by created_at for same severity
      orderBy.push({ created_at: 'asc' });
    } else if (sortBy === 'created_at') {
      orderBy.push({ created_at: sortOrder });
    } else if (sortBy === 'updated_at') {
      orderBy.push({ updated_at: sortOrder });
    }

    return orderBy;
  }

  /**
   * Get all reports with filters and pagination
   * @param {Object} filters - Filter criteria from query params
   * @param {String} currentAdminId - ID of admin making request
   * @returns {Object} Reports array + pagination metadata
   */
  async getAllReports(filters, currentAdminId) {
    const where = this.buildReportWhereClause(filters);
    const orderBy = this.buildReportOrderByClause(filters.sort_by, filters.sort_order);

    // Calculate offset
    const skip = (filters.page - 1) * filters.limit;

    // Execute query with pagination
    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        select: {
          id: true,
          category: true,
          severity: true,
          status: true,
          action_taken: true,
          created_at: true,
          updated_at: true,
          resolved_at: true,
          reporter: {
            select: {
              id: true,
              full_name: true,
              profile_id: true,
              email: true,
              mobile_number: true
            }
          },
          reported: {
            select: {
              id: true,
              full_name: true,
              profile_id: true,
              email: true,
              mobile_number: true,
              is_active: true,
              is_profile_verified: true
            }
          },
          resolver: {
            select: {
              id: true,
              full_name: true,
              profile_id: true
            }
          }
        }
      }),
      prisma.userReport.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      reports,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasMore: filters.page < totalPages
      },
      filters: {
        status: filters.status,
        severity: filters.severity,
        category: filters.category,
        has_action: filters.has_action,
        escalated: filters.escalated
      }
    };
  }

  /**
   * Get detailed report information
   * @param {Number} reportId - Report ID
   * @returns {Object} Complete report details with history
   */
  async getReportDetails(reportId) {
    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
      include: {
        // Reporter details (snapshot)
        reporter: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            email: true,
            mobile_number: true,
            gender: true,
            date_of_birth: true,
            created_at: true,
            is_active: true
          }
        },
        // Reported user details (snapshot + moderation indicators)
        reported: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            email: true,
            mobile_number: true,
            gender: true,
            date_of_birth: true,
            created_at: true,
            is_active: true,
            is_profile_verified: true,
            is_mobile_verified: true,
            is_email_verified: true,
            last_active_at: true,
            // Moderation indicators
            reports_received: {
              select: {
                id: true,
                category: true,
                severity: true,
                status: true,
                created_at: true
              },
              orderBy: { created_at: 'desc' },
              take: 10 // Last 10 reports
            },
            // Count of actions taken
            report_actions_received: {
              select: {
                id: true,
                action: true,
                created_at: true
              },
              orderBy: { created_at: 'desc' },
              take: 5
            }
          }
        },
        // Resolver details
        resolver: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            role: {
              select: {
                role_name: true
              }
            }
          }
        },
        // Admin action history on this report
        actions: {
          include: {
            actor: {
              select: {
                id: true,
                full_name: true,
                profile_id: true
              }
            },
            target_user: {
              select: {
                id: true,
                full_name: true,
                profile_id: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Calculate stats for reported user
    const reportedUserStats = {
      total_reports_received: report.reported.reports_received.length,
      open_reports_count: report.reported.reports_received.filter(r => r.status === ReportStatus.OPEN).length,
      resolved_reports_count: report.reported.reports_received.filter(r => r.status === ReportStatus.RESOLVED).length,
      total_actions_received: report.reported.report_actions_received.length,
      last_report_date: report.reported.reports_received[0]?.created_at || null,
      last_action_date: report.reported.report_actions_received[0]?.created_at || null
    };

    return {
      ...report,
      reported_user_stats: reportedUserStats,
      actionLogs: report.actions // Alias for test compatibility
    };
  }

  /**
   * Update report status
   * @param {Number} reportId - Report ID
   * @param {String} status - New status
   * @param {String} adminNotes - Optional admin notes
   * @param {String} currentAdminId - ID of admin making change
   * @param {String} currentAdminRole - Role of admin (ADMIN or MODERATOR)
   * @returns {Object} Updated report
   */
  async updateReportStatus(reportId, status, adminNotes, currentAdminId, currentAdminRole) {
    // Fetch existing report
    const existingReport = await prisma.userReport.findUnique({
      where: { id: reportId },
      select: { 
        id: true, 
        status: true, 
        reported_user: true,
        action_taken: true
      }
    });

    if (!existingReport) {
      throw new NotFoundError('Report not found');
    }

    // Moderator restrictions: Can only move OPEN -> IN_REVIEW or IN_REVIEW -> ESCALATED
    if (currentAdminRole === 'MODERATOR') {
      const allowedTransitions = {
        [ReportStatus.OPEN]: [ReportStatus.IN_REVIEW, ReportStatus.DISMISSED],
        [ReportStatus.IN_REVIEW]: [ReportStatus.ESCALATED, ReportStatus.OPEN],
        [ReportStatus.ACTION_TAKEN]: [ReportStatus.DISMISSED, ReportStatus.IN_REVIEW],
        // Moderators cannot touch RESOLVED, ESCALATED (except creating ESCALATED)
      };

      const allowed = allowedTransitions[existingReport.status];
      if (!allowed || !allowed.includes(status)) {
        throw new ForbiddenError(`Moderators cannot transition from ${existingReport.status} to ${status}`);
      }
    }

    // Update data
    const updateData = {
      status,
      updated_at: new Date()
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    // If marking as RESOLVED, set resolved_at and resolved_by
    if (status === ReportStatus.RESOLVED) {
      updateData.resolved_at = new Date();
      updateData.resolved_by = currentAdminId;
    }

    const updatedReport = await prisma.userReport.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            profile_id: true
          }
        },
        reported: {
          select: {
            id: true,
            full_name: true,
            profile_id: true
          }
        },
        resolver: {
          select: {
            id: true,
            full_name: true,
            profile_id: true
          }
        }
      }
    });

    // Log in audit trail
    await prisma.auditLog.create({
      data: {
        actor_id: currentAdminId,
        action: `REPORT_STATUS_UPDATE`,
        ip_address: null, // Can be added if available in context
      }
    });

    logger.info('Report status updated', {
      reportId,
      oldStatus: existingReport.status,
      newStatus: status,
      adminId: currentAdminId
    });

    return updatedReport;
  }

  /**
   * Take moderation action on reported user
   * @param {Number} reportId - Report ID
   * @param {String} action - Action to take
   * @param {Object} metadata - Action metadata
   * @param {String} adminNotes - Optional admin notes
   * @param {String} currentAdminId - ID of admin taking action
   * @returns {Object} Action result
   */
  async takeReportAction(reportId, action, metadata, adminNotes, currentAdminId) {
    // Fetch report
    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
      include: {
        reported: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            is_active: true
          }
        }
      }
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Cannot take action on already resolved reports (prevent duplicate actions)
    if (report.status === ReportStatus.RESOLVED) {
      throw new BadRequestError('Cannot take action on resolved report. Reopen it first.');
    }

    const reportedUserId = report.reported_user;

    // Execute the action based on type
    let actionResult = {};

    switch (action) {
      case ReportAction.NO_ACTION:
        actionResult = { message: 'No action required - report dismissed as valid but no violation' };
        break;

      case ReportAction.WARN_USER:
        actionResult = await this.warnUser(reportedUserId, reportId, currentAdminId);
        break;

      case ReportAction.SUSPEND_USER:
        if (!metadata?.suspension_days) {
          throw new BadRequestError('suspension_days is required for SUSPEND_USER action');
        }
        actionResult = await this.suspendUser(reportedUserId, metadata.suspension_days, reportId, currentAdminId);
        break;

      case ReportAction.DEACTIVATE_USER:
        actionResult = await this.deactivateUser(reportedUserId, reportId, currentAdminId);
        break;

      case ReportAction.DELETE_CONTENT:
        if (!metadata?.content_type) {
          throw new BadRequestError('content_type is required for DELETE_CONTENT action');
        }
        actionResult = await this.deleteContent(reportedUserId, metadata, reportId, currentAdminId);
        break;

      case ReportAction.RESTRICT_FEATURES:
        if (!metadata?.restricted_features || metadata.restricted_features.length === 0) {
          throw new BadRequestError('restricted_features array is required for RESTRICT_FEATURES action');
        }
        actionResult = await this.restrictFeatures(reportedUserId, metadata, reportId, currentAdminId);
        break;

      case ReportAction.FLAG_USER:
        actionResult = await this.flagUser(reportedUserId, metadata, reportId, currentAdminId);
        break;

      default:
        throw new BadRequestError(`Invalid action: ${action}`);
    }

    // Create action log entry
    await prisma.reportActionLog.create({
      data: {
        report_id: reportId,
        user_id: reportedUserId,
        action,
        metadata: metadata || {},
        acted_by: currentAdminId
      }
    });

    // Update report: set action_taken and change status to ACTION_TAKEN
    const updatedReport = await prisma.userReport.update({
      where: { id: reportId },
      data: {
        action_taken: action,
        status: ReportStatus.ACTION_TAKEN,
        admin_notes: adminNotes || null,
        updated_at: new Date()
      },
      include: {
        reported: {
          select: {
            id: true,
            full_name: true,
            profile_id: true
          }
        }
      }
    });

    // Log in audit trail
    await prisma.auditLog.create({
      data: {
        actor_id: currentAdminId,
        action: `REPORT_ACTION_${action}`,
        ip_address: null
      }
    });

    logger.info('Report action taken', {
      reportId,
      action,
      targetUserId: reportedUserId,
      adminId: currentAdminId
    });

    return {
      report: updatedReport,
      action_result: actionResult
    };
  }

  /**
   * Warn user - Send official warning notification
   * @private
   */
  async warnUser(userId, reportId, adminId) {
    // Send warning notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'PROFILE_VIEW', // Reusing existing enum, ideally add ADMIN_WARNING
        title: 'Official Warning',
        message: 'Your profile has received a warning for violating community guidelines. Please review our terms of service. Continued violations may result in account suspension.',
        related_user_id: null,
        related_id: reportId
      }
    });

    logger.info('User warned', { userId, reportId, adminId });

    return {
      action: 'WARN_USER',
      notification_sent: true,
      message: 'Warning notification sent to user'
    };
  }

  /**
   * Suspend user temporarily
   * @private
   */
  async suspendUser(userId, suspensionDays, reportId, adminId) {
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + suspensionDays);

    // Update user status to INACTIVE (we don't have SUSPENDED status yet)
    // Store suspension info in metadata or create a separate suspensions table
    await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, is_revoked: false },
      data: { is_revoked: true }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'PROFILE_VIEW', // Reusing existing enum
        title: 'Account Suspended',
        message: `Your account has been temporarily suspended for ${suspensionDays} days due to violation of community guidelines. If you believe this is an error, please contact support.`,
        related_user_id: null,
        related_id: reportId
      }
    });

    logger.info('User suspended', { userId, suspensionDays, reportId, adminId });

    return {
      action: 'SUSPEND_USER',
      suspension_days: suspensionDays,
      suspension_end: suspensionEndDate,
      tokens_revoked: true,
      notification_sent: true
    };
  }

  /**
   * Deactivate user indefinitely
   * @private
   */
  async deactivateUser(userId, reportId, adminId) {
    // Deactivate user
    await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, is_revoked: false },
      data: { is_revoked: true }
    });

    // Cancel all pending interests
    await prisma.interest.updateMany({
      where: {
        OR: [
          { sender_id: userId, status: 'PENDING' },
          { receiver_id: userId, status: 'PENDING' }
        ]
      },
      data: {
        status: 'WITHDRAWN',
        updated_at: new Date()
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: 'PROFILE_VIEW',
        title: 'Account Deactivated',
        message: 'Your account has been deactivated due to serious violation of community guidelines. Please contact support for more information.',
        related_user_id: null,
        related_id: reportId
      }
    });

    logger.info('User deactivated', { userId, reportId, adminId });

    return {
      action: 'DEACTIVATE_USER',
      user_deactivated: true,
      tokens_revoked: true,
      interests_cancelled: true,
      notification_sent: true
    };
  }

  /**
   * Delete inappropriate content
   * @private
   */
  async deleteContent(userId, metadata, reportId, adminId) {
    const contentType = metadata?.content_type || 'all';
    const contentIds = metadata?.content_ids || [];

    let deletedCount = 0;

    if (contentType === 'photo' || contentType === 'all') {
      if (contentIds.length > 0) {
        // Delete specific photos
        const result = await prisma.userPhoto.deleteMany({
          where: {
            id: { in: contentIds },
            user_id: userId
          }
        });
        deletedCount += result.count;
      } else if (contentType === 'all') {
        // Delete all unapproved photos
        const result = await prisma.userPhoto.deleteMany({
          where: {
            user_id: userId,
            is_approved: false
          }
        });
        deletedCount += result.count;
      }
    }

    if (contentType === 'bio' || contentType === 'all') {
      // Clear about_me field
      await prisma.userPersonalDetails.updateMany({
        where: { user_id: userId },
        data: { about_me: null }
      });
      deletedCount += 1;
    }

    if (contentType === 'message' || contentType === 'all') {
      // Delete messages sent by this user
      if (contentIds.length > 0) {
        // Delete specific messages
        const result = await prisma.message.deleteMany({
          where: {
            id: { in: contentIds },
            sender_id: userId
          }
        });
        deletedCount += result.count;
      } else if (contentType === 'all') {
        // Delete all messages sent in last 30 days (to avoid deleting entire history)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await prisma.message.deleteMany({
          where: {
            sender_id: userId,
            sent_at: { gte: thirtyDaysAgo }
          }
        });
        deletedCount += result.count;
      }
    }

    logger.info('Content deleted', { userId, contentType, deletedCount, reportId, adminId });

    return {
      action: 'DELETE_CONTENT',
      content_type: contentType,
      deleted_count: deletedCount,
      message: `Deleted ${deletedCount} content items`
    };
  }

  /**
   * Restrict features for user
   * @private
   */
  async restrictFeatures(userId, metadata, reportId, adminId) {
    const restrictedFeatures = metadata?.restricted_features || [];
    const restrictionDays = metadata?.restriction_days || 7;

    // Map feature names to enum values
    const featureMap = {
      'chat': 'CHAT',
      'interest': 'INTEREST',
      'upload': 'UPLOAD',
      'search': 'SEARCH'
    };

    // Helper to add days to a date
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    // Use transaction for atomic operations and race condition safety
    const restrictions = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const feature of restrictedFeatures) {
        const enumValue = featureMap[feature];
        if (!enumValue) continue;

        // Check for existing active restriction
        const existing = await tx.userFeatureRestriction.findUnique({
          where: {
            user_id_feature_is_active: {
              user_id: userId,
              feature: enumValue,
              is_active: true
            }
          }
        });

        // EXTEND behavior: If restriction exists and hasn't expired, add to existing time
        let baseDate = new Date();
        if (existing && existing.expires_at && existing.expires_at > new Date()) {
          baseDate = existing.expires_at;
        }

        const newExpiresAt = addDays(baseDate, restrictionDays);
        const restrictionReason = `Report #${reportId} - ${metadata?.notes || 'Violation of community guidelines'}`;

        // UPSERT: Race-condition safe, atomic operation
        const restriction = await tx.userFeatureRestriction.upsert({
          where: {
            user_id_feature_is_active: {
              user_id: userId,
              feature: enumValue,
              is_active: true
            }
          },
          update: {
            expires_at: newExpiresAt,
            updated_by: adminId,
            updated_at: new Date(),
            report_id: reportId,
            reason: restrictionReason
          },
          create: {
            user_id: userId,
            feature: enumValue,
            is_active: true,
            expires_at: newExpiresAt,
            restricted_by: adminId,
            report_id: reportId,
            reason: restrictionReason
          }
        });

        results.push(restriction);
      }

      return results;
    });

    // Get the latest expiry date from created/updated restrictions
    const latestExpiry = restrictions.length > 0 
      ? new Date(Math.max(...restrictions.map(r => new Date(r.expires_at))))
      : new Date();

    logger.info('Features restricted', {
      userId,
      features: restrictedFeatures,
      days: restrictionDays,
      expiresAt: latestExpiry,
      reportId,
      adminId
    });

    return {
      action: 'RESTRICT_FEATURES',
      restricted_features: restrictedFeatures,
      restriction_days: restrictionDays,
      expires_at: latestExpiry,
      restrictions_created: restrictions.length,
      message: `Restricted ${restrictions.length} features until ${latestExpiry.toISOString()}`
    };
  }

  /**
   * Flag user for future monitoring
   * @private
   */
  async flagUser(userId, metadata, reportId, adminId) {
    // Update user with flag and moderation details
    const moderationFlags = {
      flagged_at: new Date().toISOString(),
      flagged_by: adminId,
      report_id: reportId,
      reason: metadata?.notes || 'Flagged for monitoring',
      severity: metadata?.severity || 'MEDIUM'
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        is_flagged: true,
        moderation_flags: moderationFlags
      }
    });
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: `USER_FLAGGED_FOR_MONITORING`,
        ip_address: null
      }
    });

    logger.info('User flagged for monitoring', { userId, reportId, adminId, notes: metadata?.notes });

    return {
      action: 'FLAG_USER',
      user_flagged: true,
      is_flagged: true,
      moderation_flags: moderationFlags,
      message: 'User flagged for future monitoring'
    };
  }

  /**
   * Get report statistics (for admin dashboard)
   * @returns {Object} Report statistics
   */
  async getReportStatistics() {
    const [
      totalReports,
      openReports,
      inReviewReports,
      resolvedReports,
      escalatedReports,
      bySeverity,
      byCategory,
      todayReports
    ] = await Promise.all([
      // Total reports
      prisma.userReport.count(),

      // Open reports
      prisma.userReport.count({
        where: { status: ReportStatus.OPEN }
      }),

      // In review
      prisma.userReport.count({
        where: { status: ReportStatus.IN_REVIEW }
      }),

      // Resolved
      prisma.userReport.count({
        where: { status: ReportStatus.RESOLVED }
      }),

      // Escalated
      prisma.userReport.count({
        where: { status: ReportStatus.ESCALATED }
      }),

      // By severity
      prisma.userReport.groupBy({
        by: ['severity'],
        _count: true
      }),

      // By category
      prisma.userReport.groupBy({
        by: ['category'],
        _count: true
      }),

      // Today's reports
      prisma.userReport.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      overview: {
        total: totalReports,
        open: openReports,
        in_review: inReviewReports,
        resolved: resolvedReports,
        escalated: escalatedReports,
        today: todayReports
      },
      by_severity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {}),
      by_category: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {})
    };
  }

  // ==========================================
  // USER REPORTING METHODS (Task 5.5)
  // ==========================================

  /**
   * Determine severity based on report category
   * @private
   * @param {String} category - Report category
   * @returns {String} Severity level
   */
  determineSeverityFromCategory(category) {
    const severityMap = {
      // CRITICAL severity
      [ReportCategory.UNDERAGE]: ReportSeverity.CRITICAL,
      [ReportCategory.SCAM]: ReportSeverity.CRITICAL,
      
      // HIGH severity
      [ReportCategory.HARASSMENT]: ReportSeverity.HIGH,
      [ReportCategory.FAKE_PROFILE]: ReportSeverity.HIGH,
      [ReportCategory.MARRIED]: ReportSeverity.HIGH,
      
      // MEDIUM severity
      [ReportCategory.INAPPROPRIATE_PHOTO]: ReportSeverity.MEDIUM,
      [ReportCategory.INAPPROPRIATE_CONTENT]: ReportSeverity.MEDIUM,
      [ReportCategory.DUPLICATE_PROFILE]: ReportSeverity.MEDIUM,
      [ReportCategory.OFFENSIVE_BEHAVIOR]: ReportSeverity.MEDIUM,
      
      // LOW severity
      [ReportCategory.SPAM]: ReportSeverity.LOW,
      [ReportCategory.OTHER]: ReportSeverity.LOW
    };

    return severityMap[category] || ReportSeverity.MEDIUM;
  }

  /**
   * Check for duplicate reports
   * @private
   */
  async checkDuplicateReport(reporterId, reportedUserId, category) {
    const existingReport = await prisma.userReport.findFirst({
      where: {
        reported_by: reporterId,
        reported_user: reportedUserId,
        category: category,
        status: {
          in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW, ReportStatus.ESCALATED]
        }
      }
    });

    return existingReport;
  }

  /**
   * Check if user has exceeded report rate limit (5 per 24h)
   * FOR TESTING: Change >= 5 to >= 1000 temporarily
   * @private
   */
  async checkReportRateLimit(reporterId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentReportsCount = await prisma.userReport.count({
      where: {
        reported_by: reporterId,
        created_at: {
          gte: twentyFourHoursAgo
        }
      }
    });

    return recentReportsCount >= 5; // PRODUCTION: >= 5 | TESTING: >= 1000
  }

  /**
   * Detect report patterns and auto-flag user if threshold hit
   * Pattern: 3+ reports in 7 days triggers auto-flag
   * @private
   */
  async detectReportPatternsAndFlag(reportedUserId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Count recent reports against this user
    const recentReportsCount = await prisma.userReport.count({
      where: {
        reported_user: reportedUserId,
        created_at: {
          gte: sevenDaysAgo
        },
        status: {
          not: ReportStatus.DISMISSED
        }
      }
    });

    // Pattern threshold: 3+ reports in 7 days
    if (recentReportsCount >= 3) {
      // Auto-flag user and apply soft restrictions
      await prisma.$transaction(async (tx) => {
        // Flag the user
        await tx.user.update({
          where: { id: reportedUserId },
          data: {
            is_flagged: true,
            moderation_flags: {
              auto_flagged: true,
              reason: 'Multiple reports received',
              flagged_at: new Date(),
              report_count: recentReportsCount
            }
          }
        });

        // Apply soft feature restrictions (CHAT and INTEREST)
        const restrictedFeatures = ['CHAT', 'INTEREST'];
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        for (const feature of restrictedFeatures) {
          await tx.userFeatureRestriction.upsert({
            where: {
              user_id_feature_is_active: {
                user_id: reportedUserId,
                feature: feature,
                is_active: true
              }
            },
            create: {
              user_id: reportedUserId,
              feature: feature,
              restricted_by: 'SYSTEM',
              reason: 'Auto-flagged due to multiple reports',
              expires_at: expiresAt,
              is_active: true
            },
            update: {
              expires_at: expiresAt,
              reason: 'Auto-flagged due to multiple reports',
              updated_at: new Date()
            }
          });
        }
      });

      logger.warn('User auto-flagged due to report pattern', {
        userId: reportedUserId,
        reportCount: recentReportsCount,
        period: '7 days'
      });

      return {
        auto_flagged: true,
        report_count: recentReportsCount
      };
    }

    return {
      auto_flagged: false,
      report_count: recentReportsCount
    };
  }

  /**
   * Create a user report
   * @param {String} reporterId - ID of user making the report
   * @param {String} reportedUserId - ID of user being reported
   * @param {String} category - Report category
   * @param {String} reason - Detailed reason
   * @returns {Object} Created report summary
   */
  async createUserReport(reporterId, reportedUserId, category, reason) {
    // Validation 1: Prevent self-reporting
    if (reporterId === reportedUserId) {
      throw new BadRequestError('You cannot report yourself');
    }

    // Validation 2: Check if reported user exists
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
      select: {
        id: true,
        full_name: true,
        profile_id: true,
        is_active: true
      }
    });

    if (!reportedUser) {
      throw new NotFoundError('User not found');
    }

    // Validation 3: Check for duplicate report (same category)
    const duplicateReport = await this.checkDuplicateReport(reporterId, reportedUserId, category);
    if (duplicateReport) {
      throw new BadRequestError(
        `You have already reported this user for ${category}. Your previous report is being reviewed.`,
        { conflictType: 'duplicate_report', existingReportId: duplicateReport.id }
      );
    }

    // Validation 4: Rate limit check (5 per 24h)
    const rateLimitExceeded = await this.checkReportRateLimit(reporterId);
    if (rateLimitExceeded) {
      throw new BadRequestError(
        'You have exceeded the maximum number of reports (5) in 24 hours. Please try again later.',
        { error_code: 'RATE_LIMIT_EXCEEDED' }
      );
    }

    // Determine severity from category
    const severity = this.determineSeverityFromCategory(category);

    // Create the report
    const report = await prisma.userReport.create({
      data: {
        reported_by: reporterId,
        reported_user: reportedUserId,
        category: category,
        reason: reason,
        severity: severity,
        status: ReportStatus.OPEN
      },
      select: {
        id: true,
        status: true,
        severity: true,
        created_at: true
      }
    });

    // Pattern detection and auto-flagging
    const patternResult = await this.detectReportPatternsAndFlag(reportedUserId);

    // Send notification to moderators
    await this.notifyModeratorsOfNewReport(report.id, category, severity, reportedUser);

    logger.info('User report created', {
      reportId: report.id,
      reporterId,
      reportedUserId,
      category,
      severity,
      autoFlagged: patternResult.auto_flagged
    });

    return {
      report_id: report.id,
      status: report.status,
      created_at: report.created_at
    };
  }

  /**
   * Notify moderators about new report
   * @private
   */
  async notifyModeratorsOfNewReport(reportId, category, severity, reportedUser) {
    try {
      // Get all users with MODERATOR role
      const moderators = await prisma.user.findMany({
        where: {
          role: {
            role_name: 'MODERATOR'
          },
          is_active: true
        },
        select: {
          id: true
        }
      });

      // Create in-app notifications for all moderators
      const notifications = moderators.map(moderator => ({
        user_id: moderator.id,
        type: 'NEW_REPORT',
        title: `New ${severity} Report: ${category}`,
        message: `A new report has been submitted against user ${reportedUser.profile_id || reportedUser.full_name}`,
        related_user_id: reportedUser.id,
        related_id: parseInt(reportId) // Store report ID in related_id field
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });

        logger.info('Moderators notified of new report', {
          reportId,
          moderatorCount: moderators.length
        });
      }
    } catch (error) {
      // Don't fail report creation if notification fails
      logger.error('Failed to notify moderators of new report', {
        reportId,
        error: error.message
      });
    }
  }

  /**
   * Get report reasons/categories with descriptions
   * @returns {Object} Categories with labels and descriptions
   */
  async getReportReasons() {
    const categories = [
      {
        value: ReportCategory.FAKE_PROFILE,
        label: 'Fake Profile',
        description: 'Report profiles with fake information, stolen photos, or impersonation'
      },
      {
        value: ReportCategory.HARASSMENT,
        label: 'Harassment',
        description: 'Report users engaging in harassment, bullying, or threatening behavior'
      },
      {
        value: ReportCategory.INAPPROPRIATE_PHOTO,
        label: 'Inappropriate Photo',
        description: 'Report profiles with inappropriate, explicit, or offensive photos'
      },
      {
        value: ReportCategory.INAPPROPRIATE_CONTENT,
        label: 'Inappropriate Content',
        description: 'Report inappropriate messages, profile content, or offensive material'
      },
      {
        value: ReportCategory.SPAM,
        label: 'Spam',
        description: 'Report users sending spam messages or promotional content'
      },
      {
        value: ReportCategory.SCAM,
        label: 'Scam/Fraud',
        description: 'Report users attempting scams, fraud, or requesting money'
      },
      {
        value: ReportCategory.UNDERAGE,
        label: 'Underage User',
        description: 'Report profiles of users who appear to be under 18 years old'
      },
      {
        value: ReportCategory.MARRIED,
        label: 'Married/In Relationship',
        description: 'Report users who are already married or in a committed relationship'
      },
      {
        value: ReportCategory.DUPLICATE_PROFILE,
        label: 'Duplicate Profile',
        description: 'Report duplicate accounts or multiple profiles of the same person'
      },
      {
        value: ReportCategory.OFFENSIVE_BEHAVIOR,
        label: 'Offensive Behavior',
        description: 'Report offensive, disrespectful, or inappropriate behavior'
      },
      {
        value: ReportCategory.OTHER,
        label: 'Other',
        description: 'Report other policy violations or concerns not covered above'
      }
    ];

    return { categories };
  }

  /**
   * Get reports for a user (made by them and against them)
   * @param {String} userId - Current user ID
   * @param {Object} filters - Filter criteria
   * @returns {Object} Reports with pagination
   */
  async getMyReports(userId, filters) {
    const where = {};

    // Type filter: made, received, or all
    if (filters.type === 'made') {
      where.reported_by = userId;
    } else if (filters.type === 'received') {
      where.reported_user = userId;
    } else {
      // All: reports made by me OR against me
      where.OR = [
        { reported_by: userId },
        { reported_user: userId }
      ];
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Date filters
    if (filters.created_from || filters.created_to) {
      where.created_at = {};
      if (filters.created_from) {
        where.created_at.gte = new Date(filters.created_from);
      }
      if (filters.created_to) {
        where.created_at.lte = new Date(filters.created_to);
      }
    }

    // Build order by
    const orderBy = { [filters.sort_by]: filters.sort_order };

    // Calculate offset
    const skip = (filters.page - 1) * filters.limit;

    // Execute query
    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        select: {
          id: true,
          category: true,
          severity: true,
          status: true,
          reason: true,
          created_at: true,
          updated_at: true,
          resolved_at: true,
          reported_by: true,  // Need this to determine report_type
          reported_user: true, // Need this to determine report_type
          // Show limited info about other party
          reporter: {
            select: {
              id: true,
              full_name: true,
              profile_id: true
            }
          },
          reported: {
            select: {
              id: true,
              full_name: true,
              profile_id: true
            }
          },
          // Don't expose admin_notes, action_taken, or resolver details to users
          // These are admin-only fields
        }
      }),
      prisma.userReport.count({ where })
    ]);

    // Add context field to indicate if report was made by user or against them
    const reportsWithContext = reports.map(report => ({
      ...report,
      report_type: report.reported_by === userId ? 'made' : 'received',
      // Remove the other party's info based on report type for privacy
      other_party: report.reported_by === userId ? report.reported : report.reporter
    }));

    // Remove reporter, reported, reported_by, and reported_user fields 
    const cleanedReports = reportsWithContext.map(({ reporter, reported, reported_by, reported_user, ...rest }) => rest);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      reports: cleanedReports,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasMore: filters.page < totalPages
      },
      filters: {
        type: filters.type,
        status: filters.status,
        category: filters.category
      }
    };
  }
}

export default new ReportService();
