/**
 * 检查当前用户的 profile
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const address = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
  
  console.log(`Checking profile for: ${address}\n`);
  
  const profile = await prisma.profile.findUnique({
    where: { address },
  });
  
  if (!profile) {
    console.log('❌ Profile not found');
    return;
  }
  
  console.log('Profile found:');
  console.log('  Nickname:', profile.nickname);
  console.log('  City:', profile.city);
  console.log('  Contacts:', profile.contacts);
  console.log('  Encryption PubKey:', profile.encryptionPubKey);
  console.log('  PubKey length:', profile.encryptionPubKey.length, 'chars');
  
  // 检查公钥格式
  const cleanHex = profile.encryptionPubKey.startsWith('0x') 
    ? profile.encryptionPubKey.slice(2) 
    : profile.encryptionPubKey;
  const byteLength = cleanHex.length / 2;
  
  console.log('\nPublic Key Analysis:');
  console.log('  Hex length:', cleanHex.length, 'chars');
  console.log('  Byte length:', byteLength, 'bytes');
  console.log('  Expected:', '32 bytes (64 hex chars)');
  console.log('  Status:', byteLength === 32 ? '✅ Valid' : '❌ Invalid');
  
  if (byteLength !== 32) {
    console.log('\n⚠️  This public key is invalid!');
    console.log('It looks like an Ethereum address instead of a NaCl public key.');
    console.log('The user needs to re-register with a proper encryption key.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
