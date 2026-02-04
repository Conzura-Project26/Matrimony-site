/**
 * Admin Service
 * Phase 5 - Task 5.1: Admin User Management
 * 
 * Business logic for admin operations on user accounts
 * Handles user listing, status management, verification, deletion, bulk ops, and analytics
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { UserStatus } from '../types/enums.js';

class AdminService {
  /**
   * Build WHERE clause for user filtering
   * @private
   */
  buildUserWhereClause(filters, currentAdminId) {
    const where = {
      // Exclude current admin from results
      id: { not: currentAdminId }
    };

    // Text search - searches name, email, profile_id, exact mobile
    if (filters.q) {
      const searchTerm = filters.q.trim();
      where.OR = [
        { full_name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { profile_id: { contains: searchTerm, mode: 'insensitive' } },
        { mobile_number: searchTerm } // Exact match for mobile
      ];
    }

    // Status filters
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }
    if (filters.is_profile_verified !== undefined) {
      where.is_profile_verified = filters.is_profile_verified;
    }
    if (filters.is_email_verified !== undefined) {
      where.is_email_verified = filters.is_email_verified;
    }
    if (filters.is_mobile_verified !== undefined) {
      where.is_mobile_verified = filters.is_mobile_verified;
    }

    // Role filter
    if (filters.role) {
      where.role = {
        role_name: filters.role
      };
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

    if (filters.last_active_from || filters.last_active_to) {
      where.last_active_at = {};
      if (filters.last_active_from) {
        where.last_active_at.gte = new Date(filters.last_active_from);
      }
      if (filters.last_active_to) {
        where.last_active_at.lte = new Date(filters.last_active_to);
      }
    }

    // Gender filter
    if (filters.gender) {
      where.gender = filters.gender;
    }

    // Age filters (derived from date_of_birth)
    if (filters.age_min || filters.age_max) {
      where.date_of_birth = {};
      
      if (filters.age_max) {
        // age_max = 30 means born after (today - 30 years)
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - filters.age_max);
        where.date_of_birth.gte = maxDate;
      }
      
      if (filters.age_min) {
        // age_min = 25 means born before (today - 25 years)
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - filters.age_min);
        where.date_of_birth.lte = minDate;
      }
    }

    // Profile completion filter
    if (filters.profile_completion_min !== undefined) {
      where.profile_completion_percentage = {
        gte: filters.profile_completion_min
      };
    }

    return where;
  }

  /**
   * Build ORDER BY clause for sorting
   * @private
   */
  buildOrderByClause(sortBy, sortOrder) {
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    return orderBy;
  }

  /**
   * Format user data for listing (exclude sensitive fields)
   * @private
   */
  formatUserForListing(user) {
    const { password_hash, ...safeUser } = user;
    
    // Calculate age from date_of_birth
    const age = user.date_of_birth
      ? Math.floor((new Date() - new Date(user.date_of_birth)) / (1000 * 60 * 60 * 24 * 365))
      : null;

    return {
      ...safeUser,
      age,
      role: user.role?.role_name || null
    };
  }

  /**
   * Get all users with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {string} currentAdminId - Current admin user ID
   * @returns {Promise<Object>} - Paginated users list
   */
  async getAllUsers(filters, currentAdminId) {
    const { page, limit, sort_by, sort_order, ...filterParams } = filters;
    
    const skip = (page - 1) * limit;
    const whereClause = this.buildUserWhereClause(filterParams, currentAdminId);
    const orderByClause = this.buildOrderByClause(sort_by, sort_order);

    logger.info('Admin fetching users', {
      adminId: currentAdminId,
      filters: filterParams,
      page,
      limit
    });

    // Fetch users and total count in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: orderByClause,
        select: {
          id: true,
          profile_id: true,
          full_name: true,
          gender: true,
          date_of_birth: true,
          mobile_number: true,
          email: true,
          is_mobile_verified: true,
          is_email_verified: true,
          is_profile_verified: true,
          is_active: true,
          profile_completion_percentage: true,
          created_at: true,
          last_active_at: true,
          role: {
            select: {
              role_name: true
            }
          },
          personal_details: {
            select: {
              city: true,
              state: true
            }
          }
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const formattedUsers = users.map(user => this.formatUserForListing(user));

    return {
      users: formattedUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount
      }
    };
  }

  /**
   * Get detailed user information by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete user details
   */
  async getUserDetails(userId) {
    logger.info('Admin fetching user details', { userId });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            role_name: true,
            description: true
          }
        },
        personal_details: true,
        caste_details: {
          include: {
            religion: true,
            caste: true,
            sub_caste: true
          }
        },
        education_details: {
          orderBy: {
            year_of_passing: 'desc'
          }
        },
        professional_details: true,
        family_details: true,
        horoscope_details: true,
        partner_preferences: true,
        photos: {
          select: {
            id: true,
            photo_url: true,
            visibility: true,
            is_approved: true,
            is_primary: true,
            uploaded_at: true
          },
          orderBy: {
            is_primary: 'desc'
          }
        },
        // Statistics
        _count: {
          select: {
            interests_sent: true,
            interests_received: true,
            profile_views_made: true,
            profile_views_received: true,
            shortlisted: true,
            shortlisted_by: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove sensitive data
    const { password_hash, ...safeUser } = user;

    // Calculate age
    const age = user.date_of_birth
      ? Math.floor((new Date() - new Date(user.date_of_birth)) / (1000 * 60 * 60 * 24 * 365))
      : null;

    return {
      ...safeUser,
      age,
      role: user.role?.role_name || null,
      statistics: {
        interests_sent: user._count.interests_sent,
        interests_received: user._count.interests_received,
        profile_views_made: user._count.profile_views_made,
        profile_views_received: user._count.profile_views_received,
        shortlisted: user._count.shortlisted,
        shortlisted_by: user._count.shortlisted_by
      }
    };
  }

  /**
   * Update user account status (ACTIVE, INACTIVE, SUSPENDED)
   * @param {string} userId - User ID to update
   * @param {string} status - New status
   * @param {string} reason - Reason for status change
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<Object>} - Updated user
   */
  async updateUserStatus(userId, status, reason, adminId) {
    logger.info('Admin updating user status', { userId, status, reason, adminId });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent admin from changing another admin's status
    if (user.role.role_name === 'ADMIN' && user.id !== adminId) {
      throw new ForbiddenError('Cannot change status of another admin');
    }

    // Perform status change in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user status
      const isActive = status === UserStatus.ACTIVE;
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          is_active: isActive
        },
        select: {
          id: true,
          full_name: true,
          is_active: true,
          role: {
            select: {
              role_name: true
            }
          }
        }
      });

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          actor_id: adminId,
          action: `USER_STATUS_CHANGED: ${status}`,
          ip_address: null, // Will be set from controller
          created_at: new Date()
        }
      });

      // If deactivating or suspending, revoke all refresh tokens
      if (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED) {
        await tx.refreshToken.updateMany({
          where: {
            user_id: userId,
            is_revoked: false
          },
          data: {
            is_revoked: true
          }
        });

        // Soft-cancel pending interests (set to WITHDRAWN)
        await tx.interest.updateMany({
          where: {
            sender_id: userId,
            status: 'PENDING'
          },
          data: {
            status: 'WITHDRAWN',
            updated_at: new Date()
          }
        });

        logger.info('Revoked tokens and canceled interests for deactivated user', { userId });
      }

      return updatedUser;
    });

    logger.info('User status updated successfully', {
      userId,
      status,
      adminId
    });

    return {
      ...result,
      status,
      reason,
      updated_by: adminId,
      role: result.role?.role_name
    };
  }

  /**
   * Soft delete user (mark as inactive and keep data for audit)
   * @param {string} userId - User ID to delete
   * @param {string} reason - Deletion reason
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<Object>} - Result
   */
  async deleteUser(userId, reason, adminId) {
    logger.info('Admin deleting user (soft delete)', { userId, reason, adminId });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent admin from deleting another admin
    if (user.role.role_name === 'ADMIN') {
      throw new ForbiddenError('Cannot delete admin accounts');
    }

    // Soft delete in transaction
    await prisma.$transaction(async (tx) => {
      // Mark user as inactive (soft delete)
      await tx.user.update({
        where: { id: userId },
        data: {
          is_active: false
        }
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: {
          user_id: userId,
          is_revoked: false
        },
        data: {
          is_revoked: true
        }
      });

      // Cancel pending interests
      await tx.interest.updateMany({
        where: {
          sender_id: userId,
          status: 'PENDING'
        },
        data: {
          status: 'WITHDRAWN',
          updated_at: new Date()
        }
      });

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          actor_id: adminId,
          action: `USER_DELETED: ${reason}`,
          ip_address: null,
          created_at: new Date()
        }
      });
    });

    logger.info('User soft deleted successfully', { userId, adminId });

    return {
      success: true,
      user_id: userId,
      deleted_by: adminId,
      reason,
      deleted_at: new Date()
    };
  }

  /**
   * Verify or unverify user profile
   * @param {string} userId - User ID
   * @param {boolean} isVerified - Verification status
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<Object>} - Updated user
   */
  async verifyUserProfile(userId, isVerified, adminId) {
    logger.info('Admin updating profile verification', { userId, isVerified, adminId });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update verification status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          is_profile_verified: isVerified
        },
        select: {
          id: true,
          profile_id: true,
          full_name: true,
          is_profile_verified: true
        }
      });

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          actor_id: adminId,
          action: `PROFILE_VERIFICATION_${isVerified ? 'GRANTED' : 'REVOKED'}`,
          ip_address: null,
          created_at: new Date()
        }
      });

      return updatedUser;
    });

    logger.info('Profile verification updated', { userId, isVerified, adminId });

    return {
      ...result,
      verified_by: adminId,
      verified_at: new Date()
    };
  }

  /**
   * Bulk operations on users
   * @param {string} action - Bulk action type
   * @param {string[]} userIds - Array of user IDs
   * @param {string} reason - Reason for bulk action
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<Object>} - Results with success/failure counts
   */
  async bulkOperation(action, userIds, reason, adminId) {
    logger.info('Admin performing bulk operation', {
      action,
      userCount: userIds.length,
      adminId
    });

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each user
    for (const userId of userIds) {
      try {
        switch (action) {
          case 'ACTIVATE':
            await this.updateUserStatus(userId, UserStatus.ACTIVE, reason, adminId);
            break;
          case 'DEACTIVATE':
            await this.updateUserStatus(userId, UserStatus.INACTIVE, reason, adminId);
            break;
          case 'SUSPEND':
            await this.updateUserStatus(userId, UserStatus.SUSPENDED, reason, adminId);
            break;
          case 'VERIFY_PROFILE':
            await this.verifyUserProfile(userId, true, adminId);
            break;
          default:
            throw new BadRequestError('Invalid bulk action');
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          user_id: userId,
          reason: error.message
        });
        logger.error('Bulk operation failed for user', {
          userId,
          action,
          error: error.message
        });
      }
    }

    logger.info('Bulk operation completed', {
      action,
      adminId,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  /**
   * Get analytics/statistics for admin dashboard
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getAnalytics() {
    logger.info('Admin fetching analytics');

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      inactiveUsers,
      todayRegistrations,
      last7DaysActive
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { is_active: true }
      }),
      
      // Verified users
      prisma.user.count({
        where: { is_profile_verified: true }
      }),
      
      // Inactive users
      prisma.user.count({
        where: { is_active: false }
      }),
      
      // Today's registrations
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Users active in last 7 days
      prisma.user.count({
        where: {
          last_active_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      counts: {
        total_users: totalUsers,
        active_users: activeUsers,
        verified_users: verifiedUsers,
        inactive_users: inactiveUsers,
        today_registrations: todayRegistrations,
        last_7_days_active: last7DaysActive
      },
      percentages: {
        active_percentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
        verified_percentage: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0
      }
    };
  }

  /**
   * Export users data (placeholder for async implementation)
   * In production, this would trigger a background job
   * @param {string} format - Export format (CSV/JSON)
   * @param {Object} filters - Filter criteria
   * @param {string} adminId - Admin requesting export
   * @returns {Promise<Object>} - Export job details
   */
  async exportUsers(format, filters, adminId) {
    logger.info('Admin requesting user export', {
      format,
      filters,
      adminId
    });

    // In production, this would:
    // 1. Create an export job record
    // 2. Queue the job for background processing
    // 3. Process the export asynchronously
    // 4. Store file in S3/storage
    // 5. Notify admin when complete
    // 6. Provide download link with expiry

    // For now, return a placeholder response
    const exportJobId = `export_${Date.now()}_${adminId}`;

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        actor_id: adminId,
        action: `USER_EXPORT_REQUESTED: ${format}`,
        ip_address: null,
        created_at: new Date()
      }
    });

    return {
      export_id: exportJobId,
      status: 'QUEUED',
      format,
      filters,
      requested_by: adminId,
      requested_at: new Date(),
      message: 'Export job queued. You will be notified when ready for download.',
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };
  }
}

export default new AdminService();
