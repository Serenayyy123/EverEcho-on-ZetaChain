import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("Adding more ECHO for testing...");
  console.log("=".repeat(50));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", deployment.contracts.Register.address);
  
  const signers = await ethers.getSigners();
  const [deployer, helper, creator2, helper2] = signers;

  // Register additional accounts to get more ECHO
  const additionalAccounts = signers.slice(4, 8); // Use signers 4-7
  
  for (let i = 0; i < additionalAccounts.length; i++) {
    const account = additionalAccounts[i];
    try {
      const tx = await register.connect(account).register(`ipfs://extra-account-${i}`);
      await tx.wait();
      console.log(`✅ Extra account ${i} registered: ${account.address}`);
      
      // Transfer ECHO to main accounts
      const balance = await echoToken.balanceOf(account.address);
      if (balance > 0n) {
        // Transfer to deployer (main creator account)
        const transferTx = await echoToken.connect(account).transfer(deployer.address, balance);
        await transferTx.wait();
        console.log(`✅ Transferred ${ethers.formatEther(balance)} ECHO to deployer`);
      }
    } catch (e) {
      console.log(`⚠️  Extra account ${i} registration failed:`, e.message);
    }
  }

  // Check final balances
  console.log("\nFinal balances after ECHO boost:");
  console.log("-".repeat(40));
  
  const deployerBalance = await echoToken.balanceOf(deployer.address);
  const helperBalance = await echoToken.balanceOf(helper.address);
  const creator2Balance = await echoToken.balanceOf(creator2.address);
  const helper2Balance = await echoToken.balanceOf(helper2.address);
  
  console.log("Deployer (A):", ethers.formatUnits(deployerBalance, 18), "ECHO");
  console.log("Helper (B):  ", ethers.formatUnits(helperBalance, 18), "ECHO");
  console.log("Creator2 (C):", ethers.formatUnits(creator2Balance, 18), "ECHO");
  console.log("Helper2 (D): ", ethers.formatUnits(helper2Balance, 18), "ECHO");
  
  console.log("\n✅ ECHO boost complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});