import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Setting up test accounts with ECHO tokens...");
  console.log("=".repeat(50));
  
  // 读取部署信息
  const deploymentJson = fs.readFileSync('deployment.json', 'utf8');
  const deploymentData = JSON.parse(deploymentJson);
  
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("网络信息:");
  console.log("ChainId:", chainId);
  console.log("Network:", network.name);
  
  let deployment;
  if (chainId === 31337) {
    deployment = deploymentData.localhost;
  } else {
    console.error("Only localhost network supported for setup");
    process.exit(1);
  }
  
  // 处理不同的部署结构
  const getContractAddress = (contractName: string) => {
    const contract = deployment.contracts[contractName];
    return typeof contract === 'string' ? contract : contract.address;
  };
  
  const tokenAddress = getContractAddress('EOCHOToken');
  const registerAddress = getContractAddress('Register');
  
  console.log("\n合约地址:");
  console.log("EOCHOToken:", tokenAddress);
  console.log("Register:", registerAddress);
  
  // 检查合约代码
  const tokenCode = await ethers.provider.getCode(tokenAddress);
  const registerCode = await ethers.provider.getCode(registerAddress);
  
  console.log("\n合约代码验证:");
  console.log("EOCHOToken code length:", tokenCode.length);
  console.log("Register code length:", registerCode.length);
  console.log("EOCHOToken exists:", tokenCode !== "0x");
  console.log("Register exists:", registerCode !== "0x");
  
  if (tokenCode === "0x" || registerCode === "0x") {
    console.error("❌ 合约未正确部署");
    process.exit(1);
  }
  
  // 获取合约实例
  const echoToken = await ethers.getContractAt("EOCHOToken", tokenAddress);
  const register = await ethers.getContractAt("Register", registerAddress);
  
  // 获取账户
  const [deployer, helper, creator2, helper2] = await ethers.getSigners();
  
  console.log("\n注册账户 (每次注册自动 mint 100 ECHO):");
  console.log("-".repeat(40));
  
  // 注册账户（每次注册会自动 mint 100 ECHO）
  try {
    const tx1 = await register.connect(deployer).register("ipfs://creator-a-profile");
    await tx1.wait();
    console.log("✅ Deployer registered and received 100 ECHO");
  } catch (e) {
    console.log("⚠️  Deployer registration failed:", e.message);
  }
  
  try {
    const tx2 = await register.connect(helper).register("ipfs://helper-b-profile");
    await tx2.wait();
    console.log("✅ Helper registered and received 100 ECHO");
  } catch (e) {
    console.log("⚠️  Helper registration failed:", e.message);
  }
  
  try {
    const tx3 = await register.connect(creator2).register("ipfs://creator-c-profile");
    await tx3.wait();
    console.log("✅ Creator2 registered and received 100 ECHO");
  } catch (e) {
    console.log("⚠️  Creator2 registration failed:", e.message);
  }
  
  try {
    const tx4 = await register.connect(helper2).register("ipfs://helper-d-profile");
    await tx4.wait();
    console.log("✅ Helper2 registered and received 100 ECHO");
  } catch (e) {
    console.log("⚠️  Helper2 registration failed:", e.message);
  }
  
  // 检查余额
  console.log("\n最终余额检查:");
  console.log("-".repeat(40));
  
  try {
    const deployerBalance = await echoToken.balanceOf(deployer.address);
    const helperBalance = await echoToken.balanceOf(helper.address);
    const creator2Balance = await echoToken.balanceOf(creator2.address);
    const helper2Balance = await echoToken.balanceOf(helper2.address);
    
    console.log("Deployer (A):", ethers.formatUnits(deployerBalance, 18), "ECHO");
    console.log("Helper (B):  ", ethers.formatUnits(helperBalance, 18), "ECHO");
    console.log("Creator2 (C):", ethers.formatUnits(creator2Balance, 18), "ECHO");
    console.log("Helper2 (D): ", ethers.formatUnits(helper2Balance, 18), "ECHO");
    
    // 验证 balanceOf 调用成功
    console.log("\n✅ balanceOf 调用成功，无 BAD_DATA 错误");
    console.log("✅ Test accounts setup complete!");
    
  } catch (error) {
    console.error("❌ balanceOf 调用失败:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});