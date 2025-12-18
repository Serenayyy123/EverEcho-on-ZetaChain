import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  console.log("🚀 开始重新部署完整系统（使用新Register地址）...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer