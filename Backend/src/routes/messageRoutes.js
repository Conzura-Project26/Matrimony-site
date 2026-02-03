/**
 * Message Routes
 * Task 4.3: Message Service Setup
 * 
 * API Endpoints:
 * - POST   /messages/:userId          - Send message to a user
 * - GET    /messages/:userId          - Get conversation with a user
 * - GET    /messages/conversations    - Get all conversations (inbox)
 * 
 * @module routes/messageRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import messageController from '../controllers/messageController.js';
import {
  sendMessageRateLimiter,
  getConversationRateLimiter,
  getConversationsListRateLimiter
} from '../config/messageConfig.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// ============================================
// GET CONVERSATIONS LIST (INBOX)
// ============================================
// NOTE: This must come BEFORE /:userId route to avoid conflicts

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get all conversations (inbox view)
 *     description: |
 *       Retrieve list of all conversations with last message and unread count.
 *       
 *       **Features:**
 *       - ✅ Ordered by latest message timestamp (most recent first)
 *       - ✅ Shows last message content and timestamp
 *       - ✅ Unread message count per conversation
 *       - ✅ User profile info (name, photo, profile_id)
 *       - ✅ Last active timestamp
 *       - ✅ Excludes blocked users
 *       - ✅ Excludes soft-deleted messages
 *       - ✅ Pagination support
 *       
 *       **Rate Limit:** 30 requests per minute
 *       
 *       **Use Case:** Display inbox/chat list in frontend
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conversations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           profile_id:
 *                             type: string
 *                             example: "MAT00001234"
 *                           full_name:
 *                             type: string
 *                             example: "Priya Sharma"
 *                           photo_url:
 *                             type: string
 *                             nullable: true
 *                           last_active_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                       last_message:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           content:
 *                             type: string
 *                             example: "Hi, how are you?"
 *                           sent_at:
 *                             type: string
 *                             format: date-time
 *                           is_own_message:
 *                             type: boolean
 *                             description: True if current user sent this message
 *                           is_read:
 *                             type: boolean
 *                             description: True if message has been read
 *                       unread_count:
 *                         type: integer
 *                         example: 3
 *                         description: Number of unread messages from this user
 *                       last_message_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     total_pages:
 *                       type: integer
 *                       example: 3
 *                     has_more:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (30 requests per minute)
 */
router.get('/conversations', getConversationsListRateLimiter, asyncHandler(messageController.getConversationsList));

// ============================================
// SEND MESSAGE
// ============================================

/**
 * @swagger
 * /messages/{userId}:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Send message to a user
 *     description: |
 *       Send a text message to another user after interest is accepted.
 *       
 *       **Validation Rules:**
 *       - ✅ Cannot message yourself
 *       - ✅ Receiver must exist and be active
 *       - ✅ Users must NOT be blocked (bidirectional check)
 *       - ✅ **Interest Requirement**: ANY acceptance (Option A)
 *         - If User A → User B is ACCEPTED, both can message
 *         - If User B → User A is ACCEPTED, both can message
 *         - Only ONE direction needs to be ACCEPTED
 *       - ✅ Content: 1-1000 characters
 *       
 *       **Rate Limits:**
 *       - Per-minute: 30 messages
 *       - Per-hour: 100 messages
 *       - New conversations: 5 per hour (spam prevention)
 *       
 *       **Notifications:**
 *       - Creates MESSAGE_RECEIVED notification for receiver
 *       
 *       **Audit Logging:**
 *       - Logs MESSAGE_SEND action with message ID
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to send message to
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Hi! I saw your profile and would love to connect."
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Message sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     sender_id:
 *                       type: string
 *                       format: uuid
 *                     receiver_id:
 *                       type: string
 *                       format: uuid
 *                     content:
 *                       type: string
 *                       example: "Hi! I saw your profile and would love to connect."
 *                     sent_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T10:30:00.000Z"
 *                     read_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Bad request (self-message, empty content, invalid format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               selfMessage:
 *                 summary: Self-message attempt
 *                 value:
 *                   success: false
 *                   message: "Cannot send message to yourself"
 *               emptyContent:
 *                 summary: Empty message content
 *                 value:
 *                   success: false
 *                   message: "Message content cannot be empty"
 *               tooLong:
 *                 summary: Content exceeds limit
 *                 value:
 *                   success: false
 *                   message: "Message content cannot exceed 1000 characters"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden (blocked or no accepted interest)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               blocked:
 *                 summary: User is blocked
 *                 value:
 *                   success: false
 *                   message: "Unable to send message to this user"
 *               noInterest:
 *                 summary: No accepted interest
 *                 value:
 *                   success: false
 *                   message: "You can only message users with whom you have an accepted interest"
 *       404:
 *         description: User not found or inactive
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               perMinute:
 *                 summary: Per-minute limit exceeded
 *                 value:
 *                   success: false
 *                   message: "You are sending messages too fast. Please slow down."
 *               perHour:
 *                 summary: Per-hour limit exceeded
 *                 value:
 *                   success: false
 *                   message: "You have reached the hourly message limit of 100 messages. Please try again later."
 *               newConversations:
 *                 summary: New conversation limit exceeded
 *                 value:
 *                   success: false
 *                   message: "You can only start 5 new conversations per hour. Please try again later."
 */
router.post('/:userId', sendMessageRateLimiter, asyncHandler(messageController.sendMessage));

// ============================================
// GET CONVERSATION
// ============================================

/**
 * @swagger
 * /messages/{userId}:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get conversation with a user
 *     description: |
 *       Retrieve message history with a specific user (chat view).
 *       
 *       **Features:**
 *       - ✅ Returns messages in ASC order (oldest → newest)
 *       - ✅ Cursor-based pagination (high performance)
 *       - ✅ Auto-marks unread messages as read
 *       - ✅ Excludes soft-deleted messages
 *       - ✅ Excludes blocked users
 *       - ✅ User profile info included
 *       
 *       **Pagination:**
 *       - Use `cursor` from previous response to fetch next page
 *       - Default page size: 20 messages
 *       - Messages returned oldest → newest
 *       
 *       **Rate Limit:** 60 requests per minute
 *       
 *       **Use Case:** Display chat history in frontend
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to get conversation with
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (message ID from previous response)
 *         example: "12345"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to fetch
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conversation retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                         profile_id:
 *                           type: string
 *                           example: "MAT00001234"
 *                         full_name:
 *                           type: string
 *                           example: "Priya Sharma"
 *                         photo_url:
 *                           type: string
 *                           nullable: true
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 12345
 *                           sender_id:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                             example: "Hi, how are you?"
 *                           sent_at:
 *                             type: string
 *                             format: date-time
 *                           read_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           is_own_message:
 *                             type: boolean
 *                             description: True if current user sent this message
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         next_cursor:
 *                           type: string
 *                           nullable: true
 *                           example: "12365"
 *                           description: Cursor for next page (null if no more messages)
 *                         has_more:
 *                           type: boolean
 *                           example: true
 *                           description: True if more messages available
 *                         page_size:
 *                           type: integer
 *                           example: 20
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is blocked
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded (60 requests per minute)
 */
router.get('/:userId', getConversationRateLimiter, asyncHandler(messageController.getConversation));

export default router;
