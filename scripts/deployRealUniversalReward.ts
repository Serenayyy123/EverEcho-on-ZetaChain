#!/usr/bin/env tsx

/**
 * 部署真实的 EverEcho Universal Reward 合约
 */

import { ethers } from 'ethers';
import fs from 'fs';

async function deployRealUniversalReward() {
  console.log('🚀 Deploying Real EverEcho Universal Reward Contract\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    console.log('Deployer:', await signer.getAddress());
    console.log('Balance:', ethers.formatEther(await provider.getBalance(await signer.getAddress())), 'ETH');
    
    // 简化版的 EverEcho Universal Reward 合约（适用于本地测试）
    const contractSource = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      
      contract EverEchoUniversalReward {
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
          
          modifier onlyCreator(uint256 rewardId) {
              require(rewardPlans[rewardId].creator == msg.sender, "Unauthorized");
              _;
          }
          
          modifier validRewardId(uint256 rewardId) {
              require(rewardId > 0 && rewardId < nextRewardId, "Invalid reward ID");
              _;
          }
          
          modifier inStatus(uint256 rewardId, RewardStatus expectedStatus) {
              require(rewardPlans[rewardId].status == expectedStatus, "Invalid status");
              _;
          }
          
          function preparePlan(address asset, uint256 amount, uint256 targetChainId) 
              external 
              returns (uint256) 
          {
              require(amount > 0, "Amount must be greater than 0");
              
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
          
          function deposit(uint256 rewardId) 
              external 
              payable
              validRewardId(rewardId)
              onlyCreator(rewardId)
              inStatus(rewardId, RewardStatus.Prepared)
          {
              RewardPlan storage plan = rewardPlans[rewardId];
              
              if (plan.asset == address(0)) {
                  // ETH deposit
                  require(msg.value == plan.amount, "Incorrect ETH amount");
              } else {
                  // Token deposit (simplified - in real implementation would use transferFrom)
                  require(msg.value == 0, "No ETH for token deposit");
                  // TODO: Implement ERC20 transferFrom
              }
              
              plan.status = RewardStatus.Deposited;
              plan.updatedAt = block.timestamp;
              
              emit RewardDeposited(rewardId, msg.sender, plan.amount);
          }
          
          function lockForTask(uint256 rewardId, uint256 taskId)
              external
              validRewardId(rewardId)
              onlyCreator(rewardId)
              inStatus(rewardId, RewardStatus.Deposited)
          {
              require(taskId > 0, "Invalid task ID");
              require(taskRewards[taskId] == 0, "Task already has reward");
              
              RewardPlan storage plan = rewardPlans[rewardId];
              plan.taskId = taskId;
              plan.status = RewardStatus.Locked;
              plan.updatedAt = block.timestamp;
              
              taskRewards[taskId] = rewardId;
              
              emit RewardLocked(rewardId, taskId);
          }
          
          function claimToHelper(uint256 rewardId, address helperAddress)
              external
              validRewardId(rewardId)
              inStatus(rewardId, RewardStatus.Locked)
          {
              require(helperAddress != address(0), "Invalid helper address");
              
              RewardPlan storage plan = rewardPlans[rewardId];
              plan.targetAddress = helperAddress;
              
              // Execute transfer (simplified for local testing)
              if (plan.asset == address(0)) {
                  // ETH transfer
                  (bool success, ) = helperAddress.call{value: plan.amount}("");
                  require(success, "ETH transfer failed");
              }
              
              bytes32 txHash = keccak256(abi.encode(rewardId, block.timestamp, helperAddress));
              plan.lastTxHash = txHash;
              plan.status = RewardStatus.Claimed;
              plan.updatedAt = block.timestamp;
              
              emit RewardClaimed(rewardId, helperAddress, txHash);
          }
          
          function refund(uint256 rewardId)
              external
              validRewardId(rewardId)
              onlyCreator(rewardId)
          {
              RewardPlan storage plan = rewardPlans[rewardId];
              
              require(
                  plan.status == RewardStatus.Prepared ||
                  plan.status == RewardStatus.Deposited ||
                  plan.status == RewardStatus.Locked ||
                  plan.status == RewardStatus.Reverted,
                  "Cannot refund in current status"
              );
              
              // Clear task binding if exists
              if (plan.taskId != 0) {
                  delete taskRewards[plan.taskId];
              }
              
              // Refund if money was deposited
              if (plan.status == RewardStatus.Deposited || 
                  plan.status == RewardStatus.Locked || 
                  plan.status == RewardStatus.Reverted) {
                  
                  if (plan.asset == address(0)) {
                      // Refund ETH
                      (bool success, ) = plan.creator.call{value: plan.amount}("");
                      require(success, "ETH refund failed");
                  }
              }
              
              plan.status = RewardStatus.Refunded;
              plan.updatedAt = block.timestamp;
              
              emit RewardRefunded(rewardId, plan.creator);
          }
          
          function getRewardPlan(uint256 rewardId) 
              external 
              view 
              validRewardId(rewardId)
              returns (RewardPlan memory) 
          {
              return rewardPlans[rewardId];
          }
          
          function getRewardsByCreator(address creator) 
              external 
              view 
              returns (uint256[] memory) 
          {
              return creatorRewards[creator];
          }
          
          function getRewardByTask(uint256 taskId) 
              external 
              view 
              returns (uint256) 
          {
              return taskRewards[taskId];
          }
          
          // Emergency functions
          receive() external payable {}
          
          function emergencyWithdraw() external {
              // Only for testing - in production this would have proper access control
              require(msg.sender == tx.origin, "Only EOA");
              payable(msg.sender).transfer(address(this).balance);
          }
      }
    `;
    
    // 编译合约
    console.log('📝 Compiling contract...');
    
    const solc = require('solc');
    
    const input = {
      language: 'Solidity',
      sources: {
        'EverEchoUniversalReward.sol': {
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
    
    const contract = output.contracts['EverEchoUniversalReward.sol']['EverEchoUniversalReward'];
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
    
    // 测试合约基本功能
    console.log('\n🧪 Testing contract...');
    
    // 测试 nextRewardId
    const nextId = await deployedContract.nextRewardId();
    console.log('Next reward ID:', nextId.toString());
    
    // 测试 preparePlan
    const asset = '0x0000000000000000000000000000000000000000';
    const amount = ethers.parseEther('0.01');
    const targetChainId = 11155111;
    
    console.log('Testing preparePlan...');
    const tx1 = await deployedContract.preparePlan(asset, amount, targetChainId);
    const receipt1 = await tx1.wait();
    console.log('✅ preparePlan successful:', tx1.hash);
    
    // 解析事件获取 rewardId
    const event = receipt1.logs.find((log: any) => {
      try {
        const parsed = deployedContract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = deployedContract.interface.parseLog(event);
      const rewardId = parsed?.args?.rewardId?.toString();
      console.log('Created reward ID:', rewardId);
      
      // 测试 deposit
      console.log('Testing deposit...');
      const tx2 = await deployedContract.deposit(rewardId, { value: amount });
      await tx2.wait();
      console.log('✅ deposit successful:', tx2.hash);
      
      // 验证状态
      const plan = await deployedContract.getRewardPlan(rewardId);
      console.log('Reward plan status:', plan.status); // Should be 1 (Deposited)
    }
    
    // 更新前端配置
    console.log('\n📝 Updating frontend configuration...');
    
    // 更新环境变量
    const frontendEnvPath = 'frontend/.env.local';
    let envContent = '';
    if (fs.existsSync(frontendEnvPath)) {
      envContent = fs.readFileSync(frontendEnvPath, 'utf8');
    }
    
    const addressLine = `VITE_UNIVERSAL_REWARD_ADDRESS=${contractAddress}`;
    if (envContent.includes('VITE_UNIVERSAL_REWARD_ADDRESS=')) {
      envContent = envContent.replace(/VITE_UNIVERSAL_REWARD_ADDRESS=.*/, addressLine);
    } else {
      envContent += `\n${addressLine}\n`;
    }
    
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log('✅ Updated frontend/.env.local');
    
    // 保存完整的 ABI
    const abiPath = 'frontend/src/contracts/EverEchoUniversalReward.json';
    const abiData = {
      abi: abi,
      address: contractAddress,
      deployedAt: new Date().toISOString()
    };
    fs.writeFileSync(abiPath, JSON.stringify(abiData, null, 2));
    console.log('✅ Saved ABI to', abiPath);
    
    // 更新前端合约配置
    console.log('📝 Updating frontend contract configuration...');
    
    console.log('\n🎉 Real Universal Reward Contract Deployment Complete!');
    console.log('Contract Address:', contractAddress);
    console.log('Available Methods:');
    console.log('- preparePlan(asset, amount, targetChainId)');
    console.log('- deposit(rewardId) [payable]');
    console.log('- lockForTask(rewardId, taskId)');
    console.log('- claimToHelper(rewardId, helperAddress)');
    console.log('- refund(rewardId)');
    console.log('- getRewardPlan(rewardId)');
    
    console.log('\n📱 Next Steps:');
    console.log('1. Restart frontend to load new contract');
    console.log('2. Update CrossChainRewardSection to use new methods');
    console.log('3. Test complete workflow: prepare → deposit → lock → claim');
    
    return {
      address: contractAddress,
      abi: abi
    };
    
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

// 运行部署
if (require.main === module) {
  deployRealUniversalReward().then(result => {
    console.log('\n✅ Deployment successful!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Deployment failed!');
    process.exit(1);
  });
}

export default deployRealUniversalReward;