import prisma from '../config/prisma.js';
import { calculateEnhancedMatchScore } from '../utils/preferenceMatching.js';
import { BadRequestError } from '../utils/errors.js';
import logger from '../config/logger.js';
import {
  buildProfileWhereClause,
  buildOrderByClause,
  formatProfileForListing,
  getUserPartnerPreferences,
  getOppositeGender,
  logSearchQuery,
} from '../services/profileListingService.js';

/**
 * Profile Listing Controller
 * Task 3.1: Get all profiles with pagination, filtering, sorting, and match scoring
 */
class ProfileListingController {
  /**
   * Get All Profiles with Filters
   * GET /profiles
   * 
   * @description Retrieve paginated list of profiles with advanced filtering and sorting
   * @access Private (Authenticated users only)
   */
  async getAllProfiles(req, res) {
    const startTime = Date.now();
    const currentUserId = req.user.userId;

    // Extract query parameters
    const {
      page = 1,
      limit = 20,
      sort_by = 'newest',
      
      // Override filters (optional - if not provided, use partner preferences)
      gender,
      min_age,
      max_age,
      state,
      city,
      work_state,
      work_city,
      work_location_type,
      religion_id,
      caste_id,
      marital_status,
      min_height,
      max_height,
      mother_tongue,
      employment_type,
      income_range,
      qualification,
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    
    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestError('Page and limit must be positive integers');
    }

    const skip = (pageNum - 1) * limitNum;

    // Get user's partner preferences for auto-filtering
    const partnerPreferences = await getUserPartnerPreferences(currentUserId);
    const oppositeGender = await getOppositeGender(currentUserId);

    // Build filters object (use query params if provided, otherwise use preferences)
    const filters = {
      gender: gender || oppositeGender,
      min_age: min_age ? parseInt(min_age) : partnerPreferences.min_age,
      max_age: max_age ? parseInt(max_age) : partnerPreferences.max_age,
      state: state,
      city: city,
      work_state: work_state,
      work_city: work_city,
      work_location_type: work_location_type,
      religion_id: religion_id,
      caste_id: caste_id,
      marital_status: marital_status,
      min_height: min_height ? parseInt(min_height) : partnerPreferences.min_height,
      max_height: max_height ? parseInt(max_height) : partnerPreferences.max_height,
      mother_tongue: mother_tongue,
      employment_type: employment_type,
      income_range: income_range,
      qualification: qualification,
    };

    // Build WHERE clause
    const whereClause = buildProfileWhereClause(filters, currentUserId);

    // Build ORDER BY clause
    const orderByClause = buildOrderByClause(sort_by);

    try {
      // Fetch profiles with related data
      const [profiles, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: orderByClause,
          select: {
            id: true,
            profile_id: true,
            full_name: true,
            gender: true,
            date_of_birth: true,
            profile_completion_percentage: true,
            created_at: true,
            last_active_at: true,
            personal_details: {
              select: {
                height_cm: true,
                marital_status: true,
                city: true,
                state: true,
                mother_tongue: true,
              },
            },
            professional_details: {
              select: {
                occupation: true,
                annual_income_range: true,
                employment_type: true,
              },
            },
            education_details: {
              select: {
                qualification: true,
                year_of_passing: true,
              },
              orderBy: {
                year_of_passing: 'desc',
              },
              take: 1,
            },
            caste_details: {
              select: {
                religion: {
                  select: {
                    religion_name: true,
                  },
                },
                caste: {
                  select: {
                    caste_name: true,
                  },
                },
              },
            },
            photos: {
              where: {
                is_approved: true,
              },
              select: {
                photo_url: true,
                is_primary: true,
              },
            },
          },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      // Format profiles and calculate match scores
      let formattedProfiles = profiles.map(formatProfileForListing);

      // Calculate match scores if sorting by match_score or if user wants to see scores
      if (sort_by === 'match_score') {
        // Fetch current user's full profile for match scoring
        const currentUserProfile = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            personal_details: true,
            professional_details: true,
            caste_details: true,
            education_details: true,
            partner_preferences: true,
          },
        });

        if (currentUserProfile?.partner_preferences) {
          // Calculate match score for each profile
          const profilesWithScores = await Promise.all(
            profiles.map(async (profile) => {
              const fullProfile = await prisma.user.findUnique({
                where: { id: profile.id },
                include: {
                  personal_details: true,
                  professional_details: true,
                  caste_details: true,
                  education_details: true,
                },
              });

              const matchResult = calculateEnhancedMatchScore(
                currentUserProfile.partner_preferences,
                fullProfile
              );

              return {
                profile: formatProfileForListing(profile),
                match_score: matchResult.totalScore,
              };
            })
          );

          // Sort by match score (descending)
          profilesWithScores.sort((a, b) => b.match_score - a.match_score);

          // Extract formatted profiles with match scores
          formattedProfiles = profilesWithScores.map(item => ({
            ...item.profile,
            match_score: item.match_score,
          }));
        }
      } else {
        // Add match scores for display (optional, even if not sorting by it)
        const currentUserProfile = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            partner_preferences: true,
          },
        });

        if (currentUserProfile?.partner_preferences) {
          formattedProfiles = await Promise.all(
            formattedProfiles.map(async (formattedProfile, index) => {
              const fullProfile = await prisma.user.findUnique({
                where: { id: profiles[index].id },
                include: {
                  personal_details: true,
                  professional_details: true,
                  caste_details: true,
                  education_details: true,
                },
              });

              const matchResult = calculateEnhancedMatchScore(
                currentUserProfile.partner_preferences,
                fullProfile
              );

              return {
                ...formattedProfile,
                match_score: matchResult.totalScore,
              };
            })
          );
        }
      }

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Log search query
      await logSearchQuery({
        userId: currentUserId,
        filters: JSON.stringify(filters),
        resultCount: totalCount,
        executionTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Build pagination metadata
      const totalPages = Math.ceil(totalCount / limitNum);

      logger.info('Profiles retrieved successfully', {
        userId: currentUserId,
        page: pageNum,
        limit: limitNum,
        totalCount,
        executionTime: `${executionTime}ms`,
      });

      res.json({
        success: true,
        message: 'Profiles retrieved successfully',
        data: {
          profiles: formattedProfiles,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages,
          },
          filters_applied: filters,
          execution_time_ms: executionTime,
        },
      });
    } catch (error) {
      logger.error('Error fetching profiles', {
        userId: currentUserId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export default new ProfileListingController();
