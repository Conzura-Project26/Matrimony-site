/**
 * User Report Routes
 * Phase 5 - Task 5.5: User Reporting
 * 
 * Enables regular users to report other users for policy violations
 * 
 * Routes:
 * - POST   /reports/:userId - Submit a report against a user
 * - GET    /reports/reasons - Get list of report reasons/categories
 * - GET    /reports/my-reports - View reports made by/against current user
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import reportController from '../controllers/reportController.js';
import { userReportRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ==========================================
// USER REPORT ROUTES (Authenticated Users)
// ==========================================

/**
 * @swagger
 * /reports/reasons:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get report reasons/categories
 *     description: Retrieve list of available report categories with descriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report reasons retrieved successfully
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
 *                   example: 'Report reasons retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'FAKE_PROFILE'
 *                           label:
 *                             type: string
 *                             example: 'Fake Profile'
 *                           description:
 *                             type: string
 *                             example: 'Report profiles with fake information or photos'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get(
  '/reasons',
  authenticateToken,
  asyncHandler(reportController.getReportReasons)
);

/**
 * @swagger
 * /reports/my-reports:
 *   get:
 *     tags:
 *       - Reports
 *     summary: View my reports
 *     description: View reports made by me and reports filed against me
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [made, received, all]
 *           default: all
 *         description: Filter reports by type - made (reports I submitted), received (reports against me), all (both)
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
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, ACTION_TAKEN, RESOLVED, DISMISSED, ESCALATED]
 *         description: Filter by report status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_PHOTO, INAPPROPRIATE_CONTENT, SPAM, SCAM, UNDERAGE, MARRIED, DUPLICATE_PROFILE, OFFENSIVE_BEHAVIOR, OTHER]
 *         description: Filter by report category
 *       - in: query
 *         name: created_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter reports created from this date
 *       - in: query
 *         name: created_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter reports created until this date
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                   example: 'Reports retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     filters:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get(
  '/my-reports',
  authenticateToken,
  asyncHandler(reportController.getMyReports)
);

/**
 * @swagger
 * /reports/{userId}:
 *   post:
 *     tags:
 *       - Reports
 *     summary: Report a user
 *     description: Submit a report against another user for policy violations (Rate limited - 5 reports per 24 hours)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - reason
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_PHOTO, INAPPROPRIATE_CONTENT, SPAM, SCAM, UNDERAGE, MARRIED, DUPLICATE_PROFILE, OFFENSIVE_BEHAVIOR, OTHER]
 *                 description: Category of the report
 *                 example: FAKE_PROFILE
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Detailed reason for the report
 *                 example: 'This profile uses fake photos and information'
 *     responses:
 *       201:
 *         description: Report submitted successfully
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
 *                   example: 'Report submitted successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     report_id:
 *                       type: integer
 *                       example: 123
 *                     status:
 *                       type: string
 *                       example: 'OPEN'
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: '2026-02-05T10:30:00Z'
 *       400:
 *         description: Bad request - Invalid input or self-report attempt
 *       404:
 *         description: User not found
 *       409:
 *         description: Duplicate report - Already reported this user for the same reason
 *       429:
 *         description: Rate limit exceeded - Maximum 5 reports per 24 hours
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post(
  '/:userId',
  authenticateToken,
  userReportRateLimiter,
  asyncHandler(reportController.createUserReport)
);

export default router;
