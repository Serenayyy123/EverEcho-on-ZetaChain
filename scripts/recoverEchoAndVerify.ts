import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("ZetaChain Athens - ECHO 恢复与 Path 1 验证");
  console.log("=".repeat(60));

  const network = "zetachainAthens";
  const deployment = (deploymentData as any)[network];
  const [deployer] = await ethers.getSigners();

  // 连接合约
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", deployment.contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", deployment.contracts.TaskEscrow.address);

  console.log("当前状态:");
  console.log("- Deployer:", deployer.address);
  console.log("- Deployer ECHO:", ethers.formatUnits(await echoToken.balanceOf(deployer.address), 18));
  console.log("");

  // 检查有 ECHO 的地址
  const echoHolder1 = "0x862F5F2916Bc5AC989f460552ba966d6Fe50F1A0";
  const echoHolder2 = "0x2E1D42Dc9E0B7797DD46190126913DB5eAAD970f";
  
  const balance1 = await echoToken.balanceOf(echoHolder1);
  const balance2 = await echoToken.balanceOf(echoHolder2);
  
  console.log("发现的 ECHO 持有者:");
  console.log("- Address 1:", echoHolder1, "->", ethers.formatUnits(balance1, 18), "ECHO");
  console.log("- Address 2:", echoHolder2, "->", ethers.formatUnits(balance2, 18), "ECHO");
  console.log("");

  // 由于我们无法控制这些地址的私钥，需要通过注册新账户获取 ECHO
  console.log("方案: 注册新账户获取 ECHO");
  console.log("-".repeat(40));

  // 创建新的测试账户
  const helperWallet = ethers.Wallet.createRandom().connect(deployer.provider);
  console.log("创建 Helper 账户:", helperWallet.address);

  // 给 helper 转 ETH 用于 gas
  const ethTx = await deployer.sendTransaction({
    to: helperWallet.address,
    value: ethers.parseEther("0.01")
  });
  await ethTx.wait();
  console.log("✅ 已向 Helper 转入 0.01 ETH");

  // 注册 helper 获取 ECHO
  const registerTx = await register.connect(helperWallet).register("ipfs://helper-profile");
  await registerTx.wait();
  console.log("✅ Helper 注册完成");

  const helperBalance = await echoToken.balanceOf(helperWallet.address);
  console.log("Helper 获得 ECHO:", ethers.formatUnits(helperBalance, 18));

  // 如果 deployer 仍然没有 ECHO，也注册一个新账户作为 creator
  let creatorWallet = deployer;
  let creatorBalance = await echoToken.balanceOf(deployer.address);
  
  if (creatorBalance === 0n) {
    console.log("Deployer 无 ECHO，创建新的 Creator 账户...");
    creatorWallet = ethers.Wallet.createRandom().connect(deployer.provider);
    
    // 给 creator 转 ETH
    const ethTx2 = await deployer.sendTransaction({
      to: creatorWallet.address,
      value: ethers.parseEther("0.01")
    });
    await ethTx2.wait();
    
    // 注册 creator
    const registerTx2 = await register.connect(creatorWallet).register("ipfs://creator-profile");
    await registerTx2.wait();
    console.log("✅ Creator 注册完成");
    
    creatorBalance = await echoToken.balanceOf(creatorWallet.address);
    console.log("Creator 获得 ECHO:", ethers.formatUnits(creatorBalance, 18));
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("🔄 开始 Path 1 验证: Normal Completion Flow");
  console.log("=".repeat(60));

  // Path 1 验证参数 - 调整为可用余额内
  const rewardAmount = ethers.parseUnits("90", 18); // 90 ECHO reward (调整)
  const postFee = ethers.parseUnits("10", 18); // 10 ECHO post fee (固定)
  const totalRequired = rewardAmount + postFee; // 100 ECHO total

  console.log("验证参数:");
  console.log("- Reward:", ethers.formatUnits(rewardAmount, 18), "ECHO");
  console.log("- PostFee:", ethers.formatUnits(postFee, 18), "ECHO");
  console.log("- Total Required:", ethers.formatUnits(totalRequired, 18), "ECHO");
  console.log("");

  // 检查余额是否足够
  if (creatorBalance < totalRequired) {
    console.log("❌ Creator 余额不足，需要", ethers.formatUnits(totalRequired, 18), "ECHO");
    console.log("当前余额:", ethers.formatUnits(creatorBalance, 18), "ECHO");
    return;
  }

  // 记录初始余额
  const initialCreatorBalance = await echoToken.balanceOf(creatorWallet.address);
  const initialHelperBalance = await echoToken.balanceOf(helperWallet.address);
  const initialContractBalance = await echoToken.balanceOf(taskEscrow.target);

  console.log("初始余额快照:");
  console.log("- Creator:", ethers.formatUnits(initialCreatorBalance, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(initialHelperBalance, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(initialContractBalance, 18), "ECHO");
  console.log("");

  // 1. 创建任务
  console.log("1️⃣ 创建任务...");
  const approveTx = await echoToken.connect(creatorWallet).approve(taskEscrow.target, totalRequired);
  await approveTx.wait();

  const createTx = await taskEscrow.connect(creatorWallet).createTaskWithReward(
    rewardAmount,
    "ipfs://task-description",
    ethers.ZeroAddress, // rewardAsset (placeholder)
    0 // rewardAmount (placeholder)
  );
  const createReceipt = await createTx.wait();
  
  // 获取 taskId
  const taskCreatedEvent = createReceipt?.logs.find(log => {
    try {
      const parsed = taskEscrow.interface.parseLog(log);
      return parsed?.name === 'TaskCreated';
    } catch {
      return false;
    }
  });
  
  if (!taskCreatedEvent) {
    console.log("❌ 无法找到 TaskCreated 事件");
    return;
  }
  
  const parsedEvent = taskEscrow.interface.parseLog(taskCreatedEvent);
  const taskId = parsedEvent?.args[0];
  console.log("✅ 任务创建成功, TaskId:", taskId.toString());

  // 2. Helper 接受任务
  console.log("2️⃣ Helper 接受任务...");
  const acceptTx = await taskEscrow.connect(helperWallet).acceptTask(taskId);
  await acceptTx.wait();
  console.log("✅ 任务接受成功");

  // 3. Helper 提交工作
  console.log("3️⃣ Helper 提交工作...");
  const submitTx = await taskEscrow.connect(helperWallet).submitWork(taskId, "ipfs://work-result");
  await submitTx.wait();
  console.log("✅ 工作提交成功");

  // 4. Creator 确认完成
  console.log("4️⃣ Creator 确认完成...");
  const confirmTx = await taskEscrow.connect(creatorWallet).confirmComplete(taskId);
  await confirmTx.wait();
  console.log("✅ 任务完成确认");

  // 记录最终余额
  const finalCreatorBalance = await echoToken.balanceOf(creatorWallet.address);
  const finalHelperBalance = await echoToken.balanceOf(helperWallet.address);
  const finalContractBalance = await echoToken.balanceOf(taskEscrow.target);

  console.log("");
  console.log("最终余额快照:");
  console.log("- Creator:", ethers.formatUnits(finalCreatorBalance, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(finalHelperBalance, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(finalContractBalance, 18), "ECHO");
  console.log("");

  // 计算变化
  const creatorChange = finalCreatorBalance - initialCreatorBalance;
  const helperChange = finalHelperBalance - initialHelperBalance;
  const contractChange = finalContractBalance - initialContractBalance;

  console.log("余额变化:");
  console.log("- Creator 变化:", ethers.formatUnits(creatorChange, 18), "ECHO");
  console.log("- Helper 变化:", ethers.formatUnits(helperChange, 18), "ECHO");
  console.log("- Contract 变化:", ethers.formatUnits(contractChange, 18), "ECHO");
  console.log("");

  // 验证数学正确性 - 基于 90 ECHO reward
  const expectedCreatorLoss = totalRequired; // 100 ECHO (90 + 10)
  const expectedHelperGain = ethers.parseUnits("186.2", 18); // 98 + 90 + 10 - 1.8 = 186.2 ECHO
  const expectedBurn = ethers.parseUnits("1.8", 18); // 2% of 90 = 1.8 ECHO

  const creatorLossCorrect = (-creatorChange) === expectedCreatorLoss;
  const helperGainCorrect = helperChange === expectedHelperGain;
  const contractEmpty = finalContractBalance === 0n;
  const burnCorrect = (expectedCreatorLoss - helperChange) === expectedBurn;

  console.log("🎯 数学验证:");
  console.log("- Creator 损失 100 ECHO:", creatorLossCorrect ? "✅" : "❌", 
    `(实际: ${ethers.formatUnits(-creatorChange, 18)})`);
  console.log("- Helper 获得 186.2 ECHO:", helperGainCorrect ? "✅" : "❌", 
    `(实际: ${ethers.formatUnits(helperChange, 18)})`);
  console.log("- 合约余额归零:", contractEmpty ? "✅" : "❌", 
    `(实际: ${ethers.formatUnits(finalContractBalance, 18)})`);
  console.log("- 燃烧 1.8 ECHO:", burnCorrect ? "✅" : "❌", 
    `(实际: ${ethers.formatUnits(expectedCreatorLoss - helperChange, 18)})`);

  const allCorrect = creatorLossCorrect && helperGainCorrect && contractEmpty && burnCorrect;

  console.log("");
  console.log("=".repeat(60));
  console.log("🎯 PATH 1 ATHENS 验证结果:", allCorrect ? "✅ PASSED" : "❌ FAILED");
  console.log("=".repeat(60));

  if (allCorrect) {
    console.log("🎉 ZetaChain Athens Stage 3.2 验证成功！");
    console.log("✅ EverEcho Protocol 核心资金流在 Athens 链上运行正常");
    console.log("✅ 数学守恒: 100 in = 186.2 out + 1.8 burned (基于 90 ECHO reward)");
  } else {
    console.log("❌ 验证失败，请检查计算逻辑");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});