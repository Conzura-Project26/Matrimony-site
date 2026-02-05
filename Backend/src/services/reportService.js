/**
 * Report Service
 * Phase 5 - Task 5.4: Report Management
 * 
 * Business logic for admin report management operations
 * Handles report listing, status updates, action execution, and resolution workflow
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { ReportStatus, ReportSeverity, ReportAction, ReportCategory } from '../types/enums.js';

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
}

export default new ReportService();
