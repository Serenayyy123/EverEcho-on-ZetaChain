import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("Clean Path 1 Verification");
  console.log("=".repeat(60));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", deployment.contracts.TaskEscrow.address);

  const signers = await ethers.getSigners();
  const [deployer, helper] = signers;

  // Check contract balance
  const contractBalance = await echoToken.balanceOf(taskEscrow.target);
  console.log("Current contract balance:", ethers.formatUnits(contractBalance, 18), "ECHO");
  
  if (contractBalance > 0n) {
    console.log("⚠️  Contract has leftover ECHO from previous tests");
    console.log("This is expected in a test environment with multiple runs");
  }

  console.log("");
  console.log("🔄 Fresh Path 1: Normal Completion Flow");
  console.log("-".repeat(60));

  const rewardAmount = ethers.parseUnits("100", 18);
  const postFee = ethers.parseUnits("10", 18);
  const totalRequired = rewardAmount + postFee;

  // Record initial balances (excluding contract leftover)
  const initialCreator = await echoToken.balanceOf(deployer.address);
  const initialHelper = await echoToken.balanceOf(helper.address);
  const initialContract = contractBalance; // Current contract balance

  console.log("Initial balances:");
  console.log("- Creator:", ethers.formatUnits(initialCreator, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(initialHelper, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(initialContract, 18), "ECHO (pre-existing)");
  console.log("");

  // 1. Create task
  console.log("1.1 Creator 创建任务...");
  const approveTx = await echoToken.connect(deployer).approve(taskEscrow.target, totalRequired);
  await approveTx.wait();

  const createTx = await taskEscrow.connect(deployer).createTask(rewardAmount, "ipfs://clean-path1-task");
  const createReceipt = await createTx.wait();
  
  const taskCreatedEvent = createReceipt?.logs.find(log => {
    try {
      const parsed = taskEscrow.interface.parseLog(log);
      return parsed?.name === 'TaskCreated';
    } catch {
      return false;
    }
  });
  
  const parsedEvent = taskEscrow.interface.parseLog(taskCreatedEvent!);
  const taskId = parsedEvent?.args[0];
  console.log("✅ 任务创建成功, TaskId:", taskId.toString());
  console.log("   TxHash:", createTx.hash);

  // Check balance after create
  const afterCreateContract = await echoToken.balanceOf(taskEscrow.target);
  const expectedAfterCreate = initialContract + totalRequired;
  console.log("   Contract balance after create:", ethers.formatUnits(afterCreateContract, 18), "ECHO");
  console.log("   Expected:", ethers.formatUnits(expectedAfterCreate, 18), "ECHO");
  console.log("   Create OK:", afterCreateContract === expectedAfterCreate ? "✅" : "❌");

  // 2. Helper accept task
  console.log("1.2 Helper 接受任务...");
  const approveTx2 = await echoToken.connect(helper).approve(taskEscrow.target, rewardAmount);
  await approveTx2.wait();

  const acceptTx = await taskEscrow.connect(helper).acceptTask(taskId);
  await acceptTx.wait();
  console.log("✅ 任务接受成功");
  console.log("   TxHash:", acceptTx.hash);

  // Check balance after accept
  const afterAcceptContract = await echoToken.balanceOf(taskEscrow.target);
  const expectedAfterAccept = initialContract + totalRequired + rewardAmount; // 210 + 100 = 310
  console.log("   Contract balance after accept:", ethers.formatUnits(afterAcceptContract, 18), "ECHO");
  console.log("   Expected:", ethers.formatUnits(expectedAfterAccept, 18), "ECHO");
  console.log("   Accept OK:", afterAcceptContract === expectedAfterAccept ? "✅" : "❌");

  // 3. Helper submit work
  console.log("1.3 Helper 提交工作...");
  const submitTx = await taskEscrow.connect(helper).submitWork(taskId);
  await submitTx.wait();
  console.log("✅ 工作提交成功");
  console.log("   TxHash:", submitTx.hash);

  // 4. Creator confirm complete
  console.log("1.4 Creator 确认完成...");
  const confirmTx = await taskEscrow.connect(deployer).confirmComplete(taskId);
  await confirmTx.wait();
  console.log("✅ 任务完成确认");
  console.log("   TxHash:", confirmTx.hash);

  // Final balance check
  const finalCreator = await echoToken.balanceOf(deployer.address);
  const finalHelper = await echoToken.balanceOf(helper.address);
  const finalContract = await echoToken.balanceOf(taskEscrow.target);

  console.log("");
  console.log("Final balances:");
  console.log("- Creator:", ethers.formatUnits(finalCreator, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(finalHelper, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(finalContract, 18), "ECHO");

  // Calculate changes for this specific task
  const creatorChange = finalCreator - initialCreator;
  const helperChange = finalHelper - initialHelper;
  const contractChange = finalContract - initialContract;

  console.log("");
  console.log("Changes from this task:");
  console.log("- Creator change:", ethers.formatUnits(creatorChange, 18), "ECHO");
  console.log("- Helper change:", ethers.formatUnits(helperChange, 18), "ECHO");
  console.log("- Contract change:", ethers.formatUnits(contractChange, 18), "ECHO");

  // Expected values
  const expectedCreatorLoss = totalRequired; // -110 ECHO
  const expectedHelperGain = ethers.parseUnits("208", 18); // 98 + 100 + 10 = 208 ECHO
  const expectedContractChange = 0n; // Should return to initial state
  const expectedBurn = ethers.parseUnits("2", 18); // 2% of 100 = 2 ECHO

  console.log("");
  console.log("🎯 Path 1 Mathematical Verification:");
  console.log("- Creator loss:", ethers.formatUnits(-creatorChange, 18), "ECHO (expected: 110)");
  console.log("- Helper gain:", ethers.formatUnits(helperChange, 18), "ECHO (expected: 208)");
  console.log("- Contract change:", ethers.formatUnits(contractChange, 18), "ECHO (expected: 0)");
  console.log("- Burn amount:", ethers.formatUnits(expectedBurn, 18), "ECHO (calculated: 2)");

  // Verification
  const creatorCorrect = (-creatorChange) === expectedCreatorLoss;
  const helperCorrect = helperChange === expectedHelperGain;
  const contractCorrect = contractChange === expectedContractChange;
  const fundConservation = (-creatorChange) === (helperChange + expectedBurn);

  console.log("");
  console.log("Verification Results:");
  console.log("- Creator loss correct (110 ECHO):", creatorCorrect ? "✅" : "❌");
  console.log("- Helper gain correct (208 ECHO):", helperCorrect ? "✅" : "❌");
  console.log("- Contract balance unchanged:", contractCorrect ? "✅" : "❌");
  console.log("- Fund conservation (110 = 208 + 2):", fundConservation ? "✅" : "❌");

  const allCorrect = creatorCorrect && helperCorrect && contractCorrect && fundConservation;

  console.log("");
  console.log("🎯 CLEAN PATH 1 RESULT:", allCorrect ? "✅ PASSED" : "❌ FAILED");
  
  if (allCorrect) {
    console.log("✅ Path 1 verification successful!");
    console.log("✅ Fund flow: 110 ECHO in = 208 ECHO out + 2 ECHO burned");
  } else {
    console.log("❌ Path 1 verification failed - check calculations");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});