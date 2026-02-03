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

export default MessageConfig;
