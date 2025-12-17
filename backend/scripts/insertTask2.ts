import { PrismaClient } from '@prisma/client';
import axios from 'axios';

async function main() {
  console.log("🔧 直接在数据库中插入任务2数据");
  console.log("=====================================");
  
  const prisma = new PrismaClient();
  
  try {
    // 检查任务2是否已存在
    const existingTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: "31337", taskId: "2" }
      },
    });
    
    if (existingTask) {
      console.log("✅ 任务2已存在于数据库");
      console.log(`   Title: ${existingTask.title}`);
      console.log(`   Creator: ${existingTask.creator}`);
      return;
    }
    
    // 插入任务2数据
    console.log("📤 插入任务2数据...");
    const task2 = await prisma.task.create({
      data: {
        chainId: "31337",
        taskId: "2",
        title: "test",
        description: "test",
        contactsEncryptedPayload: "encrypted_test_contact_info_2",
        contactsPlaintext: "test contact info for task 2",
        createdAt: Date.now().toString(),
        category: "coffeechat",
        creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Creator1地址
      },
    });
    
    console.log("✅ 任务2插入成功:");
    console.log(`   TaskId: ${task2.taskId}`);
    console.log(`   Title: ${task2.title}`);
    console.log(`   Creator: ${task2.creator}`);
    
    // 验证可以通过API读取
    console.log("\n📤 验证API读取...");
    const response = await axios.get('http://localhost:3001/api/task/2');
    
    console.log("✅ API验证成功:");
    console.log(`   Title: ${response.data.title}`);
    console.log(`   Creator: ${response.data.creator}`);
    console.log(`   CreatorNickname: ${response.data.creatorNickname}`);
    
  } catch (error) {
    console.error("❌ 操作失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});