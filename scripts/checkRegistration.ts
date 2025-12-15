import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("检查注册状态...");
  
  const deploymentJson = fs.readFileSync('deployment.json', 'utf8');
  const deploymentData = JSON.parse(deploymentJson);
  const deployment = deploymentData.localhost;
  
  const getContractAddress = (contractName: string) => {
    const contract = deployment.contracts[contractName];
    return typeof contract === 'string' ? contract : contract.address;
  };
  
  const echoToken = await ethers.getContractAt("EOCHOToken", getContractAddress('EOCHOToken'));
  const register = await ethers.getContractAt("Register", getContractAddress('Register'));
  
  const [deployer, helper, creator2, helper2] = await ethers.getSigners();
  
  console.log("\n检查注册状态:");
  
  try {
    const deployerRegistered = await register.isRegistered(deployer.address);
    const helperRegistered = await register.isRegistered(helper.address);
    const creator2Registered = await register.isRegistered(creator2.address);
    const helper2Registered = await register.isRegistered(helper2.address);
    
    console.log("Deployer registered:", deployerRegistered);
    console.log("Helper registered:", helperRegistered);
    console.log("Creator2 registered:", creator2Registered);
    console.log("Helper2 registered:", helper2Registered);
    
    // 检查是否已经 mint 过初始代币
    const deployerMinted = await echoToken.hasReceivedInitialMint(deployer.address);
    const helperMinted = await echoToken.hasReceivedInitialMint(helper.address);
    const creator2Minted = await echoToken.hasReceivedInitialMint(creator2.address);
    const helper2Minted = await echoToken.hasReceivedInitialMint(helper2.address);
    
    console.log("\n检查初始 mint 状态:");
    console.log("Deployer minted:", deployerMinted);
    console.log("Helper minted:", helperMinted);
    console.log("Creator2 minted:", creator2Minted);
    console.log("Helper2 minted:", helper2Minted);
    
    // 如果已注册但未 mint，尝试手动 mint
    if (deployerRegistered && !deployerMinted) {
      console.log("\n尝试为已注册用户 mint 初始代币...");
      try {
        await echoToken.mintInitial(deployer.address);
        console.log("✅ Deployer mint 成功");
      } catch (e) {
        console.log("❌ Deployer mint 失败:", e.message);
      }
    }
    
  } catch (error) {
    console.error("检查失败:", error);
  }
}

main().catch(console.error);