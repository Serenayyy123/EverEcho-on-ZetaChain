import { ethers } from 'ethers';

// 测试RPC端点的可用性和响应格式
async function testRPCEndpoints() {
  console.log('🧪 Testing RPC endpoints for JSON parsing issues...\n');

  const testAddress = '0x0000000000000000000000000000000000000000'; // 零地址，用于测试

  // 测试端点配置
  const rpcEndpoints = {
    'ETH Sepolia': [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
      'https://rpc.sepolia.org'
    ],
    'ZetaChain Athens': [
      'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
      'https://rpc.ankr.com/zetachain_evm_athens_testnet'
    ]
  };

  for (const [networkName, urls] of Object.entries(rpcEndpoints)) {
    console.log(`\n📡 Testing ${networkName} endpoints:`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n  ${i + 1}. Testing: ${url}`);
      
      try {
        // 创建provider
        const provider = new ethers.JsonRpcProvider(url, undefined, {
          staticNetwork: true
        });

        // 测试基本连接
        console.log('    ⏳ Testing connection...');
        const startTime = Date.now();
        
        // 设置超时
        const balance = await Promise.race([
          provider.getBalance(testAddress),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
          )
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`    ✅ Success! Balance: ${ethers.formatEther(balance)} ETH (${duration}ms)`);
        
        // 测试网络信息
        try {
          const network = await provider.getNetwork();
          console.log(`    📊 Network: Chain ID ${network.chainId}, Name: ${network.name}`);
        } catch (networkError) {
          console.log(`    ⚠️  Network info unavailable: ${networkError}`);
        }
        
      } catch (error: any) {
        console.log(`    ❌ Failed: ${error.message}`);
        
        // 检查是否是JSON解析错误
        if (error.message.includes('JSON') || error.message.includes('json')) {
          console.log(`    🔍 JSON parsing error detected!`);
          
          // 尝试直接HTTP请求来查看响应
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [testAddress, 'latest'],
                id: 1
              })
            });
            
            const text = await response.text();
            console.log(`    📝 Raw response: ${text.substring(0, 200)}...`);
            
            try {
              const json = JSON.parse(text);
              console.log(`    ✅ Response is valid JSON`);
            } catch (parseError) {
              console.log(`    ❌ Response is NOT valid JSON: ${parseError}`);
            }
          } catch (fetchError) {
            console.log(`    ❌ Direct fetch failed: ${fetchError}`);
          }
        }
      }
    }
  }

  console.log('\n🏁 RPC endpoint testing completed!');
}

// 测试ERC20代币查询
async function testERC20Query() {
  console.log('\n🪙 Testing ERC20 token queries...\n');

  const testAddress = '0x0000000000000000000000000000000000000000';
  const usdcAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // ETH Sepolia USDC

  const sepoliaEndpoints = [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.gateway.tenderly.co',
    'https://rpc.sepolia.org'
  ];

  for (let i = 0; i < sepoliaEndpoints.length; i++) {
    const url = sepoliaEndpoints[i];
    console.log(`\n  ${i + 1}. Testing ERC20 on: ${url}`);
    
    try {
      const provider = new ethers.JsonRpcProvider(url, 11155111, {
        staticNetwork: true
      });

      const tokenContract = new ethers.Contract(
        usdcAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );

      console.log('    ⏳ Querying USDC balance and decimals...');
      const startTime = Date.now();
      
      const [balance, decimals] = await Promise.race([
        Promise.all([
          tokenContract.balanceOf(testAddress),
          tokenContract.decimals()
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`    ✅ Success! USDC Balance: ${ethers.formatUnits(balance, decimals)} USDC (${duration}ms)`);
      
    } catch (error: any) {
      console.log(`    ❌ Failed: ${error.message}`);
    }
  }
}

// 运行测试
async function main() {
  try {
    await testRPCEndpoints();
    await testERC20Query();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main().catch(console.error);