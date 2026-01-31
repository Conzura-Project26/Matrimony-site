/**
 * Partner Preference Matching Algorithm
 * Calculates weighted match score between user profile and partner preferences
 * 
 * Scoring Breakdown:
 * - Age: Hard Filter (must match or excluded)
 * - Religion: 17% (scored)
 * - Caste: 11% (scored)
 * - Education: 11% (scored)
 * - Profession: 14% (scored)
 * - Location: 17% (scored)
 * - Height: 5% (soft score)
 * - Weight: 5% (soft score)
 * - Physical Status: 5% (scored)
 * 
 * Total Base Score: 85% (100% if all match perfectly)
 * Unspecified preferences = "open to all" (full score for that category)
 */

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
 * Main function: Calculate match percentage between user and preferences
 * @param {Object} userProfile - User's complete profile data
 * @param {Object} partnerPreferences - Partner preferences
 * @returns {Object} - Match result with score and breakdown
 */
const calculateMatchScore = (userProfile, partnerPreferences) => {
  const breakdown = {
    age: { score: 0, maxScore: 0, status: 'pass', isHardFilter: true },
    religion: { score: 0, maxScore: 17, status: 'pending' },
    caste: { score: 0, maxScore: 11, status: 'pending' },
    education: { score: 0, maxScore: 11, status: 'pending' },
    profession: { score: 0, maxScore: 14, status: 'pending' },
    location: { score: 0, maxScore: 17, status: 'pending' },
    height: { score: 0, maxScore: 5, status: 'pending' },
    weight: { score: 0, maxScore: 5, status: 'pending' },
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
  // 5. PROFESSION - 14% (Scored)
  // ============================================
  const userProfession = userProfile.professional_details?.occupation;
  breakdown.profession.score = calculateCategoryScore(
    partnerPreferences.profession_preference,
    userProfession,
    breakdown.profession.maxScore
  );
  breakdown.profession.status = breakdown.profession.score > 0 ? 'match' : 'no-match';
  
  // ============================================
  // 6. LOCATION - 17% (Scored)
  // ============================================
  const userLocation = userProfile.professional_details?.work_location;
  breakdown.location.score = calculateCategoryScore(
    partnerPreferences.location_preference,
    userLocation,
    breakdown.location.maxScore
  );
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
  // 9. PHYSICAL STATUS - 5% (Scored)
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
    .filter(cat => !cat.isHardFilter)
    .reduce((sum, cat) => sum + cat.score, 0);
  
  const maxScore = Object.values(breakdown)
    .filter(cat => !cat.isHardFilter)
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
      userProfession,
      userLocation,
      userHeight,
      userWeight,
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
  calculateWeightScore
};
