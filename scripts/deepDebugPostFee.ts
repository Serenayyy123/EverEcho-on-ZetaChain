/**
 * 深度调试 PostFee 问题
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🔬 深度调试 PostFee 问题");
  console.log("=".repeat(50));

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

  console.log("✓ 环境设置完成");
  console.log("");

  // 执行任务到 Submitted 状态
  const reward = ethers.parseEther("10");
  const totalRequired = reward + ethers.parseEther("10");

  await echoToken.connect(creator).approve(taskEscrow.target, totalRequired);
  const createTx = await taskEscrow.connect(creator).createTask(reward, "ipfs://test-task");
  const taskCounter = await taskEscrow.taskCounter();
  const taskId = Number(taskCounter);

  await echoToken.connect(helper).approve(taskEscrow.target, reward);
  await taskEscrow.connect(helper).acceptTask(taskId);
  await taskEscrow.connect(helper).submitWork(taskId);

  console.log(`✓ 任务 ${taskId} 到达 Submitted 状态`);
  console.log("");

  // 获取执行前的详细状态
  const taskBefore = await taskEscrow.tasks(taskId);
  const helperBalanceBefore = await echoToken.balanceOf(helper.address);
  const contractBalanceBefore = await echoToken.balanceOf(taskEscrow.target);

  console.log("📋 执行前详细状态：");
  console.log(`Task.reward: ${ethers.formatEther(taskBefore.reward)} ECHO`);
  console.log(`Task.echoPostFee: ${ethers.formatEther(taskBefore.echoPostFee)} ECHO`);
  console.log(`Task.status: ${taskBefore.status} (应该是 2 = Submitted)`);
  console.log(`Task.creator: ${taskBefore.creator}`);
  console.log(`Task.helper: ${taskBefore.helper}`);
  console.log(`Helper balance: ${ethers.formatEther(helperBalanceBefore)} ECHO`);
  console.log(`Contract balance: ${ethers.formatEther(contractBalanceBefore)} ECHO`);
  console.log("");

  // 手动计算期望值
  const rewardValue = taskBefore.reward;
  const postFeeValue = taskBefore.echoPostFee;
  const FEE_BPS = 200n;
  
  const fee = (rewardValue * FEE_BPS) / 10000n;
  const helperReward = rewardValue - fee;
  const expectedTotalPayout = helperReward + rewardValue + postFeeValue;

  console.log("🧮 手动计算期望值：");
  console.log(`rewardValue: ${ethers.formatEther(rewardValue)} ECHO`);
  console.log(`postFeeValue: ${ethers.formatEther(postFeeValue)} ECHO`);
  console.log(`fee (2%): ${ethers.formatEther(fee)} ECHO`);
  console.log(`helperReward (98%): ${ethers.formatEther(helperReward)} ECHO`);
  console.log(`expectedTotalPayout: ${ethers.formatEther(expectedTotalPayout)} ECHO`);
  console.log(`  = ${ethers.formatEther(helperReward)} + ${ethers.formatEther(rewardValue)} + ${ethers.formatEther(postFeeValue)}`);
  console.log(`  = 9.8 + 10.0 + 10.0 = 29.8 ECHO`);
  console.log("");

  // 模拟 confirmComplete 的内部逻辑
  console.log("🎯 模拟 confirmComplete 内部逻辑：");
  
  // 这些是合约内部会执行的计算
  const internalReward = taskBefore.reward;
  const internalPostFee = taskBefore.echoPostFee;
  const internalHelper = taskBefore.helper;
  
  const internalFee = (internalReward * 200n) / 10000n;
  const internalHelperReward = internalReward - internalFee;
  const internalTotalPayout = internalHelperReward + internalReward + internalPostFee;

  console.log(`内部计算 - reward: ${ethers.formatEther(internalReward)}`);
  console.log(`内部计算 - postFee: ${ethers.formatEther(internalPostFee)}`);
  console.log(`内部计算 - helper: ${internalHelper}`);
  console.log(`内部计算 - fee: ${ethers.formatEther(internalFee)}`);
  console.log(`内部计算 - helperReward: ${ethers.formatEther(internalHelperReward)}`);
  console.log(`内部计算 - totalPayout: ${ethers.formatEther(internalTotalPayout)}`);
  console.log("");

  // 检查合约余额是否足够
  console.log("💰 资金充足性检查：");
  console.log(`合约余额: ${ethers.formatEther(contractBalanceBefore)} ECHO`);
  console.log(`需要转账: ${ethers.formatEther(internalTotalPayout)} ECHO`);
  console.log(`需要销毁: ${ethers.formatEther(internalFee)} ECHO`);
  console.log(`总需求: ${ethers.formatEther(internalTotalPayout + internalFee)} ECHO`);
  console.log(`余额充足: ${contractBalanceBefore >= (internalTotalPayout + internalFee) ? '✅' : '❌'}`);
  console.log("");

  // 执行 confirmComplete
  console.log("🎯 执行 confirmComplete...");
  
  try {
    const confirmTx = await taskEscrow.connect(creator).confirmComplete(taskId);
    const receipt = await confirmTx.wait();
    
    console.log(`✓ 交易成功，gas used: ${receipt.gasUsed}`);
    
    // 详细分析所有事件
    console.log("");
    console.log("📡 详细事件分析：");
    let totalTransferred = 0n;
    let transferToHelper = 0n;
    
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === echoToken.target.toString().toLowerCase()) {
          const parsedLog = echoToken.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsedLog) {
            if (parsedLog.name === 'Transfer') {
              const from = parsedLog.args[0];
              const to = parsedLog.args[1];
              const value = parsedLog.args[2];
              
              console.log(`Transfer: ${ethers.formatEther(value)} ECHO`);
              console.log(`  from: ${from}`);
              console.log(`  to: ${to}`);
              
              if (to.toLowerCase() === helper.address.toLowerCase()) {
                transferToHelper = value;
                console.log(`  ↑ 这是转给 Helper 的！`);
              } else if (to === '0x0000000000000000000000000000000000000000') {
                console.log(`  ↑ 这是销毁的！`);
              }
              
              totalTransferred += value;
            } else if (parsedLog.name === 'Burned') {
              console.log(`Burned: ${ethers.formatEther(parsedLog.args[0])} ECHO`);
            }
          }
        } else if (log.address.toLowerCase() === taskEscrow.target.toString().toLowerCase()) {
          const parsedLog = taskEscrow.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsedLog && parsedLog.name === 'TaskCompleted') {
            console.log(`TaskCompleted 事件:`);
            console.log(`  taskId: ${parsedLog.args[0]}`);
            console.log(`  helperReceived: ${ethers.formatEther(parsedLog.args[1])} ECHO`);
            console.log(`  feeBurned: ${ethers.formatEther(parsedLog.args[2])} ECHO`);
          }
        }
      } catch (e) {
        // 跳过无法解析的事件
      }
    }
    
    console.log("");
    console.log(`📊 事件汇总：`);
    console.log(`转给 Helper 的金额: ${ethers.formatEther(transferToHelper)} ECHO`);
    console.log(`期望转给 Helper: ${ethers.formatEther(internalTotalPayout)} ECHO`);
    console.log(`匹配: ${transferToHelper === internalTotalPayout ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error("❌ confirmComplete 执行失败:", error);
    return;
  }
  console.log("");

  // 获取执行后状态
  const taskAfter = await taskEscrow.tasks(taskId);
  const helperBalanceAfter = await echoToken.balanceOf(helper.address);
  const contractBalanceAfter = await echoToken.balanceOf(taskEscrow.target);

  console.log("📋 执行后状态：");
  console.log(`Task.echoPostFee: ${ethers.formatEther(taskAfter.echoPostFee)} ECHO`);
  console.log(`Task.status: ${taskAfter.status} (应该是 3 = Completed)`);
  console.log(`Helper balance: ${ethers.formatEther(helperBalanceAfter)} ECHO`);
  console.log(`Contract balance: ${ethers.formatEther(contractBalanceAfter)} ECHO`);
  console.log("");

  // 最终分析
  const actualHelperGain = helperBalanceAfter - helperBalanceBefore;
  
  console.log("🎯 最终分析：");
  console.log(`Helper 实际收到: ${ethers.formatEther(actualHelperGain)} ECHO`);
  console.log(`Helper 期望收到: ${ethers.formatEther(expectedTotalPayout)} ECHO`);
  console.log(`差额: ${ethers.formatEther(expectedTotalPayout - actualHelperGain)} ECHO`);
  
  if (actualHelperGain === expectedTotalPayout) {
    console.log("✅ 完全正确！PostFee 工作正常！");
  } else {
    console.log("❌ 存在差异！需要进一步调查！");
    
    const diff = expectedTotalPayout - actualHelperGain;
    if (diff === postFeeValue) {
      console.log("🎯 差异 = postFee，确认 postFee 未发放");
    } else if (diff === rewardValue) {
      console.log("🎯 差异 = reward，确认押金未返还");
    } else if (diff === helperReward) {
      console.log("🎯 差异 = helperReward，确认奖励未发放");
    } else {
      console.log("🤔 差异不匹配任何单项，可能是复合问题");
    }
  }

  console.log("");
  console.log("🔬 深度调试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });