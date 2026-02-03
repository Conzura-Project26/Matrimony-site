/**
 * Interest Controller
 * Phase 4 - Task 4.1: Send Interest
 * Phase 4 - Task 4.2: Manage Interests
 * 
 * Endpoints:
 * - POST   /interests/:receiverId            - Send interest to a user
 * - GET    /interests/sent                   - Get sent interests
 * - GET    /interests/received               - Get received interests
 * - PUT    /interests/:interestId/accept     - Accept interest
 * - PUT    /interests/:interestId/reject     - Reject interest
 * - DELETE /interests/:interestId            - Withdraw sent interest
 * 
 * @module controllers/interestController
 */

import prisma from '../config/prisma.js';
import interestService from '../services/interestService.js';
import logger from '../config/logger.js';
import { BadRequestError } from '../utils/errors.js';

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
 * Send Interest to Another User
 * POST /interests/:receiverId
 * 
 * @route POST /interests/:receiverId
 * @access Private (Authenticated users only)
 */
export async function sendInterest(req, res) {
  const senderId = req.user.userId;
  const senderName = req.user.fullName;
  const { receiverId } = req.params;

  // Send interest via service
  const result = await interestService.sendInterest(senderId, receiverId, senderName);

  // Log action
  await createAuditLog(senderId, 'INTEREST_SEND', req.ip);

  // Determine response message
  let message;
  if (result.isMutual) {
    message = `Mutual interest! You and ${result.receiver.full_name} can now message each other.`;
  } else {
    message = `Interest sent successfully to ${result.receiver.full_name}`;
  }

  res.status(201).json({
    success: true,
    message,
    data: {
      interest_id: result.interest.id,
      status: result.interest.status,
      receiver: result.receiver,
      sent_at: result.interest.sent_at,
      is_mutual: result.isMutual
    }
  });
}

export default {
  sendInterest,
  getSentInterests,
  getReceivedInterests,
  acceptInterest,
  rejectInterest,
  withdrawInterest
};

/**
 * Get Sent Interests
 * GET /interests/sent
 * 
 * @route GET /interests/sent
 * @access Private (Authenticated users only)
 */
export async function getSentInterests(req, res) {
  const senderId = req.user.userId;
  const { status, page, limit, sort } = req.query;

  const result = await interestService.getSentInterests(senderId, {
    status,
    page,
    limit,
    sort
  });

  // Log action
  await createAuditLog(senderId, 'INTEREST_SENT_LIST_VIEW', req.ip);

  res.status(200).json(result);
}

/**
 * Get Received Interests
 * GET /interests/received
 * 
 * @route GET /interests/received
 * @access Private (Authenticated users only)
 */
export async function getReceivedInterests(req, res) {
  const receiverId = req.user.userId;
  const { status, page, limit, sort } = req.query;

  const result = await interestService.getReceivedInterests(receiverId, {
    status,
    page,
    limit,
    sort
  });

  // Log action
  await createAuditLog(receiverId, 'INTEREST_RECEIVED_LIST_VIEW', req.ip);

  res.status(200).json(result);
}

/**
 * Accept Interest
 * PUT /interests/:interestId/accept
 * 
 * @route PUT /interests/:interestId/accept
 * @access Private (Authenticated users only)
 */
export async function acceptInterest(req, res) {
  const receiverId = req.user.userId;
  const receiverName = req.user.fullName;
  const { interestId } = req.params;

  // Validate interestId
  if (!interestId || isNaN(parseInt(interestId))) {
    throw new BadRequestError('Invalid interest ID');
  }

  const result = await interestService.acceptInterest(interestId, receiverId, receiverName);

  // Log action
  await createAuditLog(receiverId, `INTEREST_ACCEPT:${interestId}`, req.ip);

  res.status(200).json(result);
}

/**
 * Reject Interest
 * PUT /interests/:interestId/reject
 * 
 * @route PUT /interests/:interestId/reject
 * @access Private (Authenticated users only)
 */
export async function rejectInterest(req, res) {
  const receiverId = req.user.userId;
  const { interestId } = req.params;

  // Validate interestId
  if (!interestId || isNaN(parseInt(interestId))) {
    throw new BadRequestError('Invalid interest ID');
  }

  const result = await interestService.rejectInterest(interestId, receiverId);

  // Log action
  await createAuditLog(receiverId, `INTEREST_REJECT:${interestId}`, req.ip);

  res.status(200).json(result);
}

/**
 * Withdraw Sent Interest
 * DELETE /interests/:interestId
 * 
 * @route DELETE /interests/:interestId
 * @access Private (Authenticated users only)
 */
export async function withdrawInterest(req, res) {
  const senderId = req.user.userId;
  const { interestId } = req.params;

  // Validate interestId
  if (!interestId || isNaN(parseInt(interestId))) {
    throw new BadRequestError('Invalid interest ID');
  }

  const result = await interestService.withdrawInterest(interestId, senderId);

  // Log action
  await createAuditLog(senderId, `INTEREST_WITHDRAW:${interestId}`, req.ip);

  res.status(200).json(result);
}
