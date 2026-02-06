// This script watches for password changes and alerts when they happen
// Run this in one terminal while running tests in another

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const userId = '1a89ca75-de89-43f6-80c9-85f2628f3df7';

let previousHash = null;
let checkCount = 0;

async function checkPassword() {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password_hash: true,
      updated_at: true
    }
  });
  
  checkCount++;
  
  if (previousHash === null) {
    previousHash = user.password_hash;
    const isHarsha = await bcrypt.compare('Harsha@2004', user.password_hash);
    const isTest = await bcrypt.compare('Test@123', user.password_hash);
    console.log(`[${new Date().toISOString()}] Initial Check (#${checkCount})`);
    console.log(`  Hash: ${user.password_hash}`);
    console.log(`  Updated: ${user.updated_at}`);
    console.log(`  Password: ${isHarsha ? 'Harsha@2004' : isTest ? 'Test@123' : 'Unknown'}`);
    console.log(`\n 🔍 Monitoring for changes... (Ctrl+C to stop)\n`);
  } else if (user.password_hash !== previousHash) {
    const isHarsha = await bcrypt.compare('Harsha@2004', user.password_hash);
    const isTest = await bcrypt.compare('Test@123', user.password_hash);
    console.log(`\n🚨 PASSWORD CHANGED! (#${checkCount})`);
    console.log(`  Time: ${new Date().toISOString()}`);
    console.log(`  Old Hash: ${previousHash}`);
    console.log(`  New Hash: ${user.password_hash}`);
    console.log(`  Updated At: ${user.updated_at}`);
    console.log(`  New Password: ${isHarsha ? 'Harsha@2004' : isTest ? 'Test@123' : 'Unknown'}`);
    console.log();
    previousHash = user.password_hash;
  } else {
    // Silent check - only print every 10 checks
    if (checkCount % 10 === 0) {
      process.stdout.write(`.`);
    }
  }
}

console.log('=== PASSWORD CHANGE MONITOR ===\n');
console.log('Monitoring user: 1a89ca75-de89-43f6-80c9-85f2628f3df7');
console.log('Checking every 2 seconds...\n');

// Check immediately
checkPassword();

// Then check every 2 seconds
const interval = setInterval(checkPassword, 2000);

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\n👋 Stopping monitor...');
  clearInterval(interval);
  await prisma.$disconnect();
  process.exit(0);
});

