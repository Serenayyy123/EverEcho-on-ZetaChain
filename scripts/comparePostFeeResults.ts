/**
 * 比较两种测试方法的结果
 */

import { ethers } from "hardhat";

async function testMethod1() {
  console.log("🧪 方法1：简单余额对比");
  console.log("-".repeat(30));

  // 获取账户
  const [deployer, creator, helper] = await ethers.getSigners();
  
  // 部署合约
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

  // 注册账户
  await register.connect(creator).register("ipfs://creator-profile");
  await register.connect(helper).register("ipfs://helper-profile");

  // 记录初始余额
  const helperInitial = await echoToken.balanceOf(helper.address);
  console.log(`Helper 初始余额: ${ethers.formatEther(helperInitial)} ECHO`);

  // 执行任务流程
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10");

  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);

  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  await taskEscrow.connect(helper).acceptTask(taskId);
  await taskEscrow.connect(helper).submitWork(taskId);
  await taskEscrow.connect(creator).confirmComplete(taskId);

  // 记录最终余额
  const helperFinal = await echoToken.balanceOf(helper.address);
  console.log(`Helper 最终余额: ${ethers.formatEther(helperFinal)} ECHO`);

  const helperChange = helperFinal - helperInitial;
  console.log(`Helper 净变化: ${ethers.formatEther(helperChange)} ECHO`);
  
  return helperChange;
}

async function testMethod2() {
  console.log("🔬 方法2：事件追踪");
  console.log("-".repeat(30));

  // 获取账户
  const [deployer, creator, helper] = await ethers.getSigners();
  
  // 部署合约
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

  // 注册账户
  await register.connect(creator).register("ipfs://creator-profile");
  await register.connect(helper).register("ipfs://helper-profile");

  // 执行任务到 Submitted
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10");

  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);

  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  await taskEscrow.connect(helper).acceptTask(taskId);
  await taskEscrow.connect(helper).submitWork(taskId);

  // 记录执行前余额
  const helperBefore = await echoToken.balanceOf(helper.address);
  console.log(`Helper 执行前余额: ${ethers.formatEther(helperBefore)} ECHO`);

  // 执行 confirmComplete 并追踪事件
  const confirmTx = await taskEscrow.connect(creator).confirmComplete(taskId);
  const receipt = await confirmTx.wait();

  let transferToHelper = 0n;
  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() === echoToken.target.toString().toLowerCase()) {
        const parsedLog = echoToken.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsedLog && parsedLog.name === 'Transfer') {
          const to = parsedLog.args[1];
          const value = parsedLog.args[2];
          
          if (to.toLowerCase() === helper.address.toLowerCase()) {
            transferToHelper = value;
            console.log(`事件显示转给 Helper: ${ethers.formatEther(value)} ECHO`);
          }
        }
      }
    } catch (e) {
      // 跳过
    }
  }

  // 记录执行后余额
  const helperAfter = await echoToken.balanceOf(helper.address);
  console.log(`Helper 执行后余额: ${ethers.formatEther(helperAfter)} ECHO`);

  const actualChange = helperAfter - helperBefore;
  console.log(`Helper 实际变化: ${ethers.formatEther(actualChange)} ECHO`);
  console.log(`事件显示转账: ${ethers.formatEther(transferToHelper)} ECHO`);
  
  return { actualChange, eventTransfer: transferToHelper };
}

async function main() {
  console.log("🔍 比较两种测试方法");
  console.log("=".repeat(50));

  console.log("");
  const result1 = await testMethod1();
  
  console.log("");
  const result2 = await testMethod2();
  
  console.log("");
  console.log("📊 结果比较：");
  console.log(`方法1 (简单余额): ${ethers.formatEther(result1)} ECHO`);
  console.log(`方法2 (实际变化): ${ethers.formatEther(result2.actualChange)} ECHO`);
  console.log(`方法2 (事件转账): ${ethers.formatEther(result2.eventTransfer)} ECHO`);
  
  console.log("");
  console.log("🎯 分析：");
  if (result1 === result2.actualChange && result2.actualChange === result2.eventTransfer) {
    console.log("✅ 所有方法结果一致！PostFee 工作正常！");
  } else {
    console.log("❌ 方法间存在差异！");
    console.log(`方法1 vs 方法2实际: ${result1 === result2.actualChange ? '✅' : '❌'}`);
    console.log(`方法2实际 vs 事件: ${result2.actualChange === result2.eventTransfer ? '✅' : '❌'}`);
    
    if (result2.actualChange !== result2.eventTransfer) {
      console.log("🚨 严重问题：事件显示的转账金额与实际余额变化不符！");
    }
  }

  console.log("");
  console.log("🔍 比较完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });