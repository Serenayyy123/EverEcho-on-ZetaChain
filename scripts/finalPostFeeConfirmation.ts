/**
 * 最终 PostFee 确认测试 - 完全干净环境
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🎯 最终 PostFee 确认测试");
  console.log("=".repeat(50));

  // 重新启动 hardhat node 以获得完全干净的环境
  console.log("⚠️  请确保已重新启动 hardhat node 以获得干净环境");
  console.log("");

  // 获取全新账户
  const [deployer, creator, helper] = await ethers.getSigners();
  
  console.log("👥 使用全新账户：");
  console.log("Creator:", creator.address);
  console.log("Helper: ", helper.address);
  console.log("");

  // 部署全新合约
  console.log("🚀 部署全新合约...");
  
  const EOCHOTokenFactory = await ethers.getContractFactory("EOCHOToken");
  const echoToken = await EOCHOTokenFactory.deploy();
  await echoToken.waitForDeployment();

  const RegisterFactory = await ethers.getContractFactory("Register");
  const register = await RegisterFactory.deploy(echoToken.target);
  await register.waitForDeployment();

  await echoToken.setRegisterAddress(register.target);

  const TaskEscrowFactory = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrowFactory.deploy(echoToken.target, register.target);
  await taskEscrow.waitForDeployment();

  await echoToken.setTaskEscrowAddress(taskEscrow.target);

  console.log("✓ 合约部署完成");
  console.log("");

  // 注册账户（这是他们第一次注册，会获得 100 ECHO）
  console.log("📝 首次注册账户...");
  await register.connect(creator).register("ipfs://creator-profile");
  await register.connect(helper).register("ipfs://helper-profile");
  console.log("✓ Creator 首次注册，获得 100 ECHO");
  console.log("✓ Helper 首次注册，获得 100 ECHO");
  console.log("");

  // 验证初始余额
  const creatorInitial = await echoToken.balanceOf(creator.address);
  const helperInitial = await echoToken.balanceOf(helper.address);
  
  console.log("💰 验证初始余额：");
  console.log(`Creator: ${ethers.formatEther(creatorInitial)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperInitial)} ECHO`);
  
  if (creatorInitial !== ethers.parseEther("100") || helperInitial !== ethers.parseEther("100")) {
    console.log("❌ 初始余额不正确！环境可能不干净");
    return;
  }
  console.log("✅ 初始余额正确");
  console.log("");

  // 执行单个任务的完整流程
  console.log("🎯 执行单个任务的完整流程...");
  
  const reward = ethers.parseEther("10");
  const postFee = ethers.parseEther("10");
  const totalRequired = reward + postFee;

  // 1. 创建任务
  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);
  console.log(`✓ 创建任务 ${taskId}`);

  // 2. 接受任务
  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  await taskEscrow.connect(helper).acceptTask(taskId);
  console.log(`✓ 接受任务`);

  // 3. 提交工作
  await taskEscrow.connect(helper).submitWork(taskId);
  console.log(`✓ 提交工作`);

  // 4. 确认完成
  await taskEscrow.connect(creator).confirmComplete(taskId);
  console.log(`✓ 确认完成`);
  console.log("");

  // 验证最终余额
  const creatorFinal = await echoToken.balanceOf(creator.address);
  const helperFinal = await echoToken.balanceOf(helper.address);
  const contractFinal = await echoToken.balanceOf(taskEscrow.target);
  
  console.log("💰 最终余额：");
  console.log(`Creator: ${ethers.formatEther(creatorFinal)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperFinal)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractFinal)} ECHO`);
  console.log("");

  // 计算净变化
  const creatorChange = creatorFinal - creatorInitial;
  const helperChange = helperFinal - helperInitial;
  
  console.log("📊 净变化：");
  console.log(`Creator: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperChange)} ECHO`);
  console.log("");

  // 验证期望结果
  const expectedCreatorChange = -ethers.parseEther("20"); // -10 reward - 10 postFee
  const expectedHelperChange = ethers.parseEther("29.8"); // +9.8 reward + 10 deposit + 10 postFee

  console.log("🎯 最终验证：");
  console.log(`Creator 期望变化: ${ethers.formatEther(expectedCreatorChange)} ECHO`);
  console.log(`Creator 实际变化: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Creator 正确: ${creatorChange === expectedCreatorChange ? '✅' : '❌'}`);
  console.log("");
  console.log(`Helper 期望变化: ${ethers.formatEther(expectedHelperChange)} ECHO`);
  console.log(`Helper 实际变化: ${ethers.formatEther(helperChange)} ECHO`);
  console.log(`Helper 正确: ${helperChange === expectedHelperChange ? '✅' : '❌'}`);
  console.log("");

  // 最终结论
  if (creatorChange === expectedCreatorChange && helperChange === expectedHelperChange) {
    console.log("🎉 最终结论：PostFee 工作完全正常！");
    console.log("");
    console.log("📋 资金流详细分析：");
    console.log("Creator 支付：");
    console.log("  - 10.0 ECHO (reward)");
    console.log("  - 10.0 ECHO (postFee)");
    console.log("  = 20.0 ECHO 总支出");
    console.log("");
    console.log("Helper 收到：");
    console.log("  - 9.8 ECHO (98% reward)");
    console.log("  - 10.0 ECHO (押金返还)");
    console.log("  - 10.0 ECHO (postFee)");
    console.log("  = 29.8 ECHO 总收入");
    console.log("");
    console.log("Protocol：");
    console.log("  - 0.2 ECHO (2% fee burned)");
    console.log("");
    console.log("✅ 所有资金流都正确！TaskEscrow 中没有 postFee bug！");
  } else {
    console.log("❌ 发现问题！");
    if (creatorChange !== expectedCreatorChange) {
      console.log(`Creator 变化不正确：期望 ${ethers.formatEther(expectedCreatorChange)}，实际 ${ethers.formatEther(creatorChange)}`);
    }
    if (helperChange !== expectedHelperChange) {
      console.log(`Helper 变化不正确：期望 ${ethers.formatEther(expectedHelperChange)}，实际 ${ethers.formatEther(helperChange)}`);
    }
  }

  console.log("");
  console.log("🔍 最终确认测试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });