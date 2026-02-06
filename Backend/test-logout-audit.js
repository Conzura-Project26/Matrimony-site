import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testLogout() {
  try {
    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });
    
    const { accessToken, refreshToken } = loginResponse.data.data;
    const userId = loginResponse.data.data.user.id;
    console.log('   ✅ Login successful');
    console.log('   User ID:', userId);
    console.log('   Access Token:', accessToken.substring(0, 30) + '...');
    console.log('   Refresh Token:', refreshToken.substring(0, 30) + '...');
    
    // 2. Logout
    console.log('\n2. Logging out...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, 
      { refresh_token: refreshToken },
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    console.log('   ✅ Logout response:', logoutResponse.data);
    
    // 3. Wait a moment for async audit log
    console.log('\n3. Waiting 2 seconds for audit log...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Check if audit log was created
    console.log('\n4. Checking audit logs...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380422508',
      password: 'Nishanth@2005'
    });
    
    const adminToken = adminLoginResponse.data.data.accessToken;
    
    const logsResponse = await axios.get(`${BASE_URL}/admin/audit-logs?action=LOGOUT&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('   Full response:', JSON.stringify(logsResponse.data, null, 2));
    
    const logs = logsResponse.data?.data?.data || logsResponse.data?.data || [];
    const total = logsResponse.data?.data?.pagination?.total || logs.length;
    
    console.log('   Total LOGOUT logs:', total);
    
    if (logs.length > 0) {
      console.log('   Latest LOGOUT log:');
      const latestLog = logs[0];
      console.log('     ID:', latestLog.id);
      console.log('     Actor:', latestLog.actor.full_name);
      console.log('     Action:', latestLog.action);
      console.log('     Metadata:', JSON.stringify(latestLog.metadata, null, 6));
      console.log('     Created:', latestLog.created_at);
    } else {
      console.log('   ❌ No LOGOUT logs found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogout();
