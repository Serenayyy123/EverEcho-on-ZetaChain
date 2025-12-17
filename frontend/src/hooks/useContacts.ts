import { useState } from 'react';
import { ethers } from 'ethers';
import { apiClient } from '../api/client';
import { handleError } from '../utils/errorHandler';

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
        // 用户拒绝签名
        const errorDetails = handleError(err, 'ethers');
        errorMessage = errorDetails.message;
      } else if (err.message?.includes('HTTP 404')) {
        // 这种情况现在应该很少见，因为有自动重试机制
        errorMessage = 'Service temporarily unavailable. The system has already attempted automatic retries. Please try again in a moment.';
      } else if (err.message?.includes('All') && err.message?.includes('attempts failed')) {
        // 所有重试都失败了
        errorMessage = 'Unable to connect to backend service after multiple attempts. Please check your connection and try again.';
      } else if (err.message?.includes('Network') || err.name === 'TypeError') {
        // 网络错误，使用统一的错误处理
        const errorDetails = handleError(err, 'api');
        errorMessage = `${errorDetails.message}. The system will automatically retry.`;
      } else {
        // 其他 API 错误
        const errorDetails = handleError(err, 'api');
        errorMessage = errorDetails.message;
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
