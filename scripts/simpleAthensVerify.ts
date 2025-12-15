import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("ZetaChain Athens - 简化 Path 1 验证");
  console.log("=".repeat(60));

  const network = "zetachainAthens";
  const deployment = (deploymentData as any)[network];
  const [deployer] = await ethers.getSigners();

  // 连接合约
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", deployment.contracts.Register.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", deployment.contracts.TaskEscrow.address);

  console.log("网络信息:");
  console.log("- Network:", network);
  console.log("- ChainId:", (await ethers.provider.getNetwork()).chainId);
  console.log("- Deployer:", deployer.address);
  console.log("- Deployer ETH:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  console.log("");

  // 使用已有的 ECHO 持有者地址进行验证（模拟）
  const echoHolder = "0x862F5F2916Bc5AC989f460552ba966d6Fe50F1A0";
  const echoBalance = await echoToken.balanceOf(echoHolder);
  
  console.log("发现的 ECHO 持有者:");
  console.log("- Address:", echoHolder);
  console.log("- Balance:", ethers.formatUnits(echoBalance, 18), "ECHO");
  console.log("");

  // 创建一个新的测试账户作为 helper
  console.log("创建测试账户...");
  const testWallet = ethers.Wallet.createRandom().connect(deployer.provider);
  console.log("- Test Account:", testWallet.address);

  // 给测试账户转少量 ETH
  const ethTx = await deployer.sendTransaction({
    to: testWallet.address,
    value: ethers.parseEther("0.005") // 只转 0.005 ETH
  });
  await ethTx.wait();
  console.log("✅ 已向测试账户转入 0.005 ETH");

  // 注册测试账户获取 ECHO
  const registerTx = await register.connect(testWallet).register("ipfs://test-profile");
  await registerTx.wait();
  console.log("✅ 测试账户注册完成");

  const testBalance = await echoToken.balanceOf(testWallet.address);
  console.log("- Test Account ECHO:", ethers.formatUnits(testBalance, 18));
  console.log("");

  // 使用较小的金额进行验证
  const rewardAmount = ethers.parseUnits("80", 18); // 80 ECHO reward
  const postFee = ethers.parseUnits("10", 18); // 10 ECHO post fee
  const totalRequired = rewardAmount + postFee; // 90 ECHO total

  console.log("=".repeat(60));
  console.log("🔄 Path 1 验证: 自己给自己创建任务并完成");
  console.log("=".repeat(60));
  console.log("验证参数:");
  console.log("- Reward:", ethers.formatUnits(rewardAmount, 18), "ECHO");
  console.log("- PostFee:", ethers.formatUnits(postFee, 18), "ECHO");
  console.log("- Total Required:", ethers.formatUnits(totalRequired, 18), "ECHO");
  console.log("");

  if (testBalance < totalRequired) {
    console.log("❌ 测试账户余额不足");
    console.log("需要:", ethers.formatUnits(totalRequired, 18), "ECHO");
    console.log("当前:", ethers.formatUnits(testBalance, 18), "ECHO");
    return;
  }

  // 记录初始状态
  const initialBalance = await echoToken.balanceOf(testWallet.address);
  const initialContractBalance = await echoToken.balanceOf(taskEscrow.target);

  console.log("初始余额:");
  console.log("- Test Account:", ethers.formatUnits(initialBalance, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(initialContractBalance, 18), "ECHO");
  console.log("");

  // 1. 创建任务
  console.log("1️⃣ 创建任务...");
  const approveTx = await echoToken.connect(testWallet).approve(taskEscrow.target, totalRequired);
  await approveTx.wait();

  const createTx = await taskEscrow.connect(testWallet).createTaskWithReward(
    rewardAmount,
    "ipfs://athens-test-task",
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
  console.log("   TxHash:", createTx.hash);

  // 2. 接受任务（同一账户）
  console.log("2️⃣ 接受任务...");
  const acceptTx = await taskEscrow.connect(testWallet).acceptTask(taskId);
  await acceptTx.wait();
  console.log("✅ 任务接受成功");
  console.log("   TxHash:", acceptTx.hash);

  // 3. 提交工作
  console.log("3️⃣ 提交工作...");
  const submitTx = await taskEscrow.connect(testWallet).submitWork(taskId, "ipfs://athens-work-result");
  await submitTx.wait();
  console.log("✅ 工作提交成功");
  console.log("   TxHash:", submitTx.hash);

  // 4. 确认完成
  console.log("4️⃣ 确认完成...");
  const confirmTx = await taskEscrow.connect(testWallet).confirmComplete(taskId);
  await confirmTx.wait();
  console.log("✅ 任务完成确认");
  console.log("   TxHash:", confirmTx.hash);

  // 记录最终状态
  const finalBalance = await echoToken.balanceOf(testWallet.address);
  const finalContractBalance = await echoToken.balanceOf(taskEscrow.target);

  console.log("");
  console.log("最终余额:");
  console.log("- Test Account:", ethers.formatUnits(finalBalance, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(finalContractBalance, 18), "ECHO");
  console.log("");

  // 计算变化
  const balanceChange = finalBalance - initialBalance;
  const contractChange = finalContractBalance - initialContractBalance;

  console.log("余额变化:");
  console.log("- Account 变化:", ethers.formatUnits(balanceChange, 18), "ECHO");
  console.log("- Contract 变化:", ethers.formatUnits(contractChange, 18), "ECHO");
  console.log("");

  // 验证逻辑：自己给自己做任务
  // 支出: 90 ECHO (80 reward + 10 postFee)
  // 收入: 98 ECHO (初始余额) + 80 ECHO (reward) + 10 ECHO (postFee) = 188 ECHO
  // 燃烧: 2% of 80 = 1.6 ECHO
  // 净收入: 188 - 1.6 - 90 = 96.4 ECHO

  const expectedBurn = (rewardAmount * 2n) / 100n; // 2% of reward
  const expectedNetGain = ethers.parseUnits("98", 18) - expectedBurn; // 98 - 1.6 = 96.4 ECHO
  
  console.log("🎯 数学验证 (自己给自己做任务):");
  console.log("- 预期燃烧:", ethers.formatUnits(expectedBurn, 18), "ECHO");
  console.log("- 预期净收益:", ethers.formatUnits(expectedNetGain, 18), "ECHO");
  console.log("- 实际变化:", ethers.formatUnits(balanceChange, 18), "ECHO");
  console.log("- 合约余额归零:", finalContractBalance === 0n ? "✅" : "❌");

  const mathCorrect = balanceChange === expectedNetGain && finalContractBalance === 0n;

  console.log("");
  console.log("=".repeat(60));
  console.log("🎯 ATHENS PATH 1 验证结果:", mathCorrect ? "✅ PASSED" : "❌ FAILED");
  console.log("=".repeat(60));

  if (mathCorrect) {
    console.log("🎉 ZetaChain Athens Stage 3.2 验证成功！");
    console.log("✅ EverEcho Protocol 核心逻辑在 Athens 链上运行正常");
    console.log("✅ 资金流验证: 燃烧机制、postFee 转移、合约余额清零 全部正确");
    console.log("✅ 合约地址:");
    console.log("   - TaskEscrow:", deployment.contracts.TaskEscrow.address);
    console.log("   - EOCHOToken:", deployment.contracts.EOCHOToken.address);
  } else {
    console.log("❌ 验证失败，数学计算不匹配");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});