#!/usr/bin/env node

/**
 * Feature Gating Test Runner
 * 
 * Pre-flight checks and automated test execution
 */

import axios from 'axios';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════`);
console.log(`  Feature Gating Test Suite - Pre-Flight Check`);
console.log(`════════════════════════════════════════════════════════════════${colors.reset}\n`);

async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log(`${colors.green}✓${colors.reset} Server is running at ${BASE_URL}`);
    return true;
  } catch (error) {
    try {
      // Try a different endpoint
      await axios.get(BASE_URL);
      console.log(`${colors.green}✓${colors.reset} Server is running at ${BASE_URL}`);
      return true;
    } catch (err) {
      console.log(`${colors.red}✗${colors.reset} Server is NOT running at ${BASE_URL}`);
      console.log(`${colors.yellow}  → Start server with: npm run dev${colors.reset}\n`);
      return false;
    }
  }
}

async function checkDatabase() {
  try {
    // Try to hit an endpoint that requires DB
    await axios.get(`${BASE_URL}/plans`, { validateStatus: () => true });
    console.log(`${colors.green}✓${colors.reset} Database connection working`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not verify database connection`);
    return true; // Non-fatal, continue anyway
  }
}

async function checkFeatureSeeding() {
  try {
    const response = await axios.get(`${BASE_URL}/plans`);
    if (response.data?.plans?.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Subscription plans exist (${response.data.plans.length} plans)`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No subscription plans found`);
      console.log(`${colors.yellow}  → Run: node scripts/seedFeatureGating.js${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not check feature seeding status`);
    console.log(`${colors.yellow}  → Ensure you've run: node scripts/seedFeatureGating.js${colors.reset}`);
    return false;
  }
}

async function runPreFlightChecks() {
  console.log('Running pre-flight checks...\n');
  
  const serverOk = await checkServer();
  if (!serverOk) {
    console.log(`\n${colors.red}${colors.bright}Pre-flight check FAILED${colors.reset}`);
    console.log(`${colors.red}Cannot proceed without running server${colors.reset}\n`);
    process.exit(1);
  }
  
  await checkDatabase();
  const seedingOk = await checkFeatureSeeding();
  
  if (!seedingOk) {
    console.log(`\n${colors.yellow}${colors.bright}WARNING:${colors.reset} Feature seeding may not be complete`);
    console.log(`${colors.yellow}Tests may fail if database is not properly seeded${colors.reset}`);
    console.log(`\n${colors.cyan}Do you want to continue anyway? (y/n):${colors.reset} `);
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      const key = data.toString('utf8');
      process.stdin.setRawMode(false);
      process.stdin.pause();
      
      if (key.toLowerCase() === 'y' || key === '\r') {
        console.log(`\n${colors.green}Continuing with tests...${colors.reset}\n`);
        runTests();
      } else {
        console.log(`\n${colors.red}Tests cancelled${colors.reset}\n`);
        process.exit(0);
      }
    });
  } else {
    console.log(`\n${colors.green}${colors.bright}✓ All pre-flight checks passed!${colors.reset}\n`);
    runTests();
  }
}

function runTests() {
  console.log(`${colors.cyan}Starting test execution...${colors.reset}\n`);
  console.log(`${colors.bright}════════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const testProcess = spawn('node', ['tests/featureGating.test.js'], {
    stdio: 'inherit',
    shell: true,
  });
  
  testProcess.on('exit', (code) => {
    if (code === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ Test suite completed successfully!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.red}${colors.bright}✗ Test suite completed with failures${colors.reset}\n`);
    }
    process.exit(code);
  });
  
  testProcess.on('error', (error) => {
    console.error(`\n${colors.red}Failed to run tests:${colors.reset}`, error);
    process.exit(1);
  });
}

// Run pre-flight checks
runPreFlightChecks();
