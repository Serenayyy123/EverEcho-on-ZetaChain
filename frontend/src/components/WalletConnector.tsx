import { useWallet } from '../hooks/useWallet';

/**
 * 钱包连接器组件
 * 显示连接状态和网络信息
 */
export function WalletConnector() {
  const { address, chainId, isConnecting, error, connect, disconnect, switchNetwork } = useWallet();

  if (!address) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Connect Wallet</h3>
        {error && <p style={styles.error}>{error}</p>}
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          style={styles.connectButton}
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
        <p style={styles.hint}>
          Make sure you have MetaMask installed and are on Sepolia testnet
        </p>
      </div>
    );
  }

  const getNetworkName = (id: number | null) => {
    switch (id) {
      case 11155111:
        return 'Sepolia';
      case 31337:
        return 'Hardhat Local';
      default:
        return 'Unknown';
    }
  };

  const isWrongNetwork = chainId && ![11155111, 31337].includes(chainId);

  return (
    <div style={styles.connectedContainer}>
      <div style={styles.info}>
        <div style={styles.infoRow}>
          <span style={styles.label}>Address:</span>
          <span style={styles.value}>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Network:</span>
          <span style={styles.value}>{getNetworkName(chainId)}</span>
        </div>
      </div>

      {isWrongNetwork && (
        <div style={styles.warning}>
          <p>Wrong network! Please switch to Sepolia or Hardhat Local.</p>
          <button onClick={() => switchNetwork(11155111)} style={styles.switchButton}>
            Switch to Sepolia
          </button>
        </div>
      )}

      <button onClick={disconnect} style={styles.disconnectButton}>
        Disconnect
      </button>
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
    marginBottom: '12px',
  },
  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginBottom: '12px',
  },
  connectButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '12px',
    textAlign: 'center',
  },
  connectedContainer: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  info: {
    marginBottom: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2e7d32',
  },
  value: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#1b5e20',
  },
  warning: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  switchButton: {
    marginTop: '8px',
    padding: '8px 16px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  disconnectButton: {
    padding: '8px 16px',
    backgroundColor: '#8B4513',
    color: '#FF6B35',
    border: '1px solid #FF6B35',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};
