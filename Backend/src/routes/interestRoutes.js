/**
 * Interest Routes
 * Phase 4 - Task 4.1: Send Interest
 * Phase 4 - Task 4.2: Manage Interests
 * 
 * API Endpoints:
 * - POST   /interests/:receiverId            - Send interest to a user
 * - GET    /interests/sent                   - Get sent interests
 * - GET    /interests/received               - Get received interests
 * - PUT    /interests/:interestId/accept     - Accept interest
 * - PUT    /interests/:interestId/reject     - Reject interest
 * - DELETE /interests/:interestId            - Withdraw sent interest
 * 
 * @module routes/interestRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkFeatureRestriction } from '../middleware/checkFeatureRestrictions.js';
import asyncHandler from '../utils/asyncHandler.js';
import interestController from '../controllers/interestController.js';

const router = express.Router();

// All interest routes require authentication
router.use(authenticateToken);

// ============================================
// SEND INTEREST
// ============================================

/**
 * @swagger
 * /interests/{receiverId}:
 *   post:
 *     tags:
 *       - Interests
 *     summary: Send interest to another user
 *     description: |
 *       Send an interest request to another user's profile.
 *       
 *       **Business Rules:**
 *       - ✅ Sender must have ≥60% profile completion
 *       - ✅ Cannot send interest to yourself
 *       - ✅ Cannot send to inactive/blocked users
 *       - ✅ **PENDING**: Returns error if already sent and pending
 *       - ✅ **ACCEPTED**: Returns error (already connected)
 *       - ✅ **REJECTED**: Can re-send only after 30 days cooldown
 *       - ✅ **WITHDRAWN**: Can re-send immediately
 *       - ✅ **Mutual Interest**: Auto-accepts both if configured
 *       
 *       **Blocking System:**
 *       - One-way storage, bidirectional effect
 *       - If A blocks B, neither can send interest
 *       - Silent failure: "Profile not found" (doesn't reveal block)
 *       
 *       **Notifications:**
 *       - Receiver gets INTEREST_RECEIVED notification
 *       - If mutual, both get INTEREST_ACCEPTED notification
 *       
 *       **Audit Logging:**
 *       - All interest sends logged with IP address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to send interest to
 *     responses:
 *       201:
 *         description: Interest sent successfully
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
 *                   example: "Interest sent successfully to John Doe"
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest_id:
 *                       type: integer
 *                       example: 123
 *                     status:
 *                       type: string
 *                       enum: [PENDING, ACCEPTED]
 *                       example: "PENDING"
 *                     receiver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                           example: "John Doe"
 *                         profile_id:
 *                           type: string
 *                           example: "MAT00001234"
 *                     sent_at:
 *                       type: string
 *                       format: date-time
 *                     is_mutual:
 *                       type: boolean
 *                       example: false
 *                       description: True if both users sent interest and it was auto-accepted
 *             examples:
 *               regularInterest:
 *                 summary: Regular interest sent (not mutual)
 *                 value:
 *                   success: true
 *                   message: "Interest sent successfully to Priya Sharma"
 *                   data:
 *                     interest_id: 456
 *                     status: "PENDING"
 *                     receiver:
 *                       id: "123e4567-e89b-12d3-a456-426614174000"
 *                       full_name: "Priya Sharma"
 *                       profile_id: "MAT00005678"
 *                     sent_at: "2026-02-03T10:30:00.000Z"
 *                     is_mutual: false
 *               mutualInterest:
 *                 summary: Mutual interest (auto-accepted)
 *                 value:
 *                   success: true
 *                   message: "Mutual interest! You and Priya Sharma can now message each other."
 *                   data:
 *                     interest_id: 789
 *                     status: "ACCEPTED"
 *                     receiver:
 *                       id: "123e4567-e89b-12d3-a456-426614174000"
 *                       full_name: "Priya Sharma"
 *                       profile_id: "MAT00005678"
 *                     sent_at: "2026-02-03T10:30:00.000Z"
 *                     is_mutual: true
 *       400:
 *         description: Bad request (self-interest, incomplete profile, etc.)
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
 *               selfInterest:
 *                 summary: Self-interest attempt
 *                 value:
 *                   success: false
 *                   message: "Cannot send interest to yourself."
 *               incompleteProfile:
 *                 summary: Incomplete profile
 *                 value:
 *                   success: false
 *                   message: "Profile must be at least 60% complete to send interest. Current: 45%"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Profile not found, inactive, or blocked
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
 *                   example: "Profile not found or unavailable."
 *       409:
 *         description: Conflict (duplicate interest, cooldown period, already connected)
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
 *               alreadyPending:
 *                 summary: Interest already sent and pending
 *                 value:
 *                   success: false
 *                   message: "Interest already sent and pending response."
 *               alreadyAccepted:
 *                 summary: Already connected
 *                 value:
 *                   success: false
 *                   message: "Interest already accepted. You are connected."
 *               cooldownPeriod:
 *                 summary: Rejection cooldown active
 *                 value:
 *                   success: false
 *                   message: "Cannot send interest yet. Please wait 15 more day(s) after rejection."
 */
router.post('/interests/:receiverId', checkFeatureRestriction('INTEREST'), asyncHandler(interestController.sendInterest));

// ============================================
// GET SENT INTERESTS
// ============================================

/**
 * @swagger
 * /interests/sent:
 *   get:
 *     tags:
 *       - Interests
 *     summary: Get sent interests with filters and pagination
 *     description: |
 *       Retrieve list of interests sent by the authenticated user.
 *       
 *       **Features:**
 *       - Filter by status (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
 *       - Pagination support (default 20 per page, max 50)
 *       - Sorting options (sent_at ascending/descending)
 *       - Excludes blocked users from results
 *       
 *       **Response Data Per Interest:**
 *       - Profile ID, full name, age
 *       - Primary photo URL
 *       - Location (city, state)
 *       - Highest education qualification
 *       - Current profession
 *       - Interest status and sent timestamp
 *       
 *       **Use Cases:**
 *       - Track sent interest history
 *       - Monitor pending interests awaiting response
 *       - View accepted connections
 *       - Review rejected/withdrawn interests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, WITHDRAWN]
 *         description: Filter by interest status (optional, returns all if not specified)
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
 *         description: Number of results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [sent_at_desc, sent_at_asc]
 *           default: sent_at_desc
 *         description: Sort order (most recent first by default)
 *     responses:
 *       200:
 *         description: List of sent interests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       interest_id:
 *                         type: integer
 *                         example: 123
 *                       profile_id:
 *                         type: string
 *                         example: "MAT00001234"
 *                       full_name:
 *                         type: string
 *                         example: "Priya Sharma"
 *                       age:
 *                         type: integer
 *                         example: 26
 *                       primary_photo_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/photos/user123.jpg"
 *                       location:
 *                         type: string
 *                         nullable: true
 *                         example: "Mumbai, Maharashtra"
 *                       education:
 *                         type: string
 *                         nullable: true
 *                         example: "Bachelor's Degree"
 *                       profession:
 *                         type: string
 *                         nullable: true
 *                         example: "Software Engineer"
 *                       interest_status:
 *                         type: string
 *                         enum: [PENDING, ACCEPTED, REJECTED, WITHDRAWN]
 *                         example: "PENDING"
 *                       sent_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-03T10:30:00.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total_items:
 *                       type: integer
 *                       example: 45
 *                     total_pages:
 *                       type: integer
 *                       example: 3
 *                     has_next:
 *                       type: boolean
 *                       example: true
 *                     has_prev:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
router.get('/interests/sent', asyncHandler(interestController.getSentInterests));

// ============================================
// GET RECEIVED INTERESTS
// ============================================

/**
 * @swagger
 * /interests/received:
 *   get:
 *     tags:
 *       - Interests
 *     summary: Get received interests (Inbox view)
 *     description: |
 *       Retrieve list of interests received by the authenticated user.
 *       
 *       **Default Behavior (Inbox Mode):**
 *       - Returns only PENDING interests (action required)
 *       - Sorted by most recent first
 *       
 *       **Optional Filtering:**
 *       - Use ?status= to filter by PENDING, ACCEPTED, or REJECTED
 *       
 *       **Features:**
 *       - Match score calculation (0-100) for each sender
 *       - Pagination support (default 20 per page, max 50)
 *       - Excludes blocked users from results
 *       
 *       **Response Data Per Interest:**
 *       - Profile ID, full name, age
 *       - Primary photo URL
 *       - Location (city, state)
 *       - Highest education qualification
 *       - Current profession
 *       - Interest status and received timestamp
 *       - **Match score** (compatibility percentage)
 *       
 *       **Use Cases:**
 *       - View pending interest requests (inbox)
 *       - Review accepted connections
 *       - See rejected interests history
 *       - Prioritize responses by match score
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED]
 *         description: Filter by status (default is PENDING only)
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
 *         description: Number of results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [received_at_desc, received_at_asc]
 *           default: received_at_desc
 *         description: Sort order (most recent first by default)
 *     responses:
 *       200:
 *         description: List of received interests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       interest_id:
 *                         type: integer
 *                         example: 456
 *                       profile_id:
 *                         type: string
 *                         example: "MAT00005678"
 *                       full_name:
 *                         type: string
 *                         example: "Rahul Kumar"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       primary_photo_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/photos/user456.jpg"
 *                       location:
 *                         type: string
 *                         nullable: true
 *                         example: "Bangalore, Karnataka"
 *                       education:
 *                         type: string
 *                         nullable: true
 *                         example: "Master's Degree"
 *                       profession:
 *                         type: string
 *                         nullable: true
 *                         example: "Data Scientist"
 *                       interest_status:
 *                         type: string
 *                         enum: [PENDING, ACCEPTED, REJECTED]
 *                         example: "PENDING"
 *                       received_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-03T12:45:00.000Z"
 *                       match_score:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 100
 *                         example: 78
 *                         description: Compatibility score (0-100)
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total_items:
 *                       type: integer
 *                       example: 12
 *                     total_pages:
 *                       type: integer
 *                       example: 1
 *                     has_next:
 *                       type: boolean
 *                       example: false
 *                     has_prev:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
router.get('/interests/received', asyncHandler(interestController.getReceivedInterests));

// ============================================
// ACCEPT INTEREST
// ============================================

/**
 * @swagger
 * /interests/{interestId}/accept:
 *   put:
 *     tags:
 *       - Interests
 *     summary: Accept an interest request
 *     description: |
 *       Accept a pending interest request from another user.
 *       
 *       **Validation:**
 *       - Interest must belong to the authenticated user (receiver)
 *       - Interest status must be PENDING
 *       
 *       **Actions:**
 *       - Updates status to ACCEPTED
 *       - Sets responded_at timestamp
 *       - Creates INTEREST_ACCEPTED notification for sender
 *       - Enables messaging between both users
 *       - Checks for mutual interest (both users accepted each other)
 *       
 *       **Use Cases:**
 *       - Accept compatible matches
 *       - Start conversation with potential matches
 *       - Build connections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interest to accept
 *     responses:
 *       200:
 *         description: Interest accepted successfully
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
 *                   example: "Interest accepted successfully. You can now message Rahul Kumar."
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest_id:
 *                       type: integer
 *                       example: 456
 *                     status:
 *                       type: string
 *                       example: "ACCEPTED"
 *                     responded_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T14:20:00.000Z"
 *                     sender:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                           example: "Rahul Kumar"
 *                         profile_id:
 *                           type: string
 *                           example: "MAT00005678"
 *                     is_mutual:
 *                       type: boolean
 *                       example: true
 *                       description: True if both users accepted each other
 *       400:
 *         description: Invalid interest ID
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Not authorized to accept this interest
 *       404:
 *         description: Interest not found
 *       409:
 *         description: Interest already accepted or not pending
 */
router.put('/interests/:interestId/accept', asyncHandler(interestController.acceptInterest));

// ============================================
// REJECT INTEREST
// ============================================

/**
 * @swagger
 * /interests/{interestId}/reject:
 *   put:
 *     tags:
 *       - Interests
 *     summary: Reject an interest request
 *     description: |
 *       Reject a pending interest request from another user.
 *       
 *       **Validation:**
 *       - Interest must belong to the authenticated user (receiver)
 *       - Interest status must be PENDING
 *       
 *       **Actions:**
 *       - Updates status to REJECTED
 *       - Sets responded_at timestamp
 *       - Does NOT create notification (silent rejection)
 *       - Enforces 30-day cooldown before sender can re-send
 *       
 *       **Privacy:**
 *       - Rejection is silent (sender not explicitly notified)
 *       - Maintains user privacy and reduces confrontation
 *       
 *       **Use Cases:**
 *       - Decline incompatible matches
 *       - Manage interest inbox
 *       - Maintain control over connections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interest to reject
 *     responses:
 *       200:
 *         description: Interest rejected successfully
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
 *                   example: "Interest rejected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest_id:
 *                       type: integer
 *                       example: 789
 *                     status:
 *                       type: string
 *                       example: "REJECTED"
 *                     responded_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-03T15:10:00.000Z"
 *       400:
 *         description: Invalid interest ID
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Not authorized to reject this interest
 *       404:
 *         description: Interest not found
 *       409:
 *         description: Interest already rejected or not pending
 */
router.put('/interests/:interestId/reject', asyncHandler(interestController.rejectInterest));

// ============================================
// WITHDRAW SENT INTEREST
// ============================================

/**
 * @swagger
 * /interests/{interestId}:
 *   delete:
 *     tags:
 *       - Interests
 *     summary: Withdraw a sent interest
 *     description: |
 *       Withdraw a pending interest that you previously sent.
 *       
 *       **Validation:**
 *       - Interest must be sent by the authenticated user (sender)
 *       - Interest status must be PENDING
 *       
 *       **Actions:**
 *       - Updates status to WITHDRAWN (keeps audit trail)
 *       - Does NOT delete the record (maintains data integrity)
 *       - Does NOT notify receiver (silent withdrawal)
 *       - Allows immediate re-send if desired
 *       
 *       **Use Cases:**
 *       - Change your mind about a sent interest
 *       - Withdraw after finding better match
 *       - Manage sent interests list
 *       
 *       **Note:**
 *       - Cannot withdraw ACCEPTED interests
 *       - Can only withdraw PENDING interests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interest to withdraw
 *     responses:
 *       200:
 *         description: Interest withdrawn successfully
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
 *                   example: "Interest withdrawn successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     interest_id:
 *                       type: integer
 *                       example: 123
 *                     status:
 *                       type: string
 *                       example: "WITHDRAWN"
 *                     receiver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         full_name:
 *                           type: string
 *                           example: "Priya Sharma"
 *                         profile_id:
 *                           type: string
 *                           example: "MAT00001234"
 *       400:
 *         description: Invalid interest ID
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Not authorized to withdraw this interest
 *       404:
 *         description: Interest not found
 *       409:
 *         description: Can only withdraw pending interests
 */
router.delete('/interests/:interestId', asyncHandler(interestController.withdrawInterest));

export default router;
