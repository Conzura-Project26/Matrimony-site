/**
 * Message Controller
 * Task 4.3: Message Service Setup
 * 
 * Endpoints:
 * - POST   /messages/:userId          - Send message to a user
 * - GET    /messages/:userId          - Get conversation with a user
 * - GET    /messages/conversations    - Get all conversations (inbox)
 * 
 * @module controllers/messageController
 */

import messageService from '../services/messageService.js';
import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import { BadRequestError, TooManyRequestsError } from '../utils/errors.js';
import MessageConfig from '../config/messageConfig.js';

/**
 * Create audit log entry
 * @param {string} actorId - User ID who performed the action
 * @param {string} action - Description of the action
 * @param {string} ipAddress - IP address of the request
 */
async function createAuditLog(actorId, action, ipAddress) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_id: actorId,
        action: action,
        ip_address: ipAddress
      }
    });
  } catch (error) {
    logger.error('Audit log creation failed', {
      error: error.message,
      actorId,
      action
    });
  }
}

/**
 * Check hourly message rate limit per user
 * Prevents spam by limiting messages per hour
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of messages sent in last hour
 */
async function checkHourlyMessageLimit(userId) {
  const oneHourAgo = new Date(Date.now() - MessageConfig.RATE_LIMIT_WINDOW_HOUR);
  
  const messageCount = await prisma.message.count({
    where: {
      sender_id: userId,
      sent_at: {
        gte: oneHourAgo
      }
    }
  });

  return messageCount;
}

/**
 * Check new conversation rate limit
 * Limits number of new conversations a user can start per hour
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of new conversations started in last hour
 */
async function checkNewConversationLimit(userId) {
  const oneHourAgo = new Date(Date.now() - MessageConfig.RATE_LIMIT_WINDOW_HOUR);
  
  // Get unique receiver IDs for first messages sent in the last hour
  const newConversations = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT receiver_id)::int as count
    FROM (
      SELECT 
        receiver_id,
        MIN(sent_at) as first_message_at
      FROM messages
      WHERE sender_id = ${userId}::uuid
      GROUP BY receiver_id
      HAVING MIN(sent_at) >= ${oneHourAgo}
    ) as new_convos
  `;

  return newConversations[0]?.count || 0;
}

/**
 * Send Message to a User
 * POST /messages/:userId
 * 
 * @route POST /messages/:userId
 * @access Private (Authenticated users only)
 */
export async function sendMessage(req, res) {
  const senderId = req.user.userId;
  const senderName = req.user.fullName;
  const { userId: receiverId } = req.params;
  const { content } = req.body;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(receiverId)) {
    throw new BadRequestError('Invalid user ID format');
  }

  // Check hourly message limit (100 messages per hour)
  const hourlyMessageCount = await checkHourlyMessageLimit(senderId);
  if (hourlyMessageCount >= MessageConfig.SEND_MESSAGE_LIMIT_PER_HOUR) {
    throw new TooManyRequestsError(
      `You have reached the hourly message limit of ${MessageConfig.SEND_MESSAGE_LIMIT_PER_HOUR} messages. Please try again later.`
    );
  }

  // Check if this is a new conversation
  const isNew = await messageService.isNewConversation(senderId, receiverId);
  
  if (isNew) {
    // Check new conversation limit (5 per hour)
    const newConvoCount = await checkNewConversationLimit(senderId);
    if (newConvoCount >= MessageConfig.NEW_CONVERSATION_LIMIT_PER_HOUR) {
      throw new TooManyRequestsError(
        `You can only start ${MessageConfig.NEW_CONVERSATION_LIMIT_PER_HOUR} new conversations per hour. Please try again later.`
      );
    }
  }

  // Send message via service
  const message = await messageService.sendMessage(senderId, receiverId, content, senderName);

  // Log action
  await createAuditLog(senderId, `MESSAGE_SEND:${message.id}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message
  });
}

/**
 * Get Conversation with a User
 * GET /messages/:userId
 * 
 * @route GET /messages/:userId
 * @access Private (Authenticated users only)
 */
export async function getConversation(req, res) {
  const currentUserId = req.user.userId;
  const { userId: otherUserId } = req.params;
  const { cursor, limit } = req.query;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(otherUserId)) {
    throw new BadRequestError('Invalid user ID format');
  }

  // Get conversation via service
  const result = await messageService.getConversation(currentUserId, otherUserId, {
    cursor,
    limit
  });

  // Log action
  await createAuditLog(currentUserId, `MESSAGE_CONVERSATION_VIEW:${otherUserId}`, req.ip);

  res.status(200).json({
    success: true,
    message: 'Conversation retrieved successfully',
    data: result
  });
}

/**
 * Get All Conversations (Inbox)
 * GET /messages/conversations
 * 
 * @route GET /messages/conversations
 * @access Private (Authenticated users only)
 */
export async function getConversationsList(req, res) {
  const currentUserId = req.user.userId;
  const { page, limit, includeArchived } = req.query;

  // Get conversations via service
  const result = await messageService.getConversationsList(currentUserId, {
    page,
    limit,
    includeArchived: includeArchived === 'true' // Convert string to boolean
  });

  // Log action
  await createAuditLog(currentUserId, 'MESSAGE_CONVERSATIONS_LIST_VIEW', req.ip);

  res.status(200).json(result);
}

/**
 * Delete Conversation with a User
 * DELETE /messages/conversations/:userId
 * 
 * @route DELETE /messages/conversations/:userId
 * @access Private (Authenticated users only)
 */
export async function deleteConversation(req, res) {
  const currentUserId = req.user.userId;
  const { userId: otherUserId } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(otherUserId)) {
    throw new BadRequestError('Invalid user ID format');
  }

  // Delete conversation via service
  const result = await messageService.deleteConversation(currentUserId, otherUserId);

  // Log action
  await createAuditLog(currentUserId, `MESSAGE_CONVERSATION_DELETE:${otherUserId}`, req.ip);

  res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
    data: result
  });
}

/**
 * Delete Single Message
 * DELETE /messages/:messageId
 * 
 * @route DELETE /messages/:messageId
 * @access Private (Authenticated users only)
 */
export async function deleteSingleMessage(req, res) {
  const currentUserId = req.user.userId;
  const { messageId } = req.params;

  // Validate message ID is a number
  const messageIdNum = parseInt(messageId);
  if (isNaN(messageIdNum) || messageIdNum <= 0) {
    throw new BadRequestError('Invalid message ID format');
  }

  // Delete message via service
  const result = await messageService.deleteSingleMessage(currentUserId, messageIdNum);

  // Log action
  await createAuditLog(currentUserId, `MESSAGE_DELETE:${messageIdNum}`, req.ip);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
    data: result
  });
}

/**
 * Get Global Unread Message Count
 * GET /messages/unread-count
 * 
 * @route GET /messages/unread-count
 * @access Private (Authenticated users only)
 */
export async function getGlobalUnreadCount(req, res) {
  const currentUserId = req.user.userId;

  // Get unread count via service
  const unreadCount = await messageService.getGlobalUnreadCount(currentUserId);

  res.status(200).json({
    success: true,
    message: 'Unread count retrieved successfully',
    data: {
      unread_count: unreadCount
    }
  });
}

/**
 * Archive Conversation with a User
 * POST /messages/conversations/:userId/archive
 * 
 * @route POST /messages/conversations/:userId/archive
 * @access Private (Authenticated users only)
 */
export async function archiveConversation(req, res) {
  const currentUserId = req.user.userId;
  const { userId: otherUserId } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(otherUserId)) {
    throw new BadRequestError('Invalid user ID format');
  }

  // Archive conversation via service
  const result = await messageService.archiveConversation(currentUserId, otherUserId);

  // Log action
  await createAuditLog(currentUserId, `MESSAGE_CONVERSATION_ARCHIVE:${otherUserId}`, req.ip);

  res.status(200).json({
    success: true,
    message: 'Conversation archived successfully',
    data: result
  });
}

/**
 * Unarchive Conversation with a User
 * DELETE /messages/conversations/:userId/archive
 * 
 * @route DELETE /messages/conversations/:userId/archive
 * @access Private (Authenticated users only)
 */
export async function unarchiveConversation(req, res) {
  const currentUserId = req.user.userId;
  const { userId: otherUserId } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(otherUserId)) {
    throw new BadRequestError('Invalid user ID format');
  }

  // Unarchive conversation via service
  const result = await messageService.unarchiveConversation(currentUserId, otherUserId);

  // Log action
  await createAuditLog(currentUserId, `MESSAGE_CONVERSATION_UNARCHIVE:${otherUserId}`, req.ip);

  res.status(200).json({
    success: true,
    message: 'Conversation unarchived successfully',
    data: result
  });
}

export default {
  sendMessage,
  getConversation,
  getConversationsList,
  deleteConversation,
  deleteSingleMessage,
  getGlobalUnreadCount,
  archiveConversation,
  unarchiveConversation
};
