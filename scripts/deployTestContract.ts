#!/usr/bin/env tsx

/**
 * 部署一个简单的测试合约来验证基本功能
 */

import { ethers } from 'ethers';
import fs from 'fs';

async function deployTestContract() {
  console.log('🚀 Deploying Test Contract...\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    console.log('Deployer:', await signer.getAddress());
    console.log('Balance:', ethers.formatEther(await provider.getBalance(await signer.getAddress())), 'ETH');
    
    // 非常简单的测试合约
    const contractSource = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      
      contract TestReward {
          uint256 public nextRewardId = 1;
          
          struct RewardPlan {
              uint256 rewardId;
              address creator;
              address asset;
              uint256 amount;
              uint256 targetChainId;
          }
          
          mapping(uint256 => RewardPlan) public rewardPlans;
          
          event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount);
          
          function preparePlan(address asset, uint256 amount, uint256 targetChainId) external returns (uint256) {
              require(amount > 0, "Amount must be greater than 0");
              
              uint256 rewardId = nextRewardId++;
              
              rewardPlans[rewardId] = RewardPlan({
                  rewardId: rewardId,
                  creator: msg.sender,
                  asset: asset,
                  amount: amount,
                  targetChainId: targetChainId
              });
              
              emit RewardPlanCreated(rewardId, msg.sender, asset, amount);
              return rewardId;
          }
          
          function getRewardPlan(uint256 rewardId) external view returns (RewardPlan memory) {
              return rewardPlans[rewardId];
          }
      }
    `;
    
    // 编译合约
    console.log('📝 Compiling contract...');
    
    // 使用 solc 编译
    const solc = require('solc');
    
    const input = {
      language: 'Solidity',
      sources: {
        'TestReward.sol': {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      output.errors.forEach((error: any) => {
        if (error.severity === 'error') {
          console.error('❌ Compilation error:', error.message);
          return;
        }
      });
    }
    
    const contract = output.contracts['TestReward.sol']['TestReward'];
    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;
    
    console.log('✅ Contract compiled successfully');
    
    // 部署合约
    console.log('🚀 Deploying contract...');
    
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const deployedContract = await factory.deploy();
    await deployedContract.waitForDeployment();
    
    const contractAddress = await deployedContract.getAddress();
    console.log('✅ Contract deployed at:', contractAddress);
    
    // 测试合约
    console.log('\n🧪 Testing contract...');
    
    // 测试 nextRewardId
    const nextId = await deployedContract.nextRewardId();
    console.log('Next reward ID:', nextId.toString());
    
    // 测试 preparePlan
    const asset = '0x0000000000000000000000000000000000000000';
    const amount = ethers.parseEther('0.01');
    const targetChainId = 11155111;
    
    console.log('Calling preparePlan...');
    const tx = await deployedContract.preparePlan(asset, amount, targetChainId);
    const receipt = await tx.wait();
    
    console.log('✅ Transaction successful:', tx.hash);
    console.log('Block number:', receipt.blockNumber);
    
    // 检查事件
    const events = receipt.logs.map((log: any) => {
      try {
        return deployedContract.interface.parseLog(log);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    console.log('Events:', events.map((e: any) => ({ name: e.name, args: e.args })));
    
    // 更新环境变量
    const envPath = '.env.local';
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新或添加合约地址
    const addressLine = `VITE_UNIVERSAL_REWARD_ADDRESS=${contractAddress}`;
    if (envContent.includes('VITE_UNIVERSAL_REWARD_ADDRESS=')) {
      envContent = envContent.replace(/VITE_UNIVERSAL_REWARD_ADDRESS=.*/, addressLine);
    } else {
      envContent += `\n${addressLine}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env.local');
    
    // 保存 ABI
    const abiPath = 'frontend/src/contracts/TestReward.json';
    fs.writeFileSync(abiPath, JSON.stringify({ abi }, null, 2));
    console.log('📝 Saved ABI to', abiPath);
    
    console.log('\n🎉 Test contract deployment completed!');
    console.log('Contract Address:', contractAddress);
    console.log('Next steps:');
    console.log('1. Update frontend to use TestReward.json ABI');
    console.log('2. Test the preparePlan function in the frontend');
    
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('Full error:', error);
  }
}

deployTestContract().catch(console.error);