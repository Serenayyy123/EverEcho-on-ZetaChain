import * as nacl from 'tweetnacl';

/**
 * 将 Uint8Array 转换为 hex 字符串
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将 hex 字符串转换为 Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * 生成加密密钥对（用于 contacts 加密）
 * 冻结点 1.4-22：Profile 必须包含 encryptionPubKey
 * 
 * 使用 tweetnacl (x25519) 生成密钥对
 * @returns { publicKey: string, privateKey: string } hex 格式
 */
export function generateEncryptionKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const keyPair = nacl.box.keyPair();
  
  return {
    publicKey: uint8ArrayToHex(keyPair.publicKey),
    privateKey: uint8ArrayToHex(keyPair.secretKey),
  };
}

/**
 * 从私钥恢复公钥（用于本地存储恢复）
 * @param privateKeyHex 私钥（hex 格式）
 * @returns 公钥（hex 格式）
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const privateKey = hexToUint8Array(privateKeyHex);
  const keyPair = nacl.box.keyPair.fromSecretKey(privateKey);
  return uint8ArrayToHex(keyPair.publicKey);
}

/**
 * 获取当前 chainId（同步方式）
 * 冻结点保持：不改变业务逻辑，只是存储 key 格式
 */
function getCurrentChainIdSync(): string {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const hex = (window as any).ethereum.chainId;
    if (hex) {
      return parseInt(hex, 16).toString();
    }
  }
  return 'unknown'; // 不默认 '84532'，避免静默串台
}

/**
 * 保存加密私钥到 localStorage（按链隔离）
 * 注意：MVP 简化实现，生产环境应使用更安全的存储方式
 * @param address 用户地址
 * @param privateKey 私钥（hex 格式）
 * 
 * 冻结点保持：保持同步 API，向后兼容旧 key，不回退 viewContacts
 */
export function saveEncryptionPrivateKey(address: string, privateKey: string): void {
  const chainId = getCurrentChainIdSync();
  const key = `encryption_key_${chainId}_${address.toLowerCase()}`;
  localStorage.setItem(key, privateKey);
  
  // ✅ 向后兼容：同时保存到旧 key，防止 viewContacts 回退
  localStorage.setItem(`encryption_key_${address.toLowerCase()}`, privateKey);
}

/**
 * 从 localStorage 读取加密私钥（按链隔离）
 * @param address 用户地址
 * @returns 私钥（hex 格式）或 null
 * 
 * 冻结点保持：保持同步 API，向后兼容旧 key，不回退 viewContacts
 */
export function loadEncryptionPrivateKey(address: string): string | null {
  const chainId = getCurrentChainIdSync();
  const key = `encryption_key_${chainId}_${address.toLowerCase()}`;
  
  // 优先读取新 key，fallback 到旧 key（向后兼容）
  return (
    localStorage.getItem(key) ||
    localStorage.getItem(`encryption_key_${address.toLowerCase()}`)
  );
}

/**
 * 解密 DEK（Data Encryption Key）
 * 使用本地私钥解密后端返回的 wrappedDEK
 * 
 * @param wrappedDEK 加密的 DEK（hex 格式）
 * @param recipientPrivateKeyHex 接收方私钥（hex 格式）
 * @param senderPublicKeyHex 发送方公钥（hex 格式）
 * @returns 解密后的 DEK（hex 格式）
 */
export function unwrapDEK(
  wrappedDEK: string,
  recipientPrivateKeyHex: string,
  senderPublicKeyHex: string
): string {
  try {
    const recipientPrivateKey = hexToUint8Array(recipientPrivateKeyHex);
    const senderPublicKey = hexToUint8Array(senderPublicKeyHex);
    const encrypted = hexToUint8Array(wrappedDEK);

    // 使用 nacl.box.open 解密
    // wrappedDEK 格式：nonce(24 bytes) + ciphertext
    const nonce = encrypted.slice(0, 24);
    const ciphertext = encrypted.slice(24);

    const decrypted = nacl.box.open(
      ciphertext,
      nonce,
      senderPublicKey,
      recipientPrivateKey
    );

    if (!decrypted) {
      throw new Error('Failed to decrypt DEK');
    }

    return uint8ArrayToHex(decrypted);
  } catch (error) {
    console.error('unwrapDEK error:', error);
    throw new Error('Failed to unwrap DEK');
  }
}

/**
 * 使用 DEK 解密 contacts
 * 使用 AES-256-GCM 解密
 * 
 * @param encryptedPayload 加密的 payload（hex 格式）
 * @param dekHex DEK（hex 格式）
 * @returns 解密后的明文
 */
export async function decryptContacts(
  encryptedPayload: string,
  dekHex: string
): Promise<string> {
  try {
    const dek = hexToUint8Array(dekHex);
    const encrypted = hexToUint8Array(encryptedPayload);

    // encryptedPayload 格式：iv(12 bytes) + ciphertext + tag(16 bytes)
    const iv = encrypted.slice(0, 12);
    const ciphertext = encrypted.slice(12);

    // 导入 DEK
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(dek),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 解密
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      new Uint8Array(ciphertext)
    );

    // 转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('decryptContacts error:', error);
    throw new Error('Failed to decrypt contacts');
  }
}
