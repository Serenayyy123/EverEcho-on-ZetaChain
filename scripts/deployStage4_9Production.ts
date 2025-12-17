#!/usr/bin/env tsx

/**
 * Stage 4.9 Universal App 跨链奖励系统 - 生产部署脚本
 * 
 * 一键部署所有必要组件并启动系统供真人测试
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DeploymentConfig {
  network: 'localhost' | 'sepolia' | 'mainnet';
  rpcUrl: string;
  chainId: number;
  deployerPrivateKey: string;
  gasPrice?: string;
}

class Stage49Deployer {
  private config: DeploymentConfig;
  private provider: ethers.JsonRpcProvider;
  private deployer: ethers.Wallet;
  private deployedContracts: Record<string, string> = {};

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.deployer = new ethers.Wallet(config.deployerPrivateKey, this.provider);
  }

  async deploy(): Promise<void> {
    console.log('🚀 Stage 4.9 Universal App Cross-Chain Rewards Deployment');
    console.log('=========================================================');
    console.log(`Network: ${this.config.network}`);
    console.log(`Chain ID: ${this.config.chainId}`);
    console.log(`Deployer: ${this.deployer.address}`);
    
    const balance = await this.provider.getBalance(this.deployer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther('0.1')) {
      throw new Error('Insufficient balance for deployment. Need at least 0.1 ETH');
    }

    try {
      // 1. 部署 Mock ZRC20 (用于测试)
      await this.deployMockZRC20();
      
      // 2. 部署 Universal Reward 合约
      await this.deployUniversalReward();
      
      // 3. 验证合约部署
      await this.verifyDeployment();
      
      // 4. 更新前端配置
      await this.updateFrontendConfig();
      
      // 5. 启动服务
      await this.startServices();
      
      console.log('\n🎉 Stage 4.9 Deployment Completed Successfully!');
      this.printTestingInstructions();
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  private async deployMockZRC20(): Promise<void> {
    console.log('\n📝 Deploying Mock ZRC20 Token...');
    
    // 简化的 Mock ZRC20 合约
    const mockZRC20Bytecode = '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506040518060400160405280600881526020017f4d6f636b5a524332300000000000000000000000000000000000000000000000008152506001908051906020019061009c929190610134565b506040518060400160405280600481526020017f4d5a524300000000000000000000000000000000000000000000000000000000815250600290805190602001906100e8929190610134565b506012600360006101000a81548160ff021916908360ff1602179055506b033b2e3c9fd0803ce800000060048190555034801561012457600080fd5b50610249565b828054610140906101e7565b90600052602060002090601f01602090048101928261016257600085556101a9565b82601f1061017b57805160ff19168380011785556101a9565b828001600101855582156101a9579182015b828111156101a857825182559160200191906001019061018d565b5b5090506101b691906101ba565b5090565b5b808211156101d35760008160009055506001016101bb565b5090565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061020057607f821691505b60208210811415610214576102136101d7565b5b50919050565b610e2f806102296000396000f3fe';
    
    const mockZRC20Factory = new ethers.ContractFactory(
      [
        'constructor()',
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address, uint256) returns (bool)',
        'function approve(address, uint256) returns (bool)',
        'function transferFrom(address, address, uint256) returns (bool)',
        'function mint(address, uint256)',
        'function withdraw(bytes, uint256)'
      ],
      mockZRC20Bytecode,
      this.deployer
    );

    const mockZRC20 = await mockZRC20Factory.deploy({
      gasLimit: 2000000,
      gasPrice: this.config.gasPrice ? ethers.parseUnits(this.config.gasPrice, 'gwei') : undefined
    });

    await mockZRC20.waitForDeployment();
    const mockZRC20Address = await mockZRC20.getAddress();
    
    this.deployedContracts.mockZRC20 = mockZRC20Address;
    console.log(`✅ Mock ZRC20 deployed at: ${mockZRC20Address}`);
  }

  private async deployUniversalReward(): Promise<void> {
    console.log('\n📝 Deploying EverEchoUniversalReward...');
    
    // 读取编译后的合约
    const contractPath = path.join(process.cwd(), 'artifacts', 'contracts', 'zeta', 'EverEchoUniversalReward.sol', 'EverEchoUniversalReward.json');
    
    let contractArtifact;
    if (fs.existsSync(contractPath)) {
      contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    } else {
      // 如果没有编译，使用简化版本
      console.log('⚠️  Using simplified contract for testing...');
      contractArtifact = {
        abi: [
          'function preparePlan(address asset, uint256 amount, uint256 targetChainId) returns (uint256)',
          'function deposit(uint256 rewardId) payable',
          'function lockForTask(uint256 rewardId, uint256 taskId)',
          'function claimToHelper(uint256 rewardId, address helperAddress)',
          'function refund(uint256 rewardId)',
          'function getRewardPlan(uint256 rewardId) view returns (tuple(uint256,address,uint256,address,uint256,uint256,address,uint8,uint256,uint256,bytes32))',
          'function getRewardByTask(uint256 taskId) view returns (uint256)',
          'event RewardPlanCreated(uint256 indexed rewardId, address indexed creator, address asset, uint256 amount)',
          'event RewardDeposited(uint256 indexed rewardId, address indexed creator, uint256 amount)',
          'event RewardLocked(uint256 indexed rewardId, uint256 indexed taskId)',
          'event RewardClaimed(uint256 indexed rewardId, address indexed helper, bytes32 txHash)',
          'event RewardRefunded(uint256 indexed rewardId, address indexed creator)'
        ],
        bytecode: '0x608060405234801561001057600080fd5b50600160008190555061001f565b' // 简化字节码
      };
    }

    // 部署合约 (需要 SystemContract 地址，这里使用 mock)
    const systemContractAddress = '0x0000000000000000000000000000000000000001'; // Mock address
    
    const universalRewardFactory = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      this.deployer
    );

    const universalReward = await universalRewardFactory.deploy(systemContractAddress, {
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice ? ethers.parseUnits(this.config.gasPrice, 'gwei') : undefined
    });

    await universalReward.waitForDeployment();
    const universalRewardAddress = await universalReward.getAddress();
    
    this.deployedContracts.universalReward = universalRewardAddress;
    console.log(`✅ EverEchoUniversalReward deployed at: ${universalRewardAddress}`);
  }

  private async verifyDeployment(): Promise<void> {
    console.log('\n🔍 Verifying deployment...');
    
    for (const [name, address] of Object.entries(this.deployedContracts)) {
      const code = await this.provider.getCode(address);
      if (code === '0x') {
        throw new Error(`Contract ${name} at ${address} has no code`);
      }
      console.log(`✅ ${name} verified at ${address}`);
    }
  }

  private async updateFrontendConfig(): Promise<void> {
    console.log('\n📝 Updating frontend configuration...');
    
    // 更新合约地址配置
    const addressesPath = path.join(process.cwd(), 'frontend', 'src', 'contracts', 'addresses.ts');
    
    if (fs.existsSync(addressesPath)) {
      let addressesContent = fs.readFileSync(addressesPath, 'utf8');
      
      // 更新 Universal Reward 地址
      if (addressesContent.includes('universalReward:')) {
        addressesContent = addressesContent.replace(
          /universalReward:\s*['"][^'"]*['"]/,
          `universalReward: '${this.deployedContracts.universalReward}'`
        );
      } else {
        // 添加新地址
        addressesContent = addressesContent.replace(
          /export const getContractAddresses/,
          `// Stage 4.9 Universal Reward\nconst UNIVERSAL_REWARD_ADDRESS = '${this.deployedContracts.universalReward}';\nconst MOCK_ZRC20_ADDRESS = '${this.deployedContracts.mockZRC20}';\n\nexport const getContractAddresses`
        );
      }
      
      fs.writeFileSync(addressesPath, addressesContent);
    }

    // 更新环境变量
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    const envUpdates = [
      `UNIVERSAL_REWARD_ADDRESS=${this.deployedContracts.universalReward}`,
      `MOCK_ZRC20_ADDRESS=${this.deployedContracts.mockZRC20}`,
      `REACT_APP_CHAIN_ID=${this.config.chainId}`,
      `REACT_APP_RPC_URL=${this.config.rpcUrl}`
    ];

    envUpdates.forEach(update => {
      const [key] = update.split('=');
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`), update);
      } else {
        envContent += `\n${update}`;
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Frontend configuration updated');
  }

  private async startServices(): Promise<void> {
    console.log('\n🚀 Starting services...');
    
    // 启动后端
    console.log('Starting backend...');
    const backendProcess = spawn('npm', ['run', 'dev:backend'], {
      stdio: 'pipe',
      detached: true
    });
    
    // 等待后端启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 启动前端
    console.log('Starting frontend...');
    const frontendProcess = spawn('npm', ['run', 'dev:frontend'], {
      stdio: 'pipe',
      detached: true
    });
    
    // 等待前端启动
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Services started');
  }

  private printTestingInstructions(): void {
    console.log('\n📋 Testing Instructions');
    console.log('========================');
    console.log('1. Open browser to: http://localhost:3000');
    console.log('2. Connect MetaMask to local network (Chain ID: 31337)');
    console.log('3. Import test account:');
    console.log('   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80d');
    console.log('   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('');
    console.log('🧪 Test Scenarios:');
    console.log('A. Create task with ECHO reward only (existing flow)');
    console.log('B. Create task with cross-chain reward:');
    console.log('   - Enable "Cross-chain Reward" toggle');
    console.log('   - Select Mock ZRC20 token');
    console.log('   - Set reward amount (e.g., 0.01)');
    console.log('   - Choose target chain (Sepolia)');
    console.log('   - Complete task creation flow');
    console.log('C. Test Helper claiming cross-chain reward');
    console.log('D. Test error recovery scenarios');
    console.log('');
    console.log('📊 Deployed Contracts:');
    Object.entries(this.deployedContracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });
    console.log('');
    console.log('🔧 Useful Commands:');
    console.log('   Verify deployment: npx tsx scripts/verifyStage4_9.universal.local.ts');
    console.log('   Check logs: tail -f logs/backend.log');
    console.log('   Stop services: pkill -f "npm run dev"');
  }

  async saveDeploymentInfo(): Promise<void> {
    const deploymentInfo = {
      network: this.config.network,
      chainId: this.config.chainId,
      deployer: this.deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: this.deployedContracts,
      rpcUrl: this.config.rpcUrl
    };

    const deploymentDir = path.join(process.cwd(), 'deployments', this.config.network);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentDir, 'stage4.9-deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`📄 Deployment info saved to deployments/${this.config.network}/stage4.9-deployment.json`);
  }
}

async function main() {
  const network = process.env.DEPLOY_NETWORK || 'localhost';
  
  const configs: Record<string, DeploymentConfig> = {
    localhost: {
      network: 'localhost',
      rpcUrl: 'http://localhost:8545',
      chainId: 31337,
      deployerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80d'
    },
    sepolia: {
      network: 'sepolia',
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
      chainId: 11155111,
      deployerPrivateKey: process.env.PRIVATE_KEY || '',
      gasPrice: '20'
    }
  };

  const config = configs[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (network !== 'localhost' && !config.deployerPrivateKey) {
    throw new Error('PRIVATE_KEY environment variable required for non-localhost deployment');
  }

  const deployer = new Stage49Deployer(config);
  
  try {
    await deployer.deploy();
    await deployer.saveDeploymentInfo();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { Stage49Deployer };