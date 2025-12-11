import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载 backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: {
      chainId_taskId: {
        chainId: 84532,
        taskId: '7',
      },
    },
    select: {
      taskId: true,
      contactsEncryptedPayload: true,
      contactsPlaintext: true,
    },
  });

  if (!task) {
    console.log('Task 7 not found');
    return;
  }

  console.log('=== Task 7 Data ===');
  console.log('contactsEncryptedPayload:', task.contactsEncryptedPayload);
  console.log('contactsEncryptedPayload length:', task.contactsEncryptedPayload.length);
  console.log('');
  console.log('contactsPlaintext:', task.contactsPlaintext);
  console.log('contactsPlaintext length:', task.contactsPlaintext.length);
  console.log('');
  
  // 检查是否是加密数据（hex 格式）
  const isEncrypted = /^[0-9a-f]{64,}$/i.test(task.contactsPlaintext);
  console.log('contactsPlaintext looks encrypted?', isEncrypted);
  
  // 检查是否相同
  const isSame = task.contactsEncryptedPayload === task.contactsPlaintext;
  console.log('Both fields are identical?', isSame);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
