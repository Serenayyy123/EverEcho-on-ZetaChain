import { Contacts } from './types';

/**
 * Mock 联系方式数据
 */
export const MOCK_CONTACTS: Record<number, Contacts> = {
  2: {
    taskId: 2,
    creatorContacts: 'alice@example.com, @alice_twitter',
    helperContacts: 'bob@example.com, @bob_telegram',
    encrypted: false,
  },
  3: {
    taskId: 3,
    creatorContacts: 'bob@example.com, @bob_telegram',
    helperContacts: 'charlie@example.com, Discord: charlie#1234',
    encrypted: false,
  },
  4: {
    taskId: 4,
    creatorContacts: 'charlie@example.com, Discord: charlie#1234',
    helperContacts: 'alice@example.com, @alice_twitter',
    encrypted: false,
  },
};

export const getContacts = (taskId: number): Contacts | null => {
  return MOCK_CONTACTS[taskId] || null;
};

export const setContacts = (taskId: number, creatorContacts: string, helperContacts: string): Contacts => {
  const contacts: Contacts = {
    taskId,
    creatorContacts,
    helperContacts,
    encrypted: false,
  };
  MOCK_CONTACTS[taskId] = contacts;
  return contacts;
};
