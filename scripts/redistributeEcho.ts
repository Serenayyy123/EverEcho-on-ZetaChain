import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("Redistributing ECHO for testing...");
  console.log("=".repeat(50));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  
  const signers = await ethers.getSigners();
  const [deployer, helper, creator2, helper2] = signers;

  // Check current balances
  console.log("Current balances:");
  const deployerBalance = await echoToken.balanceOf(deployer.address);
  const helperBalance = await echoToken.balanceOf(helper.address);
  const creator2Balance = await echoToken.balanceOf(creator2.address);
  const helper2Balance = await echoToken.balanceOf(helper2.address);
  
  console.log("- Deployer:", ethers.formatUnits(deployerBalance, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(helperBalance, 18), "ECHO");
  console.log("- Creator2:", ethers.formatUnits(creator2Balance, 18), "ECHO");
  console.log("- Helper2:", ethers.formatUnits(helper2Balance, 18), "ECHO");
  console.log("");

  // Transfer ECHO to deployer for testing
  if (creator2Balance > 0n) {
    const transferTx1 = await echoToken.connect(creator2).transfer(deployer.address, creator2Balance);
    await transferTx1.wait();
    console.log("✅ Transferred", ethers.formatUnits(creator2Balance, 18), "ECHO from Creator2 to Deployer");
  }

  if (helper2Balance > 0n) {
    const transferTx2 = await echoToken.connect(helper2).transfer(deployer.address, helper2Balance);
    await transferTx2.wait();
    console.log("✅ Transferred", ethers.formatUnits(helper2Balance, 18), "ECHO from Helper2 to Deployer");
  }

  // Check final balances
  console.log("\nFinal balances:");
  const finalDeployerBalance = await echoToken.balanceOf(deployer.address);
  const finalHelperBalance = await echoToken.balanceOf(helper.address);
  
  console.log("- Deployer:", ethers.formatUnits(finalDeployerBalance, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(finalHelperBalance, 18), "ECHO");
  
  console.log("\n✅ ECHO redistribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});