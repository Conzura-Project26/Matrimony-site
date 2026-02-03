/**
 * Message Service
 * Task 4.3: Message Service Setup
 * 
 * Business Logic:
 * - Validate interest acceptance (Option A: ANY acceptance allows messaging)
 * - Check blocking status (bidirectional)
 * - Send messages with notifications
 * - Fetch conversation history (cursor-based pagination)
 * - Fetch conversations list (inbox view with unread counts)
 * - Track first-time conversations for rate limiting
 * 
 * @module services/messageService
 */

import prisma from '../config/prisma.js';
import blockService from './blockService.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import MessageConfig from '../config/messageConfig.js';
import logger from '../config/logger.js';

/**
 * Check if users have mutual interest (ANY acceptance - Option A)
 * Returns true if EITHER direction has ACCEPTED status
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if messaging is allowed
 */
export async function canUsersMessage(userId1, userId2) {
  // Check if either user has accepted interest in any direction
  const acceptedInterest = await prisma.interest.findFirst({
    where: {
      OR: [
        { sender_id: userId1, receiver_id: userId2, status: 'ACCEPTED' },
        { sender_id: userId2, receiver_id: userId1, status: 'ACCEPTED' }
      ]
    }
  });

  return !!acceptedInterest;
}

/**
 * Validate if two users can message each other
 * Checks: blocking, interest acceptance
 * 
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @throws {ForbiddenError} If users cannot message
 */
export async function validateMessagingPermission(senderId, receiverId) {
  // Cannot message yourself
  if (senderId === receiverId) {
    throw new BadRequestError('Cannot send message to yourself');
  }

  // Check if receiver exists and is active
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, is_active: true, full_name: true }
  });

  if (!receiver) {
    throw new NotFoundError('User not found');
  }

  if (!receiver.is_active) {
    throw new NotFoundError('User profile is not available');
  }

  // Check blocking (bidirectional)
  const isBlocked = await blockService.isBlocked(senderId, receiverId);
  if (isBlocked) {
    throw new ForbiddenError('Unable to send message to this user');
  }

  // Check if users have accepted interest (Option A: ANY acceptance)
  const hasAcceptedInterest = await canUsersMessage(senderId, receiverId);
  if (!hasAcceptedInterest) {
    throw new ForbiddenError('You can only message users with whom you have an accepted interest');
  }

  return receiver;
}

/**
 * Check if this is a new conversation (first message between users)
 * Used for first-time conversation rate limiting
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if no messages exist between users
 */
export async function isNewConversation(userId1, userId2) {
  const existingMessage = await prisma.message.findFirst({
    where: {
      OR: [
        { sender_id: userId1, receiver_id: userId2 },
        { sender_id: userId2, receiver_id: userId1 }
      ]
    },
    select: { id: true }
  });

  return !existingMessage;
}

/**
 * Send a message from sender to receiver
 * 
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} content - Message content
 * @param {string} senderName - Sender's full name (for notification)
 * @returns {Promise<object>} Created message
 */
export async function sendMessage(senderId, receiverId, content, senderName) {
  // Validate content
  if (!content || typeof content !== 'string') {
    throw new BadRequestError('Message content is required');
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length < MessageConfig.MIN_CONTENT_LENGTH) {
    throw new BadRequestError('Message content cannot be empty');
  }

  if (trimmedContent.length > MessageConfig.MAX_CONTENT_LENGTH) {
    throw new BadRequestError(
      `Message content cannot exceed ${MessageConfig.MAX_CONTENT_LENGTH} characters`
    );
  }

  // Validate messaging permission (blocking, interest acceptance)
  const receiver = await validateMessagingPermission(senderId, receiverId);

  // Create message
  const message = await prisma.message.create({
    data: {
      sender_id: senderId,
      receiver_id: receiverId,
      content: trimmedContent
    },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          profile_id: true
        }
      },
      receiver: {
        select: {
          id: true,
          full_name: true,
          profile_id: true
        }
      }
    }
  });

  // Create notification for receiver
  try {
    await prisma.notification.create({
      data: {
        user_id: receiverId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: `${senderName} sent you a message`,
        related_user_id: senderId,
        related_id: message.id
      }
    });

    logger.info('[MessageService] Notification created', {
      receiverId,
      senderId,
      messageId: message.id
    });
  } catch (error) {
    logger.error('[MessageService] Failed to create notification', {
      error: error.message,
      receiverId,
      senderId
    });
  }

  logger.info('[MessageService] Message sent', {
    messageId: message.id,
    senderId,
    receiverId,
    contentLength: trimmedContent.length
  });

  return {
    id: message.id,
    sender_id: message.sender_id,
    receiver_id: message.receiver_id,
    content: message.content,
    sent_at: message.sent_at,
    read_at: message.read_at
  };
}

/**
 * Get conversation between two users (chat history)
 * Returns messages in ASC order (oldest → newest)
 * Uses cursor-based pagination
 * Excludes soft-deleted messages
 * 
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @param {object} options - Pagination options
 * @returns {Promise<object>} Paginated conversation
 */
export async function getConversation(currentUserId, otherUserId, options = {}) {
  const {
    cursor = null,
    limit = MessageConfig.DEFAULT_PAGE_SIZE
  } = options;

  // Validate limit
  const pageSize = Math.min(
    Math.max(1, parseInt(limit) || MessageConfig.DEFAULT_PAGE_SIZE),
    MessageConfig.MAX_PAGE_SIZE
  );

  // Validate other user exists
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      full_name: true,
      profile_id: true,
      photos: {
        where: {
          is_primary: true,
          is_approved: true,
          visibility: 'PUBLIC'
        },
        select: {
          photo_url: true
        },
        take: 1
      }
    }
  });

  if (!otherUser) {
    throw new NotFoundError('User not found');
  }

  // Check if blocked
  const isBlocked = await blockService.isBlocked(currentUserId, otherUserId);
  if (isBlocked) {
    throw new ForbiddenError('Unable to view conversation with this user');
  }

  // Build where clause for messages
  const where = {
    OR: [
      {
        sender_id: currentUserId,
        receiver_id: otherUserId,
        deleted_by_sender_at: null
      },
      {
        sender_id: otherUserId,
        receiver_id: currentUserId,
        deleted_by_receiver_at: null
      }
    ]
  };

  // Add cursor condition if provided
  if (cursor) {
    where.id = {
      lt: parseInt(cursor) // Less than cursor for DESC pagination
    };
  }

  // Fetch messages (DESC order - newest first, like WhatsApp/Telegram)
  const messages = await prisma.message.findMany({
    where,
    orderBy: {
      id: 'desc' // Newest messages first
    },
    take: pageSize + 1, // Fetch one extra to check if there are more
    include: {
      sender: {
        select: {
          id: true,
          full_name: true
        }
      }
    }
  });

  // Check if there are more messages
  const hasMore = messages.length > pageSize;
  const paginatedMessages = hasMore ? messages.slice(0, pageSize) : messages;

  // Get next cursor (ID of first older message not in this page)
  const nextCursor = hasMore && paginatedMessages.length > 0
    ? paginatedMessages[paginatedMessages.length - 1].id.toString()
    : null;

  // Mark unread messages as read (only messages sent to current user)
  const unreadMessageIds = paginatedMessages
    .filter(msg => msg.receiver_id === currentUserId && !msg.read_at)
    .map(msg => msg.id);

  const readTimestamp = new Date();
  
  if (unreadMessageIds.length > 0) {
    const updateResult = await prisma.message.updateMany({
      where: {
        id: { in: unreadMessageIds },
        receiver_id: currentUserId
      },
      data: {
        read_at: readTimestamp
      }
    });

    logger.info('[MessageService] Messages marked as read', {
      currentUserId,
      count: unreadMessageIds.length,
      updated: updateResult.count
    });
  }

  // Format messages (use updated read_at for unread messages)
  const formattedMessages = paginatedMessages.map(msg => ({
    id: msg.id,
    sender_id: msg.sender_id,
    content: msg.content,
    sent_at: msg.sent_at,
    read_at: unreadMessageIds.includes(msg.id) ? readTimestamp : msg.read_at,
    is_own_message: msg.sender_id === currentUserId
  }));

  return {
    user: {
      user_id: otherUser.id,
      profile_id: otherUser.profile_id,
      full_name: otherUser.full_name,
      photo_url: otherUser.photos[0]?.photo_url || null
    },
    messages: formattedMessages,
    pagination: {
      next_cursor: nextCursor,
      has_more: hasMore,
      page_size: pageSize
    }
  };
}

/**
 * Get all conversations (inbox view)
 * Returns list of users with last message and unread count
 * Ordered by latest message timestamp DESC
 * Excludes archived conversations by default
 * 
 * @param {string} currentUserId - Current user ID
 * @param {object} options - Pagination and filter options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20, max: 50)
 * @param {boolean} options.includeArchived - Include archived conversations (default: false)
 * @returns {Promise<object>} List of conversations
 */
export async function getConversationsList(currentUserId, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeArchived = false
  } = options;

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * pageSize;

  // Get all unique conversation partners
  // A conversation exists if there's at least one non-deleted message
  let conversations, totalCountResult;

  if (includeArchived) {
    // Include archived conversations
    conversations = await prisma.$queryRaw`
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = ${currentUserId}::uuid THEN receiver_id
            ELSE sender_id
          END as other_user_id,
          MAX(sent_at) as last_message_at
        FROM messages
        WHERE 
          (sender_id = ${currentUserId}::uuid AND deleted_by_sender_at IS NULL)
          OR (receiver_id = ${currentUserId}::uuid AND deleted_by_receiver_at IS NULL)
        GROUP BY other_user_id
        ORDER BY last_message_at DESC
        LIMIT ${pageSize}
        OFFSET ${skip}
      )
      SELECT * FROM conversation_users
    `;

    totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT other_user_id)::int as total
      FROM (
        SELECT 
          CASE 
            WHEN sender_id = ${currentUserId}::uuid THEN receiver_id
            ELSE sender_id
          END as other_user_id
        FROM messages
        WHERE 
          (sender_id = ${currentUserId}::uuid AND deleted_by_sender_at IS NULL)
          OR (receiver_id = ${currentUserId}::uuid AND deleted_by_receiver_at IS NULL)
      ) as conversation_users
    `;
  } else {
    // Exclude archived conversations (default)
    conversations = await prisma.$queryRaw`
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = ${currentUserId}::uuid THEN receiver_id
            ELSE sender_id
          END as other_user_id,
          MAX(sent_at) as last_message_at
        FROM messages
        WHERE 
          (
            (sender_id = ${currentUserId}::uuid AND deleted_by_sender_at IS NULL AND archived_by_sender_at IS NULL)
            OR (receiver_id = ${currentUserId}::uuid AND deleted_by_receiver_at IS NULL AND archived_by_receiver_at IS NULL)
          )
        GROUP BY other_user_id
        ORDER BY last_message_at DESC
        LIMIT ${pageSize}
        OFFSET ${skip}
      )
      SELECT * FROM conversation_users
    `;

    totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT other_user_id)::int as total
      FROM (
        SELECT 
          CASE 
            WHEN sender_id = ${currentUserId}::uuid THEN receiver_id
            ELSE sender_id
          END as other_user_id
        FROM messages
        WHERE 
          (
            (sender_id = ${currentUserId}::uuid AND deleted_by_sender_at IS NULL AND archived_by_sender_at IS NULL)
            OR (receiver_id = ${currentUserId}::uuid AND deleted_by_receiver_at IS NULL AND archived_by_receiver_at IS NULL)
          )
      ) as conversation_users
    `;
  }

  const totalCount = totalCountResult[0]?.total || 0;

  // Get blocked user IDs
  const blockedUserIds = new Set();
  for (const conv of conversations) {
    const isBlocked = await blockService.isBlocked(currentUserId, conv.other_user_id);
    if (isBlocked) {
      blockedUserIds.add(conv.other_user_id);
    }
  }

  // Filter out blocked users
  const filteredConversations = conversations.filter(
    conv => !blockedUserIds.has(conv.other_user_id)
  );

  // Fetch user details, last message, and unread count for each conversation
  const conversationsWithDetails = await Promise.all(
    filteredConversations.map(async (conv) => {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: conv.other_user_id },
        select: {
          id: true,
          full_name: true,
          profile_id: true,
          last_active_at: true,
          photos: {
            where: {
              is_primary: true,
              is_approved: true,
              visibility: 'PUBLIC'
            },
            select: {
              photo_url: true
            },
            take: 1
          }
        }
      });

      if (!user) return null; // Skip if user not found

      // Get last message
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { sender_id: currentUserId, receiver_id: conv.other_user_id, deleted_by_sender_at: null },
            { sender_id: conv.other_user_id, receiver_id: currentUserId, deleted_by_receiver_at: null }
          ]
        },
        orderBy: {
          sent_at: 'desc'
        },
        select: {
          id: true,
          sender_id: true,
          content: true,
          sent_at: true,
          read_at: true
        }
      });

      // Get unread count (messages sent by other user to current user that are unread)
      const unreadCount = await prisma.message.count({
        where: {
          sender_id: conv.other_user_id,
          receiver_id: currentUserId,
          read_at: null,
          deleted_by_receiver_at: null
        }
      });

      // Check if conversation is archived (check if there's at least one message archived by current user)
      const archivedMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { 
              sender_id: currentUserId, 
              receiver_id: conv.other_user_id, 
              archived_by_sender_at: { not: null }
            },
            { 
              sender_id: conv.other_user_id, 
              receiver_id: currentUserId, 
              archived_by_receiver_at: { not: null }
            }
          ]
        },
        select: { id: true }
      });

      return {
        user: {
          user_id: user.id,
          profile_id: user.profile_id,
          full_name: user.full_name,
          photo_url: user.photos[0]?.photo_url || null,
          last_active_at: user.last_active_at
        },
        last_message: lastMessage ? {
          content: lastMessage.content,
          sent_at: lastMessage.sent_at,
          is_own_message: lastMessage.sender_id === currentUserId,
          is_read: !!lastMessage.read_at
        } : null,
        unread_count: unreadCount,
        last_message_at: conv.last_message_at,
        is_archived: !!archivedMessage
      };
    })
  );

  // Filter out null values (deleted users)
  const validConversations = conversationsWithDetails.filter(conv => conv !== null);

  return {
    success: true,
    message: 'Conversations retrieved successfully',
    data: validConversations,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total: totalCount - blockedUserIds.size,
      total_pages: Math.ceil((totalCount - blockedUserIds.size) / pageSize),
      has_more: pageNum * pageSize < (totalCount - blockedUserIds.size)
    }
  };
}

/**
 * Delete entire conversation with a user (soft delete - one-sided)
 * Updates all messages between two users to mark them as deleted for the current user
 * 
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<object>} Deletion result
 */
export async function deleteConversation(currentUserId, otherUserId) {
  // Validate other user exists
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true }
  });

  if (!otherUser) {
    throw new NotFoundError('User not found');
  }

  // Cannot delete conversation with yourself
  if (currentUserId === otherUserId) {
    throw new BadRequestError('Cannot delete conversation with yourself');
  }

  const deleteTimestamp = new Date();

  // Soft delete all messages sent by current user
  const deletedAsSender = await prisma.message.updateMany({
    where: {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      deleted_by_sender_at: null // Only update if not already deleted
    },
    data: {
      deleted_by_sender_at: deleteTimestamp
    }
  });

  // Soft delete all messages received by current user
  const deletedAsReceiver = await prisma.message.updateMany({
    where: {
      sender_id: otherUserId,
      receiver_id: currentUserId,
      deleted_by_receiver_at: null // Only update if not already deleted
    },
    data: {
      deleted_by_receiver_at: deleteTimestamp
    }
  });

  const totalDeleted = deletedAsSender.count + deletedAsReceiver.count;

  logger.info('[MessageService] Conversation deleted', {
    currentUserId,
    otherUserId,
    deletedAsSender: deletedAsSender.count,
    deletedAsReceiver: deletedAsReceiver.count,
    totalDeleted
  });

  return {
    deleted_count: totalDeleted,
    deleted_at: deleteTimestamp,
    other_user_id: otherUserId
  };
}

/**
 * Delete a single message (soft delete - one-sided)
 * Only allows deleting your own sent messages or messages you received
 * 
 * @param {string} currentUserId - Current user ID
 * @param {number} messageId - Message ID
 * @returns {Promise<object>} Deletion result
 */
export async function deleteSingleMessage(currentUserId, messageId) {
  // Find the message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      sender_id: true,
      receiver_id: true,
      deleted_by_sender_at: true,
      deleted_by_receiver_at: true
    }
  });

  if (!message) {
    throw new NotFoundError('Message not found');
  }

  // Check if user is sender or receiver
  const isSender = message.sender_id === currentUserId;
  const isReceiver = message.receiver_id === currentUserId;

  if (!isSender && !isReceiver) {
    throw new ForbiddenError('You can only delete your own messages or messages sent to you');
  }

  // Check if already deleted by current user
  if (isSender && message.deleted_by_sender_at !== null) {
    throw new ConflictError('Message already deleted');
  }

  if (isReceiver && message.deleted_by_receiver_at !== null) {
    throw new ConflictError('Message already deleted');
  }

  const deleteTimestamp = new Date();

  // Update based on role
  const updateData = isSender
    ? { deleted_by_sender_at: deleteTimestamp }
    : { deleted_by_receiver_at: deleteTimestamp };

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: updateData
  });

  logger.info('[MessageService] Single message deleted', {
    currentUserId,
    messageId,
    role: isSender ? 'sender' : 'receiver',
    deletedAt: deleteTimestamp
  });

  return {
    message_id: messageId,
    deleted_at: deleteTimestamp,
    deleted_as: isSender ? 'sender' : 'receiver'
  };
}

/**
 * Get global unread message count across all conversations
 * Returns total number of unread messages for the current user
 * 
 * @param {string} currentUserId - Current user ID
 * @returns {Promise<number>} Total unread count
 */
export async function getGlobalUnreadCount(currentUserId) {
  // Count all unread messages where current user is receiver
  // Exclude deleted and blocked conversations
  const unreadCount = await prisma.message.count({
    where: {
      receiver_id: currentUserId,
      read_at: null,
      deleted_by_receiver_at: null,
      // Exclude messages from blocked users
      sender: {
        AND: [
          {
            NOT: {
              blocks_made: {
                some: {
                  blocked_id: currentUserId,
                  unblocked_at: null
                }
              }
            }
          },
          {
            NOT: {
              blocks_received: {
                some: {
                  blocker_id: currentUserId,
                  unblocked_at: null
                }
              }
            }
          }
        ]
      }
    }
  });

  logger.info('[MessageService] Global unread count retrieved', {
    currentUserId,
    unreadCount
  });

  return unreadCount;
}

/**
 * Archive conversation with a user (one-sided)
 * Hides conversation from inbox but keeps messages accessible
 * 
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<object>} Archive result
 */
export async function archiveConversation(currentUserId, otherUserId) {
  // Validate other user exists
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true }
  });

  if (!otherUser) {
    throw new NotFoundError('User not found');
  }

  // Cannot archive conversation with yourself
  if (currentUserId === otherUserId) {
    throw new BadRequestError('Cannot archive conversation with yourself');
  }

  const archiveTimestamp = new Date();

  // Archive all messages in the conversation
  const archivedAsSender = await prisma.message.updateMany({
    where: {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      archived_by_sender_at: null,
      deleted_by_sender_at: null // Don't archive already deleted messages
    },
    data: {
      archived_by_sender_at: archiveTimestamp
    }
  });

  const archivedAsReceiver = await prisma.message.updateMany({
    where: {
      sender_id: otherUserId,
      receiver_id: currentUserId,
      archived_by_receiver_at: null,
      deleted_by_receiver_at: null // Don't archive already deleted messages
    },
    data: {
      archived_by_receiver_at: archiveTimestamp
    }
  });

  const totalArchived = archivedAsSender.count + archivedAsReceiver.count;

  logger.info('[MessageService] Conversation archived', {
    currentUserId,
    otherUserId,
    archivedAsSender: archivedAsSender.count,
    archivedAsReceiver: archivedAsReceiver.count,
    totalArchived
  });

  return {
    archived_count: totalArchived,
    archived_at: archiveTimestamp,
    other_user_id: otherUserId
  };
}

/**
 * Unarchive conversation with a user (one-sided)
 * Restores conversation to inbox
 * 
 * @param {string} currentUserId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<object>} Unarchive result
 */
export async function unarchiveConversation(currentUserId, otherUserId) {
  // Validate other user exists
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true }
  });

  if (!otherUser) {
    throw new NotFoundError('User not found');
  }

  // Cannot unarchive conversation with yourself
  if (currentUserId === otherUserId) {
    throw new BadRequestError('Cannot unarchive conversation with yourself');
  }

  // Unarchive all messages in the conversation
  const unarchivedAsSender = await prisma.message.updateMany({
    where: {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      archived_by_sender_at: { not: null }
    },
    data: {
      archived_by_sender_at: null
    }
  });

  const unarchivedAsReceiver = await prisma.message.updateMany({
    where: {
      sender_id: otherUserId,
      receiver_id: currentUserId,
      archived_by_receiver_at: { not: null }
    },
    data: {
      archived_by_receiver_at: null
    }
  });

  const totalUnarchived = unarchivedAsSender.count + unarchivedAsReceiver.count;

  logger.info('[MessageService] Conversation unarchived', {
    currentUserId,
    otherUserId,
    unarchivedAsSender: unarchivedAsSender.count,
    unarchivedAsReceiver: unarchivedAsReceiver.count,
    totalUnarchived
  });

  return {
    unarchived_count: totalUnarchived,
    other_user_id: otherUserId
  };
}

export default {
  sendMessage,
  getConversation,
  getConversationsList,
  validateMessagingPermission,
  canUsersMessage,
  isNewConversation,
  deleteConversation,
  deleteSingleMessage,
  getGlobalUnreadCount,
  archiveConversation,
  unarchiveConversation
};

