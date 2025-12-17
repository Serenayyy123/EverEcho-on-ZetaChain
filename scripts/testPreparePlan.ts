#!/usr/bin/env tsx

/**
 * 测试 preparePlan 函数调用
 */

import { ethers } from 'ethers';
import EverEchoUniversalRewardABI from '../frontend/src/contracts/EverEchoUniversalReward.json';

async function testPreparePlan() {
  console.log('🧪 Testing preparePlan function call...\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    console.log('Signer address:', await signer.getAddress());
    console.log('Signer balance:', ethers.formatEther(await provider.getBalance(await signer.getAddress())), 'ETH');
    
    // 合约地址
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    // 创建合约实例
    const contract = new ethers.Contract(contractAddress, EverEchoUniversalRewardABI.abi, signer);
    
    console.log('Contract address:', contractAddress);
    
    // 检查合约是否存在
    const code = await provider.getCode(contractAddress);
    console.log('Contract code exists:', code !== '0x');
    
    // 测试参数
    const asset = '0x0000000000000000000000000000000000000000'; // ETH
    const amount = ethers.parseEther('0.01'); // 0.01 ETH
    const targetChainId = 11155111; // Sepolia
    
    console.log('\nTest parameters:');
    console.log('Asset:', asset);
    console.log('Amount:', ethers.formatEther(amount), 'ETH');
    console.log('Target Chain ID:', targetChainId);
    
    // 估算 gas
    console.log('\n📊 Estimating gas...');
    try {
      const gasEstimate = await contract.preparePlan.estimateGas(asset, amount, targetChainId);
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (error: any) {
      console.error('❌ Gas estimation failed:', error.message);
      
      // 尝试调用 static call 来获取更详细的错误
      try {
        await contract.preparePlan.staticCall(asset, amount, targetChainId);
      } catch (staticError: any) {
        console.error('❌ Static call failed:', staticError.message);
      }
      return;
    }
    
    // 执行交易
    console.log('\n🚀 Executing preparePlan...');
    const tx = await contract.preparePlan(asset, amount, targetChainId);
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // 解析事件
    const events = receipt.logs.map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    console.log('\n📋 Events:');
    events.forEach((event: any) => {
      console.log(`- ${event.name}:`, event.args);
    });
    
    console.log('\n✅ preparePlan test completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testPreparePlan().catch(console.error);