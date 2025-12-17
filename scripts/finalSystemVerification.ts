import { ethers } from "hardhat";
import axios from 'axios';

async function main() {
  console.log("🎯 最终系统状态验证");
  console.log("=====================================");
  
  const fs = require('fs');
  const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const TaskEscrowAddress = deploymentData.localhost.contracts.TaskEscrow.address;
  
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", TaskEscrowAddress);
  
  console.log("📋 1. 链上任务状态验证");
  console.log("=====================================");
  
  const taskCounter = await TaskEscrow.taskCounter();
  console.log(`TaskCounter: ${taskCounter}`);
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await TaskEscrow.tasks(i);
    console.log(`\n任务 #${i}:`);
    console.log(`  Creator: ${task.creator}`);
    console.log(`  Reward: ${ethers.formatEther(task.reward)} ECHO`);
    console.log(`  Status: ${getStatusName(Number(task.status))}`);
    console.log(`  TaskURI: ${task.taskURI}`);
  }
  
  console.log("\n📋 2. 后端API状态验证");
  console.log("=====================================");
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    try {
      const response = await axios.get(`http://localhost:3001/api/task/${i}`);
      console.log(`\n任务 #${i} (API):`);
      console.log(`  Title: ${response.data.title}`);
      console.log(`  Creator: ${response.data.creator}`);
      console.log(`  CreatorNickname: ${response.data.creatorNickname}`);
      console.log(`  ✅ API响应正常`);
    } catch (error) {
      console.log(`\n任务 #${i} (API): ❌ ${error.response?.status || 'Network Error'}`);
    }
  }
  
  console.log("\n📋 3. 测试账号公钥验证");
  console.log("=====================================");
  
  const testAccounts = [
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Creator1" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Helper1" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "Creator2" },
    { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", name: "Helper2" }
  ];
  
  for (const account of testAccounts) {
    try {
      const response = await axios.get(`http://localhost:3001/api/profile/${account.address}`);
      const hasPublicKey = response.data.encryptionPubKey ? true : false;
      const keyLength = response.data.encryptionPubKey ? (response.data.encryptionPubKey.length - 2) / 2 : 0;
      
      console.log(`${account.name}:`);
      console.log(`  Profile: ✅`);
      console.log(`  公钥: ${hasPublicKey ? '✅' : '❌'}`);
      console.log(`  公钥长度: ${keyLength} 字节 ${keyLength === 32 ? '✅' : '❌'}`);
      console.log(`  昵称: ${response.data.nickname}`);
      
    } catch (error) {
      console.log(`${account.name}: ❌ Profile API错误`);
    }
  }
  
  console.log("\n📋 4. 联系方式加密状态验证");
  console.log("=====================================");
  
  for (let i = 1; i <= Number(taskCounter); i++) {
    try {
      // 检查任务的联系方式加密状态
      const taskResponse = await axios.get(`http://localhost:3001/api/task/${i}`);
      
      console.log(`\n任务 #${i} 联系方式状态:`);
      
      // 尝试获取联系方式 (模拟Creator访问)
      try {
        const contactsResponse = await axios.post(`http://localhost:3001/api/contacts/decrypt`, {
          taskId: i.toString(),
          userAddress: taskResponse.data.creator
        });
        
        console.log(`  联系方式解密: ✅`);
        console.log(`  联系方式内容: ${contactsResponse.data.contacts}`);
        
      } catch (contactError) {
        console.log(`  联系方式解密: ❌ ${contactError.response?.status || 'Error'}`);
        
        if (contactError.response?.status === 404) {
          console.log(`    原因: ContactKey 不存在`);
        } else if (contactError.response?.status === 400) {
          console.log(`    原因: 解密失败或公钥问题`);
        }
      }
      
    } catch (error) {
      console.log(`\n任务 #${i}: API访问失败`);
    }
  }
  
  console.log("\n📋 5. 前端兼容性验证");
  console.log("=====================================");
  
  console.log("模拟前端TaskDetail页面行为:");
  
  for (let i = 1; i <= Math.min(Number(taskCounter), 2); i++) {
    console.log(`\n访问 /tasks/${i}:`);
    
    try {
      // 1. 从链上读取任务数据
      const taskData = await TaskEscrow.tasks(i);
      console.log(`  ✅ 链上数据读取成功`);
      console.log(`    Creator: ${taskData.creator}`);
      console.log(`    Status: ${getStatusName(Number(taskData.status))}`);
      
      // 2. 从API获取metadata
      const metadataResponse = await axios.get(`http://localhost:3001/api/task/${taskData.taskURI}`);
      console.log(`  ✅ Metadata读取成功`);
      console.log(`    Title: ${metadataResponse.data.title}`);
      
      // 3. 联系方式状态
      try {
        const contactsResponse = await axios.post(`http://localhost:3001/api/contacts/decrypt`, {
          taskId: taskData.taskURI,
          userAddress: taskData.creator
        });
        console.log(`  ✅ 联系方式可访问`);
      } catch (contactError) {
        console.log(`  ⚠️ 联系方式访问问题: ${contactError.response?.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ 页面加载失败: ${error.message}`);
    }
  }
  
  console.log("\n🎉 系统状态总结");
  console.log("=====================================");
  
  const summary = {
    chainTasks: Number(taskCounter),
    apiTasks: 0,
    accountsWithKeys: 0,
    encryptedTasks: 0
  };
  
  // 统计API任务数量
  for (let i = 1; i <= Number(taskCounter); i++) {
    try {
      await axios.get(`http://localhost:3001/api/task/${i}`);
      summary.apiTasks++;
    } catch (e) {}
  }
  
  // 统计有公钥的账户
  for (const account of testAccounts) {
    try {
      const response = await axios.get(`http://localhost:3001/api/profile/${account.address}`);
      if (response.data.encryptionPubKey && (response.data.encryptionPubKey.length - 2) / 2 === 32) {
        summary.accountsWithKeys++;
      }
    } catch (e) {}
  }
  
  // 统计加密任务数量
  for (let i = 1; i <= Number(taskCounter); i++) {
    try {
      const taskResponse = await axios.get(`http://localhost:3001/api/task/${i}`);
      const contactsResponse = await axios.post(`http://localhost:3001/api/contacts/decrypt`, {
        taskId: i.toString(),
        userAddress: taskResponse.data.creator
      });
      summary.encryptedTasks++;
    } catch (e) {}
  }
  
  console.log(`📊 链上任务数量: ${summary.chainTasks}`);
  console.log(`📊 API任务数量: ${summary.apiTasks}`);
  console.log(`📊 有效公钥账户: ${summary.accountsWithKeys}/4`);
  console.log(`📊 加密任务数量: ${summary.encryptedTasks}`);
  
  const allGood = summary.chainTasks > 0 && 
                  summary.apiTasks === summary.chainTasks && 
                  summary.accountsWithKeys === 4 && 
                  summary.encryptedTasks === summary.chainTasks;
  
  if (allGood) {
    console.log("\n🎉 ✅ 系统状态完全正常！");
    console.log("✅ 链上任务与API任务数据一致");
    console.log("✅ 所有测试账号都有有效的加密公钥");
    console.log("✅ 所有任务的联系方式都已正确加密");
    console.log("✅ 前端应该能正常显示任务详情和联系方式");
  } else {
    console.log("\n⚠️ 系统状态存在问题：");
    if (summary.apiTasks !== summary.chainTasks) {
      console.log("❌ 链上任务与API任务数量不一致");
    }
    if (summary.accountsWithKeys !== 4) {
      console.log("❌ 部分测试账号缺少有效公钥");
    }
    if (summary.encryptedTasks !== summary.chainTasks) {
      console.log("❌ 部分任务的联系方式加密有问题");
    }
  }
  
  console.log("\n🔧 测试指南:");
  console.log("=====================================");
  console.log("现在你可以测试:");
  console.log("1. 访问 http://localhost:5173/tasks");
  console.log("2. 点击任务1或任务2进入详情页");
  console.log("3. 应该能正常显示任务信息，不再跳转到task0");
  console.log("4. 点击 'View Contacts' 应该能正常显示联系方式");
  console.log("5. 不再出现 'Failed to load contacts: HTTP 404' 错误");
  
} 

function getStatusName(status: number): string {
  const statusNames = {
    0: "Open",
    1: "InProgress", 
    2: "Submitted",
    3: "Completed",
    4: "Cancelled"
  };
  return statusNames[status as keyof typeof statusNames] || "Unknown";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});