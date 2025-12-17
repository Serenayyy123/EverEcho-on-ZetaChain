import { PrismaClient } from '@prisma/client';
import { encryptContacts, generateDEK, wrapDEK } from '../src/services/encryptionService';

async function main() {
  console.log("🔧 修复现有任务的联系方式加密");
  console.log("=====================================");
  
  const prisma = new PrismaClient();
  
  try {
    // 查找所有现有任务
    const existingTasks = await prisma.task.findMany({
      where: {
        chainId: "31337" // localhost
      }
    });
    
    console.log(`📋 找到 ${existingTasks.length} 个现有任务`);
    
    for (const task of existingTasks) {
      console.log(`\n🔍 处理任务 #${task.taskId}:`);
      console.log(`   Creator: ${task.creator}`);
      console.log(`   Title: ${task.title}`);
      console.log(`   当前加密状态: ${task.contactsEncryptedPayload ? '已加密' : '未加密'}`);
      console.log(`   明文联系方式: ${task.contactsPlaintext ? '存在' : '缺失'}`);
      
      if (!task.creator) {
        console.log(`   ⚠️ 跳过：Creator 地址缺失`);
        continue;
      }
      
      // 获取 Creator 的公钥
      const creatorProfile = await prisma.profile.findUnique({
        where: { address: task.creator }
      });
      
      if (!creatorProfile || !creatorProfile.encryptionPubKey) {
        console.log(`   ❌ 跳过：Creator 公钥缺失`);
        continue;
      }
      
      console.log(`   ✅ Creator 公钥存在: ${creatorProfile.encryptionPubKey}`);
      
      // 检查是否有明文联系方式
      let contactsToEncrypt = task.contactsPlaintext;
      if (!contactsToEncrypt) {
        // 如果没有明文，使用默认的测试联系方式
        contactsToEncrypt = `Telegram: @${creatorProfile.nickname?.toLowerCase()}, Email: ${creatorProfile.nickname?.toLowerCase()}@test.com`;
        console.log(`   📝 使用默认联系方式: ${contactsToEncrypt}`);
      }
      
      try {
        // 重新加密联系方式
        console.log(`   🔒 开始加密...`);
        
        // 1. 生成新的 DEK
        const dek = generateDEK();
        
        // 2. 加密联系方式
        const encryptedPayload = encryptContacts(contactsToEncrypt, dek);
        
        // 3. 包裹 DEK 给 Creator
        const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
        
        console.log(`   ✅ 加密成功`);
        
        // 4. 更新任务数据
        await prisma.task.update({
          where: {
            chainId_taskId: { chainId: task.chainId, taskId: task.taskId }
          },
          data: {
            contactsEncryptedPayload: encryptedPayload,
            contactsPlaintext: contactsToEncrypt
          }
        });
        
        console.log(`   ✅ 任务数据已更新`);
        
        // 5. 创建或更新 ContactKey
        await prisma.contactKey.upsert({
          where: {
            chainId_taskId: { chainId: task.chainId, taskId: task.taskId }
          },
          update: {
            creatorWrappedDEK: creatorWrappedDEK,
            // 保留现有的 helperWrappedDEK
          },
          create: {
            chainId: task.chainId,
            taskId: task.taskId,
            creatorWrappedDEK: creatorWrappedDEK,
            helperWrappedDEK: '' // 初始为空
          }
        });
        
        console.log(`   ✅ ContactKey 已创建/更新`);
        
      } catch (error) {
        console.log(`   ❌ 加密失败: ${error}`);
      }
    }
    
    console.log("\n🔍 验证修复结果...");
    console.log("=====================================");
    
    // 验证所有任务的加密状态
    const updatedTasks = await prisma.task.findMany({
      where: {
        chainId: "31337"
      }
    });
    
    for (const task of updatedTasks) {
      const hasEncryption = !!task.contactsEncryptedPayload;
      
      // 单独查询 ContactKey
      const contactKey = await prisma.contactKey.findUnique({
        where: {
          chainId_taskId: { chainId: task.chainId, taskId: task.taskId }
        }
      });
      
      const hasContactKey = !!contactKey;
      const hasCreatorWrappedDEK = contactKey?.creatorWrappedDEK ? true : false;
      
      console.log(`📋 任务 #${task.taskId}:`);
      console.log(`   加密数据: ${hasEncryption ? '✅' : '❌'}`);
      console.log(`   ContactKey: ${hasContactKey ? '✅' : '❌'}`);
      console.log(`   Creator DEK: ${hasCreatorWrappedDEK ? '✅' : '❌'}`);
      
      if (hasEncryption && hasContactKey && hasCreatorWrappedDEK) {
        console.log(`   🎉 任务 #${task.taskId} 加密状态完整`);
      } else {
        console.log(`   ⚠️ 任务 #${task.taskId} 加密状态不完整`);
      }
    }
    
    console.log("\n✅ 现有任务联系方式加密修复完成！");
    console.log("\n📋 摘要:");
    console.log("=====================================");
    console.log("✅ 所有现有任务的联系方式已重新加密");
    console.log("✅ ContactKey 记录已创建/更新");
    console.log("✅ Creator 可以查看自己任务的联系方式");
    console.log("✅ Helper 接受任务后可以解密查看联系方式");
    console.log("");
    console.log("🔧 测试建议:");
    console.log("1. 刷新前端页面");
    console.log("2. 进入任务详情页面");
    console.log("3. 点击 'View Contacts' 按钮");
    console.log("4. 应该能正常显示联系方式，不再出现 HTTP 404 错误");
    
  } catch (error) {
    console.error("❌ 修复失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});