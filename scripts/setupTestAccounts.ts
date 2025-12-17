/**
 * 设置测试账户 - 为手动测试准备
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔧 设置测试账户 - Stage 4.8 手动测试准备");
  console.log("=".repeat(60));

  // 读取部署信息
  const deploymentPath = "./deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ 错误：找不到 deployment.json，请先运行 deploy.ts");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取账户
  const [deployer, creator1, helper1, creator2, helper2] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const mockZRC20 = await ethers.getContractAt("MockZRC20", contracts.MockZRC20.address);

  console.log("📋 合约地址：");
  console.log("EOCHOToken:     ", contracts.EOCHOToken.address);
  console.log("Register:       ", contracts.Register.address);
  console.log("TaskEscrow:     ", contracts.TaskEscrow.address);
  console.log("EverEchoGateway:", contracts.EverEchoGateway.address);
  console.log("MockZRC20:      ", contracts.MockZRC20.address);
  console.log("");

  console.log("👥 测试账户地址：");
  console.log("Deployer: ", deployer.address);
  console.log("Creator1: ", creator1.address, "(用于 Path A - 纯 ECHO 任务)");
  console.log("Helper1:  ", helper1.address, "(用于 Path A - 纯 ECHO 任务)");
  console.log("Creator2: ", creator2.address, "(用于 Path B - 跨链奖励任务)");
  console.log("Helper2:  ", helper2.address, "(用于 Path B - 跨链奖励任务)");
  console.log("");

  // 给测试账户转一些 ETH 用于 gas
  console.log("⛽ 分发 ETH gas 费...");
  for (const account of [creator1, helper1, creator2, helper2]) {
    const balance = await ethers.provider.getBalance(account.address);
    if (balance < ethers.parseEther("1")) {
      await deployer.sendTransaction({
        to: account.address,
        value: ethers.parseEther("10")
      });
      console.log(`✓ ${account.address} 获得 10 ETH gas 费`);
    } else {
      console.log(`- ${account.address} 已有足够 ETH`);
    }
  }
  console.log("");

  // 注册所有测试账户
  console.log("📝 注册测试账户...");
  const accounts = [
    { signer: creator1, name: "Creator1" },
    { signer: helper1, name: "Helper1" },
    { signer: creator2, name: "Creator2" },
    { signer: helper2, name: "Helper2" }
  ];

  for (const account of accounts) {
    try {
      const isRegistered = await register.isRegistered(account.signer.address);
      if (!isRegistered) {
        await register.connect(account.signer).register(`ipfs://${account.name.toLowerCase()}-profile`);
        console.log(`✓ ${account.name} 注册成功，获得 100 ECHO`);
      } else {
        console.log(`- ${account.name} 已注册`);
      }
    } catch (error) {
      console.log(`❌ ${account.name} 注册失败:`, error.message);
    }
  }
  console.log("");

  // 给 Creator2 mint MockZRC20 代币（模拟跨链资产）
  console.log("🪙 分发 MockZRC20 代币...");
  const creator2ZRC20Balance = await mockZRC20.balanceOf(creator2.address);
  if (creator2ZRC20Balance < ethers.parseEther("100")) {
    await mockZRC20.mint(creator2.address, ethers.parseEther("1000"));
    console.log(`✓ Creator2 获得 1000 MockZRC20 (模拟 Sepolia ETH)`);
  } else {
    console.log(`- Creator2 已有 ${ethers.formatEther(creator2ZRC20Balance)} MockZRC20`);
  }
  console.log("");

  // 验证账户余额
  console.log("💰 验证账户余额：");
  for (const account of accounts) {
    const echoBalance = await echoToken.balanceOf(account.signer.address);
    console.log(`${account.name}: ${ethers.formatEther(echoBalance)} ECHO`);
  }
  
  const creator2MockBalance = await mockZRC20.balanceOf(creator2.address);
  console.log(`Creator2: ${ethers.formatEther(creator2MockBalance)} MockZRC20`);
  console.log("");

  // 输出手动测试指南
  console.log("📖 手动测试指南：");
  console.log("");
  console.log("🔄 Path A - 纯 ECHO 任务测试：");
  console.log("1. 使用 Creator1 账户 (", creator1.address, ")");
  console.log("2. 创建任务：reward = 10 ECHO");
  console.log("3. 使用 Helper1 账户 (", helper1.address, ")");
  console.log("4. 接受任务 → 提交工作 → Creator 确认完成");
  console.log("5. 验证 Helper1 收到 29.8 ECHO");
  console.log("");
  console.log("🌉 Path B - 跨链奖励任务测试：");
  console.log("1. 使用 Creator2 账户 (", creator2.address, ")");
  console.log("2. 创建跨链任务：reward = 10 ECHO + 跨链奖励 = 50 MockZRC20");
  console.log("3. 存入跨链奖励到 Gateway");
  console.log("4. 使用 Helper2 账户 (", helper2.address, ")");
  console.log("5. 完成任务后领取跨链奖励");
  console.log("6. 验证 Helper2 收到 29.8 ECHO + 50 MockZRC20");
  console.log("");
  console.log("🖥️ 前端访问：");
  console.log("URL: http://localhost:5173");
  console.log("Network: localhost (ChainId: 31337)");
  console.log("");
  console.log("✅ 测试账户设置完成！可以开始手动测试。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });