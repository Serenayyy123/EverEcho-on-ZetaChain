#!/usr/bin/env tsx

/**
 * 前端状态测试脚本
 * 验证前端是否正常运行并可以访问
 */

import { execSync } from 'child_process';

async function testFrontendStatus() {
  console.log('🔍 Testing Frontend Status...\n');

  const tests = [
    {
      name: 'Frontend Server Accessibility',
      test: async () => {
        try {
          const response = await fetch('http://localhost:5173');
          return response.status === 200;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Backend Server Accessibility', 
      test: async () => {
        try {
          const response = await fetch('http://localhost:3001/api/health');
          return response.status === 200;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Blockchain Node Accessibility',
      test: async () => {
        try {
          const response = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1
            })
          });
          return response.status === 200;
        } catch (error) {
          return false;
        }
      }
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const result = await test.test();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ FAIL ${test.name} - Error: ${error}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All systems are operational!');
    console.log('\n📱 Access URLs:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:3001');
    console.log('   Blockchain: http://localhost:8545');
    console.log('\n🧪 Ready for Stage 4.9 Universal App testing!');
  } else {
    console.log('⚠️  Some systems are not accessible.');
    console.log('   Please check the services and try again.');
  }

  return allPassed;
}

// 运行测试
testFrontendStatus().catch(console.error);