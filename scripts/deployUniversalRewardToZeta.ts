import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function deployUniversalRewardToZeta() {
  console.log('🚀 Deploying EverEchoUniversalReward to ZetaChain Athens...\n');

  // 连接到 ZetaChain Athens
  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  // 使用环境变量中的私钥
  const privateKey = process.env.ZETA_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('请在 .env 文件中设置 ZETA_PRIVATE_KEY 或 DEPLOYER_PRIVATE_KEY');
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`📍 Deployer address: ${wallet.address}`);
  
  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ZETA`);
  
  if (balance < ethers.parseEther('0.1')) {
    console.warn('⚠️  Warning: Low balance, deployment might fail');
  }

  // 简化的 EverEchoUniversalReward 合约源码
  const contractSource = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.7;

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
        
        uint256 public nextRewardId = 1;
        mapping(uint256 => RewardPlan) public rewardPlans;
        mapping(address => uint256[]) public creatorRewards;
        mapping(uint256 => uint256) public taskRewards;
        
        event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount, uint256 targetChainId);
        event RewardDeposited(uint256 indexed rewardId, address indexed creator, uint256 amount);
        event RewardLocked(uint256 indexed rewardId, uint256 indexed taskId);
        event RewardClaimed(uint256 indexed rewardId, address indexed helper, bytes32 txHash);
        event RewardRefunded(uint256 indexed rewardId, address indexed creator);
        
        function preparePlan(address asset, uint256 amount, uint256 targetChainId) external payable returns (uint256) {
            require(amount > 0, "Amount must be greater than 0");
            
            uint256 rewardId = nextRewardId++;
            
            // 如果是原生代币，检查发送的 value
            if (asset == address(0)) {
                require(msg.value == amount, "Sent value must equal amount for native token");
            } else {
                require(msg.value == 0, "Should not send value for ERC20 tokens");
                // 注意：实际实现中需要 transferFrom ERC20 代币
                // 这里为了简化测试，暂时跳过
            }
            
            rewardPlans[rewardId] = RewardPlan({
                rewardId: rewardId,
                creator: msg.sender,
                taskId: 0,
                asset: asset,
                amount: amount,
                targetChainId: targetChainId,
                targetAddress: address(0),
                status: RewardStatus.Deposited,
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                lastTxHash: bytes32(0)
            });
            
            creatorRewards[msg.sender].push(rewardId);
            
            emit RewardPlanCreated(rewardId, msg.sender, asset, amount, targetChainId);
            emit RewardDeposited(rewardId, msg.sender, amount);
            
            return rewardId;
        }
        
        function deposit(uint256 rewardId) external payable {
            RewardPlan storage plan = rewardPlans[rewardId];
            require(plan.creator == msg.sender, "Only creator can deposit");
            require(plan.status == RewardStatus.Prepared, "Invalid status for deposit");
            
            if (plan.asset == address(0)) {
                require(msg.value == plan.amount, "Incorrect value sent");
            }
            
            plan.status = RewardStatus.Deposited;
            plan.updatedAt = block.timestamp;
            
            emit RewardDeposited(rewardId, msg.sender, plan.amount);
        }
        
        function lockForTask(uint256 rewardId, uint256 taskId) external {
            RewardPlan storage plan = rewardPlans[rewardId];
            require(plan.creator == msg.sender, "Only creator can lock");
            require(plan.status == RewardStatus.Deposited, "Invalid status for lock");
            
            plan.taskId = taskId;
            plan.status = RewardStatus.Locked;
            plan.updatedAt = block.timestamp;
            
            taskRewards[taskId] = rewardId;
            
            emit RewardLocked(rewardId, taskId);
        }
        
        function claimToHelper(uint256 rewardId, address helperAddress) external {
            RewardPlan storage plan = rewardPlans[rewardId];
            require(plan.status == RewardStatus.Locked, "Invalid status for claim");
            
            plan.targetAddress = helperAddress;
            plan.status = RewardStatus.Claimed;
            plan.updatedAt = block.timestamp;
            
            // 实际发送资金给 helper（简化版本）
            if (plan.asset == address(0)) {
                payable(helperAddress).transfer(plan.amount);
            }
            
            emit RewardClaimed(rewardId, helperAddress, bytes32(0));
        }
        
        function refund(uint256 rewardId) external {
            RewardPlan storage plan = rewardPlans[rewardId];
            require(plan.creator == msg.sender, "Only creator can refund");
            require(plan.status == RewardStatus.Deposited || plan.status == RewardStatus.Prepared, "Invalid status for refund");
            
            plan.status = RewardStatus.Refunded;
            plan.updatedAt = block.timestamp;
            
            // 退款给创建者
            if (plan.asset == address(0)) {
                payable(msg.sender).transfer(plan.amount);
            }
            
            emit RewardRefunded(rewardId, msg.sender);
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
        
        function emergencyWithdraw() external {
            // 紧急提取函数（仅用于测试）
            payable(msg.sender).transfer(address(this).balance);
        }
    }
  `;

  console.log('📝 Compiling contract...');
  
  // 使用 solc 编译合约
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
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    console.log('Compilation errors:');
    output.errors.forEach((error: any) => {
      console.log(error.formattedMessage);
    });
    
    if (output.errors.some((error: any) => error.severity === 'error')) {
      throw new Error('Compilation failed');
    }
  }

  const contract = output.contracts['EverEchoUniversalReward.sol']['EverEchoUniversalReward'];
  const bytecode = contract.evm.bytecode.object;
  const abi = contract.abi;

  console.log('🚀 Deploying contract...');
  
  // 部署合约
  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  const deployedContract = await contractFactory.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits('20', 'gwei')
  });

  await deployedContract.waitForDeployment();
  const contractAddress = await deployedContract.getAddress();
  
  console.log(`✅ EverEchoUniversalReward deployed at: ${contractAddress}`);
  
  // 测试合约
  console.log('\n🧪 Testing deployed contract...');
  
  try {
    const nextRewardId = await deployedContract.nextRewardId();
    console.log(`✅ nextRewardId(): ${nextRewardId.toString()}`);
    
    // 测试 preparePlan 调用
    console.log('🧪 Testing preparePlan...');
    const testTx = await deployedContract.preparePlan(
      '0x0000000000000000000000000000000000000000', // ETH
      ethers.parseEther('0.001'), // 0.001 ZETA
      BigInt(11155111), // ETH Sepolia
      { value: ethers.parseEther('0.001') }
    );
    
    const receipt = await testTx.wait();
    console.log(`✅ Test transaction successful: ${receipt.hash}`);
    
  } catch (error) {
    console.log(`⚠️  Test failed: ${error}`);
  }
  
  // 更新配置文件
  console.log('\n📝 Updating configuration...');
  
  // 更新 .env.local
  const envLocalPath = '.env.local';
  let envContent = '';
  
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }
  
  // 更新或添加 UNIVERSAL_REWARD_ADDRESS
  const newEnvLine = `VITE_ZETA_UNIVERSAL_REWARD_ADDRESS=${contractAddress}`;
  
  if (envContent.includes('VITE_ZETA_UNIVERSAL_REWARD_ADDRESS=')) {
    envContent = envContent.replace(/VITE_ZETA_UNIVERSAL_REWARD_ADDRESS=.*/g, newEnvLine);
  } else {
    envContent += `\n${newEnvLine}\n`;
  }
  
  fs.writeFileSync(envLocalPath, envContent);
  console.log(`✅ Updated ${envLocalPath}`);
  
  // 保存 ABI
  const abiPath = 'frontend/src/contracts/EverEchoUniversalReward.json';
  const abiData = {
    abi: abi,
    address: contractAddress,
    deployedAt: new Date().toISOString(),
    network: 'ZetaChain Athens',
    chainId: 7001
  };
  
  fs.writeFileSync(abiPath, JSON.stringify(abiData, null, 2));
  console.log(`✅ Updated ${abiPath}`);
  
  // 更新 deployment.json
  const deploymentPath = 'deployment.json';
  let deploymentData: any = {};
  
  if (fs.existsSync(deploymentPath)) {
    deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  
  if (!deploymentData.zetachainAthens) {
    deploymentData.zetachainAthens = {
      network: 'zetachainAthens',
      chainId: 7001,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      contracts: {},
      rpc: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
    };
  }
  
  deploymentData.zetachainAthens.contracts.EverEchoUniversalReward = {
    address: contractAddress,
    txHash: deployedContract.deploymentTransaction()?.hash || '',
    blockNumber: 0 // 会在后续更新
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✅ Updated ${deploymentPath}`);
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Explorer: https://athens.explorer.zetachain.com/address/${contractAddress}`);
  console.log('\n💡 Next steps:');
  console.log('1. Refresh your frontend application');
  console.log('2. Test the cross-chain reward functionality');
  console.log('3. Verify the contract on ZetaChain explorer if needed');
}

deployUniversalRewardToZeta().catch(console.error);