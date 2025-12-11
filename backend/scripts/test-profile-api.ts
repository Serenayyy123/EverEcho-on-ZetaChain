import { getProfile } from '../src/services/profileService';

async function testProfileAPI() {
  const address = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
  
  console.log(`Testing Profile API for: ${address}\n`);
  
  try {
    const profile = await getProfile(address);
    
    if (profile) {
      console.log('✅ Profile found:');
      console.log(JSON.stringify(profile, null, 2));
    } else {
      console.log('❌ Profile not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProfileAPI();
