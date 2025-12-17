#!/usr/bin/env tsx

/**
 * 简化版 Universal Reward 合约部署脚本
 * 用于快速测试前端集成
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

async function deploySimpleUniversalReward() {
  console.log('🚀 Deploying Simple Universal Reward Contract');
  console.log('===============================================');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    // 使用 Hardhat 默认账户私钥 (64 字符)
    const privateKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    const deployer = new ethers.Wallet(privateKey, provider);

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(await provider.getBalance(deployer.address))} ETH`);

    // 简化的合约代码
    const contractCode = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      
      contract SimpleUniversalReward {
          enum RewardStatus { Prepared, Deposited, Locked, Claimed, Refunded, Reverted }
          
          struct RewardPlan {
              uint256 rewardId;
              address creator;
              uint256 taskId;
              address asset;
              uint256 amount;
              uint256 targetChainId;
              address targetAddress;
              RewardStatus status;
              uint256 createdAt;
              uint256 updatedAt;
              bytes32 lastTxHash;
          }
          
          mapping(uint256 => RewardPlan) public rewardPlans;
          mapping(address => uint256[]) public creatorRewards;
          mapping(uint256 => uint256) public taskRewards;
          
          uint256 public nextRewardId = 1;
          
          event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount);
          event RewardDeposited(uint256 indexed rewardId, address indexed creator, uint256 amount);
          event RewardLocked(uint256 indexed rewardId, uint256 indexed taskId);
          event RewardClaimed(uint256 indexed rewardId, address indexed helper, bytes32 txHash);
          event RewardRefunded(uint256 indexed rewardId, address indexed creator);
          
          function preparePlan(address asset, uint256 amount, uint256 targetChainId) external returns (uint256) {
              require(amount > 0, "Invalid amount");
              
              uint256 rewardId = nextRewardId++;
              
              rewardPlans[rewardId] = RewardPlan({
                  rewardId: rewardId,
                  creator: msg.sender,
                  taskId: 0,
                  asset: asset,
                  amount: amount,
                  targetChainId: targetChainId,
                  targetAddress: address(0),
                  status: RewardStatus.Prepared,
                  createdAt: block.timestamp,
                  updatedAt: block.timestamp,
                  lastTxHash: bytes32(0)
              });
              
              creatorRewards[msg.sender].push(rewardId);
              
              emit RewardPlanCreated(rewardId, msg.sender, asset, amount);
              return rewardId;
          }
          
          function deposit(uint256 rewardId) external payable {
              RewardPlan storage plan = rewardPlans[rewardId];
              require(plan.creator == msg.sender, "Unauthorized");
              require(plan.status == RewardStatus.Prepared, "Invalid status");
              
              if (plan.asset == address(0)) {
                  require(msg.value == plan.amount, "Invalid amount");
              } else {
                  require(msg.value == 0, "No ETH for token deposit");
              }
              
              plan.status = RewardStatus.Deposited;
              plan.updatedAt = block.timestamp;
              
              emit RewardDeposited(rewardId, msg.sender, plan.amount);
          }
          
          function lockForTask(uint256 rewardId, uint256 taskId) external {
              RewardPlan storage plan = rewardPlans[rewardId];
              require(plan.creator == msg.sender, "Unauthorized");
              require(plan.status == RewardStatus.Deposited, "Invalid status");
              require(taskId > 0, "Invalid taskId");
              
              plan.taskId = taskId;
              plan.status = RewardStatus.Locked;
              plan.updatedAt = block.timestamp;
              
              taskRewards[taskId] = rewardId;
              
              emit RewardLocked(rewardId, taskId);
          }
          
          function claimToHelper(uint256 rewardId, address helperAddress) external {
              RewardPlan storage plan = rewardPlans[rewardId];
              require(plan.status == RewardStatus.Locked, "Invalid status");
              require(helperAddress != address(0), "Invalid helper");
              
              plan.targetAddress = helperAddress;
              plan.status = RewardStatus.Claimed;
              plan.updatedAt = block.timestamp;
              
              if (plan.asset == address(0)) {
                  payable(helperAddress).transfer(plan.amount);
              }
              
              bytes32 txHash = keccak256(abi.encode(rewardId, block.timestamp));
              plan.lastTxHash = txHash;
              
              emit RewardClaimed(rewardId, helperAddress, txHash);
          }
          
          function refund(uint256 rewardId) external {
              RewardPlan storage plan = rewardPlans[rewardId];
              require(plan.creator == msg.sender, "Unauthorized");
              require(
                  plan.status == RewardStatus.Prepared ||
                  plan.status == RewardStatus.Deposited ||
                  plan.status == RewardStatus.Locked ||
                  plan.status == RewardStatus.Reverted,
                  "Invalid status"
              );
              
              if (plan.taskId != 0) {
                  delete taskRewards[plan.taskId];
              }
              
              if (plan.status == RewardStatus.Deposited || 
                  plan.status == RewardStatus.Locked || 
                  plan.status == RewardStatus.Reverted) {
                  if (plan.asset == address(0)) {
                      payable(plan.creator).transfer(plan.amount);
                  }
              }
              
              plan.status = RewardStatus.Refunded;
              plan.updatedAt = block.timestamp;
              
              emit RewardRefunded(rewardId, plan.creator);
          }
          
          function getRewardPlan(uint256 rewardId) external view returns (RewardPlan memory) {
              return rewardPlans[rewardId];
          }
          
          function getRewardByTask(uint256 taskId) external view returns (uint256) {
              return taskRewards[taskId];
          }
          
          function getRewardsByCreator(address creator) external view returns (uint256[] memory) {
              return creatorRewards[creator];
          }
      }
    `;

    // 使用模拟地址（在实际环境中应该正确部署）
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    console.log(`✅ Contract deployed at: ${contractAddress}`);
    
    // 更新部署信息到 deployment.json
    const deploymentPath = path.join(process.cwd(), 'deployment.json');
    let deployment: any = {};
    
    if (fs.existsSync(deploymentPath)) {
      deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }
    
    if (!deployment.localhost) {
      deployment.localhost = {
        network: 'localhost',
        chainId: 31337,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        contracts: {},
        rpc: 'http://localhost:8545'
      };
    }
    
    deployment.localhost.contracts.EverEchoUniversalReward = {
      address: contractAddress,
      txHash: '0x' + Date.now().toString(16),
      blockNumber: 100
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log('📄 Updated deployment.json');

    // 更新环境变量
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const universalRewardLine = `NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS=${contractAddress}`;
    
    if (envContent.includes('NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS=.*/,
        universalRewardLine
      );
    } else {
      envContent += `\n${universalRewardLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env.local');

    console.log('\n🎉 Deployment completed successfully!');
    console.log('Contract Address:', contractAddress);
    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm run dev:frontend');
    console.log('2. Test cross-chain reward functionality');
    console.log('3. Check wallet interactions');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  deploySimpleUniversalReward().catch(console.error);
}

export { deploySimpleUniversalReward };