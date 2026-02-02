/**
 * Partner Preference Matching Algorithm
 * Calculates weighted match score between user profile and partner preferences
 * 
 * Scoring Breakdown:
 * - Age: Hard Filter (must match or excluded)
 * - Religion: 16% (scored)
 * - Location: 16% (scored)
 * - Profession: 13% (scored)
 * - Education: 10% (scored)
 * - Caste: 10% (scored)
 * - Height: 5% (soft score)
 * - Weight: 5% (soft score)
 * - Income: 5% (soft score - overlap based)
 * - Physical Status: 5% (scored)
 * 
 * Total Base Score: 85% (100% if all match perfectly)
 * Unspecified preferences = "open to all" (full score for that category)
 */

/**
 * Income range mapping with numeric values
 * Maps income range strings to their min/max numeric values in rupees
 */
const incomeRangeMap = {
  'Below 2 Lakhs': { min: 0, max: 200000 },
  '2 - 5 Lakhs': { min: 200000, max: 500000 },
  '5 - 10 Lakhs': { min: 500000, max: 1000000 },
  '10 - 15 Lakhs': { min: 1000000, max: 1500000 },
  '15 - 20 Lakhs': { min: 1500000, max: 2000000 },
  '20 - 30 Lakhs': { min: 2000000, max: 3000000 },
  '30 - 50 Lakhs': { min: 3000000, max: 5000000 },
  'Above 50 Lakhs': { min: 5000000, max: Infinity }
};

/**
 * Get numeric values from income range string
 * @param {string} incomeRange - Income range string (e.g., "5 - 10 Lakhs")
 * @returns {Object|null} - {min, max} or null if invalid
 */
const parseIncomeRange = (incomeRange) => {
  if (!incomeRange) return null;
  return incomeRangeMap[incomeRange] || null;
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number|null} - Age in years or null if invalid
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return null;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if value is in array, or if array is empty/null (open to all)
 * @param {Array} preferenceArray - Array of preferred values
 * @param {any} actualValue - Actual value to check
 * @returns {boolean} - True if matches or preference is open
 */
const isPreferenceMatch = (preferenceArray, actualValue) => {
  // If no preference specified, open to all (returns true)
  if (!preferenceArray || preferenceArray.length === 0) {
    return true;
  }
  
  // If actual value is not provided, no match
  if (actualValue === null || actualValue === undefined) {
    return false;
  }
  
  // Check if actual value is in preference array
  return preferenceArray.includes(actualValue);
};

/**
 * Calculate match score for a category
 * @param {Array} preferenceArray - Array of preferred values
 * @param {any} actualValue - Actual value
 * @param {number} maxScore - Maximum score for this category
 * @returns {number} - Score achieved
 */
const calculateCategoryScore = (preferenceArray, actualValue, maxScore) => {
  // If preference is open (empty/null), give full score
  if (!preferenceArray || preferenceArray.length === 0) {
    return maxScore;
  }
  
  // If match found, give full score
  if (isPreferenceMatch(preferenceArray, actualValue)) {
    return maxScore;
  }
  
  // No match, zero score
  return 0;
};

/**
 * Calculate height match score (soft scoring)
 * @param {number} minHeight - Minimum preferred height (cm)
 * @param {number} maxHeight - Maximum preferred height (cm)
 * @param {number} actualHeight - Actual height (cm)
 * @returns {number} - Score (0-5)
 */
const calculateHeightScore = (minHeight, maxHeight, actualHeight) => {
  const maxScore = 5;
  
  // If no height preference, full score
  if (!minHeight && !maxHeight) {
    return maxScore;
  }
  
  // If actual height not provided, no score
  if (!actualHeight) {
    return 0;
  }
  
  // If within range, full score
  if (minHeight && maxHeight) {
    if (actualHeight >= minHeight && actualHeight <= maxHeight) {
      return maxScore;
    }
    
    // Partial score for being close (within 10 cm)
    const distanceFromMin = Math.abs(actualHeight - minHeight);
    const distanceFromMax = Math.abs(actualHeight - maxHeight);
    const closestDistance = Math.min(distanceFromMin, distanceFromMax);
    
    if (closestDistance <= 10) {
      return maxScore * 0.5; // 50% score if within 10 cm
    }
    
    return 0;
  }
  
  // Only min_height specified
  if (minHeight) {
    if (actualHeight >= minHeight) {
      return maxScore;
    }
    if (Math.abs(actualHeight - minHeight) <= 10) {
      return maxScore * 0.5;
    }
    return 0;
  }
  
  // Only max_height specified
  if (maxHeight) {
    if (actualHeight <= maxHeight) {
      return maxScore;
    }
    if (Math.abs(actualHeight - maxHeight) <= 10) {
      return maxScore * 0.5;
    }
    return 0;
  }
  
  return 0;
};

/**
 * Calculate weight match score (soft scoring)
 * @param {number} minWeight - Minimum preferred weight (kg)
 * @param {number} maxWeight - Maximum preferred weight (kg)
 * @param {number} actualWeight - Actual weight (kg)
 * @returns {number} - Score (0-5)
 */
const calculateWeightScore = (minWeight, maxWeight, actualWeight) => {
  const maxScore = 5;
  
  // If no weight preference, full score
  if (!minWeight && !maxWeight) {
    return maxScore;
  }
  
  // If actual weight not provided, no score
  if (!actualWeight) {
    return 0;
  }
  
  // If within range, full score
  if (minWeight && maxWeight) {
    if (actualWeight >= minWeight && actualWeight <= maxWeight) {
      return maxScore;
    }
    
    // Partial score for being close (within 5 kg)
    const distanceFromMin = Math.abs(actualWeight - minWeight);
    const distanceFromMax = Math.abs(actualWeight - maxWeight);
    const closestDistance = Math.min(distanceFromMin, distanceFromMax);
    
    if (closestDistance <= 5) {
      return maxScore * 0.5; // 50% score if within 5 kg
    }
    
    return 0;
  }
  
  // Only min_weight specified
  if (minWeight) {
    if (actualWeight >= minWeight) {
      return maxScore;
    }
    if (Math.abs(actualWeight - minWeight) <= 5) {
      return maxScore * 0.5;
    }
    return 0;
  }
  
  // Only max_weight specified
  if (maxWeight) {
    if (actualWeight <= maxWeight) {
      return maxScore;
    }
    if (Math.abs(actualWeight - maxWeight) <= 5) {
      return maxScore * 0.5;
    }
    return 0;
  }
  
  return 0;
};

/**
 * Calculate income match score (soft scoring with overlap-based matching)
 * @param {string} incomePreferenceMin - Minimum preferred income range
 * @param {string} incomePreferenceMax - Maximum preferred income range
 * @param {string} actualIncomeRange - Actual income range
 * @returns {number} - Score (0-5)
 */
const calculateIncomeScore = (incomePreferenceMin, incomePreferenceMax, actualIncomeRange) => {
  const maxScore = 5;
  
  // If no income preference specified, open to all (full score)
  if (!incomePreferenceMin && !incomePreferenceMax) {
    return maxScore;
  }
  
  // If actual income not provided, skip this preference (return null to indicate skip)
  if (!actualIncomeRange) {
    return null;
  }
  
  // Parse income ranges
  const userIncome = parseIncomeRange(actualIncomeRange);
  
  // If user income is invalid format, skip
  if (!userIncome) {
    return null;
  }
  
  // Determine preference range boundaries
  const preferenceMin = incomePreferenceMin ? parseIncomeRange(incomePreferenceMin) : null;
  const preferenceMax = incomePreferenceMax ? parseIncomeRange(incomePreferenceMax) : null;
  
  let prefMinValue, prefMaxValue;
  
  // If both min and max preferences specified
  if (preferenceMin && preferenceMax) {
    prefMinValue = preferenceMin.min;
    prefMaxValue = preferenceMax.max;
  } 
  // Only min preference specified - open upper bound
  else if (preferenceMin) {
    prefMinValue = preferenceMin.min;
    prefMaxValue = Infinity;
  } 
  // Only max preference specified - open lower bound
  else if (preferenceMax) {
    prefMinValue = 0;
    prefMaxValue = preferenceMax.max;
  } 
  else {
    // No valid preference, full score
    return maxScore;
  }
  
  // Check for overlap: User's min <= Pref's max AND User's max >= Pref's min
  const hasOverlap = userIncome.min <= prefMaxValue && userIncome.max >= prefMinValue;
  
  if (hasOverlap) {
    return maxScore; // Full score for overlap
  }
  
  // Calculate proximity for partial scoring
  // If user's income is close to preference range, give partial score
  
  // User income is below preference range
  if (userIncome.max < prefMinValue) {
    const gap = prefMinValue - userIncome.max;
    // Within 5 lakhs (500000) below minimum - 50% score
    if (gap <= 500000) {
      return maxScore * 0.5;
    }
  }
  
  // User income is above preference range
  if (userIncome.min > prefMaxValue && prefMaxValue !== Infinity) {
    const gap = userIncome.min - prefMaxValue;
    // Within 5 lakhs (500000) above maximum - 50% score
    if (gap <= 500000) {
      return maxScore * 0.5;
    }
  }
  
  // No match, no proximity
  return 0;
};

/**
 * Main function: Calculate match percentage between user and preferences
 * @param {Object} userProfile - User's complete profile data
 * @param {Object} partnerPreferences - Partner preferences
 * @returns {Object} - Match result with score and breakdown
 */
const calculateMatchScore = (userProfile, partnerPreferences) => {
  const breakdown = {
    age: { score: 0, maxScore: 0, status: 'pass', isHardFilter: true },
    religion: { score: 0, maxScore: 16, status: 'pending' },
    caste: { score: 0, maxScore: 10, status: 'pending' },
    education: { score: 0, maxScore: 10, status: 'pending' },
    profession: { score: 0, maxScore: 13, status: 'pending' },
    location: { score: 0, maxScore: 16, status: 'pending' },
    height: { score: 0, maxScore: 5, status: 'pending' },
    weight: { score: 0, maxScore: 5, status: 'pending' },
    income: { score: 0, maxScore: 5, status: 'pending' },
    physical_status: { score: 0, maxScore: 5, status: 'pending' }
  };
  
  // ============================================
  // 1. AGE - HARD FILTER (Must match to proceed)
  // ============================================
  const userAge = calculateAge(userProfile.date_of_birth);
  const minAge = partnerPreferences.min_age;
  const maxAge = partnerPreferences.max_age;
  
  // If age preferences exist, check hard filter
  if (minAge !== null && minAge !== undefined || maxAge !== null && maxAge !== undefined) {
    // If user age cannot be calculated, skip age filter (treat as pass)
    if (userAge === null) {
      breakdown.age.status = 'pass';
      breakdown.age.note = 'Target user date_of_birth not available';
    } else {
      let ageMatches = true;
      
      if (minAge !== null && minAge !== undefined && userAge < minAge) {
        ageMatches = false;
      }
      if (maxAge !== null && maxAge !== undefined && userAge > maxAge) {
        ageMatches = false;
      }
      
      if (!ageMatches) {
        breakdown.age.status = 'fail';
        breakdown.age.userAge = userAge;
        breakdown.age.preferredRange = { min: minAge, max: maxAge };
        return {
          match: false,
          matchPercentage: 0,
          totalScore: 0,
          maxScore: 85,
          breakdown,
          failReason: `Age does not match hard filter criteria. User age: ${userAge}, Required: ${minAge || 'any'}-${maxAge || 'any'}`
        };
      }
    }
  }
  
  breakdown.age.status = 'pass';
  breakdown.age.userAge = userAge;
  
  // ============================================
  // 2. RELIGION - 17% (Scored)
  // ============================================
  const userReligionId = userProfile.caste_details?.religion_id;
  breakdown.religion.score = calculateCategoryScore(
    partnerPreferences.religion_preference,
    userReligionId,
    breakdown.religion.maxScore
  );
  breakdown.religion.status = breakdown.religion.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 3. CASTE - 11% (Scored)
  // ============================================
  const userCasteId = userProfile.caste_details?.caste_id;
  breakdown.caste.score = calculateCategoryScore(
    partnerPreferences.caste_preference,
    userCasteId,
    breakdown.caste.maxScore
  );
  breakdown.caste.status = breakdown.caste.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 4. EDUCATION - 11% (Scored)
  // ============================================
  // Get highest qualification from education_details array
  const userEducation = userProfile.education_details && userProfile.education_details.length > 0
    ? userProfile.education_details[0].qualification // Assume first is highest
    : null;
  
  breakdown.education.score = calculateCategoryScore(
    partnerPreferences.education_preference,
    userEducation,
    breakdown.education.maxScore
  );
  breakdown.education.status = breakdown.education.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 5. EMPLOYMENT_TYPE - 14% (Scored)
  // ============================================
  const userEmploymentType = userProfile.professional_details?.employment_type;
  breakdown.profession.score = calculateCategoryScore(
    partnerPreferences.employment_type_preference,
    userEmploymentType,
    breakdown.profession.maxScore
  );
  breakdown.profession.status = breakdown.profession.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 6. LOCATION - 17% (Scored)
  // ============================================
  const userWorkState = userProfile.professional_details?.work_state;
  const userWorkCity = userProfile.professional_details?.work_city;
  
  // Handle preferred_location which is a JSON object {state: [cities]}
  let locationMatches = false;
  if (!partnerPreferences.preferred_location || Object.keys(partnerPreferences.preferred_location).length === 0) {
    // No preference specified, open to all
    locationMatches = true;
  } else if (userWorkState || userWorkCity) {
    // Check if user's work_state/work_city matches any preferred state or city
    const preferredLocations = partnerPreferences.preferred_location;
    
    // Check if user location matches any state or city in preferences
    for (const [state, cities] of Object.entries(preferredLocations)) {
      // Match if work_state matches the preferred state
      if (userWorkState && userWorkState.toLowerCase() === state.toLowerCase()) {
        locationMatches = true;
        break;
      }
      
      // Match if work_city matches any of the preferred cities for this state
      if (userWorkCity && Array.isArray(cities)) {
        for (const city of cities) {
          if (userWorkCity.toLowerCase() === city.toLowerCase()) {
            locationMatches = true;
            break;
          }
        }
      }
      
      if (locationMatches) break;
    }
  }
  
  breakdown.location.score = locationMatches ? breakdown.location.maxScore : 0;
  breakdown.location.status = breakdown.location.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 7. HEIGHT - 5% (Soft Score)
  // ============================================
  const userHeight = userProfile.personal_details?.height_cm;
  breakdown.height.score = calculateHeightScore(
    partnerPreferences.min_height,
    partnerPreferences.max_height,
    userHeight
  );
  breakdown.height.status = breakdown.height.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 8. WEIGHT - 5% (Soft Score)
  // ============================================
  const userWeight = userProfile.personal_details?.weight_kg;
  breakdown.weight.score = calculateWeightScore(
    partnerPreferences.min_weight,
    partnerPreferences.max_weight,
    userWeight
  );
  breakdown.weight.status = breakdown.weight.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 9. INCOME - 5% (Soft Score - Overlap Based)
  // ============================================
  const userIncome = userProfile.professional_details?.annual_income_range;
  const incomeScore = calculateIncomeScore(
    partnerPreferences.income_preference_min,
    partnerPreferences.income_preference_max,
    userIncome
  );
  
  // If income score is null (user hasn't provided income), skip this category
  if (incomeScore === null) {
    breakdown.income.status = 'skipped';
    breakdown.income.note = 'User income not provided - category skipped';
    breakdown.income.isSkipped = true;
  } else {
    breakdown.income.score = incomeScore;
    breakdown.income.status = breakdown.income.score > 0 ? 'match' : 'no-match';
  }
  
  // ============================================
  // 10. PHYSICAL STATUS - 5% (Scored)
  // ============================================
  const userPhysicalStatus = userProfile.personal_details?.physical_status;
  breakdown.physical_status.score = calculateCategoryScore(
    partnerPreferences.physical_status,
    userPhysicalStatus,
    breakdown.physical_status.maxScore
  );
  breakdown.physical_status.status = breakdown.physical_status.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // CALCULATE TOTAL SCORE
  // ============================================
  const totalScore = Object.values(breakdown)
    .filter(cat => !cat.isHardFilter && !cat.isSkipped)
    .reduce((sum, cat) => sum + cat.score, 0);
  
  const maxScore = Object.values(breakdown)
    .filter(cat => !cat.isHardFilter && !cat.isSkipped)
    .reduce((sum, cat) => sum + cat.maxScore, 0);
  
  const matchPercentage = Math.round((totalScore / maxScore) * 100);
  
  return {
    match: true,
    matchPercentage,
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    maxScore,
    breakdown,
    userAge,
    details: {
      userReligionId,
      userCasteId,
      userEducation,
      userEmploymentType,
      userLocation,
      userHeight,
      userWeight,
      userIncome,
      userPhysicalStatus
    }
  };
};

/**
 * Calculate match score with additional attributes (bonus scoring)
 * Extends base match with marital status, diet, habits, etc.
 * @param {Object} userProfile - User's complete profile
 * @param {Object} partnerPreferences - Partner preferences
 * @returns {Object} - Enhanced match result
 */
const calculateEnhancedMatchScore = (userProfile, partnerPreferences) => {
  // Get base match score
  const baseMatch = calculateMatchScore(userProfile, partnerPreferences);
  
  // If hard filter failed, return immediately
  if (!baseMatch.match) {
    return baseMatch;
  }
  
  // Calculate bonus scores for additional attributes
  const bonusBreakdown = {
    marital_status: { score: 0, maxScore: 5, status: 'pending' },
    mother_tongue: { score: 0, maxScore: 3, status: 'pending' },
    diet: { score: 0, maxScore: 3, status: 'pending' },
    drinking_habit: { score: 0, maxScore: 2, status: 'pending' },
    smoking_habit: { score: 0, maxScore: 2, status: 'pending' }
  };
  
  // Marital Status
  const userMaritalStatus = userProfile.personal_details?.marital_status;
  bonusBreakdown.marital_status.score = calculateCategoryScore(
    partnerPreferences.marital_status_preference,
    userMaritalStatus,
    bonusBreakdown.marital_status.maxScore
  );
  bonusBreakdown.marital_status.status = bonusBreakdown.marital_status.score > 0 ? 'match' : 'no-match';
  
  // Mother Tongue
  const userMotherTongue = userProfile.personal_details?.mother_tongue;
  bonusBreakdown.mother_tongue.score = calculateCategoryScore(
    partnerPreferences.mother_tongue_preference,
    userMotherTongue,
    bonusBreakdown.mother_tongue.maxScore
  );
  bonusBreakdown.mother_tongue.status = bonusBreakdown.mother_tongue.score > 0 ? 'match' : 'no-match';
  
  // Diet Preference
  const userDiet = userProfile.personal_details?.diet_preference;
  bonusBreakdown.diet.score = calculateCategoryScore(
    partnerPreferences.diet_preference,
    userDiet,
    bonusBreakdown.diet.maxScore
  );
  bonusBreakdown.diet.status = bonusBreakdown.diet.score > 0 ? 'match' : 'no-match';
  
  // Drinking Habit
  const userDrinking = userProfile.personal_details?.drinking_habit;
  bonusBreakdown.drinking_habit.score = calculateCategoryScore(
    partnerPreferences.drinking_habit_preference,
    userDrinking,
    bonusBreakdown.drinking_habit.maxScore
  );
  bonusBreakdown.drinking_habit.status = bonusBreakdown.drinking_habit.score > 0 ? 'match' : 'no-match';
  
  // Smoking Habit
  const userSmoking = userProfile.personal_details?.smoking_habit;
  bonusBreakdown.smoking_habit.score = calculateCategoryScore(
    partnerPreferences.smoking_habit_preference,
    userSmoking,
    bonusBreakdown.smoking_habit.maxScore
  );
  bonusBreakdown.smoking_habit.status = bonusBreakdown.smoking_habit.score > 0 ? 'match' : 'no-match';
  
  // Calculate bonus total
  const bonusScore = Object.values(bonusBreakdown).reduce((sum, cat) => sum + cat.score, 0);
  const bonusMaxScore = Object.values(bonusBreakdown).reduce((sum, cat) => sum + cat.maxScore, 0);
  
  // Enhanced total
  const enhancedTotalScore = baseMatch.totalScore + bonusScore;
  const enhancedMaxScore = baseMatch.maxScore + bonusMaxScore;
  const enhancedMatchPercentage = Math.round((enhancedTotalScore / enhancedMaxScore) * 100);
  
  return {
    ...baseMatch,
    matchPercentage: enhancedMatchPercentage,
    totalScore: Math.round(enhancedTotalScore * 10) / 10,
    maxScore: enhancedMaxScore,
    bonusScore: Math.round(bonusScore * 10) / 10,
    bonusMaxScore,
    bonusBreakdown,
    breakdown: {
      ...baseMatch.breakdown,
      ...bonusBreakdown
    }
  };
};

export {
  calculateMatchScore,
  calculateEnhancedMatchScore,
  calculateAge,
  isPreferenceMatch,
  calculateCategoryScore,
  calculateHeightScore,
  calculateWeightScore,
  calculateIncomeScore,
  parseIncomeRange
};
