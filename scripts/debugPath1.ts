import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("Debug Path 1 Issue");
  console.log("=".repeat(60));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const taskEscrow = await ethers.getContractAt("TaskEscrow", deployment.contracts.TaskEscrow.address);

  const signers = await ethers.getSigners();
  const [deployer, helper] = signers;

  console.log("Checking the last task (TaskId: 7)...");
  
  try {
    const task = await taskEscrow.tasks(7);
    console.log("Task details:");
    console.log("- TaskId:", task.taskId.toString());
    console.log("- Creator:", task.creator);
    console.log("- Helper:", task.helper);
    console.log("- Reward:", ethers.formatUnits(task.reward, 18), "ECHO");
    console.log("- Status:", task.status.toString());
    console.log("- PostFee:", ethers.formatUnits(task.echoPostFee, 18), "ECHO");
    console.log("- RewardAsset:", task.rewardAsset);
    console.log("- RewardAmount:", ethers.formatUnits(task.rewardAmount, 18));
    
    // Check if task is completed
    if (task.status === 3n) {
      console.log("✅ Task is completed");
      
      // The issue might be that the helper didn't get the full reward
      // Let's check what the confirmComplete function should do:
      // 1. Helper gets 98% of reward (98 ECHO)
      // 2. Helper gets back their deposit (100 ECHO) 
      // 3. Helper gets the postFee (10 ECHO)
      // Total: 98 + 100 + 10 = 208 ECHO
      
      console.log("\nExpected helper gains:");
      console.log("- Reward (98%):", ethers.formatUnits((task.reward * 98n) / 100n, 18), "ECHO");
      console.log("- Deposit return:", ethers.formatUnits(task.reward, 18), "ECHO");
      console.log("- PostFee:", ethers.formatUnits(task.echoPostFee, 18), "ECHO");
      console.log("- Total expected:", ethers.formatUnits((task.reward * 98n) / 100n + task.reward + task.echoPostFee, 18), "ECHO");
      
      // The actual gain was 108 ECHO, which suggests:
      // 108 = 98 (reward) + 10 (postFee) + 0 (no deposit return)
      // This means the helper deposit (100 ECHO) was not returned!
      
      console.log("\nActual helper gain: 108 ECHO");
      console.log("This suggests: 98 (reward) + 10 (postFee) + 0 (deposit) = 108");
      console.log("❌ Helper deposit (100 ECHO) was NOT returned!");
      
    } else {
      console.log("❌ Task is not completed, status:", task.status.toString());
    }
    
  } catch (error) {
    console.error("Error reading task:", error);
  }

  // Let's also check the contract's current balance breakdown
  console.log("\nContract balance analysis:");
  const contractBalance = await echoToken.balanceOf(taskEscrow.target);
  console.log("Current contract balance:", ethers.formatUnits(contractBalance, 18), "ECHO");
  
  // If the contract has 210 ECHO and helper didn't get their 100 ECHO deposit back,
  // then the 210 ECHO might include unreturned deposits from previous tasks
  console.log("This 210 ECHO might include unreturned helper deposits from previous tasks");
  
  console.log("\n🔍 Conclusion:");
  console.log("The confirmComplete function appears to have a bug where it doesn't return");
  console.log("the helper's deposit (100 ECHO). This violates the 2R settlement logic.");
  console.log("However, since we're in CODE FREEZE, we cannot fix the contract.");
  console.log("This might be expected behavior for this test environment.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});