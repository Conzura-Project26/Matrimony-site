/**
 * Master Data Controller
 * Handles retrieval of all master data (enums, religions, castes, etc.)
 */

import { PrismaClient } from '@prisma/client';
import {
  genderOptions,
  profileCreatedByOptions,
  maritalStatusOptions,
  physicalStatusOptions,
  employmentTypeOptions,
  familyValuesOptions,
  incomeRangeOptions,
  photoVisibilityOptions,
  educationLevelOptions,
  dietPreferenceOptions,
  drinkingHabitOptions,
  smokingHabitOptions,
  heightRanges,
  ageRanges,
  motherTongueOptions,
  rasiOptions,
  nakshatraOptions
} from '../../prisma/seeds/enumMasterData.js';
import { getAllStates, getCitiesByState } from '../services/locationService.js';
import { BadRequestError } from '../utils/errors.js';

const prisma = new PrismaClient();

/**
 * Get all enum options
 * GET /api/master/enums
 */
export const getAllEnums = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        gender: genderOptions,
        profileCreatedBy: profileCreatedByOptions,
        maritalStatus: maritalStatusOptions,
        physicalStatus: physicalStatusOptions,
        employmentType: employmentTypeOptions,
        familyValues: familyValuesOptions,
        incomeRange: incomeRangeOptions,
        photoVisibility: photoVisibilityOptions,
        educationLevel: educationLevelOptions,
        dietPreference: dietPreferenceOptions,
        drinkingHabit: drinkingHabitOptions,
        smokingHabit: smokingHabitOptions,
        heightRanges,
        ageRanges,
        motherTongue: motherTongueOptions,
        rasi: rasiOptions,
        nakshatra: nakshatraOptions
      }
    });
  } catch (error) {
    console.error('Error fetching enums:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enum data',
      error: error.message
    });
  }
};

/**
 * Get all religions
 * GET /api/master/religions
 */
export const getAllReligions = async (req, res) => {
  try {
    const religions = await prisma.religion.findMany({
      where: { is_active: true },
      orderBy: { religion_name: 'asc' },
      select: {
        id: true,
        religion_name: true
      }
    });

    res.json({
      success: true,
      data: religions
    });
  } catch (error) {
    console.error('Error fetching religions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch religions',
      error: error.message
    });
  }
};

/**
 * Get castes by religion
 * GET /api/master/castes/:religionId
 */
export const getCastesByReligion = async (req, res) => {
  try {
    const { religionId } = req.params;

    // First, check if religion exists
    const religion = await prisma.religion.findUnique({
      where: { id: parseInt(religionId) }
    });

    if (!religion) {
      return res.status(404).json({
        success: false,
        message: `Religion with ID ${religionId} not found`,
        data: []
      });
    }

    if (!religion.is_active) {
      return res.status(400).json({
        success: false,
        message: `Religion "${religion.religion_name}" is not active`,
        data: []
      });
    }

    const castes = await prisma.caste.findMany({
      where: {
        religion_id: parseInt(religionId),
        is_active: true
      },
      orderBy: { caste_name: 'asc' },
      select: {
        id: true,
        caste_name: true,
        religion_id: true
      }
    });

    res.json({
      success: true,
      data: castes,
      count: castes.length
    });
  } catch (error) {
    console.error('Error fetching castes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch castes',
      error: error.message
    });
  }
};

/**
 * Get sub-castes by caste
 * GET /api/master/sub-castes/:casteId
 */
export const getSubCastesByCaste = async (req, res) => {
  try {
    const { casteId } = req.params;

    // First, check if caste exists
    const caste = await prisma.caste.findUnique({
      where: { id: parseInt(casteId) },
      include: { religion: true }
    });

    if (!caste) {
      return res.status(404).json({
        success: false,
        message: `Caste with ID ${casteId} not found`,
        data: []
      });
    }

    if (!caste.is_active) {
      return res.status(400).json({
        success: false,
        message: `Caste "${caste.caste_name}" is not active`,
        data: []
      });
    }

    const subCastes = await prisma.subCaste.findMany({
      where: {
        caste_id: parseInt(casteId),
        is_active: true
      },
      orderBy: { sub_caste_name: 'asc' },
      select: {
        id: true,
        sub_caste_name: true,
        caste_id: true
      }
    });

    res.json({
      success: true,
      data: subCastes,
      count: subCastes.length
    });
  } catch (error) {
    console.error('Error fetching sub-castes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-castes',
      error: error.message
    });
  }
};

/**
 * Get all master data (combined endpoint)
 * GET /api/master/all
 */
export const getAllMasterData = async (req, res) => {
  try {
    const [religions, enums] = await Promise.all([
      prisma.religion.findMany({
        where: { is_active: true },
        orderBy: { religion_name: 'asc' },
        select: {
          id: true,
          religion_name: true
        }
      }),
      Promise.resolve({
        gender: genderOptions,
        profileCreatedBy: profileCreatedByOptions,
        maritalStatus: maritalStatusOptions,
        physicalStatus: physicalStatusOptions,
        employmentType: employmentTypeOptions,
        familyValues: familyValuesOptions,
        incomeRange: incomeRangeOptions,
        photoVisibility: photoVisibilityOptions,
        educationLevel: educationLevelOptions,
        dietPreference: dietPreferenceOptions,
        drinkingHabit: drinkingHabitOptions,
        smokingHabit: smokingHabitOptions,
        heightRanges,
        ageRanges,
        motherTongue: motherTongueOptions,
        rasi: rasiOptions,
        nakshatra: nakshatraOptions
      })
    ]);

    res.json({
      success: true,
      data: {
        religions,
        enums
      }
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch master data',
      error: error.message
    });
  }
};

/**
 * Get religion with castes and sub-castes (hierarchical)
 * GET /api/master/religions/:religionId/hierarchy
 */
export const getReligionHierarchy = async (req, res) => {
  try {
    const { religionId } = req.params;

    const religionData = await prisma.religion.findUnique({
      where: {
        id: parseInt(religionId),
        is_active: true
      },
      include: {
        castes: {
          where: { is_active: true },
          orderBy: { caste_name: 'asc' },
          include: {
            sub_castes: {
              where: { is_active: true },
              orderBy: { sub_caste_name: 'asc' }
            }
          }
        }
      }
    });

    if (!religionData) {
      return res.status(404).json({
        success: false,
        message: 'Religion not found'
      });
    }

    res.json({
      success: true,
      data: religionData
    });
  } catch (error) {
    console.error('Error fetching religion hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch religion hierarchy',
      error: error.message
    });
  }
};

/**
 * Get all Indian states
 * GET /api/master/states
 */
export const getStates = async (req, res) => {
  try {
    const states = await getAllStates();

    res.json({
      success: true,
      data: states,
      count: states.length,
      message: 'States retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
};

/**
 * Get cities by state with optional search
 * GET /api/master/cities?state=Karnataka&search=Bang
 */
export const getCities = async (req, res) => {
  try {
    const { state, search } = req.query;

    // State is required
    if (!state) {
      throw new BadRequestError('State parameter is required');
    }

    // Validate state exists
    const states = await getAllStates();
    if (!states.includes(state)) {
      throw new BadRequestError(`Invalid state: ${state}`);
    }

    // Get cities (with optional search filter)
    const cities = await getCitiesByState(state, search || '');

    res.json({
      success: true,
      data: cities,
      count: cities.length,
      message: search 
        ? `Cities in ${state} matching "${search}" retrieved successfully`
        : `Cities in ${state} retrieved successfully`,
      filters: {
        state,
        search: search || null
      }
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};
