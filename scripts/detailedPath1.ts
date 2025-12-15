import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("Detailed Path 1 Verification with Step-by-Step Tracking");
  console.log("=".repeat(60));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", deployment.contracts.TaskEscrow.address);

  const signers = await ethers.getSigners();
  const [deployer, helper] = signers;

  // Start fresh with clean balances
  console.log("Starting fresh Path 1 test...");
  
  const rewardAmount = ethers.parseUnits("100", 18);
  const postFee = ethers.parseUnits("10", 18);
  const totalRequired = rewardAmount + postFee;

  // Record initial balances
  const step0_creator = await echoToken.balanceOf(deployer.address);
  const step0_helper = await echoToken.balanceOf(helper.address);
  const step0_contract = await echoToken.balanceOf(taskEscrow.target);

  console.log("Step 0 - Initial State:");
  console.log("- Creator:", ethers.formatUnits(step0_creator, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(step0_helper, 18), "ECHO");
  console.log("- Contract:", ethers.formatUnits(step0_contract, 18), "ECHO");
  console.log("");

  // Step 1: Create Task
  console.log("Step 1: Creator creates task (110 ECHO: 100 reward + 10 postFee)");
  const approveTx1 = await echoToken.connect(deployer).approve(taskEscrow.target, totalRequired);
  await approveTx1.wait();

  const createTx = await taskEscrow.connect(deployer).createTask(rewardAmount, "ipfs://detailed-test");
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
  console.log("✅ Task created, TaskId:", taskId.toString());

  const step1_creator = await echoToken.balanceOf(deployer.address);
  const step1_helper = await echoToken.balanceOf(helper.address);
  const step1_contract = await echoToken.balanceOf(taskEscrow.target);

  console.log("After createTask:");
  console.log("- Creator:", ethers.formatUnits(step1_creator, 18), "ECHO (change:", ethers.formatUnits(step1_creator - step0_creator, 18), ")");
  console.log("- Helper:", ethers.formatUnits(step1_helper, 18), "ECHO (change:", ethers.formatUnits(step1_helper - step0_helper, 18), ")");
  console.log("- Contract:", ethers.formatUnits(step1_contract, 18), "ECHO (change:", ethers.formatUnits(step1_contract - step0_contract, 18), ")");
  console.log("");

  // Step 2: Helper Accept Task
  console.log("Step 2: Helper accepts task (100 ECHO deposit)");
  const approveTx2 = await echoToken.connect(helper).approve(taskEscrow.target, rewardAmount);
  await approveTx2.wait();

  const acceptTx = await taskEscrow.connect(helper).acceptTask(taskId);
  await acceptTx.wait();
  console.log("✅ Task accepted");

  const step2_creator = await echoToken.balanceOf(deployer.address);
  const step2_helper = await echoToken.balanceOf(helper.address);
  const step2_contract = await echoToken.balanceOf(taskEscrow.target);

  console.log("After acceptTask:");
  console.log("- Creator:", ethers.formatUnits(step2_creator, 18), "ECHO (change:", ethers.formatUnits(step2_creator - step1_creator, 18), ")");
  console.log("- Helper:", ethers.formatUnits(step2_helper, 18), "ECHO (change:", ethers.formatUnits(step2_helper - step1_helper, 18), ")");
  console.log("- Contract:", ethers.formatUnits(step2_contract, 18), "ECHO (change:", ethers.formatUnits(step2_contract - step1_contract, 18), ")");
  console.log("");

  // Step 3: Submit Work
  console.log("Step 3: Helper submits work");
  const submitTx = await taskEscrow.connect(helper).submitWork(taskId);
  await submitTx.wait();
  console.log("✅ Work submitted");

  // Step 4: Confirm Complete (the critical step)
  console.log("Step 4: Creator confirms completion");
  console.log("Expected transfers in confirmComplete:");
  console.log("- Helper reward (98%):", ethers.formatUnits((rewardAmount * 98n) / 100n, 18), "ECHO");
  console.log("- Burn (2%):", ethers.formatUnits((rewardAmount * 2n) / 100n, 18), "ECHO");
  console.log("- Helper deposit return:", ethers.formatUnits(rewardAmount, 18), "ECHO");
  console.log("- Helper postFee:", ethers.formatUnits(postFee, 18), "ECHO");
  console.log("- Total to helper:", ethers.formatUnits((rewardAmount * 98n) / 100n + rewardAmount + postFee, 18), "ECHO");

  // Check contract balance before confirmComplete
  const preConfirm_contract = await echoToken.balanceOf(taskEscrow.target);
  console.log("Contract balance before confirmComplete:", ethers.formatUnits(preConfirm_contract, 18), "ECHO");
  
  const expectedTransferTotal = (rewardAmount * 98n) / 100n + rewardAmount + postFee; // 98 + 100 + 10 = 208
  const expectedBurn = (rewardAmount * 2n) / 100n; // 2
  const totalNeeded = expectedTransferTotal + expectedBurn; // 208 + 2 = 210
  
  console.log("Total ECHO needed for confirmComplete:", ethers.formatUnits(totalNeeded, 18), "ECHO");
  console.log("Contract has enough?", preConfirm_contract >= totalNeeded ? "✅" : "❌");

  if (preConfirm_contract < totalNeeded) {
    console.log("❌ Contract doesn't have enough ECHO for all transfers!");
    console.log("This will cause the confirmComplete to fail or behave unexpectedly");
  }

  const confirmTx = await taskEscrow.connect(deployer).confirmComplete(taskId);
  await confirmTx.wait();
  console.log("✅ Task completed");

  const step4_creator = await echoToken.balanceOf(deployer.address);
  const step4_helper = await echoToken.balanceOf(helper.address);
  const step4_contract = await echoToken.balanceOf(taskEscrow.target);

  console.log("After confirmComplete:");
  console.log("- Creator:", ethers.formatUnits(step4_creator, 18), "ECHO (change:", ethers.formatUnits(step4_creator - step2_creator, 18), ")");
  console.log("- Helper:", ethers.formatUnits(step4_helper, 18), "ECHO (change:", ethers.formatUnits(step4_helper - step2_helper, 18), ")");
  console.log("- Contract:", ethers.formatUnits(step4_contract, 18), "ECHO (change:", ethers.formatUnits(step4_contract - step2_contract, 18), ")");
  console.log("");

  // Final Analysis
  console.log("🎯 Final Analysis:");
  const totalCreatorChange = step4_creator - step0_creator;
  const totalHelperChange = step4_helper - step0_helper;
  const totalContractChange = step4_contract - step0_contract;

  console.log("Total changes from start to finish:");
  console.log("- Creator:", ethers.formatUnits(totalCreatorChange, 18), "ECHO (expected: -110)");
  console.log("- Helper:", ethers.formatUnits(totalHelperChange, 18), "ECHO (expected: +208)");
  console.log("- Contract:", ethers.formatUnits(totalContractChange, 18), "ECHO (expected: 0)");

  const creatorCorrect = totalCreatorChange === -totalRequired;
  const helperCorrect = totalHelperChange === expectedTransferTotal;
  const contractCorrect = totalContractChange === 0n;

  console.log("");
  console.log("Verification:");
  console.log("- Creator loss correct:", creatorCorrect ? "✅" : "❌");
  console.log("- Helper gain correct:", helperCorrect ? "✅" : "❌");
  console.log("- Contract balance unchanged:", contractCorrect ? "✅" : "❌");

  const allCorrect = creatorCorrect && helperCorrect && contractCorrect;
  console.log("");
  console.log("🎯 DETAILED PATH 1 RESULT:", allCorrect ? "✅ PASSED" : "❌ FAILED");

  if (!allCorrect) {
    console.log("");
    console.log("🔍 Debugging Info:");
    if (!helperCorrect) {
      console.log("Helper gain issue:");
      console.log("- Expected:", ethers.formatUnits(expectedTransferTotal, 18), "ECHO");
      console.log("- Actual:", ethers.formatUnits(totalHelperChange, 18), "ECHO");
      console.log("- Difference:", ethers.formatUnits(expectedTransferTotal - totalHelperChange, 18), "ECHO");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});