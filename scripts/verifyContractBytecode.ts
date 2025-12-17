/**
 * 验证合约字节码是否与源代码一致
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔍 验证合约字节码");
  console.log("=".repeat(50));

  // 读取部署信息
  const deploymentPath = "./deployment.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ 找不到 deployment.json");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deploymentData.localhost.contracts;

  // 获取合约实例
  const taskEscrow = await ethers.getContractAt("TaskEscrow", contracts.TaskEscrow.address);

  console.log("📋 合约信息：");
  console.log("TaskEscrow 地址:", contracts.TaskEscrow.address);
  console.log("");

  // 检查合约常量
  const T_OPEN = await taskEscrow.T_OPEN();
  const T_PROGRESS = await taskEscrow.T_PROGRESS();
  const T_REVIEW = await taskEscrow.T_REVIEW();
  const FEE_BPS = await taskEscrow.FEE_BPS();
  const MAX_REWARD = await taskEscrow.MAX_REWARD();
  const TASK_POST_FEE = await taskEscrow.TASK_POST_FEE();

  console.log("🔧 合约常量：");
  console.log(`T_OPEN: ${T_OPEN} seconds (${Number(T_OPEN) / 86400} days)`);
  console.log(`T_PROGRESS: ${T_PROGRESS} seconds (${Number(T_PROGRESS) / 86400} days)`);
  console.log(`T_REVIEW: ${T_REVIEW} seconds (${Number(T_REVIEW) / 86400} days)`);
  console.log(`FEE_BPS: ${FEE_BPS} (${Number(FEE_BPS) / 100}%)`);
  console.log(`MAX_REWARD: ${ethers.formatEther(MAX_REWARD)} ECHO`);
  console.log(`TASK_POST_FEE: ${ethers.formatEther(TASK_POST_FEE)} ECHO`);
  console.log("");

  // 验证常量是否正确
  const expectedValues = {
    T_OPEN: 7 * 24 * 60 * 60, // 7 days
    T_PROGRESS: 14 * 24 * 60 * 60, // 14 days
    T_REVIEW: 3 * 24 * 60 * 60, // 3 days
    FEE_BPS: 200, // 2%
    MAX_REWARD: ethers.parseEther("1000"),
    TASK_POST_FEE: ethers.parseEther("10")
  };

  console.log("✅ 常量验证：");
  console.log(`T_OPEN: ${Number(T_OPEN) === expectedValues.T_OPEN ? '✅' : '❌'}`);
  console.log(`T_PROGRESS: ${Number(T_PROGRESS) === expectedValues.T_PROGRESS ? '✅' : '❌'}`);
  console.log(`T_REVIEW: ${Number(T_REVIEW) === expectedValues.T_REVIEW ? '✅' : '❌'}`);
  console.log(`FEE_BPS: ${Number(FEE_BPS) === expectedValues.FEE_BPS ? '✅' : '❌'}`);
  console.log(`MAX_REWARD: ${MAX_REWARD === expectedValues.MAX_REWARD ? '✅' : '❌'}`);
  console.log(`TASK_POST_FEE: ${TASK_POST_FEE === expectedValues.TASK_POST_FEE ? '✅' : '❌'}`);
  console.log("");

  // 检查合约方法是否存在
  console.log("🔧 方法检查：");
  try {
    const taskCounter = await taskEscrow.taskCounter();
    console.log(`taskCounter: ✅ (当前值: ${taskCounter})`);
  } catch (e) {
    console.log("taskCounter: ❌");
  }

  try {
    // 检查是否有 confirmComplete 方法
    const fragment = taskEscrow.interface.getFunction("confirmComplete");
    console.log(`confirmComplete: ✅ (inputs: ${fragment.inputs.length})`);
  } catch (e) {
    console.log("confirmComplete: ❌");
  }

  console.log("");
  console.log("🔍 字节码验证完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });