/**
 * PostFee Bug 诊断脚本
 * 目的：确认 postFee 在哪个环节丢失
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 PostFee Bug 诊断开始...");
  console.log("=".repeat(50));

  // 读取部署信息
  const deploymentPath = "./deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ 错误：找不到 deployment.json");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const [deployer, creator, helper] = await ethers.getSigners();
  
  const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  console.log("📋 合约地址：");
  console.log("EOCHOToken: ", contracts.EOCHOToken.address);
  console.log("TaskEscrow: ", contracts.TaskEscrow.address);
  console.log("");

  // 确保账户注册并有足够余额
  const isCreatorRegistered = await register.isRegistered(creator.address);
  const isHelperRegistered = await register.isRegistered(helper.address);
  
  if (!isCreatorRegistered) {
    await register.connect(creator).register("ipfs://creator-profile");
    console.log("✓ Creator 注册完成，获得 100 ECHO");
  }
  
  if (!isHelperRegistered) {
    await register.connect(helper).register("ipfs://helper-profile");
    console.log("✓ Helper 注册完成，获得 100 ECHO");
  }

  // 检查 Creator 余额，如果不足则从 deployer 转账
  const creatorBalance = await echoToken.balanceOf(creator.address);
  if (creatorBalance < ethers.parseEther("50")) {
    // 从 deployer 转账给 Creator
    await echoToken.connect(deployer).transfer(creator.address, ethers.parseEther("100"));
    console.log("✓ Creator 获得 100 ECHO 用于测试");
  }

  // 记录初始余额
  const creatorInitial = await echoToken.balanceOf(creator.address);
  const helperInitial = await echoToken.balanceOf(helper.address);
  const contractInitial = await echoToken.balanceOf(taskEscrow.target);

  console.log("💰 初始余额：");
  console.log(`Creator: ${ethers.formatEther(creatorInitial)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperInitial)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractInitial)} ECHO`);
  console.log("");

  // 创建任务
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10"); // reward + postFee

  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  console.log(`✓ Creator approve ${ethers.formatEther(totalRequired)} ECHO`);

  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  await createTx.wait();
  
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);
  console.log(`✓ 创建任务 ${taskId}`);

  // 检查任务状态
  const taskAfterCreate = await taskEscrow.tasks(taskId);
  console.log(`🔍 创建后 echoPostFee: ${ethers.formatEther(taskAfterCreate.echoPostFee)} ECHO`);

  // 检查合约余额变化
  const contractAfterCreate = await echoToken.balanceOf(taskEscrow.target);
  console.log(`🔍 创建后合约余额: ${ethers.formatEther(contractAfterCreate)} ECHO`);
  console.log(`🔍 合约余额增加: ${ethers.formatEther(contractAfterCreate - contractInitial)} ECHO`);
  console.log("");

  // Helper 接受任务
  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  console.log(`✓ Helper approve ${ethers.formatEther(reward)} ECHO 押金`);

  await taskEscrow.connect(helper).acceptTask(taskId);
  console.log(`✓ Helper 接受任务`);

  const taskAfterAccept = await taskEscrow.tasks(taskId);
  console.log(`🔍 接受后 echoPostFee: ${ethers.formatEther(taskAfterAccept.echoPostFee)} ECHO`);

  const contractAfterAccept = await echoToken.balanceOf(taskEscrow.target);
  console.log(`🔍 接受后合约余额: ${ethers.formatEther(contractAfterAccept)} ECHO`);
  console.log("");

  // Helper 提交工作
  await taskEscrow.connect(helper).submitWork(taskId);
  console.log(`✓ Helper 提交工作`);

  const taskAfterSubmit = await taskEscrow.tasks(taskId);
  console.log(`🔍 提交后 echoPostFee: ${ethers.formatEther(taskAfterSubmit.echoPostFee)} ECHO`);
  console.log("");

  // 记录确认前余额
  const creatorBeforeConfirm = await echoToken.balanceOf(creator.address);
  const helperBeforeConfirm = await echoToken.balanceOf(helper.address);
  const contractBeforeConfirm = await echoToken.balanceOf(taskEscrow.target);

  console.log("💰 确认前余额：");
  console.log(`Creator: ${ethers.formatEther(creatorBeforeConfirm)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperBeforeConfirm)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractBeforeConfirm)} ECHO`);
  console.log("");

  // Creator 确认完成
  console.log("🎯 执行 confirmComplete...");
  
  const taskBeforeConfirm = await taskEscrow.tasks(taskId);
  console.log(`🔍 确认前 echoPostFee: ${ethers.formatEther(taskBeforeConfirm.echoPostFee)} ECHO`);

  const confirmTx = await taskEscrow.connect(creator).confirmComplete(taskId);
  const receipt = await confirmTx.wait();
  console.log(`✓ confirmComplete 执行完成，gas used: ${receipt.gasUsed}`);

  const taskAfterConfirm = await taskEscrow.tasks(taskId);
  console.log(`🔍 确认后 echoPostFee: ${ethers.formatEther(taskAfterConfirm.echoPostFee)} ECHO`);
  console.log("");

  // 记录最终余额
  const creatorFinal = await echoToken.balanceOf(creator.address);
  const helperFinal = await echoToken.balanceOf(helper.address);
  const contractFinal = await echoToken.balanceOf(taskEscrow.target);

  console.log("💰 最终余额：");
  console.log(`Creator: ${ethers.formatEther(creatorFinal)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperFinal)} ECHO`);
  console.log(`Contract: ${ethers.formatEther(contractFinal)} ECHO`);
  console.log("");

  // 计算变化
  const creatorChange = creatorFinal - creatorInitial;
  const helperChange = helperFinal - helperInitial;
  const contractChange = contractFinal - contractInitial;

  console.log("📊 余额变化分析：");
  console.log(`Creator 变化: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Helper 变化:  ${ethers.formatEther(helperChange)} ECHO`);
  console.log(`Contract 变化: ${ethers.formatEther(contractChange)} ECHO`);
  console.log("");

  // 期望值检查
  const expectedCreatorChange = -ethers.parseEther("20"); // -10 reward - 10 postFee
  const expectedHelperChange = ethers.parseEther("29.8"); // +9.8 reward + 10 deposit + 10 postFee
  const expectedContractChange = ethers.parseEther("0"); // 应该清空

  console.log("🎯 期望 vs 实际：");
  console.log(`Creator 期望: ${ethers.formatEther(expectedCreatorChange)} ECHO`);
  console.log(`Creator 实际: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Creator 匹配: ${creatorChange === expectedCreatorChange ? '✅' : '❌'}`);
  console.log("");
  console.log(`Helper 期望: ${ethers.formatEther(expectedHelperChange)} ECHO`);
  console.log(`Helper 实际: ${ethers.formatEther(helperChange)} ECHO`);
  console.log(`Helper 匹配: ${helperChange >= ethers.parseEther("29.8") ? '✅' : '❌'}`);
  console.log("");
  console.log(`Contract 期望: ${ethers.formatEther(expectedContractChange)} ECHO`);
  console.log(`Contract 实际: ${ethers.formatEther(contractChange)} ECHO`);
  console.log(`Contract 匹配: ${contractChange === expectedContractChange ? '✅' : '❌'}`);
  console.log("");

  // 总结
  if (helperChange >= ethers.parseEther("29.8")) {
    console.log("✅ PostFee 发放正常！Helper 收到了完整的 29.8+ ECHO");
  } else {
    console.log("❌ PostFee 发放异常！Helper 只收到了", ethers.formatEther(helperChange), "ECHO");
    console.log("🔍 可能原因：");
    console.log("1. postFee 在某个环节被提前清零");
    console.log("2. confirmComplete 中的计算逻辑有误");
    console.log("3. 合约中存在其他资金流出");
  }

  console.log("");
  console.log("🔍 诊断完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });