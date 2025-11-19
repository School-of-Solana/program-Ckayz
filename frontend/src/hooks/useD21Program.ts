import { useMemo } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import IDL from '../idl/voting_program.json';

const PROGRAM_ID = new PublicKey('BmYR9dVbJmmDyvucVymQTNzFB7hRq5iuWFxq1i8RePvD');

export function useD21Program() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    return new Program(IDL as any, provider);
  }, [connection, wallet]);

  return program;
}

// Helper to derive election PDA
export function getElectionPda(
  authority: PublicKey,
  electionIndex: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('election'),
      authority.toBuffer(),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(electionIndex)]).buffer)),
    ],
    PROGRAM_ID
  );
}

// Helper to derive voter ballot PDA
export function getVoterBallotPda(
  election: PublicKey,
  voter: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('voter_ballot'),
      election.toBuffer(),
      voter.toBuffer(),
    ],
    PROGRAM_ID
  );
}
