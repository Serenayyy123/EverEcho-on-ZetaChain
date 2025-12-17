import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 简单合约连接测试");
  console.log("=====================================");
  
  // 读取部署信息
  const deploymentData = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const contracts = deploymentData.localhost.contracts;
  
  console.log("📋 使用的合约地址:");
  console.log(`   EOCHOToken: ${contracts.EOCHOToken.address}`);
  console.log(`   Register: ${contracts.Register.address}`);
  console.log(`   MockZRC20: ${contracts.MockZRC20.address}`);
  
  // 获取账户
  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  
  try {
    // 测试 EOCHOToken
    console.log("\n🪙 测试 EOCHOToken...");
    const echoToken = await ethers.getContractAt("EOCHOToken", contracts.EOCHOToken.address);
    const totalSupply = await echoToken.totalSupply();
    console.log(`   ✅ 总供应量: ${ethers.formatEther(totalSupply)} ECHO`);
    
    const deployerBalance = await echoToken.balanceOf(deployer.address);
    console.log(`   ✅ Deployer余额: ${ethers.formatEther(deployerBalance)} ECHO`);
    
  } catch (error) {
    console.log(`   ❌ EOCHOToken 测试失败: ${error.message}`);
  }
  
  try {
    // 测试 Register
    console.log("\n📝 测试 Register...");
    const register = await ethers.getContractAt("Register", contracts.Register.address);
    const isRegistered = await register.isRegistered(deployer.address);
    console.log(`   ✅ Deployer注册状态: ${isRegistered}`);
    
  } catch (error) {
    console.log(`   ❌ Register 测试失败: ${error.message}`);
  }
  
  try {
    // 测试 MockZRC20
    console.log("\n🌉 测试 MockZRC20...");
    const mockZRC20 = await ethers.getContractAt("MockZRC20", contracts.MockZRC20.address);
    const totalSupply = await mockZRC20.totalSupply();
    console.log(`   ✅ 总供应量: ${ethers.formatEther(totalSupply)} MockZRC20`);
    
    const deployerBalance = await mockZRC20.balanceOf(deployer.address);
    console.log(`   ✅ Deployer余额: ${ethers.formatEther(deployerBalance)} MockZRC20`);
    
  } catch (error) {
    console.log(`   ❌ MockZRC20 测试失败: ${error.message}`);
  }
  
  // 网络信息
  console.log("\n🌐 网络信息:");
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(`   网络: ${network.name} (ChainId: ${network.chainId})`);
  console.log(`   区块高度: ${blockNumber}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});