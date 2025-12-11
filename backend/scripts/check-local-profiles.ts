/**
 * 检查本地数据库中所有用户的 encryptionPubKey 状态
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking local profiles encryptionPubKey status...\n');

  try {
    // 获取所有 profiles
    const profiles = await prisma.profile.findMany({
      select: {
        address: true,
        nickname: true,
        encryptionPubKey: true,
      },
      orderBy: {
        address: 'asc',
      },
    });

    console.log(`📊 Total profiles: ${profiles.length}\n`);

    let hasKeyCount = 0;
    let missingKeyCount = 0;

    profiles.forEach((profile, index) => {
      const hasKey = profile.encryptionPubKey && profile.encryptionPubKey.length > 0;
      const status = hasKey ? '✅' : '❌';
      
      if (hasKey) {
        hasKeyCount++;
      } else {
        missingKeyCount++;
      }

      console.log(`${index + 1}. ${status} ${profile.address}`);
      console.log(`   Nickname: ${profile.nickname || 'N/A'}`);
      console.log(`   EncryptionPubKey: ${hasKey ? profile.encryptionPubKey?.slice(0, 20) + '...' : 'MISSING'}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Has encryptionPubKey: ${hasKeyCount}/${profiles.length}`);
    console.log(`   ❌ Missing encryptionPubKey: ${missingKeyCount}/${profiles.length}`);
    console.log('='.repeat(60));

    if (missingKeyCount > 0) {
      console.log('\n⚠️  Users missing encryptionPubKey:');
      profiles.forEach((profile) => {
        if (!profile.encryptionPubKey || profile.encryptionPubKey.length === 0) {
          console.log(`   - ${profile.address} (${profile.nickname || 'No nickname'})`);
        }
      });
      console.log('\n💡 These users need to restore their profile using the UI.');
    } else {
      console.log('\n🎉 All users have encryptionPubKey!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
