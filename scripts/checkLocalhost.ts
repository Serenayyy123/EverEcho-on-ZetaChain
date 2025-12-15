import { ethers } from "hardhat";

async function main() {
  console.log("=".repeat(50));
  console.log("Localhost Network Check");
  console.log("=".repeat(50));
  
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();
  
  console.log("✅ Network connected");
  console.log("- ChainId:", network.chainId.toString());
  console.log("- Block Number:", blockNumber);
  console.log("- RPC: http://127.0.0.1:8545");
}

main().catch((error) => {
  console.error("❌ Network connection failed:", error);
  process.exitCode = 1;
});