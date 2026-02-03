/**
 * Block Controller
 * Task 4.x: User Blocking System
 * 
 * Handles HTTP requests for blocking/unblocking users.
 * 
 * @module controllers/blockController
 */

import blockService from '../services/blockService.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Block a user
 * POST /blocks/:userId
 */
const blockUser = async (req, res) => {
  const currentUserId = req.user.userId;
  const { userId } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new ValidationError('Invalid user ID format');
  }

  const result = await blockService.blockUser(currentUserId, userId);

  logger.info('[BlockController] Block request processed', {
    currentUserId,
    blockedUserId: userId,
    rejectedInterests: result.rejected_interests_count
  });

  res.status(200).json({
    success: true,
    message: 'User blocked successfully',
    data: {
      blocked_user_id: userId,
      blocked_at: result.blocked_at,
      rejected_interests_count: result.rejected_interests_count
    }
  });
};

/**
 * Unblock a user
 * DELETE /blocks/:userId
 */
const unblockUser = async (req, res) => {
  const currentUserId = req.user.userId;
  const { userId } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new ValidationError('Invalid user ID format');
  }

  const result = await blockService.unblockUser(currentUserId, userId);

  logger.info('[BlockController] Unblock request processed', {
    currentUserId,
    unblockedUserId: userId
  });

  res.status(200).json({
    success: true,
    message: 'User unblocked successfully',
    data: {
      unblocked_user_id: userId,
      unblocked_at: result.unblocked_at
    }
  });
};

/**
 * Get list of blocked users
 * GET /blocks
 */
const getBlockedUsers = async (req, res) => {
  const currentUserId = req.user.userId;

  const blockedUsers = await blockService.getBlockedUsers(currentUserId);

  logger.info('[BlockController] Blocked users retrieved', {
    currentUserId,
    count: blockedUsers.length
  });

  res.status(200).json({
    success: true,
    message: 'Blocked users retrieved successfully',
    data: blockedUsers
  });
};

export default {
  blockUser,
  unblockUser,
  getBlockedUsers
};
