/**
 * Interest Service
 * Phase 4 - Task 4.1: Send Interest
 * Phase 4 - Task 4.2: Manage Interests
 * 
 * Business Logic:
 * - Check if users are blocked (bidirectional effect)
 * - Validate sender's profile completion (≥60%)
 * - Enforce rejection cooldown (30 days)
 * - Detect and auto-accept mutual interests
 * - Create notifications for interest events
 * - Get sent/received interests with filtering
 * - Accept/reject/withdraw interests
 * 
 * @module services/interestService
 */

import prisma from '../config/prisma.js';
import { InterestStatus, InterestConfig, NotificationType } from '../types/enums.js';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { calculateEnhancedMatchScore, calculateAge } from '../utils/preferenceMatching.js';

/**
 * Check if two users have an active block between them (bidirectional)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if blocked
 */
export async function areUsersBlocked(userId1, userId2) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blocker_id: userId1, blocked_id: userId2, unblocked_at: null },
        { blocker_id: userId2, blocked_id: userId1, unblocked_at: null }
      ]
    }
  });

  return !!block;
}

/**
 * Get existing interest between sender and receiver
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @returns {Promise<object|null>} Existing interest or null
 */
export async function getExistingInterest(senderId, receiverId) {
  return await prisma.interest.findUnique({
    where: {
      sender_id_receiver_id: {
        sender_id: senderId,
        receiver_id: receiverId
      }
    }
  });
}

/**
 * Check if sender can send interest based on rejection cooldown
 * @param {object} existingInterest - Previous interest record
 * @throws {ConflictError} If cooldown period hasn't passed
 */
export function validateRejectionCooldown(existingInterest) {
  if (existingInterest.status === InterestStatus.REJECTED) {
    const daysSinceRejection = Math.floor(
      (Date.now() - existingInterest.responded_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRejection < InterestConfig.REJECTION_COOLDOWN_DAYS) {
      const remainingDays = InterestConfig.REJECTION_COOLDOWN_DAYS - daysSinceRejection;
      throw new ConflictError(
        `Cannot send interest yet. Please wait ${remainingDays} more day(s) after rejection.`
      );
    }
  }
}

/**
 * Validate if sender meets requirements to send interest
 * @param {object} sender - Sender user object
 * @throws {BadRequestError} If sender doesn't meet requirements
 */
export function validateSenderRequirements(sender) {
  // Check if sender is active
  if (!sender.is_active) {
    throw new BadRequestError('Your account is inactive. Cannot send interest.');
  }

  // Check profile completion
  const completion = sender.profile_completion_percentage || 0;
  if (completion < InterestConfig.MIN_PROFILE_COMPLETION_TO_SEND) {
    throw new BadRequestError(
      `Profile must be at least ${InterestConfig.MIN_PROFILE_COMPLETION_TO_SEND}% complete to send interest. Current: ${completion}%`
    );
  }
}

/**
 * Validate receiver is eligible to receive interest
 * @param {object} receiver - Receiver user object
 * @param {string} senderId - Sender user ID
 * @throws {BadRequestError|NotFoundError} If receiver is invalid
 */
export async function validateReceiver(receiver, senderId) {
  if (!receiver) {
    throw new NotFoundError('Profile not found or unavailable.');
  }

  if (receiver.id === senderId) {
    throw new BadRequestError('Cannot send interest to yourself.');
  }

  if (!receiver.is_active) {
    throw new NotFoundError('Profile not found or unavailable.');
  }

  // Check blocking (bidirectional)
  const isBlocked = await areUsersBlocked(senderId, receiver.id);
  if (isBlocked) {
    throw new NotFoundError('Profile not found or unavailable.');
  }
}

/**
 * Check for mutual interest and auto-accept if configured
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @returns {Promise<object|null>} Reverse interest if exists
 */
export async function checkMutualInterest(senderId, receiverId) {
  return await prisma.interest.findUnique({
    where: {
      sender_id_receiver_id: {
        sender_id: receiverId,
        receiver_id: senderId
      }
    }
  });
}

/**
 * Create a notification for interest event
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} relatedUserId - ID of user who triggered the notification
 * @param {number} relatedId - ID of related interest
 */
export async function createNotification(userId, type, title, message, relatedUserId, relatedId) {
  try {
    await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        related_user_id: relatedUserId,
        related_id: relatedId
      }
    });
  } catch (error) {
    // Log error but don't fail the request if notification creation fails
    console.error('Failed to create notification:', error);
  }
}

/**
 * Send interest from sender to receiver
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} senderName - Sender's full name
 * @returns {Promise<object>} Created/updated interest with metadata
 */
export async function sendInterest(senderId, receiverId, senderName) {
  // Fetch sender and receiver
  const [sender, receiver] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        full_name: true,
        is_active: true,
        profile_completion_percentage: true,
        profile_id: true
      }
    }),
    prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        full_name: true,
        is_active: true,
        profile_id: true
      }
    })
  ]);

  // Validate sender requirements
  validateSenderRequirements(sender);

  // Validate receiver
  await validateReceiver(receiver, senderId);

  // Check for existing interest
  const existingInterest = await getExistingInterest(senderId, receiverId);

  if (existingInterest) {
    // Handle different statuses
    switch (existingInterest.status) {
      case InterestStatus.PENDING:
        throw new ConflictError('Interest already sent and pending response.');

      case InterestStatus.ACCEPTED:
        throw new ConflictError('Interest already accepted. You are connected.');

      case InterestStatus.REJECTED:
        // Check cooldown period
        validateRejectionCooldown(existingInterest);
        break;

      case InterestStatus.WITHDRAWN:
        // Allow immediate re-send
        break;

      default:
        throw new ConflictError('Cannot send interest at this time.');
    }
  }

  // Check for mutual interest (receiver already sent to sender)
  const reverseInterest = await checkMutualInterest(senderId, receiverId);
  const isMutual = reverseInterest && reverseInterest.status === InterestStatus.PENDING;

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    let interest;

    if (existingInterest) {
      // Update existing interest (after cooldown or withdrawn)
      interest = await tx.interest.update({
        where: { id: existingInterest.id },
        data: {
          status: isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL 
            ? InterestStatus.ACCEPTED 
            : InterestStatus.PENDING,
          sent_at: new Date(),
          updated_at: new Date(),
          responded_at: isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL ? new Date() : null
        }
      });
    } else {
      // Create new interest
      interest = await tx.interest.create({
        data: {
          sender_id: senderId,
          receiver_id: receiverId,
          status: isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL 
            ? InterestStatus.ACCEPTED 
            : InterestStatus.PENDING,
          responded_at: isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL ? new Date() : null
        }
      });
    }

    // If mutual and auto-accepted, update reverse interest too
    if (isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL && reverseInterest) {
      await tx.interest.update({
        where: { id: reverseInterest.id },
        data: {
          status: InterestStatus.ACCEPTED,
          responded_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    return { interest, isMutual, reverseInterest };
  });

  // Create notifications (outside transaction)
  if (result.isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL) {
    // Both users accepted each other
    await Promise.all([
      createNotification(
        receiverId,
        NotificationType.INTEREST_ACCEPTED,
        'Interest Accepted! 🎉',
        `${sender.full_name} accepted your interest. You can now message each other!`,
        senderId,
        result.interest.id
      ),
      createNotification(
        senderId,
        NotificationType.INTEREST_ACCEPTED,
        'Interest Accepted! 🎉',
        `${receiver.full_name} accepted your interest. You can now message each other!`,
        receiverId,
        result.reverseInterest.id
      )
    ]);
  } else {
    // Regular interest sent
    await createNotification(
      receiverId,
      NotificationType.INTEREST_RECEIVED,
      'New Interest Received! 💕',
      `${sender.full_name} (${sender.profile_id}) sent you an interest.`,
      senderId,
      result.interest.id
    );
  }

  return {
    interest: result.interest,
    isMutual: result.isMutual && InterestConfig.AUTO_ACCEPT_MUTUAL,
    receiver: {
      id: receiver.id,
      full_name: receiver.full_name,
      profile_id: receiver.profile_id
    }
  };
}

export default {
  sendInterest,
  areUsersBlocked,
  getExistingInterest,
  checkMutualInterest,
  createNotification,
  getSentInterests,
  getReceivedInterests,
  acceptInterest,
  rejectInterest,
  withdrawInterest
};

/**
 * Get sent interests with status filter and pagination
 * Phase 4 - Task 4.2
 * 
 * @param {string} senderId - User ID who sent interests
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated sent interests with profile data
 */
export async function getSentInterests(senderId, options = {}) {
  const {
    status = null,
    page = 1,
    limit = 20,
    sort = 'sent_at_desc'
  } = options;

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {
    sender_id: senderId
  };

  if (status && Object.values(InterestStatus).includes(status)) {
    where.status = status;
  }

  // Determine sort order
  const orderBy = sort === 'sent_at_asc' 
    ? { sent_at: 'asc' }
    : { sent_at: 'desc' };

  // Get interests with receiver profile data
  const [interests, totalCount] = await Promise.all([
    prisma.interest.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        receiver: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            date_of_birth: true,
            personal_details: {
              select: {
                city: true,
                state: true
              }
            },
            education_details: {
              select: {
                qualification: true
              },
              orderBy: {
                year_of_passing: 'desc'
              },
              take: 1
            },
            professional_details: {
              select: {
                occupation: true
              }
            },
            photos: {
              where: {
                is_primary: true,
                is_approved: true
              },
              select: {
                photo_url: true
              },
              take: 1
            }
          }
        }
      }
    }),
    prisma.interest.count({ where })
  ]);

  // Check for blocked users
  const blockedUserIds = new Set();
  for (const interest of interests) {
    const isBlocked = await areUsersBlocked(senderId, interest.receiver_id);
    if (isBlocked) {
      blockedUserIds.add(interest.receiver_id);
    }
  }

  // Format response
  const formattedInterests = interests
    .filter(interest => !blockedUserIds.has(interest.receiver_id))
    .map(interest => {
      const age = calculateAge(interest.receiver.date_of_birth);
      const location = interest.receiver.personal_details
        ? `${interest.receiver.personal_details.city || ''}, ${interest.receiver.personal_details.state || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
        : null;
      const education = interest.receiver.education_details?.[0]?.qualification || null;
      const profession = interest.receiver.professional_details?.occupation || null;
      const primaryPhoto = interest.receiver.photos?.[0]?.photo_url || null;

      return {
        interest_id: interest.id,
        profile_id: interest.receiver.profile_id,
        full_name: interest.receiver.full_name,
        age,
        primary_photo_url: primaryPhoto,
        location,
        education,
        profession,
        interest_status: interest.status,
        sent_at: interest.sent_at
      };
    });

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    success: true,
    data: formattedInterests,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_items: totalCount,
      total_pages: totalPages,
      has_next: pageNum < totalPages,
      has_prev: pageNum > 1
    }
  };
}

/**
 * Get received interests with status filter and pagination
 * Phase 4 - Task 4.2
 * 
 * Default: Returns only PENDING (inbox behavior)
 * Optional: Filter by status
 * Includes match score calculation
 * 
 * @param {string} receiverId - User ID who received interests
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated received interests with profile data and match scores
 */
export async function getReceivedInterests(receiverId, options = {}) {
  const {
    status = InterestStatus.PENDING, // Default to PENDING only
    page = 1,
    limit = 20,
    sort = 'received_at_desc'
  } = options;

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {
    receiver_id: receiverId
  };

  if (status && Object.values(InterestStatus).includes(status)) {
    where.status = status;
  }

  // Determine sort order (use sent_at as "received_at")
  const orderBy = sort === 'received_at_asc' 
    ? { sent_at: 'asc' }
    : { sent_at: 'desc' };

  // Get receiver's preferences for match score calculation
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    include: {
      partner_preferences: true,
      caste_details: true
    }
  });

  // Get interests with sender profile data
  const [interests, totalCount] = await Promise.all([
    prisma.interest.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            profile_id: true,
            date_of_birth: true,
            gender: true,
            personal_details: {
              select: {
                height_cm: true,
                weight_kg: true,
                city: true,
                state: true,
                marital_status: true,
                mother_tongue: true,
                diet_preference: true,
                drinking_habit: true,
                smoking_habit: true,
                physical_status: true
              }
            },
            caste_details: {
              select: {
                religion_id: true,
                caste_id: true,
                sub_caste_id: true
              }
            },
            education_details: {
              select: {
                qualification: true
              },
              orderBy: {
                year_of_passing: 'desc'
              },
              take: 1
            },
            professional_details: {
              select: {
                occupation: true,
                employment_type: true,
                annual_income_range: true,
                work_city: true,
                work_state: true
              }
            },
            photos: {
              where: {
                is_primary: true,
                is_approved: true
              },
              select: {
                photo_url: true
              },
              take: 1
            }
          }
        }
      }
    }),
    prisma.interest.count({ where })
  ]);

  // Check for blocked users
  const blockedUserIds = new Set();
  for (const interest of interests) {
    const isBlocked = await areUsersBlocked(receiverId, interest.sender_id);
    if (isBlocked) {
      blockedUserIds.add(interest.sender_id);
    }
  }

  // Format response with match scores
  const formattedInterests = interests
    .filter(interest => !blockedUserIds.has(interest.sender_id))
    .map(interest => {
      const sender = interest.sender;
      const age = calculateAge(sender.date_of_birth);
      const location = sender.personal_details
        ? `${sender.personal_details.city || ''}, ${sender.personal_details.state || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
        : null;
      const education = sender.education_details?.[0]?.qualification || null;
      const profession = sender.professional_details?.occupation || null;
      const primaryPhoto = sender.photos?.[0]?.photo_url || null;

      // Calculate match score
      let matchScore = 0;
      if (receiver.partner_preferences) {
        try {
          const result = calculateEnhancedMatchScore(sender, receiver.partner_preferences);
          // Extract matchPercentage from the result object
          if (result && typeof result === 'object' && typeof result.matchPercentage === 'number') {
            matchScore = result.matchPercentage;
          } else if (typeof result === 'number') {
            matchScore = Math.round(result);
          }
        } catch (error) {
          // If match score calculation fails, default to 0
          matchScore = 0;
        }
      }

      return {
        interest_id: interest.id,
        profile_id: sender.profile_id,
        full_name: sender.full_name,
        age,
        primary_photo_url: primaryPhoto,
        location,
        education,
        profession,
        interest_status: interest.status,
        received_at: interest.sent_at,
        match_score: matchScore
      };
    });

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    success: true,
    data: formattedInterests,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_items: totalCount,
      total_pages: totalPages,
      has_next: pageNum < totalPages,
      has_prev: pageNum > 1
    }
  };
}

/**
 * Accept an interest request
 * Phase 4 - Task 4.2
 * 
 * Validates:
 * - Interest belongs to the authenticated user (receiver)
 * - Interest status is PENDING
 * 
 * Updates:
 * - Status to ACCEPTED
 * - Sets responded_at timestamp
 * - Creates notification for sender
 * 
 * @param {string} interestId - Interest ID to accept
 * @param {string} receiverId - User ID accepting the interest
 * @param {string} receiverName - Receiver's full name for notification
 * @returns {Promise<Object>} Updated interest data
 */
export async function acceptInterest(interestId, receiverId, receiverName) {
  // Fetch interest with sender data
  const interest = await prisma.interest.findUnique({
    where: { id: parseInt(interestId) },
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

  // Validate interest exists
  if (!interest) {
    throw new NotFoundError('Interest not found');
  }

  // Validate ownership (must be the receiver)
  if (interest.receiver_id !== receiverId) {
    throw new ForbiddenError('You are not authorized to accept this interest');
  }

  // Validate status
  if (interest.status === InterestStatus.ACCEPTED) {
    throw new ConflictError('Interest already accepted');
  }

  if (interest.status !== InterestStatus.PENDING) {
    throw new ConflictError('Can only accept pending interests');
  }

  // Update interest status
  const updatedInterest = await prisma.interest.update({
    where: { id: parseInt(interestId) },
    data: {
      status: InterestStatus.ACCEPTED,
      responded_at: new Date(),
      updated_at: new Date()
    }
  });

  // Create notification for sender
  await createNotification(
    interest.sender_id,
    NotificationType.INTEREST_ACCEPTED,
    'Interest Accepted! 🎉',
    `${receiverName} (${interest.receiver.profile_id}) accepted your interest. You can now message each other!`,
    receiverId,
    interest.id
  );

  // Check if mutual interest exists
  const reverseInterest = await prisma.interest.findUnique({
    where: {
      sender_id_receiver_id: {
        sender_id: receiverId,
        receiver_id: interest.sender_id
      }
    }
  });

  const isMutual = !!(reverseInterest && reverseInterest.status === InterestStatus.ACCEPTED);

  // MATCH_FOUND notification - Notify both users when mutual acceptance happens
  if (isMutual) {
    // Notify the sender (A) that they matched with receiver (B)
    await createNotification(
      interest.sender_id,
      NotificationType.MATCH_FOUND,
      'It\'s a Match! 💕',
      `You and ${receiverName} (${interest.receiver.profile_id}) have mutually accepted each other's interests!`,
      receiverId,
      interest.id
    );

    // Notify the receiver (B) that they matched with sender (A)
    await createNotification(
      receiverId,
      NotificationType.MATCH_FOUND,
      'It\'s a Match! 💕',
      `You and ${interest.sender.full_name} (${interest.sender.profile_id}) have mutually accepted each other's interests!`,
      interest.sender_id,
      interest.id
    );
  }

  return {
    success: true,
    message: `Interest accepted successfully. You can now message ${interest.sender.full_name}.`,
    data: {
      interest_id: updatedInterest.id,
      status: updatedInterest.status,
      responded_at: updatedInterest.responded_at,
      sender: {
        id: interest.sender.id,
        full_name: interest.sender.full_name,
        profile_id: interest.sender.profile_id
      },
      is_mutual: isMutual
    }
  };
}

/**
 * Reject an interest request
 * Phase 4 - Task 4.2
 * 
 * Validates:
 * - Interest belongs to the authenticated user (receiver)
 * - Interest status is PENDING
 * 
 * Updates:
 * - Status to REJECTED
 * - Sets responded_at timestamp
 * - Does NOT create notification (silent rejection)
 * - Enforces 30-day cooldown before sender can re-send
 * 
 * @param {string} interestId - Interest ID to reject
 * @param {string} receiverId - User ID rejecting the interest
 * @returns {Promise<Object>} Updated interest data
 */
export async function rejectInterest(interestId, receiverId) {
  // Fetch interest
  const interest = await prisma.interest.findUnique({
    where: { id: parseInt(interestId) },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          profile_id: true
        }
      }
    }
  });

  // Validate interest exists
  if (!interest) {
    throw new NotFoundError('Interest not found');
  }

  // Validate ownership (must be the receiver)
  if (interest.receiver_id !== receiverId) {
    throw new ForbiddenError('You are not authorized to reject this interest');
  }

  // Validate status
  if (interest.status === InterestStatus.REJECTED) {
    throw new ConflictError('Interest already rejected');
  }

  if (interest.status !== InterestStatus.PENDING) {
    throw new ConflictError('Can only reject pending interests');
  }

  // Update interest status
  const updatedInterest = await prisma.interest.update({
    where: { id: parseInt(interestId) },
    data: {
      status: InterestStatus.REJECTED,
      responded_at: new Date(),
      updated_at: new Date()
    }
  });

  return {
    success: true,
    message: 'Interest rejected successfully',
    data: {
      interest_id: updatedInterest.id,
      status: updatedInterest.status,
      responded_at: updatedInterest.responded_at
    }
  };
}

/**
 * Withdraw a sent interest
 * Phase 4 - Task 4.2
 * 
 * Validates:
 * - Interest was sent by the authenticated user (sender)
 * - Interest status is PENDING (can only withdraw pending)
 * 
 * Updates:
 * - Status to WITHDRAWN (keeps audit trail)
 * - Sets updated_at timestamp
 * - Does NOT notify receiver
 * 
 * @param {string} interestId - Interest ID to withdraw
 * @param {string} senderId - User ID withdrawing the interest
 * @returns {Promise<Object>} Result of withdrawal
 */
export async function withdrawInterest(interestId, senderId) {
  // Fetch interest
  const interest = await prisma.interest.findUnique({
    where: { id: parseInt(interestId) },
    include: {
      receiver: {
        select: {
          id: true,
          full_name: true,
          profile_id: true
        }
      }
    }
  });

  // Validate interest exists
  if (!interest) {
    throw new NotFoundError('Interest not found');
  }

  // Validate ownership (must be the sender)
  if (interest.sender_id !== senderId) {
    throw new ForbiddenError('You are not authorized to withdraw this interest');
  }

  // Validate status (can only withdraw PENDING)
  if (interest.status !== InterestStatus.PENDING) {
    throw new ConflictError('Can only withdraw pending interests');
  }

  // Update interest status to WITHDRAWN
  const updatedInterest = await prisma.interest.update({
    where: { id: parseInt(interestId) },
    data: {
      status: InterestStatus.WITHDRAWN,
      updated_at: new Date()
    }
  });

  return {
    success: true,
    message: 'Interest withdrawn successfully',
    data: {
      interest_id: updatedInterest.id,
      status: updatedInterest.status,
      receiver: {
        id: interest.receiver.id,
        full_name: interest.receiver.full_name,
        profile_id: interest.receiver.profile_id
      }
    }
  };
}
