import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * 检查EOCHOToken合约中的TaskEscrow地址设置
 */

async function main() {
  console.log("检查EOCHOToken合约中的TaskEscrow地址设置...");
  console.log("");

  // 读取部署信息
  let deploymentData: any = {};
  try {
    const existingData = fs.readFileSync('deployment.json', 'utf8');
    deploymentData = JSON.parse(existingData);
  } catch (error) {
    console.error("❌ 无法读取 deployment.json");
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  let networkName = "";
  if (chainId === 31337) {
    networkName = "localhost";
  } else if (chainId === 7001) {
    networkName = "zetachainAthens";
  }

  if (!deploymentData[networkName]) {
    console.error(`❌ 未找到 ${networkName} 网络的部署信息`);
    process.exit(1);
  }

  const echoTokenAddress = deploymentData[networkName].contracts.EOCHOToken.address;
  const currentTaskEscrowAddress = deploymentData[networkName].contracts.TaskEscrow.address;

  console.log("网络:", networkName, "(", chainId, ")");
  console.log("EOCHOToken地址:", echoTokenAddress);
  console.log("当前TaskEscrow地址:", currentTaskEscrowAddress);
  console.log("");

  // 连接到EOCHOToken合约
  const echoToken = await ethers.getContractAt("EOCHOToken", echoTokenAddress);
  
  try {
    // 检查当前设置的TaskEscrow地址
    const setTaskEscrowAddress = await echoToken.taskEscrowAddress();
    console.log("EOCHOToken中设置的TaskEscrow地址:", setTaskEscrowAddress);
    
    if (setTaskEscrowAddress === ethers.ZeroAddress) {
      console.log("✓ TaskEscrow地址未设置，可以设置新地址");
    } else if (setTaskEscrowAddress.toLowerCase() === currentTaskEscrowAddress.toLowerCase()) {
      console.log("✓ TaskEscrow地址已正确设置");
    } else {
      console.log("⚠️  TaskEscrow地址已设置为其他地址");
      console.log("   需要部署新的EOCHOToken合约或使用不同的方法");
    }
    
    // 检查合约owner
    const owner = await echoToken.owner();
    const [deployer] = await ethers.getSigners();
    console.log("");
    console.log("EOCHOToken合约owner:", owner);
    console.log("当前部署账户:", deployer.address);
    
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✓ 当前账户是合约owner，可以调用setter函数");
    } else {
      console.log("❌ 当前账户不是合约owner，无法调用setter函数");
    }
    
  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });