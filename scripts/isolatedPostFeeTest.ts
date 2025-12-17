/**
 * 独立的 PostFee 测试 - 使用全新部署
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🧪 独立 PostFee 测试（全新部署）");
  console.log("=".repeat(50));

  // 获取账户
  const [deployer, creator, helper] = await ethers.getSigners();
  
  console.log("👥 测试账户：");
  console.log("Deployer:", deployer.address);
  console.log("Creator: ", creator.address);
  console.log("Helper:  ", helper.address);
  console.log("");

  // 部署合约
  console.log("🚀 部署合约...");
  
  // 1. 部署 EOCHOToken
  const EOCHOTokenFactory = await ethers.getContractFactory("EOCHOToken");
  const echoToken = await EOCHOTokenFactory.deploy();
  await echoToken.waitForDeployment();
  console.log("✓ EOCHOToken:", echoToken.target);

  // 2. 部署 Register
  const RegisterFactory = await ethers.getContractFactory("Register");
  const register = await RegisterFactory.deploy(echoToken.target);
  await register.waitForDeployment();
  console.log("✓ Register:", register.target);

  // 3. 配置 EOCHOToken
  await echoToken.setRegisterAddress(register.target);
  console.log("✓ EOCHOToken Register 配置完成");

  // 4. 部署 TaskEscrow
  const TaskEscrowFactory = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrowFactory.deploy(echoToken.target, register.target);
  await taskEscrow.waitForDeployment();
  console.log("✓ TaskEscrow:", taskEscrow.target);

  // 5. 配置 EOCHOToken
  await echoToken.setTaskEscrowAddress(taskEscrow.target);
  console.log("✓ EOCHOToken TaskEscrow 配置完成");
  console.log("");

  // 注册账户
  console.log("📝 注册账户...");
  await register.connect(creator).register("ipfs://creator-profile");
  await register.connect(helper).register("ipfs://helper-profile");
  console.log("✓ Creator 注册完成，获得 100 ECHO");
  console.log("✓ Helper 注册完成，获得 100 ECHO");
  console.log("");

  // 记录初始余额
  const creatorInitial = await echoToken.balanceOf(creator.address);
  const helperInitial = await echoToken.balanceOf(helper.address);
  
  console.log("💰 初始余额：");
  console.log(`Creator: ${ethers.formatEther(creatorInitial)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperInitial)} ECHO`);
  console.log("");

  // 执行完整任务流程
  console.log("🎯 执行任务流程...");
  
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10"); // reward + postFee

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
  
  console.log("📊 余额变化：");
  console.log(`Creator: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Helper:  ${ethers.formatEther(helperChange)} ECHO`);
  console.log("");

  // 验证结果
  const expectedCreatorChange = -ethers.parseEther("20"); // -10 reward - 10 postFee
  const expectedHelperChange = ethers.parseEther("29.8"); // +9.8 reward + 10 deposit + 10 postFee

  console.log("🎯 验证结果：");
  console.log(`Creator 期望: ${ethers.formatEther(expectedCreatorChange)} ECHO`);
  console.log(`Creator 实际: ${ethers.formatEther(creatorChange)} ECHO`);
  console.log(`Creator 正确: ${creatorChange === expectedCreatorChange ? '✅' : '❌'}`);
  console.log("");
  console.log(`Helper 期望: ${ethers.formatEther(expectedHelperChange)} ECHO`);
  console.log(`Helper 实际: ${ethers.formatEther(helperChange)} ECHO`);
  console.log(`Helper 正确: ${helperChange >= ethers.parseEther("29.8") ? '✅' : '❌'}`);
  console.log("");

  // 最终结论
  if (helperChange >= ethers.parseEther("29.8")) {
    console.log("🎉 结论：PostFee 工作正常！");
    console.log("   Helper 收到了完整的 29.8 ECHO");
    console.log("   包括：9.8 reward + 10 deposit + 10 postFee");
  } else {
    console.log("❌ 结论：PostFee 存在问题！");
    console.log(`   Helper 只收到了 ${ethers.formatEther(helperChange)} ECHO`);
    console.log(`   缺少 ${ethers.formatEther(expectedHelperChange - helperChange)} ECHO`);
  }

  console.log("");
  console.log("🔍 独立测试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });