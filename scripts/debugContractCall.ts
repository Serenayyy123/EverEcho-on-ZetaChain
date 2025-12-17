#!/usr/bin/env tsx

/**
 * 调试合约调用问题
 */

import { ethers } from 'ethers';

async function debugContractCall() {
  console.log('🔍 Debugging contract call issue...\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    console.log('Signer address:', await signer.getAddress());
    console.log('Signer balance:', ethers.formatEther(await provider.getBalance(await signer.getAddress())), 'ETH');
    
    // 合约地址
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    console.log('Contract address:', contractAddress);
    
    // 检查合约是否存在
    const code = await provider.getCode(contractAddress);
    console.log('Contract code exists:', code !== '0x');
    console.log('Contract code length:', code.length);
    
    // 简化的 ABI，只包含我们需要的函数
    const simpleABI = [
      "function preparePlan(address asset, uint256 amount, uint256 targetChainId) external returns (uint256)",
      "function nextRewardId() external view returns (uint256)",
      "event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount)"
    ];
    
    // 创建合约实例
    const contract = new ethers.Contract(contractAddress, simpleABI, signer);
    
    // 检查合约状态
    try {
      const nextId = await contract.nextRewardId();
      console.log('Next reward ID:', nextId.toString());
    } catch (error: any) {
      console.error('❌ Failed to read nextRewardId:', error.message);
    }
    
    // 测试参数
    const asset = '0x0000000000000000000000000000000000000000'; // ETH
    const amount = ethers.parseEther('0.01'); // 0.01 ETH
    const targetChainId = 11155111; // Sepolia
    
    console.log('\nTest parameters:');
    console.log('Asset:', asset);
    console.log('Amount:', amount.toString(), 'wei (', ethers.formatEther(amount), 'ETH)');
    console.log('Target Chain ID:', targetChainId);
    
    // 检查 amount > 0
    console.log('Amount > 0:', amount > 0n);
    
    // 尝试不同的方法调用
    console.log('\n🧪 Testing different call methods...');
    
    // 1. 尝试 staticCall
    try {
      console.log('1. Testing staticCall...');
      const result = await contract.preparePlan.staticCall(asset, amount, targetChainId);
      console.log('✅ StaticCall succeeded, result:', result.toString());
    } catch (error: any) {
      console.error('❌ StaticCall failed:', error.message);
      
      // 尝试解析错误数据
      if (error.data) {
        console.log('Error data:', error.data);
      }
    }
    
    // 2. 尝试 estimateGas
    try {
      console.log('2. Testing estimateGas...');
      const gasEstimate = await contract.preparePlan.estimateGas(asset, amount, targetChainId);
      console.log('✅ Gas estimation succeeded:', gasEstimate.toString());
    } catch (error: any) {
      console.error('❌ Gas estimation failed:', error.message);
    }
    
    // 3. 尝试使用不同的参数
    console.log('\n🔄 Testing with different parameters...');
    
    // 测试更大的金额
    try {
      const largerAmount = ethers.parseEther('1.0');
      console.log('Testing with 1.0 ETH...');
      await contract.preparePlan.staticCall(asset, largerAmount, targetChainId);
      console.log('✅ Larger amount works');
    } catch (error: any) {
      console.error('❌ Larger amount failed:', error.message);
    }
    
    // 测试不同的目标链
    try {
      console.log('Testing with different target chain (1)...');
      await contract.preparePlan.staticCall(asset, amount, 1);
      console.log('✅ Different target chain works');
    } catch (error: any) {
      console.error('❌ Different target chain failed:', error.message);
    }
    
  } catch (error: any) {
    console.error('\n❌ Debug failed:', error.message);
    console.error('Full error:', error);
  }
}

debugContractCall().catch(console.error);