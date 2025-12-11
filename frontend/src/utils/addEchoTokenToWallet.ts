/**
 * Add ECHO token to user's wallet using wallet_watchAsset
 * @param tokenAddress ECHO token contract address
 * @returns true if user accepted, false if rejected
 * @throws Error if wallet doesn't support the method
 */
export async function addEchoTokenToWallet(tokenAddress: string): Promise<boolean> {
  const eth = (window as any).ethereum;
  
  if (!eth?.request) {
    throw new Error('NO_ETHEREUM_PROVIDER');
  }

  try {
    const result = await eth.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: 'ECHO',
          decimals: 18,
        },
      },
    });
    
    return !!result;
  } catch (error) {
    throw error;
  }
}
