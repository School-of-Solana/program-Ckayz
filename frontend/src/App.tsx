import { useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { ElectionList } from './components/ElectionList';
import { CreateElectionForm } from './components/CreateElectionForm';
import { NetworkIndicator } from './components/NetworkIndicator';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const network = clusterApiUrl('devnet');

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<'elections' | 'create'>('elections');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
              D21 Voting System
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Democratic voting with positive and negative votes
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NetworkIndicator />
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            gap: '2rem',
          }}
        >
          <button
            onClick={() => setActiveTab('elections')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'elections' ? '600' : '400',
              color: activeTab === 'elections' ? '#2563eb' : '#666',
              borderBottom: activeTab === 'elections' ? '2px solid #2563eb' : '2px solid transparent',
              transition: 'all 0.3s',
            }}
          >
            Elections
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '1rem 0',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'create' ? '600' : '400',
              color: activeTab === 'create' ? '#2563eb' : '#666',
              borderBottom: activeTab === 'create' ? '2px solid #2563eb' : '2px solid transparent',
              transition: 'all 0.3s',
            }}
          >
            Create Election
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1.5rem',
        }}
      >
        {activeTab === 'elections' && <ElectionList key={refreshKey} />}
        {activeTab === 'create' && (
          <CreateElectionForm
            onSuccess={() => {
              setActiveTab('elections');
              setRefreshKey((k) => k + 1);
            }}
            onCancel={() => setActiveTab('elections')}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          marginTop: '3rem',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#999',
          }}
        >
          Built on Solana • School of Solana Project
        </div>
      </footer>
    </div>
  );
}

export default App;
