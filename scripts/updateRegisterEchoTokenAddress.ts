/**
 * 更新Register合约中的ECHO Token地址
 */

import { ethers } from 'ethers';

const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
const NEW_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';

// Register合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function setEchoToken(address _echoToken) external',
  'function owner() view returns (address)'
];

async function updateRegisterEchoTokenAddress() {
  console.log('🔄 更新Register合约中的ECHO Token地址...\n');

  console.log(`📋 Register合约地址: ${REGISTER_ADDRESS}`);
  console.log(`📋 新的ECHO Token地址: ${NEW_ECHO_TOKEN}\n`);

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 1. 检查当前地址
    console.log('1. 📡 检查当前ECHO Token地址...');
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);
    const currentEchoToken = await registerContract.echoToken();
    console.log(`   当前地址: ${currentEchoToken}`);

    if (currentEchoToken.toLowerCase() === NEW_ECHO_TOKEN.toLowerCase()) {
      console.log('   ✅ 地址已经是最新的，无需更新');
      return;
    }

    // 2. 生成更新指令
    console.log('\n2. 📝 生成更新指令...');
    console.log('⚠️  需要合约所有者执行以下操作来更新ECHO Token地址:\n');

    console.log('方法1: 使用ethers.js脚本');
    console.log(`
const { ethers } = require('ethers');

async function updateEchoToken() {
  // 连接到ZetaChain
  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  // 使用私钥创建钱包（需要是合约所有者）
  const privateKey = "YOUR_PRIVATE_KEY"; // 替换为实际私钥
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // 连接到Register合约
  const registerABI = [
    'function setEchoToken(address _echoToken) external'
  ];
  const registerContract = new ethers.Contract("${REGISTER_ADDRESS}", registerABI, wallet);
  
  // 更新ECHO Token地址
  console.log('🔄 更新ECHO Token地址...');
  const tx = await registerContract.setEchoToken("${NEW_ECHO_TOKEN}");
  console.log('📤 交易已发送:', tx.hash);
  
  // 等待确认
  const receipt = await tx.wait();
  console.log('✅ 更新完成！Gas使用:', receipt.gasUsed.toString());
}

updateEchoToken().catch(console.error);
    `);

    console.log('\n方法2: 使用Hardhat脚本');
    console.log(`
// 在hardhat.config.ts中配置网络后运行
npx hardhat run --network zetachain scripts/updateRegisterEchoToken.js

// scripts/updateRegisterEchoToken.js 内容:
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用账户:", deployer.address);
  
  const Register = await ethers.getContractAt("Register", "${REGISTER_ADDRESS}");
  
  console.log("更新ECHO Token地址...");
  const tx = await Register.setEchoToken("${NEW_ECHO_TOKEN}");
  await tx.wait();
  
  console.log("✅ 更新完成！");
}

main().catch(console.error);
    `);

    console.log('\n方法3: 直接调用合约');
    console.log('如果您有合约所有者的私钥，可以直接调用:');
    console.log(`合约地址: ${REGISTER_ADDRESS}`);
    console.log(`函数: setEchoToken(address)`);
    console.log(`参数: ${NEW_ECHO_TOKEN}`);

    // 3. 验证脚本
    console.log('\n3. 📋 更新后验证脚本:');
    console.log(`
// 验证更新是否成功
const registerContract = new ethers.Contract("${REGISTER_ADDRESS}", ABI, provider);
const newAddress = await registerContract.echoToken();
console.log("新的ECHO Token地址:", newAddress);
console.log("更新成功:", newAddress.toLowerCase() === "${NEW_ECHO_TOKEN.toLowerCase()}");
    `);

  } catch (error: any) {
    console.error('❌ 操作失败:', error.message);
    throw error;
  }
}

// 运行更新
if (require.main === module) {
  updateRegisterEchoTokenAddress().catch(console.error);
}

export { updateRegisterEchoTokenAddress };