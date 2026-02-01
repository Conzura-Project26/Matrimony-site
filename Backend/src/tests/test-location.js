/**
 * Quick test script for Location Service
 * Tests states and cities API integration
 */

import { getAllStates, getCitiesByState, validateCityInState } from '../services/locationService.js';

async function testLocationService() {
  console.log('🧪 Testing Location Service...\n');

  try {
    // Test 1: Get all states
    console.log('Test 1: Fetching all Indian states...');
    const states = await getAllStates();
    console.log(`✅ Successfully fetched ${states.length} states`);
    console.log(`First 5 states: ${states.slice(0, 5).join(', ')}\n`);

    // Test 2: Get cities for Karnataka
    console.log('Test 2: Fetching cities for Karnataka...');
    const cities = await getCitiesByState('Karnataka');
    console.log(`✅ Successfully fetched ${cities.length} cities for Karnataka`);
    console.log(`First 10 cities: ${cities.slice(0, 10).join(', ')}\n`);

    // Test 3: Search cities with "Bang"
    console.log('Test 3: Searching cities in Karnataka with "Bang"...');
    const bangCities = await getCitiesByState('Karnataka', 'Bang');
    console.log(`✅ Found ${bangCities.length} cities matching "Bang"`);
    console.log(`Results: ${bangCities.join(', ')}\n`);

    // Test 4: Validate city-state relationship
    console.log('Test 4: Validating city-state relationships...');
    const isBangaloreValid = await validateCityInState('Karnataka', 'Bangalore');
    const isMumbaiValidInKarnataka = await validateCityInState('Karnataka', 'Mumbai');
    console.log(`✅ Bangalore in Karnataka: ${isBangaloreValid}`);
    console.log(`✅ Mumbai in Karnataka: ${isMumbaiValidInKarnataka}\n`);

    // Test 5: Get cities for Maharashtra
    console.log('Test 5: Fetching cities for Maharashtra...');
    const maharashtraCities = await getCitiesByState('Maharashtra');
    console.log(`✅ Successfully fetched ${maharashtraCities.length} cities for Maharashtra`);
    console.log(`First 10 cities: ${maharashtraCities.slice(0, 10).join(', ')}\n`);

    console.log('✅ All tests passed!');
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    
    // Exit with error
    process.exit(1);
  }
}

// Add timeout to prevent hanging
setTimeout(() => {
  console.error('❌ Test timed out after 30 seconds');
  process.exit(1);
}, 30000);

testLocationService();
