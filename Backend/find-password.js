import bcrypt from 'bcrypt';

const storedHash = '$2b$10$p0tpTcLP9gpbV8ZCcr5eOeJ3RqzWBCRLe1VSIhncjVYZeQDXjAWTK';

const possiblePasswords = [
  'Harsha@2004',
  'harsha@2004',
  'Harsha@123',
  'Test@123',
  'Test@1234',
  'Kshitij@2004',
  'Rahul@2004',
  'Nishanth@2005',
  'password',
  'Password@123'
];

console.log('Testing stored hash against possible passwords...\n');

for (const pwd of possiblePasswords) {
  const matches = await bcrypt.compare(pwd, storedHash);
  if (matches) {
    console.log(`✅ MATCH FOUND: "${pwd}"`);
  } else {
    console.log(`❌ No match: "${pwd}"`);
  }
}

console.log('\nDone!');
