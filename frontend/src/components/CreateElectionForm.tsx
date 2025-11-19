import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { useD21Program, getElectionPda } from '../hooks/useD21Program';

interface CreateElectionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateElectionForm({ onSuccess, onCancel }: CreateElectionFormProps) {
  const { publicKey } = useWallet();
  const program = useD21Program();

  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [positiveVotes, setPositiveVotes] = useState(2);
  const [negativeVotes, setNegativeVotes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less');
      return false;
    }

    const nonEmptyCandidates = candidates.filter((c) => c.trim());
    if (nonEmptyCandidates.length < 2) {
      setError('You need at least 2 candidates');
      return false;
    }

    if (nonEmptyCandidates.length > 20) {
      setError('You can have at most 20 candidates');
      return false;
    }

    for (const candidate of nonEmptyCandidates) {
      if (candidate.length > 50) {
        setError('Each candidate name must be 50 characters or less');
        return false;
      }
    }

    if (positiveVotes === 0 && negativeVotes === 0) {
      setError('You must allow at least 1 vote type');
      return false;
    }

    return true;
  };

  const handleAddCandidate = () => {
    if (candidates.length < 20) {
      setCandidates([...candidates, '']);
    }
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleCandidateChange = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    if (!program || !publicKey) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);

    try {
      const candidateNames = candidates
        .filter((c) => c.trim())
        .map((name) => name.trim());

      // Use a unique index for this election
      const electionIndex = Math.floor(Date.now() / 1000);

      // Derive the election PDA
      const [electionPda] = getElectionPda(publicKey, electionIndex);

      const tx = await program.methods
        .initializeElection(
          new BN(electionIndex),
          title.trim(),
          candidateNames,
          positiveVotes,
          negativeVotes
        )
        .accounts({
          election: electionPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSuccess('Election created successfully! Transaction: ' + tx);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create election');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #ddd',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Create New Election
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
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
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Election Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Best Programming Language"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginTop: '0.25rem',
            }}
          >
            {title.length}/200 characters
          </p>
        </div>

        {/* Candidates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151',
            }}
          >
            Candidates
          </label>

          {candidates.map((candidate, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={candidate}
                onChange={(e) => handleCandidateChange(index, e.target.value)}
                placeholder={`Candidate ${index + 1}`}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                }}
              />
              {candidates.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCandidate(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {candidates.length < 20 && (
            <button
              type="button"
              onClick={handleAddCandidate}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              + Add Candidate
            </button>
          )}
        </div>

        {/* Vote Configuration */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151',
              }}
            >
              Positive Votes Per Voter
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={positiveVotes}
              onChange={(e) => setPositiveVotes(Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151',
              }}
            >
              Negative Votes Per Voter
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={negativeVotes}
              onChange={(e) => setNegativeVotes(Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Buttons */}
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
            disabled={loading}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Election'}
          </button>
        </div>
      </form>
    </div>
  );
}
