/**
 * 检查所有用户的 Profile 状态
 * 
 * 用途：
 * - 检查哪些用户有完整的 encryptionPubKey
 * - 检查哪些用户是历史占位数据
 * - 统计恢复状态
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking all profiles status...\n');

  // 获取所有 profiles
  const profiles = await prisma.profile.findMany({
    orderBy: { address: 'asc' },
  });

  console.log(`📊 Total profiles: ${profiles.length}\n`);

  if (profiles.length === 0) {
    console.log('✅ No profiles found');
    return;
  }

  // 分类统计
  let complete = 0;
  let missingKey = 0;
  let placeholder = 0;

  const completeProfiles: string[] = [];
  const missingKeyProfiles: string[] = [];
  const placeholderProfiles: string[] = [];

  // 检查每个 profile
  profiles.forEach((profile) => {
    const hasKey = profile.encryptionPubKey && profile.encryptionPubKey.trim() !== '';
    const isPlaceholder = profile.nickname.includes('(synced from chain)');

    if (hasKey && !isPlaceholder) {
      complete++;
      completeProfiles.push(profile.address);
    } else if (!hasKey) {
      missingKey++;
      missingKeyProfiles.push(profile.address);
    } else if (isPlaceholder) {
      placeholder++;
      placeholderProfiles.push(profile.address);
    }
  });

  // 输出统计
  console.log('=' .repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Complete profiles (has key + real data): ${complete}`);
  console.log(`⚠️  Missing encryption key: ${missingKey}`);
  console.log(`🔄 Placeholder data (needs restore): ${placeholder}`);
  console.log('='.repeat(70));
  console.log('');

  // 详细列表
  if (completeProfiles.length > 0) {
    console.log('✅ COMPLETE PROFILES:');
    completeProfiles.forEach((addr) => {
      const p = profiles.find((x) => x.address === addr)!;
      console.log(`  ${addr}`);
      console.log(`    Nickname: ${p.nickname}`);
      console.log(`    City: ${p.city}`);
      console.log(`    Skills: ${p.skills}`);
      console.log(`    EncryptionPubKey: ${p.encryptionPubKey.substring(0, 20)}...`);
      console.log('');
    });
  }

  if (missingKeyProfiles.length > 0) {
    console.log('⚠️  MISSING ENCRYPTION KEY:');
    missingKeyProfiles.forEach((addr) => {
      const p = profiles.find((x) => x.address === addr)!;
      console.log(`  ${addr}`);
      console.log(`    Nickname: ${p.nickname}`);
      console.log(`    City: ${p.city}`);
      console.log(`    ⚠️  EncryptionPubKey: EMPTY`);
      console.log('');
    });
  }

  if (placeholderProfiles.length > 0) {
    console.log('🔄 PLACEHOLDER DATA (NEEDS RESTORE):');
    placeholderProfiles.forEach((addr) => {
      const p = profiles.find((x) => x.address === addr)!;
      console.log(`  ${addr}`);
      console.log(`    Nickname: ${p.nickname}`);
      console.log(`    City: ${p.city}`);
      console.log(`    EncryptionPubKey: ${p.encryptionPubKey || 'EMPTY'}`);
      console.log('');
    });
  }

  // 建议
  console.log('='.repeat(70));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(70));
  
  if (missingKey > 0 || placeholder > 0) {
    console.log('⚠️  Some users need to restore their profiles:');
    console.log('   1. Visit Profile page');
    console.log('   2. Click "Restore profile (off-chain)" button');
    console.log('   3. This will generate encryption key and update profile');
    console.log('');
  }

  if (complete === profiles.length) {
    console.log('✅ All profiles are complete! No action needed.');
  }

  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
