import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Task 9 with real title...\n');
  
  const result = await prisma.task.update({
    where: { taskId: '9' },
    data: {
      title: '求新疆姐妹邀请去婚礼参加拖依舞会！！会带红包和礼物',
      description: '求新疆姐妹邀请去婚礼参加拖依舞会！！会带红包和礼物',
    },
  });
  
  console.log('✅ Task 9 updated successfully!');
  console.log('  Title:', result.title);
  console.log('  Description:', result.description);
  console.log('');
  console.log('Now refresh your browser to see the updated title!');
  
  await prisma.$disconnect();
}

main().catch(console.error);
