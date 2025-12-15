import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(50));
  console.log("Contract Code Verification");
  console.log("=".repeat(50));

  const network = "localhost";
  const deployment = (deploymentData as any)[network];
  
  if (!deployment) {
    console.log("❌ No localhost deployment found");
    return;
  }

  console.log("Network:", network);
  console.log("ChainId:", deployment.chainId);
  console.log("");

  const contracts = [
    { name: "EOCHOToken", address: deployment.contracts.EOCHOToken.address },
    { name: "Register", address: deployment.contracts.Register.address },
    { name: "TaskEscrow", address: deployment.contracts.TaskEscrow.address },
    { name: "EverEchoGateway", address: deployment.contracts.EverEchoGateway.address },
  ];

  for (const contract of contracts) {
    const code = await ethers.provider.getCode(contract.address);
    const codeLength = code.length;
    const hasCode = codeLength > 2; // "0x" = 2 chars
    
    console.log(`${contract.name}:`);
    console.log(`  Address: ${contract.address}`);
    console.log(`  Code Length: ${codeLength} bytes`);
    console.log(`  Has Code: ${hasCode ? "✅" : "❌"}`);
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});