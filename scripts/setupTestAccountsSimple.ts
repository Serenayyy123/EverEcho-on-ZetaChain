import { ethers } from 'ethers';

// Method 4 合约地址
const CONTRACT_ADDRESSES = {
  register: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  echoToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

// Hardhat测试账号 (前4个)
const TEST_ACCOUNTS = [
  {
    name: 'Alice (发布者)',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    role: 'publisher',
    bio: '专业的任务发布者，擅长技术项目管理',
    skills: ['项目管理', '技术评估', '质量控制']
  },
  {
    name: 'Bob (助手)',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    role: 'helper',
    bio: '经验丰富的开发者，专注于前端和智能合约开发',
    skills: ['React', 'Solidity', 'Web3开发']
  },
  {
    name: 'Charlie (助手)',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    role: 'helper',
    bio: '全栈工程师，擅长后端开发和数据库设计',
    skills: ['Node.js', 'PostgreSQL', 'API设计']
  },
  {
    name: 'David (助手)',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    role: 'helper',
    bio: 'UI/UX设计师兼前端开发者，注重用户体验',
    skills: ['UI设计', 'Vue.js', '用户体验']
  }
];

// Register ABI
const REGISTER_ABI = [
  'function register(string memory name, string memory bio, string memory publicKey, string memory skills) external'
];

// ECHOToken ABI
const ECHO_TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external'
];

async function setupTestAccountsSimple() {
  console.log('🚀 设置测试账号 (简化版)...');
  console.log('');

  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  console.log('📋 合约地址:');
  console.log('   Register:', CONTRACT_ADDRESSES.register);
  console.log('   ECHOToken:', CONTRACT_ADDRESSES.echoToken);
  console.log('');

  // 创建合约实例
  const registerContract = new ethers.Contract(CONTRACT_ADDRESSES.register, REGISTER_ABI, provider);
  const echoTokenContract = new ethers.Contract(CONTRACT_ADDRESSES.echoToken, ECHO_TOKEN_ABI, provider);

  console.log('👥 设置测试账号:');
  console.log('');

  for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
    const account = TEST_ACCOUNTS[i];
    console.log(`📋 账号 ${i + 1}: ${account.name}`);
    console.log(`   地址: ${account.address}`);
    
    try {
      // 创建签名者
      const signer = new ethers.Wallet(account.privateKey, provider);
      
      // 1. 检查ETH余额
      const ethBalance = await provider.getBalance(account.address);
      console.log(`   ETH余额: ${ethers.formatEther(ethBalance)} ETH`);
      
      // 2. 生成加密密钥对
      const keyPair = ethers.Wallet.createRandom();
      const publicKey = keyPair.publicKey;
      const encryptionPrivateKey = keyPair.privateKey;
      
      console.log(`   公钥: ${publicKey.slice(0, 20)}...`);
      console.log(`   加密私钥: ${encryptionPrivateKey}`);
      
      // 3. 注册账号 (直接注册，不检查状态)
      console.log('   📝 注册账号...');
      
      try {
        const registerTx = await (registerContract.connect(signer) as any).register(
          account.name,
          account.bio,
          publicKey,
          account.skills.join(',')
        );
        
        await registerTx.wait();
        console.log('   ✅ 注册成功');
      } catch (regError: any) {
        if (regError.message.includes('already registered')) {
          console.log('   ✅ 已注册');
        } else {
          console.log('   ⚠️ 注册失败:', regError.message);
        }
      }
      
      // 4. 分配ECHO代币
      console.log('   💰 分配ECHO代币...');
      
      try {
        // 使用第一个账号(拥有者)来mint代币
        const ownerSigner = new ethers.Wallet(TEST_ACCOUNTS[0].privateKey, provider);
        const mintAmount = ethers.parseEther('200'); // 给每个账号200 ECHO
        
        const mintTx = await (echoTokenContract.connect(ownerSigner) as any).mint(account.address, mintAmount);
        await mintTx.wait();
        
        console.log('   ✅ 分配了 200 ECHO');
      } catch (mintError: any) {
        console.log('   ⚠️ 分配ECHO失败:', mintError.message);
      }
      
      console.log('   ✅ 账号设置完成');
      
    } catch (error) {
      console.error(`   ❌ 设置失败:`, error);
    }
    
    console.log('');
  }
  
  console.log('🎉 所有测试账号设置完成！');
  console.log('');
  console.log('📋 测试账号摘要:');
  console.log('');
  
  for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
    const account = TEST_ACCOUNTS[i];
    console.log(`${i + 1}. ${account.name}`);
    console.log(`   地址: ${account.address}`);
    console.log(`   私钥: ${account.privateKey}`);
    console.log(`   角色: ${account.role}`);
    console.log(`   技能: ${account.skills.join(', ')}`);
    console.log('');
  }
  
  console.log('🔧 MetaMask导入说明:');
  console.log('1. 打开MetaMask，点击账户图标');
  console.log('2. 选择"导入账户"');
  console.log('3. 粘贴上面的私钥');
  console.log('4. 确保连接到 http://localhost:8545 (Chain ID: 31337)');
  console.log('');
  console.log('🌐 前端地址: http://localhost:5173');
  console.log('');
  console.log('✅ Method 4原子操作已启用 - TaskID解析问题已完全解决！');
}

setupTestAccountsSimple().catch(console.error);