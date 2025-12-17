import { ethers } from "hardhat";

async function main() {
  console.log("🔍 验证前端实际使用的合约地址");
  console.log("=====================================");
  
  // 模拟前端的地址获取逻辑
  const chainId = 31337;
  
  // 检查环境变量
  console.log("📋 环境变量检查:");
  console.log(`VITE_TASK_ESCROW_ADDRESS: ${process.env.VITE_TASK_ESCROW_ADDRESS || 'undefined'}`);
  console.log(`VITE_EOCHO_TOKEN_ADDRESS: ${process.env.VITE_EOCHO_TOKEN_ADDRESS || 'undefined'}`);
  console.log("");
  
  // 硬编码地址（模拟前端逻辑）
  const HARDHAT_ADDRESSES = {
    echoToken: '0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A',
    register: '0x07882Ae1ecB7429a84f1D53048d35c4bB2056877',
    taskEscrow: '0xA7c59f010700930003b33aB25a7a0679C860f29c',
    gateway: '0x276C216D241856199A83bf27b2286659e5b877D3',
  };
  
  console.log("📋 前端应该使用的地址 (chainId 31337):");
  Object.entries(HARDHAT_ADDRESSES).forEach(([name, addr]) => {
    console.log(`   ${name}: ${addr}`);
  });
  console.log("");
  
  // 验证这些地址的合约状态
  console.log("🔍 验证合约状态:");
  
  try {
    // 检查新地址
    const newTaskEscrow = await ethers.getContractAt("TaskEscrow", HARDHAT_ADDRESSES.taskEscrow);
    const newTaskCounter = await newTaskEscrow.taskCounter();
    console.log(`✅ 新 TaskEscrow (${HARDHAT_ADDRESSES.taskEscrow}): taskCounter = ${newTaskCounter}`);
    
    // 检查旧地址
    const oldTaskEscrow = await ethers.getContractAt("TaskEscrow", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
    const oldTaskCounter = await oldTaskEscrow.taskCounter();
    console.log(`⚠️ 旧 TaskEscrow (0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9): taskCounter = ${oldTaskCounter}`);
    
  } catch (error) {
    console.log(`❌ 合约检查失败: ${error}`);
  }
  
  console.log("");
  console.log("🎯 诊断结论:");
  console.log("如果前端仍然显示旧任务，可能的原因:");
  console.log("1. 浏览器缓存 - 需要强制刷新 (Ctrl+F5)");
  console.log("2. MetaMask 缓存 - 需要重新连接钱包");
  console.log("3. 前端代码中有其他硬编码地址");
  console.log("4. 环境变量优先级问题");
  
  console.log("");
  console.log("🔧 建议操作:");
  console.log("1. 在浏览器中按 Ctrl+F5 强制刷新");
  console.log("2. 断开并重新连接 MetaMask");
  console.log("3. 检查浏览器开发者工具的 Network 标签，看实际请求的合约地址");
  console.log("4. 如果还是不行，可能需要重新部署合约并创建新任务");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});