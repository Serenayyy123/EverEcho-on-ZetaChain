import fs from 'fs';
import path from 'path';

async function main() {
  console.log("🔧 添加测试联系方式端点");
  console.log("=====================================");
  
  const contactsRoutePath = path.join(__dirname, '../src/routes/contacts.ts');
  
  try {
    // 读取现有的contacts.ts文件
    let contactsContent = fs.readFileSync(contactsRoutePath, 'utf8');
    
    // 检查是否已经有测试端点
    if (contactsContent.includes('/test-decrypt')) {
      console.log("✅ 测试端点已存在");
      return;
    }
    
    // 添加测试端点
    const testEndpoint = `
/**
 * POST /api/contacts/test-decrypt
 * 测试用联系方式解密端点（无签名验证）
 * 仅用于本地开发测试
 */
router.post('/test-decrypt', async (req: Request, res: Response) => {
  try {
    const { taskId, userAddress } = req.body;
    
    console.log('[/test-decrypt] Request received:', { taskId, userAddress });
    
    // 参数校验
    if (!taskId || !userAddress) {
      return res.status(400).json({
        error: 'Missing required fields: taskId, userAddress',
      });
    }
    
    // 直接从数据库获取明文联系方式
    const { getCurrentChainId } = require('../config/chainConfig');
    const CURRENT_CHAIN_ID = getCurrentChainId();
    
    const task = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
      select: { 
        contactsPlaintext: true,
        creator: true,
        title: true
      },
    });
    
    if (!task) {
      console.log('[/test-decrypt] Task not found:', taskId);
      return res.status(404).json({
        error: 'Task not found',
      });
    }
    
    if (!task.contactsPlaintext) {
      console.log('[/test-decrypt] Contacts not found for task:', taskId);
      return res.status(404).json({
        error: 'Contacts not found',
      });
    }
    
    console.log('[/test-decrypt] Returning contacts:', task.contactsPlaintext);
    
    // 返回明文联系方式
    res.status(200).json({
      success: true,
      contacts: task.contactsPlaintext,
      taskTitle: task.title,
      creator: task.creator,
      note: 'This is a test endpoint without signature verification'
    });
    
  } catch (error) {
    console.error('Error in test-decrypt:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
`;
    
    // 在export default router之前插入测试端点
    const exportIndex = contactsContent.lastIndexOf('export default router;');
    if (exportIndex === -1) {
      console.log("❌ 无法找到export语句");
      return;
    }
    
    const newContent = contactsContent.slice(0, exportIndex) + 
                      testEndpoint + 
                      '\n' + 
                      contactsContent.slice(exportIndex);
    
    // 写入文件
    fs.writeFileSync(contactsRoutePath, newContent);
    
    console.log("✅ 测试端点已添加到 contacts.ts");
    console.log("📋 新端点: POST /api/contacts/test-decrypt");
    console.log("📋 参数: { taskId, userAddress }");
    console.log("📋 功能: 无签名验证的联系方式获取");
    
    console.log("\n🔧 重启后端服务以应用更改:");
    console.log("1. 停止当前的后端服务 (Ctrl+C)");
    console.log("2. 重新运行: npm run dev");
    console.log("3. 测试新端点:");
    console.log("   curl -X POST http://localhost:3001/api/contacts/test-decrypt \\");
    console.log("        -H 'Content-Type: application/json' \\");
    console.log("        -d '{\"taskId\":\"1\",\"userAddress\":\"0x70997970C51812dc3A010C7d01b50e0d17dc79C8\"}'");
    
  } catch (error) {
    console.error("❌ 添加测试端点失败:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});