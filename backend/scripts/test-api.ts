/**
 * 测试 API 是否正常工作
 */

import axios from 'axios';

async function testAPI() {
  console.log('='.repeat(60));
  console.log('🧪 Testing API');
  console.log('='.repeat(60));

  try {
    // 测试获取 Task 3
    console.log('\n📡 Testing GET /api/task/3...');
    const response = await axios.get('http://localhost:3001/api/task/3');
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.category) {
      console.log(`\n✅ Category: ${response.data.category}`);
    } else {
      console.log('\n⚠️  No category in response');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete');
  console.log('='.repeat(60));
}

testAPI();
