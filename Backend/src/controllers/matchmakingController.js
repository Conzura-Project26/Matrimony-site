/**
 * Matchmaking Controller
 * Phase 3 - Task 3.4: Matchmaking Algorithm
 * 
 * Handles HTTP requests for matchmaking features:
 * - GET /profiles/recommended - Get recommended profiles
 * - GET /profiles/daily-matches - Get daily curated matches
 * - GET /profiles/new-matches - Get new matches since last check
 * - GET /profiles/new-matches/count - Get count of unseen matches
 * - POST /matches/:matchId/view - Record match interaction
 * 
 * @module controllers/matchmakingController
 */

import {
  getRecommendedProfiles,
  getDailyMatches,
  getNewMatches,
  getNewMatchesCount,
  recordMatchInteraction,
  formatMatchProfile
} from '../services/matchmakingService.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';

const logAPI = {
  info: (message, meta) => logger.info(`[Matchmaking API] ${message}`, meta),
  success: (message, meta) => logger.info(`[Matchmaking API] ✅ ${message}`, meta),
  error: (message, meta) => logger.error(`[Matchmaking API] ❌ ${message}`, meta)
};

class MatchmakingController {
  /**
   * Get recommended profiles for user
   * GET /profiles/recommended
   * 
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 20)
   * - min_score: Minimum match score (default: 50)
   * - regenerate: Force regenerate matches (default: false)
   */
  async getRecommended(req, res) {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      min_score = 50,
      regenerate = false 
    } = req.query;
    
    logAPI.info('Fetching recommended profiles', {
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      minScore: parseInt(min_score)
    });
    
    // Validate query params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const minScoreNum = parseInt(min_score);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      throw new BadRequestError('Invalid pagination parameters');
    }
    
    if (minScoreNum < 0 || minScoreNum > 100) {
      throw new BadRequestError('min_score must be between 0 and 100');
    }
    
    // Get recommendations
    const result = await getRecommendedProfiles(userId, {
      page: pageNum,
      limit: limitNum,
      minScore: minScoreNum,
      regenerate: regenerate === 'true' || regenerate === true
    });
    
    // Format response (minimal card data)
    const formattedMatches = result.matches.map(formatMatchProfile);
    
    logAPI.success('Recommended profiles fetched', {
      userId,
      count: formattedMatches.length,
      page: pageNum
    });
    
    res.status(200).json({
      success: true,
      message: 'Recommended profiles fetched successfully',
      data: {
        matches: formattedMatches,
        pagination: result.pagination
      }
    });
  }
  
  /**
   * Get daily matches for user
   * GET /profiles/daily-matches
   * 
   * Returns 10 curated matches for the day
   * Refreshes at midnight
   */
  async getDailyMatches(req, res) {
    const userId = req.user.userId;
    
    logAPI.info('Fetching daily matches', { userId });
    
    // Get daily matches
    const matches = await getDailyMatches(userId);
    
    // Format response
    const formattedMatches = matches.map(formatMatchProfile);
    
    // Calculate how many are new (not viewed)
    const newCount = formattedMatches.filter(m => !m.is_viewed).length;
    
    logAPI.success('Daily matches fetched', {
      userId,
      totalMatches: formattedMatches.length,
      newMatches: newCount
    });
    
    res.status(200).json({
      success: true,
      message: 'Daily matches fetched successfully',
      data: {
        matches: formattedMatches,
        stats: {
          total: formattedMatches.length,
          new: newCount,
          viewed: formattedMatches.length - newCount,
          refresh_time: 'Daily at midnight'
        }
      }
    });
  }
  
  /**
   * Get new matches for user
   * GET /profiles/new-matches
   * 
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 20)
   * 
   * Returns profiles not previously shown to user
   */
  async getNewMatches(req, res) {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    logAPI.info('Fetching new matches', {
      userId,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    // Validate query params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      throw new BadRequestError('Invalid pagination parameters');
    }
    
    // Get new matches
    const result = await getNewMatches(userId, {
      page: pageNum,
      limit: limitNum
    });
    
    // Format response
    const formattedMatches = result.matches.map(formatMatchProfile);
    
    logAPI.success('New matches fetched', {
      userId,
      count: formattedMatches.length,
      page: pageNum
    });
    
    res.status(200).json({
      success: true,
      message: 'New matches fetched successfully',
      data: {
        matches: formattedMatches,
        pagination: result.pagination
      }
    });
  }
  
  /**
   * Get count of unseen new matches
   * GET /profiles/new-matches/count
   * 
   * Returns count for notification badge
   */
  async getNewMatchesCount(req, res) {
    const userId = req.user.userId;
    
    logAPI.info('Fetching new matches count', { userId });
    
    // Get count
    const count = await getNewMatchesCount(userId);
    
    logAPI.success('New matches count fetched', { userId, count });
    
    res.status(200).json({
      success: true,
      message: 'New matches count fetched successfully',
      data: {
        count,
        last_checked: new Date().toISOString()
      }
    });
  }
  
  /**
   * Record match interaction (view)
   * POST /matches/:matchId/view
   * 
   * Tracks when user views a match profile
   */
  async recordView(req, res) {
    const userId = req.user.userId;
    const { matchId } = req.params;
    
    logAPI.info('Recording match view', { userId, matchId });
    
    // Validate matchId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      throw new BadRequestError('Invalid match ID format');
    }
    
    // Record interaction
    const interaction = await recordMatchInteraction(matchId, 'VIEWED');
    
    logAPI.success('Match view recorded', { userId, matchId });
    
    res.status(200).json({
      success: true,
      message: 'Match view recorded successfully',
      data: {
        interaction_id: interaction.id,
        viewed_at: interaction.viewed_at
      }
    });
  }
}

export default new MatchmakingController();
