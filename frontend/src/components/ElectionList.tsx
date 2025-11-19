import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useD21Program } from '../hooks/useD21Program';
import { VotingModal } from './VotingModal';

interface ElectionData {
  publicKey: PublicKey;
  account: any;
}

export function ElectionList() {
  const { publicKey } = useWallet();
  const program = useD21Program();
  const [elections, setElections] = useState<ElectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingModal, setVotingModal] = useState<{
    electionPubkey: PublicKey;
    electionData: any;
  } | null>(null);

  const fetchElections = useCallback(async () => {
    if (!program) return;
    try {
      const allElections = await (program.account as any).election.all();
      setElections(allElections);
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  if (!publicKey) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Connect your wallet to view elections</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Loading elections...</p>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>No elections found</p>
        <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
          Create the first one!
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          All Elections
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {elections.map((election) => (
            <ElectionCard
              key={election.publicKey.toString()}
              election={election}
              onVote={(electionPubkey, electionData) =>
                setVotingModal({ electionPubkey, electionData })
              }
            />
          ))}
        </div>
      </div>

      {votingModal && (
        <VotingModal
          electionPubkey={votingModal.electionPubkey}
          electionData={votingModal.electionData}
          onSuccess={() => {
            setVotingModal(null);
            fetchElections();
          }}
          onCancel={() => setVotingModal(null)}
        />
      )}
    </>
  );
}

function ElectionCard({
  election,
  onVote,
}: {
  election: ElectionData;
  onVote: (pubkey: PublicKey, data: any) => void;
}) {
  const { account } = election;

  // Calculate scores
  const candidatesWithScores = account.candidates
    .map((c: any) => ({
      ...c,
      score: c.positiveVotes.toNumber() - c.negativeVotes.toNumber(),
    }))
    .sort((a: any, b: any) => b.score - a.score);

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{account.title}</h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            {account.totalVoters.toString()} voters
          </p>
        </div>
        <span
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            backgroundColor: account.isActive ? '#ecfdf5' : '#f3f4f6',
            color: account.isActive ? '#047857' : '#374151',
          }}
        >
          {account.isActive ? 'Active' : 'Closed'}
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
          Results:
        </p>
        {candidatesWithScores.map((candidate: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.25rem',
              marginBottom: '0.25rem',
            }}
          >
            <span style={{ fontWeight: '500' }}>{candidate.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#059669' }}>+{candidate.positiveVotes.toString()}</span>
              <span style={{ color: '#dc2626' }}>-{candidate.negativeVotes.toString()}</span>
              <span style={{ fontWeight: 'bold' }}>Score: {candidate.score}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onVote(election.publicKey, account)}
          disabled={!account.isActive}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: account.isActive ? '#2563eb' : '#d1d5db',
            color: 'white',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: account.isActive ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s',
            opacity: account.isActive ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (account.isActive) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            if (account.isActive) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
        >
          {account.isActive ? 'Vote' : 'Election Closed'}
        </button>
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
