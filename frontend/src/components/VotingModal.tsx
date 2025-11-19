import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useD21Program } from '../hooks/useD21Program';

interface VotingModalProps {
  electionPubkey: PublicKey;
  electionData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VotingModal({ electionPubkey, electionData, onSuccess, onCancel }: VotingModalProps) {
  const { publicKey } = useWallet();
  const program = useD21Program();

  const [votes, setVotes] = useState<{ positive: number[]; negative: number[] }>({
    positive: [],
    negative: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { positiveVotesPerVoter, negativeVotesPerVoter, candidates } = electionData;

  const togglePositiveVote = (index: number) => {
    setVotes((prevVotes) => {
      const isSelected = prevVotes.positive.includes(index);

      if (isSelected) {
        // Remove vote
        setError('');
        return {
          ...prevVotes,
          positive: prevVotes.positive.filter((i) => i !== index),
        };
      } else {
        // Try to add vote
        if (prevVotes.positive.length >= positiveVotesPerVoter) {
          setError(`Maximum ${positiveVotesPerVoter} positive votes allowed`);
          return prevVotes;
        }

        if (prevVotes.negative.includes(index)) {
          setError('Cannot vote both positive and negative for the same candidate');
          return prevVotes;
        }

        setError('');
        return {
          ...prevVotes,
          positive: [...prevVotes.positive, index],
        };
      }
    });
  };

  const toggleNegativeVote = (index: number) => {
    setVotes((prevVotes) => {
      const isSelected = prevVotes.negative.includes(index);

      if (isSelected) {
        // Remove vote
        setError('');
        return {
          ...prevVotes,
          negative: prevVotes.negative.filter((i) => i !== index),
        };
      } else {
        // Try to add vote
        if (prevVotes.negative.length >= negativeVotesPerVoter) {
          setError(`Maximum ${negativeVotesPerVoter} negative votes allowed`);
          return prevVotes;
        }

        if (prevVotes.positive.includes(index)) {
          setError('Cannot vote both positive and negative for the same candidate');
          return prevVotes;
        }

        setError('');
        return {
          ...prevVotes,
          negative: [...prevVotes.negative, index],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!program || !publicKey) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);

    try {
      const tx = await program.methods
        .castVote(Buffer.from(votes.positive), Buffer.from(votes.negative))
        .accounts({
          election: electionPubkey,
          voterBallot: PublicKey.findProgramAddressSync(
            [Buffer.from('voter_ballot'), electionPubkey.toBuffer(), publicKey.toBuffer()],
            program.programId
          )[0],
          voter: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess('Vote cast successfully! Transaction: ' + tx);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to cast vote');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cast Your Vote</h2>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '0.75rem 1rem',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              border: '1px solid #a7f3d0',
              fontSize: '0.875rem',
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              Votes used: {votes.positive.length + votes.negative.length} / {positiveVotesPerVoter + negativeVotesPerVoter}
            </p>

            {candidates.map((candidate: any, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: votes.positive.includes(index) || votes.negative.includes(index) ? '#f0fdf4' : '#ffffff',
                  border: votes.positive.includes(index) ? '2px solid #059669' : votes.negative.includes(index) ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>
                  {index + 1}. {candidate.name}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => togglePositiveVote(index)}
                    disabled={loading}
                    style={{
                      padding: '1rem',
                      backgroundColor: votes.positive.includes(index) ? '#059669' : '#f0fdf4',
                      color: votes.positive.includes(index) ? 'white' : '#059669',
                      border: '2px solid #86efac',
                      borderRadius: '0.5rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                    }}
                  >
                    {votes.positive.includes(index) ? '✓ VOTED +' : '+ VOTE UP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNegativeVote(index)}
                    disabled={loading}
                    style={{
                      padding: '1rem',
                      backgroundColor: votes.negative.includes(index) ? '#dc2626' : '#fef2f2',
                      color: votes.negative.includes(index) ? 'white' : '#dc2626',
                      border: '2px solid #fca5a5',
                      borderRadius: '0.5rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                    }}
                  >
                    {votes.negative.includes(index) ? '✓ VOTED -' : '- VOTE DOWN'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (votes.positive.length + votes.negative.length === 0)}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: votes.positive.length + votes.negative.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: votes.positive.length + votes.negative.length === 0 || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Submitting...' : 'Submit Votes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
