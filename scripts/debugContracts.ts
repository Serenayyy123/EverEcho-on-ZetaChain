import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Debugging contract deployment...");
  
  // 读取部署信息
  const deploymentJson = fs.readFileSync('deployment.json', 'utf8');
  const deploymentData = JSON.parse(deploymentJson);
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  const deployment = deploymentData.localhost;
  
  console.log("Network:", chainId);
  console.log("EOCHOToken address:", deployment.contracts.EOCHOToken.address);
  
  // 检查合约是否存在
  const code = await ethers.provider.getCode(deployment.contracts.EOCHOToken.address);
  console.log("Contract code length:", code.length);
  console.log("Contract exists:", code !== "0x");
  
  if (code === "0x") {
    console.log("❌ Contract not deployed at this address");
    return;
  }
  
  // 尝试获取合约
  try {
    const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
    
    // 尝试调用简单的 view 函数
    const name = await echoToken.name();
    console.log("Token name:", name);
    
    const symbol = await echoToken.symbol();
    console.log("Token symbol:", symbol);
    
    const totalSupply = await echoToken.totalSupply();
    console.log("Total supply:", ethers.formatUnits(totalSupply, 18));
    
    // 尝试 balanceOf
    const [deployer] = await ethers.getSigners();
    const balance = await echoToken.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.formatUnits(balance, 18));
    
  } catch (error) {
    console.error("Error calling contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});