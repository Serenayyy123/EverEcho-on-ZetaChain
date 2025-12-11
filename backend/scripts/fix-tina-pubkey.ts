/**
 * 修复 Tina 的 encryptionPubKey
 * 生成一个有效的 32 字节公钥
 */

import { PrismaClient } from '@prisma/client';
import * as nacl from 'tweetnacl';

const prisma = new PrismaClient();

async function main() {
  const address = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
  
  console.log('Generating new encryption key pair for Tina...\n');
  
  // 生成新的密钥对
  const keyPair = nacl.box.keyPair();
  
  // 转换为十六进制
  const publicKeyHex = Array.from(keyPair.publicKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const encryptionPubKey = '0x' + publicKeyHex;
  
  const privateKeyHex = Array.from(keyPair.secretKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('New encryption key pair generated:');
  console.log('  Public key:', encryptionPubKey);
  console.log('  Public key length:', keyPair.publicKey.length, 'bytes');
  console.log('  Private key (first 20 chars):', privateKeyHex.slice(0, 20) + '...');
  
  // 更新数据库
  const profile = await prisma.profile.update({
    where: { address },
    data: {
      encryptionPubKey,
    },
  });
  
  console.log('\n✅ Profile updated successfully!');
  console.log('  Nickname:', profile.nickname);
  console.log('  New PubKey:', profile.encryptionPubKey);
  
  console.log('\n📝 Important: Save this private key for testing:');
  console.log('  Private key:', privateKeyHex);
  console.log('\nYou can also set it in localStorage:');
  console.log(`  localStorage.setItem('encryptionPrivateKey_${address}', '${privateKeyHex}');`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
