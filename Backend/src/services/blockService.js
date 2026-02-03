/**
 * Block Service
 * Task 4.x: User Blocking System
 * 
 * Handles blocking/unblocking users with bidirectional hiding.
 * 
 * @module services/blockService
 */

import prisma from '../config/prisma.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Check if blocking relationship exists between two users (bidirectional)
 * Returns true if either user has blocked the other
 */
const isBlocked = async (userId1, userId2) => {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blocker_id: userId1, blocked_id: userId2, unblocked_at: null },
        { blocker_id: userId2, blocked_id: userId1, unblocked_at: null }
      ]
    }
  });
  
  return !!block;
};

/**
 * Get all users blocked by the current user
 */
const getBlockedUsers = async (userId) => {
  const blocks = await prisma.userBlock.findMany({
    where: {
      blocker_id: userId,
      unblocked_at: null
    },
    include: {
      blocked: {
        include: {
          photos: {
            where: {
              is_approved: true,
              is_primary: true,
              visibility: 'PUBLIC'
            },
            select: {
              photo_url: true
            },
            take: 1
          }
        }
      }
    },
    orderBy: {
      blocked_at: 'desc'
    }
  });

  return blocks.map(block => ({
    user: {
      id: block.blocked.id,
      full_name: block.blocked.full_name,
      profile_id: block.blocked.profile_id,
      age: block.blocked.date_of_birth
        ? Math.floor((Date.now() - new Date(block.blocked.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      photo_url: block.blocked.photos[0]?.photo_url || null
    },
    blocked_at: block.blocked_at
  }));
};

/**
 * Block a user
 * - Creates block relationship
 * - Auto-rejects pending interests (bidirectional)
 * - Creates audit log
 * - Silent operation (no notification to blocked user)
 */
const blockUser = async (blockerId, blockedId, transaction = null) => {
  const tx = transaction || prisma;

  // Cannot block yourself
  if (blockerId === blockedId) {
    throw new ConflictError('Cannot block yourself');
  }

  // Check if user exists
  const blockedUser = await tx.user.findUnique({
    where: { id: blockedId }
  });

  if (!blockedUser) {
    throw new NotFoundError('User not found');
  }

  // Check if already blocked (active block)
  const existingBlock = await tx.userBlock.findFirst({
    where: {
      blocker_id: blockerId,
      blocked_id: blockedId,
      unblocked_at: null
    }
  });

  if (existingBlock) {
    throw new ConflictError('User is already blocked');
  }

  // Check if there was a previous block that was unblocked
  const previousBlock = await tx.userBlock.findFirst({
    where: {
      blocker_id: blockerId,
      blocked_id: blockedId,
      unblocked_at: { not: null }
    }
  });

  let block;
  if (previousBlock) {
    // Reactivate previous block
    block = await tx.userBlock.update({
      where: { id: previousBlock.id },
      data: {
        unblocked_at: null,
        blocked_at: new Date()
      }
    });
  } else {
    // Create new block
    block = await tx.userBlock.create({
      data: {
        blocker_id: blockerId,
        blocked_id: blockedId
      }
    });
  }

  // Auto-reject all pending interests between these users (bidirectional)
  const rejectedCount = await tx.interest.updateMany({
    where: {
      OR: [
        { sender_id: blockerId, receiver_id: blockedId, status: 'PENDING' },
        { sender_id: blockedId, receiver_id: blockerId, status: 'PENDING' }
      ]
    },
    data: {
      status: 'REJECTED',
      responded_at: new Date()
    }
  });

  logger.info('[BlockService] User blocked', {
    blockerId,
    blockedId,
    blockId: block.id,
    rejectedInterests: rejectedCount.count
  });

  // Create audit log
  await tx.auditLog.create({
    data: {
      actor_id: blockerId,
      action: 'BLOCK_USER'
    }
  });

  return {
    block_id: block.id,
    blocked_at: block.blocked_at,
    rejected_interests_count: rejectedCount.count
  };
};

/**
 * Unblock a user
 * - Soft deletes block (sets unblocked_at)
 * - Creates audit log
 * - Does NOT restore rejected interests
 */
const unblockUser = async (blockerId, blockedId) => {
  // Find active block
  const block = await prisma.userBlock.findFirst({
    where: {
      blocker_id: blockerId,
      blocked_id: blockedId,
      unblocked_at: null
    }
  });

  if (!block) {
    throw new NotFoundError('Block relationship not found or already unblocked');
  }

  // Soft delete by setting unblocked_at
  const updatedBlock = await prisma.userBlock.update({
    where: {
      id: block.id
    },
    data: {
      unblocked_at: new Date()
    }
  });

  logger.info('[BlockService] User unblocked', {
    blockerId,
    blockedId,
    blockId: block.id,
    blockedDuration: new Date() - new Date(block.blocked_at)
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actor_id: blockerId,
      action: 'UNBLOCK_USER'
    }
  });

  return {
    block_id: updatedBlock.id,
    unblocked_at: updatedBlock.unblocked_at
  };
};

/**
 * Get query condition to exclude blocked users (bidirectional)
 * Use this in WHERE clauses for search/listing queries
 * 
 * @param {string} currentUserId - ID of the logged-in user
 * @param {string} targetField - Field name for the target user ID (e.g., 'id', 'user_id', 'sender_id')
 * @returns {Object} Prisma NOT condition
 */
const getBlockExclusionCondition = (currentUserId, targetField = 'id') => {
  return {
    AND: [
      {
        NOT: {
          blocks_received: {
            some: {
              blocker_id: currentUserId,
              unblocked_at: null
            }
          }
        }
      },
      {
        NOT: {
          blocks_made: {
            some: {
              blocked_id: currentUserId,
              unblocked_at: null
            }
          }
        }
      }
    ]
  };
};

export default {
  isBlocked,
  getBlockedUsers,
  blockUser,
  unblockUser,
  getBlockExclusionCondition
};
