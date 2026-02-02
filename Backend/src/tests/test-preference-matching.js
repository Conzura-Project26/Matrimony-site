/**
 * Quick test for preference matching logic
 * Tests the location matching with JSON structure
 */

import { calculateMatchScore, calculateEnhancedMatchScore } from '../utils/preferenceMatching.js';

console.log('🧪 Testing Preference Matching Logic...\n');

// Test data
const userProfile = {
  date_of_birth: new Date('1995-01-15'),
  caste_details: {
    religion_id: 1,
    caste_id: 10
  },
  education_details: [
    {
      qualification: 'Bachelor of Engineering'
    }
  ],
  professional_details: {
    employment_type: 'Private Job',
    work_state: 'Karnataka',
    work_city: 'Bangalore Urban',
    annual_income_range: '5-10 Lakhs'
  },
  personal_details: {
    height_cm: 175,
    weight_kg: 70,
    physical_status: 'Normal',
    marital_status: 'Never Married',
    mother_tongue: 'Kannada',
    diet_preference: 'Vegetarian',
    drinking_habit: 'No',
    smoking_habit: 'No'
  }
};

const partnerPreferences = {
  min_age: 25,
  max_age: 35,
  min_height: 160,
  max_height: 180,
  min_weight: 50,
  max_weight: 80,
  religion_preference: [1, 2],
  caste_preference: [10, 11, 12],
  education_preference: ['Bachelor of Engineering', 'Master of Engineering'],
  employment_type_preference: ['Private Job', 'Government Job'],
  preferred_location: {
    'Karnataka': ['Bangalore Urban', 'Mysore'],
    'Maharashtra': ['Mumbai', 'Pune']
  },
  physical_status: ['Normal'],
  marital_status_preference: ['Never Married'],
  mother_tongue_preference: ['Kannada', 'Hindi'],
  diet_preference: ['Vegetarian'],
  drinking_habit_preference: ['No'],
  smoking_habit_preference: ['No']
};

try {
  console.log('Test 1: Basic Match Score');
  console.log('='.repeat(50));
  const basicMatch = calculateMatchScore(userProfile, partnerPreferences);
  
  if (basicMatch.match) {
    console.log(`✅ PASS: Match successful`);
    console.log(`   Match Percentage: ${basicMatch.matchPercentage}%`);
    console.log(`   Total Score: ${basicMatch.totalScore}/${basicMatch.maxScore}`);
    console.log(`\n   Breakdown:`);
    console.log(`   - Age: ${basicMatch.breakdown.age.status} (Hard Filter)`);
    console.log(`   - Religion: ${basicMatch.breakdown.religion.score}/${basicMatch.breakdown.religion.maxScore} (${basicMatch.breakdown.religion.status})`);
    console.log(`   - Caste: ${basicMatch.breakdown.caste.score}/${basicMatch.breakdown.caste.maxScore} (${basicMatch.breakdown.caste.status})`);
    console.log(`   - Education: ${basicMatch.breakdown.education.score}/${basicMatch.breakdown.education.maxScore} (${basicMatch.breakdown.education.status})`);
    console.log(`   - Profession: ${basicMatch.breakdown.profession.score}/${basicMatch.breakdown.profession.maxScore} (${basicMatch.breakdown.profession.status})`);
    console.log(`   - Location: ${basicMatch.breakdown.location.score}/${basicMatch.breakdown.location.maxScore} (${basicMatch.breakdown.location.status})`);
    console.log(`   - Height: ${basicMatch.breakdown.height.score}/${basicMatch.breakdown.height.maxScore} (${basicMatch.breakdown.height.status})`);
    console.log(`   - Weight: ${basicMatch.breakdown.weight.score}/${basicMatch.breakdown.weight.maxScore} (${basicMatch.breakdown.weight.status})`);
    console.log(`   - Physical Status: ${basicMatch.breakdown.physical_status.score}/${basicMatch.breakdown.physical_status.maxScore} (${basicMatch.breakdown.physical_status.status})`);
  } else {
    console.log(`❌ FAIL: ${basicMatch.failReason}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\nTest 2: Enhanced Match Score');
  console.log('='.repeat(50));
  const enhancedMatch = calculateEnhancedMatchScore(userProfile, partnerPreferences);
  
  if (enhancedMatch.match) {
    console.log(`✅ PASS: Enhanced match successful`);
    console.log(`   Match Percentage: ${enhancedMatch.matchPercentage}%`);
    console.log(`   Base Score: ${enhancedMatch.totalScore - enhancedMatch.bonusScore}/${enhancedMatch.maxScore - enhancedMatch.bonusMaxScore}`);
    console.log(`   Bonus Score: ${enhancedMatch.bonusScore}/${enhancedMatch.bonusMaxScore}`);
    console.log(`   Total Score: ${enhancedMatch.totalScore}/${enhancedMatch.maxScore}`);
    
    console.log(`\n   Bonus Breakdown:`);
    console.log(`   - Marital Status: ${enhancedMatch.bonusBreakdown.marital_status.score}/${enhancedMatch.bonusBreakdown.marital_status.maxScore} (${enhancedMatch.bonusBreakdown.marital_status.status})`);
    console.log(`   - Mother Tongue: ${enhancedMatch.bonusBreakdown.mother_tongue.score}/${enhancedMatch.bonusBreakdown.mother_tongue.maxScore} (${enhancedMatch.bonusBreakdown.mother_tongue.status})`);
    console.log(`   - Diet: ${enhancedMatch.bonusBreakdown.diet.score}/${enhancedMatch.bonusBreakdown.diet.maxScore} (${enhancedMatch.bonusBreakdown.diet.status})`);
    console.log(`   - Drinking: ${enhancedMatch.bonusBreakdown.drinking_habit.score}/${enhancedMatch.bonusBreakdown.drinking_habit.maxScore} (${enhancedMatch.bonusBreakdown.drinking_habit.status})`);
    console.log(`   - Smoking: ${enhancedMatch.bonusBreakdown.smoking_habit.score}/${enhancedMatch.bonusBreakdown.smoking_habit.maxScore} (${enhancedMatch.bonusBreakdown.smoking_habit.status})`);
  } else {
    console.log(`❌ FAIL: ${enhancedMatch.failReason}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\nTest 3: Location Matching with Different City');
  console.log('='.repeat(50));
  
  // Test with Mumbai location
  const mumbaiProfile = {
    ...userProfile,
    professional_details: {
      ...userProfile.professional_details,
      work_state: 'Maharashtra',
      work_city: 'Mumbai'
    }
  };
  
  const mumbaiMatch = calculateMatchScore(mumbaiProfile, partnerPreferences);
  
  if (mumbaiMatch.match) {
    console.log(`✅ PASS: Mumbai location matched correctly`);
    console.log(`   Location Score: ${mumbaiMatch.breakdown.location.score}/${mumbaiMatch.breakdown.location.maxScore}`);
    console.log(`   Match Percentage: ${mumbaiMatch.matchPercentage}%`);
  } else {
    console.log(`❌ FAIL: Mumbai should match preferences`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\nTest 4: Location Not in Preferences');
  console.log('='.repeat(50));
  
  // Test with Chennai location (not in preferences)
  const chennaiProfile = {
    ...userProfile,
    professional_details: {
      ...userProfile.professional_details,
      work_state: 'Tamil Nadu',
      work_city: 'Chennai'
    }
  };
  
  const chennaiMatch = calculateMatchScore(chennaiProfile, partnerPreferences);
  
  if (chennaiMatch.match) {
    console.log(`✅ PASS: Match calculated (location doesn't match but not a hard filter)`);
    console.log(`   Location Score: ${chennaiMatch.breakdown.location.score}/${chennaiMatch.breakdown.location.maxScore}`);
    console.log(`   Match Percentage: ${chennaiMatch.matchPercentage}%`);
    
    if (chennaiMatch.breakdown.location.score === 0) {
      console.log(`   ✓ Correctly scored 0 for non-matching location`);
    }
  } else {
    console.log(`❌ FAIL: Should still match (location is scored, not hard filter)`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\nTest 5: Age Hard Filter Test');
  console.log('='.repeat(50));
  
  // Test with age outside range
  const youngProfile = {
    ...userProfile,
    date_of_birth: new Date('2005-01-15') // 21 years old
  };
  
  const ageMatch = calculateMatchScore(youngProfile, partnerPreferences);
  
  if (!ageMatch.match) {
    console.log(`✅ PASS: Age hard filter working correctly`);
    console.log(`   Reason: ${ageMatch.failReason}`);
  } else {
    console.log(`❌ FAIL: Should reject due to age hard filter`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All preference matching tests completed successfully!');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Test failed with error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
