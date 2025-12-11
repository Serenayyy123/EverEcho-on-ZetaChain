import * as nacl from 'tweetnacl';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../config/chainConfig';

// 严格获取 chainId（无默认回落）
const CURRENT_CHAIN_ID = getCurrentChainId();

const prisma = new PrismaClient();

/**
 * 联系方式加密服务
 * 冻结点 2.2-P1-B3：contacts 加密发生在 Creator 发布任务链下阶段
 */

/**
 * 生成随机 DEK（32 字节）
 */
export function generateDEK(): Buffer {
  return randomBytes(32);
}

/**
 * 使用 AES-256-GCM 加密 contacts
 * @param plaintext 明文 contacts
 * @param dek Data Encryption Key (32 bytes)
 * @returns 加密后的 payload（包含 iv + authTag + ciphertext，hex 编码）
 */
export function encryptContacts(plaintext: string, dek: Buffer): string {
  const iv = randomBytes(12); // GCM 推荐 12 字节 IV
  const cipher = createCipheriv('aes-256-gcm', dek, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // 格式：iv(24 hex) + authTag(32 hex) + ciphertext
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * 使用 AES-256-GCM 解密 contacts
 * @param encryptedPayload 加密的 payload（hex 编码）
 * @param dek Data Encryption Key (32 bytes)
 * @returns 明文 contacts
 */
export function decryptContacts(encryptedPayload: string, dek: Buffer): string {
  // 解析格式：iv(24 hex) + authTag(32 hex) + ciphertext
  const iv = Buffer.from(encryptedPayload.slice(0, 24), 'hex');
  const authTag = Buffer.from(encryptedPayload.slice(24, 56), 'hex');
  const ciphertext = encryptedPayload.slice(56);
  
  const decipher = createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 使用公钥包裹 DEK（tweetnacl sealed box）
 * @param dek Data Encryption Key
 * @param publicKeyHex 公钥（hex 格式，含或不含 0x）
 * @returns 包裹后的 DEK（hex 编码）
 */
export function wrapDEK(dek: Buffer, publicKeyHex: string): string {
  // 移除 0x 前缀（如果有）
  const cleanHex = publicKeyHex.startsWith('0x') 
    ? publicKeyHex.slice(2) 
    : publicKeyHex;
  
  // 转换为 Uint8Array
  const publicKey = Buffer.from(cleanHex, 'hex');
  
  if (publicKey.length !== 32) {
    console.error('[wrapDEK] Invalid public key:');
    console.error('  Original:', publicKeyHex);
    console.error('  Clean hex:', cleanHex);
    console.error('  Length:', publicKey.length, 'bytes (expected 32)');
    throw new Error(`Invalid public key length (must be 32 bytes, got ${publicKey.length})`);
  }
  
  // 使用 sealed box 加密（单向加密，只有私钥持有者能解密）
  // 注意：tweetnacl 没有内置 sealedbox，需要使用 tweetnacl-sealedbox-js 或手动实现
  // 临时方案：使用 box 加密（需要生成临时密钥对）
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = randomBytes(24);
  const wrappedDEK = nacl.box(
    dek,
    nonce,
    publicKey,
    ephemeralKeyPair.secretKey
  );
  
  // 格式：ephemeralPublicKey + nonce + wrappedDEK
  const result = Buffer.concat([
    Buffer.from(ephemeralKeyPair.publicKey),
    nonce,
    Buffer.from(wrappedDEK),
  ]);
  
  return result.toString('hex');
}

/**
 * 加密 contacts 并存储 wrapped DEKs
 * @param taskId 任务 ID
 * @param creatorPubKey Creator 的 encryptionPubKey
 * @param helperPubKey Helper 的 encryptionPubKey
 * @param contactsPlaintext 明文 contacts
 * @returns contactsEncryptedPayload
 */
export async function encryptAndStoreContacts(
  taskId: string,
  creatorPubKey: string,
  helperPubKey: string,
  contactsPlaintext: string
): Promise<string> {
  // 1. 生成随机 DEK
  const dek = generateDEK();
  
  // 2. 使用 AES-256-GCM 加密 contacts
  const contactsEncryptedPayload = encryptContacts(contactsPlaintext, dek);
  
  // 3. 分别包裹 DEK
  const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);
  const helperWrappedDEK = wrapDEK(dek, helperPubKey);
  
  // 4. 存储到数据库（幂等）
  await prisma.contactKey.upsert({
    where: {
      chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
    },
    update: {
      creatorWrappedDEK,
      helperWrappedDEK,
    },
    create: {
      chainId: CURRENT_CHAIN_ID,
      taskId,
      creatorWrappedDEK,
      helperWrappedDEK,
    },
  });
  
  return contactsEncryptedPayload;
}

/**
 * 获取用户对应的 wrapped DEK
 * @param taskId 任务 ID
 * @param address 用户地址（creator 或 helper）
 * @param isCreator 是否为 creator
 * @returns wrappedDEK（hex 编码）
 */
export async function getWrappedDEK(
  taskId: string,
  address: string,
  isCreator: boolean
): Promise<string | null> {
  const contactKey = await prisma.contactKey.findUnique({
    where: {
      chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
    },
  });
  
  if (!contactKey) {
    return null;
  }
  
  // 只返回该用户对应的 wrappedDEK
  return isCreator ? contactKey.creatorWrappedDEK : contactKey.helperWrappedDEK;
}

/**
 * 校验 encryptionPubKey 格式
 * @param pubKeyHex 公钥（hex 格式）
 * @returns 是否合法
 */
export function validateEncryptionPubKey(pubKeyHex: string): boolean {
  if (!pubKeyHex) return false;
  
  const cleanHex = pubKeyHex.startsWith('0x') 
    ? pubKeyHex.slice(2) 
    : pubKeyHex;
  
  // 必须是 64 个 hex 字符（32 字节）
  if (cleanHex.length !== 64) return false;
  
  // 必须是合法的 hex
  return /^[0-9a-fA-F]{64}$/.test(cleanHex);
}
