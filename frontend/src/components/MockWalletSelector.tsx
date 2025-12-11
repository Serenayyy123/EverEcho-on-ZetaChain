import { useMockWallet } from '../hooks/useMockWallet';

/**
 * Mock 钱包选择器组件
 * 用于在 Mock 模式下切换账户
 */
export function MockWalletSelector() {
  const { address, isConnecting, connect, disconnect, switchAccount, availableAccounts } = useMockWallet();

  if (!address) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Connect Mock Wallet</h3>
        <p style={styles.description}>Select a mock account to connect:</p>
        <div style={styles.accountList}>
          {availableAccounts.map((acc) => (
            <button
              key={acc}
              onClick={() => connect(acc)}
              disabled={isConnecting}
              style={styles.accountButton}
            >
              {acc}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.connectedContainer}>
      <div style={styles.addressDisplay}>
        <span style={styles.label}>Connected:</span>
        <span style={styles.address}>{address}</span>
      </div>
      <div style={styles.actions}>
        <select
          value={address}
          onChange={(e) => switchAccount(e.target.value)}
          style={styles.select}
        >
          {availableAccounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>
        <button onClick={disconnect} style={styles.disconnectButton}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  accountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  accountButton: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  connectedContainer: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  addressDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2e7d32',
  },
  address: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#1b5e20',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    flex: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #4caf50',
    fontSize: '14px',
  },
  disconnectButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
