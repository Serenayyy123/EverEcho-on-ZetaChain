import { useState } from 'react';
import { registerProfile } from '../mock/profiles';

/**
 * Mock 注册 Hook
 */
export function useMockRegister() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (address: string, profileURI: string) => {
    setIsRegistering(true);
    setError(null);

    try {
      // 模拟注册延迟
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (!profileURI) {
        throw new Error('Profile URI is required');
      }

      registerProfile(address, profileURI);
      setIsRegistering(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsRegistering(false);
      return false;
    }
  };

  return {
    register,
    isRegistering,
    error,
  };
}
