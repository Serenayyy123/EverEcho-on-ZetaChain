import { useState } from 'react';
import { ethers } from 'ethers';
import { apiClient } from '../api/client';

/**
 * 真实联系方式 Hook
 * 流程：签名 → POST /api/contacts/decrypt → wrappedDEK → 前端解密
 */
export function useContacts(
  taskId: number | string,
  signer: ethers.Signer | null,
  address: string | null
) {
  const [contacts, setContacts] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    if (!taskId || !signer || !address) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: 生成签名消息
      const message = `Request contacts for task ${taskId}`;
      
      // Step 2: 签名
      console.log('[useContacts] Signing message:', message);
      console.log('[useContacts] Signer address:', address);
      const signature = await signer.signMessage(message);
      console.log('[useContacts] Signature:', signature);

      // Step 3: 调用后端解密接口
      console.log('[useContacts] Requesting contacts decryption...');
      console.log('[useContacts] Request payload:', {
        taskId,
        address,
        signature: signature.slice(0, 20) + '...',
        message,
      });
      const response = await apiClient.decryptContacts({
        taskId,
        address,
        signature,
        message,
      });

      // Step 4: 使用后端返回的明文联系方式（MVP 简化方案）
      // 后端返回的 response.contacts 应该是明文
      console.log('[useContacts] Response:', response);
      
      const decryptedContacts = response.contacts || response.contactsEncryptedPayload || response.wrappedDEK;
      console.log('[useContacts] Decrypted contacts:', decryptedContacts);
      
      setContacts(decryptedContacts);
      setLoading(false);
    } catch (err: any) {
      console.error('Load contacts failed:', err);
      
      let errorMessage = 'Failed to load contacts';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Signature rejected by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const clearContacts = () => {
    setContacts(null);
    setError(null);
  };

  return {
    contacts,
    loading,
    error,
    loadContacts,
    clearContacts,
  };
}
