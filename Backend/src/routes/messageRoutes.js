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
  getConversationsListRateLimiter,
  deleteSingleMessageRateLimiter,
  deleteConversationRateLimiter,
  archiveConversationRateLimiter,
  getUnreadCountRateLimiter
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
 *       - ✅ Excludes archived conversations by default (Task 4.4)
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
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include archived conversations (Task 4.4)
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
// GET GLOBAL UNREAD COUNT (Task 4.4)
// ============================================
// NOTE: Must be placed BEFORE /:userId route to avoid route conflict

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get global unread message count
 *     description: |
 *       Returns total number of unread messages across all conversations.
 *       
 *       **Use Case:**
 *       - Display notification badge count on navigation/tab bar
 *       - Show total unread count in inbox header
 *       
 *       **Features:**
 *       - ✅ Counts all unread messages (read_at IS NULL)
 *       - ✅ Excludes soft-deleted messages
 *       - ✅ Excludes messages from blocked users (bidirectional)
 *       - ✅ Real-time accurate count
 *       
 *       **Performance:** Indexed query, fast response
 *       
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
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
 *                   example: "Unread count retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread_count:
 *                       type: integer
 *                       example: 15
 *                       description: Total unread messages across all conversations
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (60 requests per minute)
 */
router.get('/unread-count', getUnreadCountRateLimiter, asyncHandler(messageController.getGlobalUnreadCount));

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

// ============================================
// DELETE CONVERSATION (Task 4.4)
// ============================================

/**
 * @swagger
 * /messages/conversations/{userId}:
 *   delete:
 *     tags:
 *       - Messages
 *     summary: Delete entire conversation with a user (soft delete - one-sided)
 *     description: |
 *       Soft deletes all messages in a conversation with the specified user.
 *       This is a ONE-SIDED operation - only deletes for the current user.
 *       
 *       **How It Works:**
 *       - ✅ Messages you SENT → marked with `deleted_by_sender_at`
 *       - ✅ Messages you RECEIVED → marked with `deleted_by_receiver_at`
 *       - ✅ Conversation disappears from your inbox
 *       - ✅ Other user still sees the conversation (one-sided)
 *       - ✅ Deleted messages stay hidden forever (no resurrection)
 *       - ✅ New messages from this user appear normally
 *       
 *       **Use Cases:**
 *       - Clear conversation history
 *       - Remove unwanted conversations
 *       - Clean up inbox
 *       
 *       **Note:** If BOTH users delete, messages eligible for hard delete cleanup job
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
 *         description: UUID of the other user in the conversation
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
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
 *                   example: "Conversation deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       example: 47
 *                       description: Number of messages deleted
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T10:30:45.678Z"
 *                     other_user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *       400:
 *         description: Validation error (invalid UUID or cannot delete conversation with yourself)
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (10 requests per minute)
 */
router.delete('/conversations/:userId', deleteConversationRateLimiter, asyncHandler(messageController.deleteConversation));

// ============================================
// ARCHIVE/UNARCHIVE CONVERSATION (Task 4.4)
// ============================================

/**
 * @swagger
 * /messages/conversations/{userId}/archive:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Archive conversation (hide from inbox - WhatsApp/Telegram style)
 *     description: |
 *       Archives a conversation to hide it from the inbox without deleting.
 *       This is a ONE-SIDED operation - only archives for the current user.
 *       
 *       **How It Works:**
 *       - ✅ Conversation hidden from inbox (GET /conversations)
 *       - ✅ Messages still accessible if you have direct link
 *       - ✅ Can be unarchived anytime
 *       - ✅ New messages from archived user auto-unarchive conversation
 *       - ✅ Similar to WhatsApp/Telegram archive feature
 *       
 *       **Use Cases:**
 *       - Temporarily hide completed conversations
 *       - Organize inbox without deleting
 *       - Keep conversations accessible but out of sight
 *       
 *       **Note:** To view archived conversations, use `GET /conversations?includeArchived=true`
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
 *         description: UUID of the other user in the conversation
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     responses:
 *       200:
 *         description: Conversation archived successfully
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
 *                   example: "Conversation archived successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     archived_count:
 *                       type: integer
 *                       example: 47
 *                       description: Number of messages archived
 *                     archived_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T11:15:30.123Z"
 *                     other_user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *       400:
 *         description: Validation error (invalid UUID or cannot archive conversation with yourself)
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (15 requests per minute)
 *   delete:
 *     tags:
 *       - Messages
 *     summary: Unarchive conversation (restore to inbox)
 *     description: |
 *       Unarchives a conversation to make it visible in the inbox again.
 *       This is a ONE-SIDED operation - only unarchives for the current user.
 *       
 *       **How It Works:**
 *       - ✅ Conversation visible in inbox again
 *       - ✅ All messages remain intact
 *       - ✅ Can be archived again anytime
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
 *         description: UUID of the other user in the conversation
 *         example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *     responses:
 *       200:
 *         description: Conversation unarchived successfully
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
 *                   example: "Conversation unarchived successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     unarchived_count:
 *                       type: integer
 *                       example: 47
 *                       description: Number of messages unarchived
 *                     other_user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "17bbc1c7-9f2b-4dbe-851e-2cf321841e9c"
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (15 requests per minute)
 */
router.post('/conversations/:userId/archive', archiveConversationRateLimiter, asyncHandler(messageController.archiveConversation));
router.delete('/conversations/:userId/archive', archiveConversationRateLimiter, asyncHandler(messageController.unarchiveConversation));

// ============================================
// DELETE SINGLE MESSAGE (Task 4.4)
// ============================================

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     tags:
 *       - Messages
 *     summary: Delete a single message (soft delete - one-sided)
 *     description: |
 *       Soft deletes a single message. This is a ONE-SIDED operation.
 *       
 *       **How It Works:**
 *       - ✅ If you're the SENDER → marked with `deleted_by_sender_at`
 *       - ✅ If you're the RECEIVER → marked with `deleted_by_receiver_at`
 *       - ✅ Message disappears from your view only
 *       - ✅ Other user still sees the message (one-sided)
 *       - ✅ Cannot delete someone else's message
 *       
 *       **Use Cases:**
 *       - Remove individual message you sent
 *       - Delete received message from your view
 *       - Clean up specific messages
 *       
 *       **Note:** If BOTH users delete, message eligible for hard delete cleanup job
 *       
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the message to delete
 *         example: 12345
 *     responses:
 *       200:
 *         description: Message deleted successfully
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
 *                   example: "Message deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message_id:
 *                       type: integer
 *                       example: 12345
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T12:00:00.000Z"
 *                     deleted_as:
 *                       type: string
 *                       enum: [sender, receiver]
 *                       example: "sender"
 *                       description: Your role in this message
 *       400:
 *         description: Validation error (invalid message ID)
 *       403:
 *         description: Forbidden - can only delete your own messages
 *       404:
 *         description: Message not found
 *       409:
 *         description: Message already deleted
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Rate limit exceeded (20 requests per minute)
 */
router.delete('/:messageId', deleteSingleMessageRateLimiter, asyncHandler(messageController.deleteSingleMessage));

export default router;
