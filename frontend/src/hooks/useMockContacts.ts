import { useState } from 'react';
import { getContacts, setContacts } from '../mock/contacts';
import { Contacts } from '../mock/types';

/**
 * Mock 联系方式 Hook
 */
export function useMockContacts(taskId: number) {
  const [contacts, setContactsState] = useState<Contacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      // 模拟解密延迟
      await new Promise((resolve) => setTimeout(resolve, 400));
      const result = getContacts(taskId);
      setContactsState(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      setLoading(false);
    }
  };

  const saveContacts = async (creatorContacts: string, helperContacts: string) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const result = setContacts(taskId, creatorContacts, helperContacts);
      setContactsState(result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contacts');
      setLoading(false);
      return null;
    }
  };

  return {
    contacts,
    loading,
    error,
    loadContacts,
    saveContacts,
  };
}
