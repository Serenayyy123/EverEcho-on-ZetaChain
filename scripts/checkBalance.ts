import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("=".repeat(50));
  console.log("ZetaChain Athens Balance Check");
  console.log("=".repeat(50));
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", await deployer.provider.getNetwork());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});