/**
 * Search Controller
 * Handles all profile search operations
 * 
 * Endpoints:
 * - GET /api/search/profiles - Simple search with query params
 * - POST /api/search/advanced - Advanced search with complex filters
 * - GET /api/search/profile/:profileId - Search by custom profile ID
 */

import {
  simpleSearchSchema,
  advancedSearchSchema,
  profileIdSearchSchema,
} from '../utils/validation.js';
import {
  searchProfiles,
  searchByProfileId,
  logSearch,
} from '../services/searchService.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * Simple Search - GET endpoint
 * For basic searches with query parameters
 * 
 * GET /api/search/profiles?keyword=engineer&mother_tongue=Hindi&page=1
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const simpleSearch = async (req, res) => {
  try {
    // Validate query parameters
    const validatedQuery = simpleSearchSchema.parse(req.query);
    
    const {
      page,
      keyword,
      mother_tongue,
      min_height,
      max_height,
      rasi,
      nakshatra,
    } = validatedQuery;
    
    // Build filters object
    const filters = {};
    
    if (keyword) filters.keyword = keyword;
    if (mother_tongue) filters.mother_tongue = [mother_tongue]; // Convert to array for service
    if (min_height) filters.min_height = min_height;
    if (max_height) filters.max_height = max_height;
    if (rasi) filters.rasi = [rasi]; // Convert to array for service
    if (nakshatra) filters.nakshatra = [nakshatra]; // Convert to array for service
    
    // Check if at least one filter is provided
    if (Object.keys(filters).length === 0) {
      throw new BadRequestError('At least one search filter is required');
    }
    
    // Get current user ID from authenticated token
    const currentUserId = req.user.userId;
    
    // Execute search
    const searchResults = await searchProfiles(filters, page, currentUserId);
    
    // Log search asynchronously
    logSearch({
      userId: currentUserId,
      filters,
      resultCount: searchResults.result_count,
      executionTimeMs: searchResults.execution_time_ms,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    
    // Send response
    res.json({
      success: true,
      message: `Found ${searchResults.result_count} profiles`,
      data: searchResults.results,
      pagination: searchResults.pagination,
      filters: filters,
      execution_time_ms: searchResults.execution_time_ms,
    });
    
    logger.info('Simple search completed', {
      userId: currentUserId,
      resultCount: searchResults.result_count,
      page,
      filters,
      executionTimeMs: searchResults.execution_time_ms,
    });
  } catch (error) {
    logger.error('Simple search error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      query: req.query,
    });
    throw error; // Let global error handler deal with it
  }
};

/**
 * Advanced Search - POST endpoint
 * For complex searches with multiple filters
 * 
 * POST /api/search/advanced
 * Body: {
 *   page: 1,
 *   keyword: "engineer",
 *   mother_tongue: ["Hindi", "English"],
 *   min_height: 160,
 *   max_height: 180,
 *   rasi: ["Mesha (Aries)", "Simha (Leo)"],
 *   nakshatra: ["Ashwini", "Bharani"]
 * }
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const advancedSearch = async (req, res) => {
  try {
    // Validate request body
    const validatedBody = advancedSearchSchema.parse(req.body);
    
    const {
      page,
      keyword,
      mother_tongue,
      min_height,
      max_height,
      rasi,
      nakshatra,
    } = validatedBody;
    
    // Build filters object
    const filters = {};
    
    if (keyword) filters.keyword = keyword;
    if (mother_tongue) filters.mother_tongue = mother_tongue;
    if (min_height !== undefined) filters.min_height = min_height;
    if (max_height !== undefined) filters.max_height = max_height;
    if (rasi) filters.rasi = rasi;
    if (nakshatra) filters.nakshatra = nakshatra;
    
    // Get current user ID from authenticated token
    const currentUserId = req.user.userId;
    
    // Execute search
    const searchResults = await searchProfiles(filters, page, currentUserId);
    
    // Log search asynchronously
    logSearch({
      userId: currentUserId,
      filters,
      resultCount: searchResults.result_count,
      executionTimeMs: searchResults.execution_time_ms,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    
    // Send response
    res.json({
      success: true,
      message: `Found ${searchResults.result_count} profiles matching your criteria`,
      data: searchResults.results,
      pagination: searchResults.pagination,
      filters: filters,
      execution_time_ms: searchResults.execution_time_ms,
    });
    
    logger.info('Advanced search completed', {
      userId: currentUserId,
      resultCount: searchResults.result_count,
      page,
      filterCount: Object.keys(filters).length,
      executionTimeMs: searchResults.execution_time_ms,
    });
  } catch (error) {
    logger.error('Advanced search error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      body: req.body,
    });
    throw error; // Let global error handler deal with it
  }
};

/**
 * Search by Profile ID - GET endpoint
 * Returns a single profile by custom profile ID
 * 
 * GET /api/search/profile/:profileId
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getProfileById = async (req, res) => {
  try {
    // Validate profile ID parameter
    const { profile_id } = profileIdSearchSchema.parse({
      profile_id: req.params.profileId,
    });
    
    // Get current user ID from authenticated token
    const currentUserId = req.user.userId;
    
    // Search for profile
    const result = await searchByProfileId(profile_id, currentUserId);
    
    // Log search asynchronously
    logSearch({
      userId: currentUserId,
      filters: { profile_id },
      resultCount: 1,
      executionTimeMs: result.execution_time_ms,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    
    // Send response
    res.json({
      success: true,
      message: 'Profile found',
      data: result.profile,
      execution_time_ms: result.execution_time_ms,
    });
    
    logger.info('Profile ID search completed', {
      userId: currentUserId,
      profileId: profile_id,
      executionTimeMs: result.execution_time_ms,
    });
  } catch (error) {
    logger.error('Profile ID search error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      profileId: req.params.profileId,
    });
    throw error; // Let global error handler deal with it
  }
};

export default {
  simpleSearch,
  advancedSearch,
  getProfileById,
};
