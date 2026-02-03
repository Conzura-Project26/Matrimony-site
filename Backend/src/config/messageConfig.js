/**
 * Message Configuration
 * Task 4.3: Message Service Setup
 * 
 * Contains rate limiters, constants, and validation rules for messaging system.
 * 
 * @module config/messageConfig
 */

import { createRateLimiter } from '../middleware/rateLimiter.js';

// ============================================
// MESSAGE CONSTANTS
// ============================================

export const MessageConfig = {
  // Content validation
  MAX_CONTENT_LENGTH: 1000,
  MIN_CONTENT_LENGTH: 1,
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Rate limiting windows (milliseconds)
  RATE_LIMIT_WINDOW_MINUTE: 60 * 1000, // 1 minute
  RATE_LIMIT_WINDOW_HOUR: 60 * 60 * 1000, // 1 hour
  
  // Rate limiting thresholds
  SEND_MESSAGE_LIMIT_PER_MINUTE: 30,
  SEND_MESSAGE_LIMIT_PER_HOUR: 100,
  GET_CONVERSATION_LIMIT_PER_MINUTE: 60,
  GET_CONVERSATIONS_LIST_LIMIT_PER_MINUTE: 30,
  NEW_CONVERSATION_LIMIT_PER_HOUR: 5,
  DELETE_MESSAGE_LIMIT_PER_MINUTE: 20,
  DELETE_CONVERSATION_LIMIT_PER_MINUTE: 10,
  ARCHIVE_CONVERSATION_LIMIT_PER_MINUTE: 15,
  UNREAD_COUNT_LIMIT_PER_MINUTE: 60,
};

// ============================================
// RATE LIMITERS
// ============================================

/**
 * Rate Limiter for POST /messages/:userId
 * 30 messages per minute
 */
export const sendMessageRateLimiter = createRateLimiter(
  MessageConfig.SEND_MESSAGE_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'send-message'
);

/**
 * Rate Limiter for GET /messages/:userId
 * 60 requests per minute
 */
export const getConversationRateLimiter = createRateLimiter(
  MessageConfig.GET_CONVERSATION_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'get-conversation'
);

/**
 * Rate Limiter for GET /messages/conversations
 * 30 requests per minute
 */
export const getConversationsListRateLimiter = createRateLimiter(
  MessageConfig.GET_CONVERSATIONS_LIST_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'get-conversations-list'
);

/**
 * Rate Limiter for DELETE /messages/:messageId
 * 20 requests per minute
 */
export const deleteSingleMessageRateLimiter = createRateLimiter(
  MessageConfig.DELETE_MESSAGE_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'delete-single-message'
);

/**
 * Rate Limiter for DELETE /messages/conversations/:userId
 * 10 requests per minute
 */
export const deleteConversationRateLimiter = createRateLimiter(
  MessageConfig.DELETE_CONVERSATION_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'delete-conversation'
);

/**
 * Rate Limiter for POST/DELETE /messages/conversations/:userId/archive
 * 15 requests per minute
 */
export const archiveConversationRateLimiter = createRateLimiter(
  MessageConfig.ARCHIVE_CONVERSATION_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'archive-conversation'
);

/**
 * Rate Limiter for GET /messages/unread-count
 * 60 requests per minute
 */
export const getUnreadCountRateLimiter = createRateLimiter(
  MessageConfig.UNREAD_COUNT_LIMIT_PER_MINUTE,
  MessageConfig.RATE_LIMIT_WINDOW_MINUTE,
  'get-unread-count'
);

export default MessageConfig;
