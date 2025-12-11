import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { generateDEK, wrapDEK } from '../src/services/encryptionService';
import { getProfile } from '../src/services/profileService';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixTask8ContactKey() {
  console.log('=== Fixing Task8 ContactKey ===\n');

  const chainId = process.env.CHAIN_ID || '84532';
  const taskId = '8';

  // 1. 从链上读取 Task8
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.TASK_ESCROW_ADDRESS!,
    ['function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)'],
    provider
  );

  const task = await contract.tasks(8);
  const creator = task[1];
  const helper = task[2];

  console.log('Task8 info:');
  console.log(`  Creator: ${creator}`);
  console.log(`  Helper: ${helper}`);

  // 2. 检查是否已存在
  const existing = await prisma.contactKey.findUnique({
    where: {
      chainId_taskId: { chainId, taskId },
    },
  });

  if (existing) {
    console.log('\n✓ ContactKey already exists');
    console.log(`  Creator DEK: ${existing.creatorWrappedDEK ? 'exists' : 'missing'}`);
    console.log(`  Helper DEK: ${existing.helperWrappedDEK ? 'exists' : 'missing'}`);
    await prisma.$disconnect();
    return;
  }

  // 3. 获取 creator 和 helper 的公钥
  console.log('\n--- Fetching public keys ---');
  
  const creatorProfile = await getProfile(creator);
  if (!creatorProfile?.encryptionPubKey) {
    throw new Error(`Creator ${creator} has no encryption public key`);
  }
  console.log(`✓ Creator public key: ${creatorProfile.encryptionPubKey.slice(0, 20)}...`);

  const helperProfile = await getProfile(helper);
  if (!helperProfile?.encryptionPubKey) {
    throw new Error(`Helper ${helper} has no encryption public key`);
  }
  console.log(`✓ Helper public key: ${helperProfile.encryptionPubKey.slice(0, 20)}...`);

  // 4. 生成并包装 DEK
  console.log('\n--- Generating DEKs ---');
  
  const dek = generateDEK();
  const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
  const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

  console.log(`✓ Creator wrapped DEK: ${creatorWrappedDEK.slice(0, 20)}...`);
  console.log(`✓ Helper wrapped DEK: ${helperWrappedDEK.slice(0, 20)}...`);

  // 5. 保存到数据库
  console.log('\n--- Saving to database ---');
  
  await prisma.contactKey.create({
    data: {
      chainId,
      taskId,
      creatorWrappedDEK,
      helperWrappedDEK,
    },
  });

  console.log('✓ ContactKey created successfully!');

  await prisma.$disconnect();
  console.log('\n=== Fix Complete ===');
}

fixTask8ContactKey().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
