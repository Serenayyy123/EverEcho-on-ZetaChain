import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("Getting fresh ECHO for verification...");
  console.log("=".repeat(50));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", deployment.contracts.Register.address);
  
  const signers = await ethers.getSigners();
  const [deployer, helper] = signers;

  // Use fresh signers (8-15) to get more ECHO
  const freshSigners = signers.slice(8, 16);
  
  console.log("Registering fresh accounts for ECHO...");
  for (let i = 0; i < freshSigners.length; i++) {
    const signer = freshSigners[i];
    try {
      const tx = await register.connect(signer).register(`ipfs://fresh-${i}`);
      await tx.wait();
      console.log(`✅ Fresh account ${i} registered: ${signer.address}`);
      
      // Transfer all ECHO to deployer
      const balance = await echoToken.balanceOf(signer.address);
      if (balance > 0n) {
        const transferTx = await echoToken.connect(signer).transfer(deployer.address, balance);
        await transferTx.wait();
        console.log(`   Transferred ${ethers.formatEther(balance)} ECHO to deployer`);
      }
    } catch (e) {
      console.log(`⚠️  Fresh account ${i} failed:`, e.message);
    }
  }

  // Also give helper some ECHO
  const deployerBalance = await echoToken.balanceOf(deployer.address);
  if (deployerBalance >= ethers.parseUnits("200", 18)) {
    const transferToHelper = ethers.parseUnits("200", 18);
    const tx = await echoToken.connect(deployer).transfer(helper.address, transferToHelper);
    await tx.wait();
    console.log("✅ Transferred 200 ECHO to helper");
  }

  // Final balance check
  const finalDeployerBalance = await echoToken.balanceOf(deployer.address);
  const finalHelperBalance = await echoToken.balanceOf(helper.address);
  
  console.log("\nFinal balances:");
  console.log("- Deployer:", ethers.formatUnits(finalDeployerBalance, 18), "ECHO");
  console.log("- Helper:", ethers.formatUnits(finalHelperBalance, 18), "ECHO");
  
  console.log("\n✅ Fresh ECHO ready for verification!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});