import axios from 'axios';

console.log('⏳ Waiting 65 seconds for rate limit window to reset...');
await new Promise(r => setTimeout(r, 65000));

console.log('✅ Starting clean rate limit test...\n');

const loginRes = await axios.post('http://localhost:3000/auth/login', {
  identifier: '9380245433',
  password: 'Harsha@2004'
});

const token = loginRes.data.data.accessToken;
const receiverId = 'd181e7a7-1414-4690-828b-1022dede6c81';

let success = 0;
let blocked = 0;

for (let i = 1; i <= 32; i++) {
  try {
    const res = await axios.post(
      `http://localhost:3000/messages/${receiverId}`,
      { content: `Rate limit test message ${i}` },
      { 
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true 
      }
    );
    
    if (res.status === 201) {
      success++;
      process.stdout.write('✅');
    } else if (res.status === 429) {
      blocked++;
      console.log(`\n⛔ Rate limited at message #${i}`);
      console.log(`   Message: ${res.data.message}`);
      break;
    }
  } catch (err) {
    console.log(`\n❌ Error at #${i}:`, err.message);
    break;
  }
}

console.log(`\n\n📊 RESULTS:`);
console.log(`   ✅ Successful: ${success}`);
console.log(`   ⛔ Rate limited: ${blocked}`);
console.log(`\n${success === 30 && blocked === 1 ? '🎉 PERFECT! Rate limiting works correctly (30/min)' : `⚠️  Unexpected result (expected 30 success + 1 blocked)`}`);
