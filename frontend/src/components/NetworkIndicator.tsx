import { useConnection } from '@solana/wallet-adapter-react';

export function NetworkIndicator() {
  const { connection } = useConnection();
  const rpcUrl = connection.rpcEndpoint;

  // Detect network from RPC URL
  let networkName = 'Unknown';
  let isMainnet = false;
  let backgroundColor = '#e5e7eb';
  let textColor = '#374151';

  if (rpcUrl.includes('mainnet')) {
    networkName = 'Mainnet';
    isMainnet = true;
    backgroundColor = '#fee2e2';
    textColor = '#991b1b';
  } else if (rpcUrl.includes('devnet')) {
    networkName = 'Devnet';
    backgroundColor = '#ecfdf5';
    textColor = '#065f46';
  } else if (rpcUrl.includes('testnet')) {
    networkName = 'Testnet';
    backgroundColor = '#fef3c7';
    textColor = '#92400e';
  } else if (rpcUrl.includes('localhost')) {
    networkName = 'Localnet';
    backgroundColor = '#f0f9ff';
    textColor = '#0c4a6e';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.375rem',
        backgroundColor,
        border: isMainnet ? '2px solid #dc2626' : `2px solid ${textColor}`,
      }}
      title={`Connected to: ${rpcUrl}`}
    >
      <div
        style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          backgroundColor: isMainnet ? '#dc2626' : '#10b981',
        }}
      />
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: textColor,
        }}
      >
        {networkName}
      </span>
      {isMainnet && (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: '#dc2626',
            marginLeft: '0.25rem',
          }}
        >
          ⚠️
        </span>
      )}
    </div>
  );
}
