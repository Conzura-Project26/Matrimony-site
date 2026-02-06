#!/usr/bin/env node

/**
 * User Reporting Manual Test Script
 * Task 5.5 - Quick Manual Testing
 * 
 * Usage: node manual-test-reporting.js
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Test configuration
const config = {
  baseURL: '',
  userToken: '',
  reportedUserId: ''
};

async function main() {
  log('\n='.repeat(60), 'cyan');
  log('🧪 USER REPORTING SYSTEM - MANUAL TEST SCRIPT', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    // Step 1: Get configuration
    log('📝 Configuration Setup\n', 'yellow');
    
    config.baseURL = await question('Enter API Base URL (e.g., http://localhost:3000): ');
    config.userToken = await question('Enter your JWT token: ');
    config.reportedUserId = await question('Enter User ID to report (UUID): ');
    
    const client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Authorization': `Bearer ${config.userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    log('\n✅ Configuration complete!\n', 'green');
    
    // Test 1: Get Report Reasons
    log('='.repeat(60), 'cyan');
    log('Test 1: Get Report Reasons', 'cyan');
    log('='.repeat(60), 'cyan');
    
    try {
      const reasonsResponse = await client.get('/reports/reasons');
      log('✅ SUCCESS', 'green');
      log(`   Status: ${reasonsResponse.status}`, 'green');
      log(`   Categories: ${reasonsResponse.data.data.categories.length}`, 'green');
      
      log('\n📋 Available Categories:', 'yellow');
      reasonsResponse.data.data.categories.forEach((cat, idx) => {
        log(`   ${idx + 1}. ${cat.value} - ${cat.label}`, 'blue');
        log(`      ${cat.description}`, 'blue');
      });
    } catch (error) {
      log('❌ FAILED', 'red');
      log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      log(`   Status: ${error.response?.status}`, 'red');
    }
    
    // Test 2: Create Report
    log('\n' + '='.repeat(60), 'cyan');
    log('Test 2: Create User Report', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const proceed = await question('\nDo you want to submit a test report? (yes/no): ');
    
    if (proceed.toLowerCase() === 'yes' || proceed.toLowerCase() === 'y') {
      const category = await question('Enter category (e.g., FAKE_PROFILE): ');
      const reason = await question('Enter reason (min 10 chars): ');
      
      try {
        const createResponse = await client.post(`/reports/${config.reportedUserId}`, {
          category: category,
          reason: reason
        });
        
        log('\n✅ SUCCESS - Report Created!', 'green');
        log(`   Status: ${createResponse.status}`, 'green');
        log(`   Report ID: ${createResponse.data.data.report_id}`, 'green');
        log(`   Status: ${createResponse.data.data.status}`, 'green');
        log(`   Created: ${createResponse.data.data.created_at}`, 'green');
        
      } catch (error) {
        log('\n❌ FAILED', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        log(`   Status: ${error.response?.status}`, 'red');
        
        if (error.response?.data?.errors) {
          log('\n   Validation Errors:', 'red');
          error.response.data.errors.forEach(err => {
            log(`   - ${err.field}: ${err.message}`, 'red');
          });
        }
      }
    }
    
    // Test 3: View My Reports
    log('\n' + '='.repeat(60), 'cyan');
    log('Test 3: View My Reports', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const viewReports = await question('\nDo you want to view your reports? (yes/no): ');
    
    if (viewReports.toLowerCase() === 'yes' || viewReports.toLowerCase() === 'y') {
      const reportType = await question('Type (made/received/all) [default: all]: ') || 'all';
      
      try {
        const myReportsResponse = await client.get(`/reports/my-reports?type=${reportType}`);
        
        log('\n✅ SUCCESS', 'green');
        log(`   Status: ${myReportsResponse.status}`, 'green');
        log(`   Total Reports: ${myReportsResponse.data.data.pagination.total}`, 'green');
        log(`   Current Page: ${myReportsResponse.data.data.pagination.page}`, 'green');
        
        if (myReportsResponse.data.data.reports.length > 0) {
          log('\n📋 Your Reports:', 'yellow');
          myReportsResponse.data.data.reports.forEach((report, idx) => {
            log(`\n   ${idx + 1}. Report #${report.id}`, 'blue');
            log(`      Type: ${report.report_type}`, 'blue');
            log(`      Category: ${report.category}`, 'blue');
            log(`      Severity: ${report.severity}`, 'blue');
            log(`      Status: ${report.status}`, 'blue');
            log(`      Created: ${report.created_at}`, 'blue');
            log(`      Other Party: ${report.other_party.full_name} (${report.other_party.profile_id})`, 'blue');
          });
        } else {
          log('\n   No reports found', 'yellow');
        }
        
      } catch (error) {
        log('\n❌ FAILED', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
        log(`   Status: ${error.response?.status}`, 'red');
      }
    }
    
    // Test 4: Test Validations
    log('\n' + '='.repeat(60), 'cyan');
    log('Test 4: Validation Tests', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const testValidations = await question('\nDo you want to test validations? (yes/no): ');
    
    if (testValidations.toLowerCase() === 'yes' || testValidations.toLowerCase() === 'y') {
      // Test 4a: Short reason
      log('\n📝 Testing short reason (should fail)...', 'yellow');
      try {
        await client.post(`/reports/${config.reportedUserId}`, {
          category: 'SPAM',
          reason: 'Short'
        });
        log('❌ Unexpected success', 'red');
      } catch (error) {
        log('✅ Correctly rejected short reason', 'green');
        log(`   Error: ${error.response?.data?.message}`, 'green');
      }
      
      // Test 4b: Invalid category
      log('\n📝 Testing invalid category (should fail)...', 'yellow');
      try {
        await client.post(`/reports/${config.reportedUserId}`, {
          category: 'INVALID_CAT',
          reason: 'This is a test with invalid category'
        });
        log('❌ Unexpected success', 'red');
      } catch (error) {
        log('✅ Correctly rejected invalid category', 'green');
        log(`   Error: ${error.response?.data?.message}`, 'green');
      }
      
      // Test 4c: Missing fields
      log('\n📝 Testing missing required fields (should fail)...', 'yellow');
      try {
        await client.post(`/reports/${config.reportedUserId}`, {
          category: 'SPAM'
          // Missing reason
        });
        log('❌ Unexpected success', 'red');
      } catch (error) {
        log('✅ Correctly rejected missing fields', 'green');
        log(`   Error: ${error.response?.data?.message}`, 'green');
      }
    }
    
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ Testing Complete!', 'green');
    log('='.repeat(60) + '\n', 'cyan');
    
  } catch (error) {
    log('\n❌ Test script failed:', 'red');
    log(error.message, 'red');
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(error => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
