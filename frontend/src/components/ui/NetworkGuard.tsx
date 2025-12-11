import React from 'react';
import { SUPPORTED_CHAIN_IDS } from '../../contracts/addresses';
import { Alert } from './Alert';

export interface NetworkGuardProps {
  chainId: number | null;
  children: React.ReactNode;
}

export function NetworkGuard({ chainId, children }: NetworkGuardProps) {
  if (!chainId) {
    return (
      <Alert variant="warning" title="Network Not Detected">
        Please connect your wallet and select a network.
      </Alert>
    );
  }

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    const chainNames: Record<number, string> = {
      11155111: 'Sepolia Testnet',
      31337: 'Hardhat Local',
    };

    return (
      <Alert variant="error" title="Wrong Network">
        <p>
          You are connected to an unsupported network (Chain ID: {chainId}).
        </p>
        <p style={{ marginTop: '8px' }}>
          Please switch to one of the supported networks:
        </p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          {SUPPORTED_CHAIN_IDS.map(id => (
            <li key={id}>{chainNames[id] || `Chain ${id}`} (ID: {id})</li>
          ))}
        </ul>
        <p style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic' }}>
          All write operations are disabled until you switch to a supported network.
        </p>
      </Alert>
    );
  }

  return <>{children}</>;
}
