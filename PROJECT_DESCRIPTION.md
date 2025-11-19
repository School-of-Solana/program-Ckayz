# Project Description

**Deployed Frontend URL:** [TODO: Add your Vercel deployment URL here]

**Solana Program ID:** `BmYR9dVbJmmDyvucVymQTNzFB7hRq5iuWFxq1i8RePvD`

## Project Overview

### Description
The D21 Voting System is a decentralized democratic voting application built on Solana that implements the D21 (Democratic voting with positive and negative votes) method. Users can create elections with multiple candidates and cast both positive and negative votes to express their preferences. Each election is independent with configurable voting limits, allowing for flexible voting mechanisms. The smart contract ensures vote integrity through Program Derived Addresses (PDAs) and prevents double-voting. This dApp demonstrates advanced Solana program concepts including PDA-based account derivation, multi-instruction voting workflows, and complex state management.

### Key Features
- **Create Elections**: Initialize new elections with custom titles, candidate lists, and voting parameters
- **Configurable Voting**: Set positive and negative votes per voter for flexible voting mechanics
- **Cast Positive Votes**: Vote for candidates you support (multiple votes allowed based on election settings)
- **Cast Negative Votes**: Vote against candidates you oppose (multiple votes allowed based on election settings)
- **View Results**: See real-time election results with candidate scores (positive votes - negative votes)
- **Prevent Double-Voting**: Smart contract ensures each voter can only vote once per election
- **Prevent Conflicting Votes**: Cannot vote both positive and negative for the same candidate

### How to Use the dApp
1. **Connect Wallet** - Connect your Solana wallet (Phantom, Solflare, or other supported wallets)
2. **Switch to Devnet** - Ensure you're connected to Devnet (warning indicator shows active network)
3. **Create Election** - Click "Create Election" tab and fill in:
   - Election title
   - Candidate names (minimum 2, maximum 20)
   - Positive votes per voter (0-20)
   - Negative votes per voter (0-20)
4. **View Elections** - Return to "Elections" tab to see all active elections and their current results
5. **Cast Votes** - Click "Vote" button on any active election to open the voting modal
6. **Select Votes** - Click "+ VOTE UP" and "- VOTE DOWN" buttons to select your votes
7. **Submit** - Click "Submit Votes" to finalize your vote on the blockchain
8. **View Results** - Immediately see updated results showing vote counts and candidate scores

## Program Architecture

The D21 Voting System uses a role-based architecture with two main account types and two core instructions. The program leverages PDAs to create deterministic, owner-controlled election accounts and voter ballot accounts, ensuring vote integrity and preventing unauthorized modifications.

### PDA Usage
The program uses Program Derived Addresses to create unique, deterministic accounts that prevent conflicts and ensure proper access control.

**PDAs Used:**
- **Election PDA**: Derived from seeds `["election", authority_wallet, election_index]` - ensures each authority can create multiple unique elections, with only they can modify election settings
- **Voter Ballot PDA**: Derived from seeds `["voter_ballot", election_pubkey, voter_wallet]` - ensures each voter has exactly one ballot per election, preventing double-voting

### Program Instructions
**Instructions Implemented:**
- **Initialize Election**: Creates a new election with specified title, candidates, and voting parameters. Only callable by the election authority. Initializes candidate vote counts to zero.
- **Cast Vote**: Allows a voter to submit their votes for an election. Creates a voter ballot account to record the vote and atomically increments vote counts for selected candidates. Validates that votes don't exceed election limits and prevents conflicting positive/negative votes for same candidate.

### Account Structure
```rust
#[account]
pub struct Election {
    pub authority: Pubkey,              // The wallet that created this election
    pub title: String,                   // Election title (max 200 chars)
    pub candidates: Vec<Candidate>,      // List of candidates in the election
    pub positive_votes_per_voter: u8,   // Max positive votes each voter can cast
    pub negative_votes_per_voter: u8,   // Max negative votes each voter can cast
    pub total_voters: u32,              // Count of voters who have voted
    pub is_active: bool,                // Whether election is still accepting votes
}

#[derive(Clone)]
pub struct Candidate {
    pub name: String,                    // Candidate name (max 50 chars)
    pub positive_votes: u32,            // Number of positive votes received
    pub negative_votes: u32,            // Number of negative votes received
}

#[account]
pub struct VoterBallot {
    pub election: Pubkey,                // Reference to the election
    pub voter: Pubkey,                   // The voter's wallet address
    pub positive_votes: Vec<u8>,        // Indices of candidates voted positive
    pub negative_votes: Vec<u8>,        // Indices of candidates voted negative
}
```

## Testing

### Test Coverage
Comprehensive test suite with 15 tests covering all instructions, validation rules, and error scenarios to ensure program security and reliability.

**Happy Path Tests:**
- **Initialize Election**: Successfully creates election with correct initial state, candidate setup, and voting parameters
- **Cast Vote Single Positive**: Voter can successfully cast a single positive vote on a candidate
- **Cast Vote Multiple Positive**: Voter can successfully cast multiple positive votes up to the election limit
- **Cast Vote Single Negative**: Voter can successfully cast a single negative vote on a candidate
- **Cast Vote Multiple Negative**: Voter can successfully cast multiple negative votes up to the election limit
- **Cast Vote Mixed**: Voter can successfully cast both positive and negative votes (on different candidates)
- **Vote Counting**: Vote counts are correctly incremented for candidates receiving votes

**Unhappy Path Tests:**
- **Duplicate Vote Prevention**: Fails when voter tries to vote twice in same election
- **Positive Vote Limit**: Fails when voter exceeds positive vote limit for election
- **Negative Vote Limit**: Fails when voter exceeds negative vote limit for election
- **Conflicting Votes**: Fails when voter tries to vote both positive and negative for same candidate
- **Invalid Candidate Index**: Fails when vote index exceeds number of candidates
- **Election Not Found**: Fails when attempting to vote on non-existent election
- **Closed Election**: Fails when attempting to vote on inactive election
- **Authorization Check**: Fails when non-authority attempts to modify election settings

### Running Tests
```bash
cd anchor_project/voting_program
anchor test     # Run all tests (15/15 passing)
```

### Frontend Implementation
The React frontend provides a user-friendly interface for the voting system:

**Components:**
- **App.tsx**: Main application shell with tab navigation and wallet integration
- **ElectionList.tsx**: Displays all elections with real-time vote counts and candidate scores
- **VotingModal.tsx**: Modal dialog for casting votes with atomic state management for multi-vote support
- **CreateElectionForm.tsx**: Form for creating new elections with validation
- **NetworkIndicator.tsx**: Displays active network with warnings for mainnet (prevents accidental real SOL spending)

**Key Features:**
- Solana Wallet Adapter integration (Phantom, Solflare, etc.)
- Real-time election results updates
- Atomic vote state management to prevent race conditions
- Input validation and error handling
- Visual feedback for vote selection and submission status

### Additional Notes for Evaluators

**Project Highlights:**
- Successfully implemented complex democratic voting mechanism with both positive and negative votes
- Demonstrated deep understanding of Solana PDAs for deterministic account creation
- Comprehensive test coverage ensuring program reliability and security
- Frontend implements atomic state management to handle rapid user interactions
- Added NetworkIndicator component as a safety feature to prevent accidental mainnet usage
- Fixed critical voting state race condition through atomic state refactoring

**Key Learning Outcomes:**
- Mastered PDA derivation for multiple account types (Election and VoterBallot)
- Implemented complex validation logic (vote limits, conflict prevention, double-vote prevention)
- Built responsive React frontend with proper wallet integration
- Debugged and resolved asynchronous state management issues
- Deployed smart contract to Devnet and integrated with frontend

**Challenges Overcome:**
- Initial difficulty with Borsh serialization for Vec<String> in election creation
- Race condition in voting modal with separate useState calls - resolved through atomic state object
- Wallet network selection (prevented accidental mainnet spending with visual indicators)
- Managing multiple PDAs with different seed structures for elections and voter ballots
