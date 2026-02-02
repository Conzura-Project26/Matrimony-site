/**
 * Matchmaking Service
 * Phase 3 - Task 3.4: Matchmaking Algorithm
 * 
 * Features:
 * - Partner preference-based match generation
 * - Bidirectional scoring (mutual compatibility)
 * - Multiple match types: DAILY_MATCH, RECOMMENDATION, NEW_MATCH
 * - Intelligent filtering (excludes interests, rejections)
 * - Match history tracking with cooldown
 * - Profile completion requirements
 * - Smart defaults for users without preferences
 * - Progressive criteria relaxation
 * 
 * @module services/matchmakingService
 */

import prisma from '../config/prisma.js';
import { calculateEnhancedMatchScore, calculateAge } from '../utils/preferenceMatching.js';
import { 
  MatchType, 
  MatchScoreThreshold, 
  MatchConfig,
  ProfileCompletionRequirement,
  InterestStatus 
} from '../types/enums.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Get opposite gender for matching
 * @param {string} gender - User's gender
 * @returns {string} Opposite gender
 */
const getOppositeGender = (gender) => {
  if (gender === 'Male') return 'Female';
  if (gender === 'Female') return 'Male';
  return null; // For 'Other', we'll handle differently
};

/**
 * Generate smart default preferences when user hasn't set any
 * @param {Object} user - User object with profile data
 * @returns {Object} Default partner preferences
 */
const generateSmartDefaults = (user) => {
  const userAge = calculateAge(user.date_of_birth);
  
  return {
    min_age: Math.max(18, userAge - 5),
    max_age: Math.min(100, userAge + 5),
    religion_preference: user.caste_details?.religion_id ? [user.caste_details.religion_id] : [],
    caste_preference: [],
    education_preference: [],
    employment_type_preference: [],
    marital_status_preference: [],
    mother_tongue_preference: [],
    diet_preference: [],
    drinking_habit_preference: [],
    smoking_habit_preference: [],
    physical_status: [],
    preferred_location: {},
    min_height: null,
    max_height: null,
    min_weight: null,
    max_weight: null,
    income_preference_min: null,
    income_preference_max: null
  };
};

/**
 * Build WHERE clause for match candidate filtering
 * Excludes: self, inactive, unverified, wrong gender, existing interests, rejections
 * 
 * @param {string} userId - Current user ID
 * @param {Object} user - User's complete profile
 * @param {Object} preferences - Partner preferences (or smart defaults)
 * @param {number} minScore - Minimum match score threshold
 * @param {number} minProfileCompletion - Minimum profile completion %
 * @returns {Promise<Object>} Prisma where clause
 */
const buildMatchCandidatesFilter = async (userId, user, preferences, minScore = 0, minProfileCompletion = 70) => {
  // Get list of users to exclude (interests sent/received, rejections)
  const existingInterests = await prisma.interest.findMany({
    where: {
      OR: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    },
    select: {
      sender_id: true,
      receiver_id: true,
      status: true
    }
  });

  // Extract user IDs from interests
  const excludedUserIds = new Set();
  existingInterests.forEach(interest => {
    if (interest.sender_id !== userId) excludedUserIds.add(interest.sender_id);
    if (interest.receiver_id !== userId) excludedUserIds.add(interest.receiver_id);
  });

  const where = {
    // Exclude self
    id: { 
      notIn: [userId, ...Array.from(excludedUserIds)]
    },
    
    // Only active and verified profiles
    is_active: true,
    is_profile_verified: true,
    
    // Opposite gender (if applicable)
    gender: getOppositeGender(user.gender) || user.gender,
    
    // Minimum profile completion
    profile_completion_percentage: {
      gte: minProfileCompletion
    }
  };

  // Age filter (from preferences)
  if (preferences.min_age || preferences.max_age) {
    const today = new Date();
    
    if (preferences.max_age) {
      const minDob = new Date(today.getFullYear() - preferences.max_age, today.getMonth(), today.getDate());
      where.date_of_birth = { ...(where.date_of_birth || {}), gte: minDob };
    }
    
    if (preferences.min_age) {
      const maxDob = new Date(today.getFullYear() - preferences.min_age, today.getMonth(), today.getDate());
      where.date_of_birth = { ...(where.date_of_birth || {}), lte: maxDob };
    }
  }

  return where;
};

/**
 * Get candidate profiles for matching with all required relations
 * @param {Object} where - Prisma where clause
 * @param {number} limit - Maximum number of candidates to fetch
 * @returns {Promise<Array>} Array of user profiles
 */
const fetchMatchCandidates = async (where, limit = 100) => {
  return await prisma.user.findMany({
    where,
    take: limit,
    include: {
      personal_details: true,
      caste_details: {
        include: {
          religion: true,
          caste: true
        }
      },
      education_details: {
        orderBy: { year_of_passing: 'desc' },
        take: 1
      },
      professional_details: true,
      photos: {
        where: {
          is_primary: true,
          is_approved: true
        },
        take: 1
      }
    },
    orderBy: {
      created_at: 'desc'  // Prefer newer profiles
    }
  });
};

/**
 * Calculate bidirectional match score
 * Scores how well A matches B AND how well B matches A, then averages
 * 
 * @param {Object} userA - First user's profile
 * @param {Object} preferencesA - First user's preferences
 * @param {Object} userB - Second user's profile
 * @param {Object} preferencesB - Second user's preferences
 * @returns {Object} Bidirectional match result
 */
const calculateBidirectionalScore = (userA, preferencesA, userB, preferencesB) => {
  // Score A → B (how well B matches A's preferences)
  const scoreAtoB = calculateEnhancedMatchScore(userB, preferencesA);
  
  // Score B → A (how well A matches B's preferences)
  const scoreBtoA = calculateEnhancedMatchScore(userA, preferencesB);
  
  // If either hard filter fails, no match
  if (!scoreAtoB.match || !scoreBtoA.match) {
    return {
      match: false,
      bidirectionalScore: 0,
      scoreAtoB: scoreAtoB.matchPercentage,
      scoreBtoA: scoreBtoA.matchPercentage,
      failReason: scoreAtoB.failReason || scoreBtoA.failReason
    };
  }
  
  // Average the two scores for mutual compatibility
  const bidirectionalScore = Math.round((scoreAtoB.matchPercentage + scoreBtoA.matchPercentage) / 2);
  
  return {
    match: true,
    bidirectionalScore,
    scoreAtoB: scoreAtoB.matchPercentage,
    scoreBtoA: scoreBtoA.matchPercentage,
    detailsAtoB: scoreAtoB,
    detailsBtoA: scoreBtoA
  };
};

/**
 * Check if a profile was recently shown to user (cooldown period)
 * @param {string} userId - User ID
 * @param {string} candidateId - Candidate user ID
 * @param {string} matchType - Match type
 * @param {number} cooldownDays - Cooldown period in days
 * @returns {Promise<boolean>} True if in cooldown period
 */
const isInCooldown = async (userId, candidateId, matchType, cooldownDays = MatchConfig.MATCH_RESHOWN_COOLDOWN_DAYS) => {
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);
  
  const recentMatch = await prisma.match.findFirst({
    where: {
      user_id: userId,
      matched_user_id: candidateId,
      match_type: matchType,
      generated_at: {
        gte: cooldownDate
      }
    }
  });
  
  return !!recentMatch;
};

/**
 * Generate matches for a user
 * Core matchmaking algorithm with filtering, scoring, and ranking
 * 
 * @param {string} userId - User ID
 * @param {MatchType} matchType - Type of match to generate
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} Array of match objects
 */
export const generateMatches = async (userId, matchType, options = {}) => {
  const {
    limit = MatchConfig.DEFAULT_RECOMMENDATIONS_PER_PAGE,
    skipCooldown = false,
    useBidirectional = true
  } = options;
  
  // Get current user's complete profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      personal_details: true,
      caste_details: {
        include: {
          religion: true,
          caste: true
        }
      },
      education_details: {
        orderBy: { year_of_passing: 'desc' },
        take: 1
      },
      professional_details: true,
      partner_preferences: true
    }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Check user's profile completion
  if (user.profile_completion_percentage < ProfileCompletionRequirement.TO_VIEW_MATCHES) {
    throw new BadRequestError(
      `Profile completion must be at least ${ProfileCompletionRequirement.TO_VIEW_MATCHES}% to view matches. Current: ${user.profile_completion_percentage}%`
    );
  }
  
  // Get partner preferences or use smart defaults
  let preferences = user.partner_preferences;
  let usingDefaults = false;
  
  if (!preferences) {
    preferences = generateSmartDefaults(user);
    usingDefaults = true;
    logger.info('Using smart default preferences for matchmaking', { userId });
  }
  
  // Get minimum score threshold for this match type
  const minScore = MatchScoreThreshold[matchType] || 40;
  
  // Build filter for match candidates
  const where = await buildMatchCandidatesFilter(
    userId, 
    user, 
    preferences, 
    minScore,
    ProfileCompletionRequirement.TO_APPEAR_IN_MATCHES
  );
  
  // Fetch potential candidates (fetch more than needed for filtering)
  const candidates = await fetchMatchCandidates(where, limit * 3);
  
  if (candidates.length === 0) {
    logger.info('No candidates found for user', { userId, matchType });
    return [];
  }
  
  // Score each candidate
  const scoredMatches = [];
  
  for (const candidate of candidates) {
    // Check cooldown (skip if recently shown)
    if (!skipCooldown) {
      const inCooldown = await isInCooldown(userId, candidate.id, matchType);
      if (inCooldown) {
        continue;
      }
    }
    
    let matchScore;
    let scoreDetails;
    
    if (useBidirectional && candidate.partner_preferences) {
      // Use bidirectional scoring if both have preferences
      scoreDetails = calculateBidirectionalScore(
        user,
        preferences,
        candidate,
        candidate.partner_preferences
      );
      
      if (!scoreDetails.match) {
        continue;  // Skip if hard filter fails
      }
      
      matchScore = scoreDetails.bidirectionalScore;
    } else {
      // Use unidirectional scoring
      const result = calculateEnhancedMatchScore(candidate, preferences);
      
      if (!result.match) {
        continue;  // Skip if hard filter fails
      }
      
      matchScore = result.matchPercentage;
      scoreDetails = result;
    }
    
    // Filter by minimum score threshold
    if (matchScore < minScore) {
      continue;
    }
    
    scoredMatches.push({
      candidate,
      matchScore,
      scoreDetails
    });
  }
  
  // Sort by match score (descending) with slight randomization for variety
  scoredMatches.sort((a, b) => {
    const scoreDiff = b.matchScore - a.matchScore;
    
    // If scores are within 5%, add slight randomness
    if (Math.abs(scoreDiff) <= 5) {
      return Math.random() - 0.5;
    }
    
    return scoreDiff;
  });
  
  // Take top matches
  const topMatches = scoredMatches.slice(0, limit);
  
  // Store matches in database
  const storedMatches = await storeMatches(userId, topMatches, matchType);
  
  logger.info('Matches generated successfully', {
    userId,
    matchType,
    candidatesScored: candidates.length,
    matchesGenerated: storedMatches.length,
    usingDefaults
  });
  
  return storedMatches;
};

/**
 * Store generated matches in database
 * @param {string} userId - User ID
 * @param {Array} matches - Array of scored matches
 * @param {MatchType} matchType - Type of match
 * @returns {Promise<Array>} Stored match records
 */
const storeMatches = async (userId, matches, matchType) => {
  const matchRecords = [];
  
  // Calculate expiry time (for daily matches)
  let expiresAt = null;
  if (matchType === MatchType.DAILY_MATCH) {
    expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Expire at end of day
  }
  
  for (const match of matches) {
    try {
      const matchRecord = await prisma.match.upsert({
        where: {
          user_id_matched_user_id_match_type: {
            user_id: userId,
            matched_user_id: match.candidate.id,
            match_type: matchType
          }
        },
        update: {
          match_score: match.matchScore,
          generated_at: new Date(),
          expires_at: expiresAt
        },
        create: {
          user_id: userId,
          matched_user_id: match.candidate.id,
          match_score: match.matchScore,
          match_type: matchType,
          expires_at: expiresAt
        },
        include: {
          matched_user: {
            include: {
              personal_details: true,
              caste_details: {
                include: {
                  religion: true,
                  caste: true
                }
              },
              professional_details: true,
              photos: {
                where: {
                  is_primary: true,
                  is_approved: true
                },
                take: 1
              }
            }
          }
        }
      });
      
      matchRecords.push(matchRecord);
    } catch (error) {
      logger.error('Error storing match', { error: error.message, userId, candidateId: match.candidate.id });
    }
  }
  
  return matchRecords;
};

/**
 * Get recommended profiles for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise<Object>} Paginated recommendations
 */
export const getRecommendedProfiles = async (userId, options = {}) => {
  const {
    page = 1,
    limit = MatchConfig.DEFAULT_RECOMMENDATIONS_PER_PAGE,
    minScore = MatchScoreThreshold.RECOMMENDATION,
    regenerate = false
  } = options;
  
  // Check if we need to generate new matches
  if (regenerate) {
    await generateMatches(userId, MatchType.RECOMMENDATION, { limit: limit * 2 });
  }
  
  // Fetch existing recommendations from database
  const matches = await prisma.match.findMany({
    where: {
      user_id: userId,
      match_type: MatchType.RECOMMENDATION,
      match_score: {
        gte: minScore
      }
    },
    include: {
      matched_user: {
        include: {
          personal_details: true,
          caste_details: {
            include: {
              religion: true,
              caste: true
            }
          },
          professional_details: true,
          photos: {
            where: {
              is_primary: true,
              is_approved: true
            },
            take: 1
          }
        }
      },
      interactions: true
    },
    orderBy: [
      { match_score: 'desc' },
      { generated_at: 'desc' }
    ],
    skip: (page - 1) * limit,
    take: limit
  });
  
  // If no matches found, generate them
  if (matches.length === 0) {
    const newMatches = await generateMatches(userId, MatchType.RECOMMENDATION, { limit: limit * 2 });
    
    // For extreme pagination (page > available data), return empty
    if (page > 1 && newMatches.length === 0) {
      return {
        matches: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      };
    }
    
    return {
      matches: newMatches.slice(0, limit),
      pagination: {
        page: 1,
        limit,
        total: newMatches.length,
        hasMore: newMatches.length > limit
      }
    };
  }
  
  // Get total count
  const totalCount = await prisma.match.count({
    where: {
      user_id: userId,
      match_type: MatchType.RECOMMENDATION,
      match_score: {
        gte: minScore
      }
    }
  });
  
  return {
    matches,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: page * limit < totalCount
    }
  };
};

/**
 * Get daily matches for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Daily match profiles
 */
export const getDailyMatches = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check for existing daily matches generated today
  let matches = await prisma.match.findMany({
    where: {
      user_id: userId,
      match_type: MatchType.DAILY_MATCH,
      generated_at: {
        gte: today
      },
      OR: [
        { expires_at: null },
        { expires_at: { gte: new Date() } }
      ]
    },
    include: {
      matched_user: {
        include: {
          personal_details: true,
          caste_details: {
            include: {
              religion: true,
              caste: true
            }
          },
          professional_details: true,
          photos: {
            where: {
              is_primary: true,
              is_approved: true
            },
            take: 1
          }
        }
      },
      interactions: true
    },
    orderBy: {
      match_score: 'desc'
    }
  });
  
  // If no matches for today, generate new ones
  if (matches.length === 0) {
    matches = await generateMatches(userId, MatchType.DAILY_MATCH, { 
      limit: MatchConfig.DAILY_MATCHES_COUNT 
    });
  }
  
  return matches;
};

/**
 * Get new matches for a user (profiles not previously shown)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} New matches with pagination
 */
export const getNewMatches = async (userId, options = {}) => {
  const {
    page = 1,
    limit = MatchConfig.DEFAULT_RECOMMENDATIONS_PER_PAGE,
    minScore = MatchScoreThreshold.NEW_MATCH
  } = options;
  
  // Get user's last check timestamp (from interactions or matches)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { last_active_at: true }
  });
  
  const lastCheckTime = user?.last_active_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
  
  // Find matches generated after last check that haven't been viewed
  const matches = await prisma.match.findMany({
    where: {
      user_id: userId,
      match_type: MatchType.NEW_MATCH,
      match_score: {
        gte: minScore
      },
      generated_at: {
        gte: lastCheckTime
      },
      interactions: {
        none: {}  // No interactions yet (not viewed)
      }
    },
    include: {
      matched_user: {
        include: {
          personal_details: true,
          caste_details: {
            include: {
              religion: true,
              caste: true
            }
          },
          professional_details: true,
          photos: {
            where: {
              is_primary: true,
              is_approved: true
            },
            take: 1
          }
        }
      }
    },
    orderBy: [
      { match_score: 'desc' },
      { generated_at: 'desc' }
    ],
    skip: (page - 1) * limit,
    take: limit
  });
  
  // If no new matches, try generating some
  if (matches.length === 0 && page === 1) {
    const newMatches = await generateMatches(userId, MatchType.NEW_MATCH, { 
      limit: MatchConfig.DAILY_MATCHES_COUNT,
      skipCooldown: true  // For new matches, we can be more lenient
    });
    
    return {
      matches: newMatches,
      pagination: {
        page: 1,
        limit,
        total: newMatches.length,
        hasMore: false
      }
    };
  }
  
  // Get total count
  const totalCount = await prisma.match.count({
    where: {
      user_id: userId,
      match_type: MatchType.NEW_MATCH,
      match_score: {
        gte: minScore
      },
      generated_at: {
        gte: lastCheckTime
      },
      interactions: {
        none: {}
      }
    }
  });
  
  return {
    matches,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: page * limit < totalCount
    }
  };
};

/**
 * Get count of unseen new matches
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unseen matches
 */
export const getNewMatchesCount = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { last_active_at: true }
  });
  
  const lastCheckTime = user?.last_active_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const count = await prisma.match.count({
    where: {
      user_id: userId,
      generated_at: {
        gte: lastCheckTime
      },
      interactions: {
        none: {}
      },
      match_score: {
        gte: MatchScoreThreshold.NEW_MATCH
      }
    }
  });
  
  return count;
};

/**
 * Record match interaction (view, skip, interest)
 * @param {string} matchId - Match ID
 * @param {string} action - Action type (VIEWED, SKIPPED, INTERESTED)
 * @returns {Promise<Object>} Interaction record
 */
export const recordMatchInteraction = async (matchId, action) => {
  // Check if match exists
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });
  
  if (!match) {
    throw new NotFoundError('Match not found');
  }
  
  // Create or update interaction
  const interaction = await prisma.matchInteraction.create({
    data: {
      match_id: matchId,
      is_viewed: action === 'VIEWED',
      viewed_at: action === 'VIEWED' ? new Date() : null,
      action,
      acted_at: new Date()
    }
  });
  
  logger.info('Match interaction recorded', {
    matchId,
    action,
    userId: match.user_id
  });
  
  return interaction;
};

/**
 * Progressive criteria relaxation when no matches found
 * @param {Object} preferences - Current preferences
 * @param {number} step - Relaxation step (1, 2, 3...)
 * @returns {Object} Relaxed preferences
 */
export const relaxPreferences = (preferences, step = 1) => {
  const relaxed = { ...preferences };
  
  switch (step) {
    case 1:
      // Relax age by ±2 years
      if (relaxed.min_age) relaxed.min_age = Math.max(18, relaxed.min_age - 2);
      if (relaxed.max_age) relaxed.max_age = Math.min(100, relaxed.max_age + 2);
      break;
      
    case 2:
      // Remove height/weight restrictions
      relaxed.min_height = null;
      relaxed.max_height = null;
      relaxed.min_weight = null;
      relaxed.max_weight = null;
      break;
      
    case 3:
      // Relax caste preference (keep religion)
      relaxed.caste_preference = [];
      break;
      
    case 4:
      // Remove location preference
      relaxed.preferred_location = {};
      break;
      
    default:
      // Maximum relaxation: keep only age and religion
      relaxed.caste_preference = [];
      relaxed.education_preference = [];
      relaxed.employment_type_preference = [];
      relaxed.preferred_location = {};
      relaxed.marital_status_preference = [];
      relaxed.mother_tongue_preference = [];
  }
  
  return relaxed;
};

/**
 * Format match profile for API response (minimal card data)
 * Ensures contact info is NEVER exposed
 * 
 * @param {Object} match - Match object with matched_user
 * @returns {Object} Formatted profile data
 */
export const formatMatchProfile = (match) => {
  const user = match.matched_user;
  const age = calculateAge(user.date_of_birth);
  
  return {
    match_id: match.id,
    user_id: user.id,
    profile_id: user.profile_id,
    full_name: user.full_name,
    age,
    gender: user.gender,
    height_cm: user.personal_details?.height_cm || null,
    occupation: user.professional_details?.occupation || null,
    city: user.personal_details?.city || null,
    state: user.personal_details?.state || null,
    religion: user.caste_details?.religion?.religion_name || null,
    caste: user.caste_details?.caste?.caste_name || null,
    education: user.education_details?.[0]?.qualification || user.highest_qualification || null,
    match_score: Math.round(match.match_score),
    primary_photo: user.photos?.[0]?.photo_url || null,
    is_viewed: match.interactions?.some(i => i.is_viewed) || false,
    profile_completion: user.profile_completion_percentage
  };
};

export default {
  generateMatches,
  getRecommendedProfiles,
  getDailyMatches,
  getNewMatches,
  getNewMatchesCount,
  recordMatchInteraction,
  relaxPreferences,
  formatMatchProfile
};
