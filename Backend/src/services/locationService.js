/**
 * Location Service
 * Handles fetching and caching of Indian states and cities from external API
 * 
 * API: CountriesNow API
 * - States: https://countriesnow.space/api/v0.1/countries/states
 * - Cities: https://countriesnow.space/api/v0.1/countries/state/cities
 * 
 * Features:
 * - Fetch all Indian states
 * - Fetch cities by state
 * - In-memory caching with weekly refresh
 * - Validation: city must belong to selected state
 * - Fallback to static data if API fails
 */

import axios from 'axios';
import logger from '../config/logger.js';

// API Configuration
const COUNTRIES_NOW_API = {
  STATES: 'https://countriesnow.space/api/v0.1/countries/states',
  CITIES: 'https://countriesnow.space/api/v0.1/countries/state/cities',
};

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
let statesCache = null;
let citiesCache = {}; // { stateName: [cities...] }
let lastCacheUpdate = null;

/**
 * Static fallback data (major Indian states)
 * Used when API is unreachable
 */
const FALLBACK_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/**
 * Check if cache is expired
 */
const isCacheExpired = () => {
  if (!lastCacheUpdate) return true;
  return Date.now() - lastCacheUpdate > CACHE_DURATION;
};

/**
 * Fetch all Indian states from API
 * @returns {Promise<string[]>} Array of state names
 */
const fetchStatesFromAPI = async () => {
  try {
    logger.info('[LocationService] Fetching states from API');
    
    const response = await axios.post(COUNTRIES_NOW_API.STATES, {
      country: 'India'
    }, {
      timeout: 10000 // 10 seconds timeout
    });

    if (response.data && response.data.data && response.data.data.states) {
      const states = response.data.data.states
        .map(state => state.name)
        .sort();
      
      logger.info('[LocationService] Successfully fetched states from API', {
        count: states.length
      });
      
      return states;
    }

    throw new Error('Invalid API response structure');
  } catch (error) {
    logger.error('[LocationService] Failed to fetch states from API', error);
    return null;
  }
};

/**
 * Fetch cities for a specific state from API
 * @param {string} stateName - State name
 * @returns {Promise<string[]>} Array of city names
 */
const fetchCitiesFromAPI = async (stateName) => {
  try {
    logger.info('[LocationService] Fetching cities from API', { state: stateName });
    
    const response = await axios.post(COUNTRIES_NOW_API.CITIES, {
      country: 'India',
      state: stateName
    }, {
      timeout: 10000 // 10 seconds timeout
    });

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const cities = response.data.data.sort();
      
      logger.info('[LocationService] Successfully fetched cities from API', {
        state: stateName,
        count: cities.length
      });
      
      return cities;
    }

    throw new Error('Invalid API response structure');
  } catch (error) {
    logger.error('[LocationService] Failed to fetch cities from API', error, {
      state: stateName
    });
    return null;
  }
};

/**
 * Initialize or refresh the cache
 */
const refreshCache = async () => {
  try {
    logger.info('[LocationService] Refreshing location cache');
    
    // Fetch states
    const states = await fetchStatesFromAPI();
    
    if (states && states.length > 0) {
      statesCache = states;
      lastCacheUpdate = Date.now();
      
      logger.info('[LocationService] Cache refreshed successfully', {
        statesCount: states.length,
        nextRefresh: new Date(lastCacheUpdate + CACHE_DURATION).toISOString()
      });
    } else {
      // Use fallback if API fails
      logger.warn('[LocationService] Using fallback states data');
      statesCache = FALLBACK_STATES;
      lastCacheUpdate = Date.now();
    }
    
    return true;
  } catch (error) {
    logger.error('[LocationService] Cache refresh failed', error);
    
    // Use fallback data
    if (!statesCache) {
      logger.warn('[LocationService] Initializing with fallback states data');
      statesCache = FALLBACK_STATES;
      lastCacheUpdate = Date.now();
    }
    
    return false;
  }
};

/**
 * Get all Indian states
 * @returns {Promise<string[]>} Array of state names
 */
export const getAllStates = async () => {
  // Initialize or refresh cache if expired
  if (!statesCache || isCacheExpired()) {
    await refreshCache();
  }
  
  return statesCache || FALLBACK_STATES;
};

/**
 * Get cities by state
 * @param {string} stateName - State name
 * @param {string} searchQuery - Optional search query to filter cities
 * @returns {Promise<string[]>} Array of city names
 */
export const getCitiesByState = async (stateName, searchQuery = '') => {
  // Validate state exists
  const states = await getAllStates();
  if (!states.includes(stateName)) {
    logger.warn('[LocationService] Invalid state requested', { state: stateName });
    return [];
  }
  
  // Check if cities are already cached for this state
  if (!citiesCache[stateName]) {
    const cities = await fetchCitiesFromAPI(stateName);
    
    if (cities && cities.length > 0) {
      citiesCache[stateName] = cities;
    } else {
      // Return empty array if API fails
      logger.warn('[LocationService] No cities found for state', { state: stateName });
      return [];
    }
  }
  
  let cities = citiesCache[stateName] || [];
  
  // Apply search filter if provided
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    cities = cities.filter(city => 
      city.toLowerCase().includes(query)
    );
  }
  
  return cities;
};

/**
 * Validate if a city belongs to a specific state
 * @param {string} stateName - State name
 * @param {string} cityName - City name
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export const validateCityInState = async (stateName, cityName) => {
  if (!stateName || !cityName) {
    return false;
  }
  
  const cities = await getCitiesByState(stateName);
  
  // Case-insensitive comparison
  return cities.some(city => 
    city.toLowerCase() === cityName.toLowerCase()
  );
};

/**
 * Clear cache (useful for testing or manual refresh)
 */
export const clearCache = () => {
  statesCache = null;
  citiesCache = {};
  lastCacheUpdate = null;
  logger.info('[LocationService] Cache cleared');
};

/**
 * Get cache status (useful for monitoring)
 */
export const getCacheStatus = () => {
  return {
    hasStatesCache: !!statesCache,
    statesCount: statesCache ? statesCache.length : 0,
    cachedStatesCount: Object.keys(citiesCache).length,
    lastUpdate: lastCacheUpdate ? new Date(lastCacheUpdate).toISOString() : null,
    nextRefresh: lastCacheUpdate 
      ? new Date(lastCacheUpdate + CACHE_DURATION).toISOString() 
      : null,
    isExpired: isCacheExpired()
  };
};

// Initialize cache on service load (non-blocking)
refreshCache().catch(err => {
  logger.error('[LocationService] Initial cache load failed', err);
});

// Set up automatic weekly refresh (only in production/server context)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    if (isCacheExpired()) {
      logger.info('[LocationService] Automatic cache refresh triggered');
      refreshCache().catch(err => {
        logger.error('[LocationService] Scheduled cache refresh failed', err);
      });
    }
  }, 24 * 60 * 60 * 1000); // Check daily if refresh is needed
}

export default {
  getAllStates,
  getCitiesByState,
  validateCityInState,
  clearCache,
  getCacheStatus
};
