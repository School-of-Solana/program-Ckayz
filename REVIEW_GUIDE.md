# D21 Voting System - Review Guide

## Project Overview
Building a D21 (Janeček method) voting system on Solana where voters can give both positive and negative votes to candidates, ensuring democratic representation.

---

## 📁 Directory Structure

```
program-Ckayz/
├── anchor_project/voting_program/          # Solana Program (Rust/Anchor)
│   ├── programs/voting_program/src/lib.rs  # Smart contract code
│   ├── tests/voting_program.ts              # 15 comprehensive tests ✅
│   ├── target/idl/voting_program.json       # Generated IDL for frontend
│   └── Anchor.toml                          # Program configuration
│
├── frontend/                                 # React TypeScript Frontend
│   ├── src/
│   │   ├── App.tsx                          # Main app with wallet integration
│   │   ├── components/
│   │   │   └── ElectionList.tsx             # Display elections & results
│   │   ├── hooks/
│   │   │   └── useD21Program.ts             # Solana program interaction
│   │   ├── idl/
│   │   │   ├── voting_program.json          # IDL from Anchor
│   │   │   └── d21_voting.ts                # TypeScript types
│   │   └── index.tsx                        # Entry point
│   └── package.json                         # Dependencies
│
└── plan/
    ├── SYSTEM_PROMPT.md                     # AI agent instructions
    └── MILESTONE.md                         # Full project spec
```

---

## 🔍 What to Review

### 1. **Smart Contract Logic** (The Core)

**File:** `anchor_project/voting_program/programs/voting_program/src/lib.rs`

**Key Components:**

#### A. Account Structures
```rust
Election {
  authority: Pubkey,           // Who created it
  title: String,               // Election name
  candidates: Vec<Candidate>,  // Candidates with vote counts
  positive_votes_per_voter: u8,  // Votes each person gets (+)
  negative_votes_per_voter: u8,  // Votes each person gets (-)
  total_voters: u64,           // How many people voted
  is_active: bool,             // Can people still vote?
  created_at: i64,             // When created
  bump: u8,                    // PDA seed
}

Candidate {
  name: String,
  positive_votes: i64,
  negative_votes: i64,
  score() -> i64 {             // positive - negative
    self.positive_votes - self.negative_votes
  }
}

VoterBallot {
  voter: Pubkey,               // Who voted
  election: Pubkey,            // Which election
  positive_votes_used: Vec<u8>, // Indices of candidates (+)
  negative_votes_used: Vec<u8>, // Indices of candidates (-)
  voted_at: i64,               // When they voted
  bump: u8,                    // PDA seed
}
```

#### B. Four Main Instructions

1. **initialize_election**
   - Creates a new election
   - Validates: title length, candidate count (2-20), candidate name lengths
   - Validates: at least 1 vote type (positive OR negative)
   - Uses Election PDA: `[b"election", authority, election_index]`

2. **cast_vote**
   - Records a voter's ballot
   - Validates: election is active
   - Validates: vote counts within limits
   - Validates: no duplicate votes to same candidate
   - Validates: no overlap between positive/negative votes
   - Uses Voter Ballot PDA: `[b"voter_ballot", election, voter]`
   - PDA uniqueness prevents double voting ✅

3. **close_election**
   - Only election creator can call
   - Sets `is_active = false`
   - No more votes can be cast

4. **get_election_results**
   - Read-only function
   - Anyone can call
   - Returns all election data

#### C. Security Features
- ✅ PDA-based account derivation (deterministic addresses)
- ✅ Double-voting prevention (one ballot per voter per election)
- ✅ Comprehensive validation before state changes
- ✅ Authority checks on sensitive operations
- ✅ Proper error handling with clear error codes

---

### 2. **Test Suite** (Verification)

**File:** `anchor_project/voting_program/tests/voting_program.ts`

**Running Tests:**
```bash
cd anchor_project/voting_program
anchor test
```

**Test Results:**
```
✅ 15/15 tests passing
   - 6 happy path tests
   - 9 unhappy path tests
```

**What's Tested:**

| Test Category | Tests | What They Verify |
|---|---|---|
| Initialize Election | 1 happy | Election creation with correct data |
| | 3 unhappy | Title length, candidate count, vote config |
| Cast Vote | 3 happy | Multiple voters, partial votes, vote recording |
| | 5 unhappy | Double voting, too many votes, duplicates, invalid index, closed election |
| Get Results | 1 happy | Results retrieval and data accuracy |
| Close Election | 1 happy | Authority can close |
| | 1 unhappy | Non-authority cannot close |

**Key Test Scenarios:**

1. **Happy Path - Full Flow:**
   ```
   1. Create election "Best Programming Language"
      - 4 candidates: Rust, TypeScript, Python, Go
      - 2 positive votes per voter
      - 1 negative vote per voter
   
   2. Voter 1 votes:
      - +2: Rust, Python
      - -1: Go
   
   3. Voter 2 votes:
      - +2: TypeScript, Go
      - -1: Rust
   
   4. Voter 3 votes:
      - +1: Python
      - -0: (none)
   
   5. Results:
      Rust: 0 (+1, -1)
      TypeScript: +1
      Python: +2 (winner)
      Go: 0 (+1, -1)
   
   6. Authority closes election
   ```

2. **Unhappy Path Examples:**
   - ❌ Voter tries to vote twice → "already in use" error
   - ❌ Title > 200 chars → "TitleTooLong" error
   - ❌ Only 1 candidate → "NotEnoughCandidates" error
   - ❌ 0 positive, 0 negative votes → "InvalidVoteConfig" error
   - ❌ Voting after election closed → "ElectionNotActive" error
   - ❌ Non-creator closes election → "UnauthorizedClose" error

---

### 3. **Frontend Architecture** (User Interface)

**File Structure:**
```
src/
├── App.tsx                    # Main component
├── components/
│   └── ElectionList.tsx       # Display elections
├── hooks/
│   └── useD21Program.ts       # Solana integration
└── idl/
    ├── voting_program.json    # Generated from Rust
    └── d21_voting.ts          # TypeScript wrapper
```

#### A. App.tsx - Main Container
```typescript
Features:
✅ Wallet connection providers
✅ DevNet network configuration
✅ Wallet adapters: Phantom, Solflare
✅ Header with app title and wallet button
✅ Main content area
✅ Footer with attribution
```

#### B. ElectionList.tsx - Display Component
```typescript
Displays:
✅ Loading state
✅ "Connect wallet" message if not connected
✅ List of all elections from blockchain
✅ For each election:
   - Title
   - Voter count
   - Status (Active/Closed)
   - All candidates with scores
   - Vote/Details buttons (placeholders)
```

#### C. useD21Program.ts - Hook
```typescript
Functions:
✅ useD21Program()
   - Initializes Anchor Program with wallet
   - Returns Program instance for RPC calls
   
✅ getElectionPda(authority, index)
   - Derives Election PDA: [b"election", authority, index]
   - Used to find election accounts on-chain
   
✅ getVoterBallotPda(election, voter)
   - Derives Voter Ballot PDA: [b"voter_ballot", election, voter]
   - Used to prevent double voting
```

---

## 🧪 Testing the Current Setup

### Test 1: Verify Smart Contract
```bash
cd anchor_project/voting_program
anchor build          # Should complete with .so file
anchor test           # Should show 15/15 passing ✅
```

### Test 2: Check Frontend Compilation
```bash
cd frontend
npm install
npm run build         # Will show webpack polyfill warning (expected)
```

### Test 3: Inspect Key Files
```bash
# View generated IDL
cat anchor_project/voting_program/target/idl/voting_program.json | jq '.instructions' | head -30

# Check test coverage
grep -c "it(" anchor_project/voting_program/tests/voting_program.ts
# Should return: 15
```

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| Smart Contract Instructions | 4 |
| Account Types | 3 |
| Error Codes | 11 |
| Test Cases | 15 |
| Test Pass Rate | 100% ✅ |
| Frontend Components | 2 |
| Hooks | 1 |

---

## ⚠️ Known Issues & Next Steps

### Current Limitations (Expected for Milestone 4)
1. Frontend has webpack polyfill warnings (normal for Solana + CRA)
2. Create Election form not yet implemented
3. Voting modal not yet implemented
4. Program not yet deployed to Devnet
5. Frontend not yet deployed to Vercel

### What's Complete ✅
- ✅ Smart contract fully functional
- ✅ All tests passing
- ✅ Frontend wallet integration
- ✅ Election display component
- ✅ Program/wallet interaction hooks

### What's Coming (Milestones 5-6)
1. **Milestone 5:** 
   - Create Election Form
   - Voting Modal
   - Tab navigation
   - Full interactive features

2. **Milestone 6:**
   - Deploy to Devnet
   - Deploy frontend to Vercel
   - Complete documentation

---

## 🔐 Security Review

### PDA Usage ✅
- **Election PDA:** `[b"election", creator_pubkey, election_index]`
  - Allows creator to have multiple elections
  - Deterministic address derivation
  
- **Voter Ballot PDA:** `[b"voter_ballot", election_pubkey, voter_pubkey]`
  - One ballot per voter per election
  - Account creation fails if ballot exists (double voting prevention)

### Validation ✅
- Title/candidate name length checks
- Candidate count validation
- Vote count limits enforcement
- Duplicate vote detection
- Authority checks
- Election state checks

### Error Handling ✅
- 11 distinct error codes
- Clear error messages
- Early validation (fail fast)

---

## 🎯 Review Checklist

- [ ] Read the Account Structures section above
- [ ] Review the Four Main Instructions (initialize, cast, close, results)
- [ ] Run `anchor test` and verify 15/15 passing
- [ ] Check the frontend App.tsx to understand wallet integration
- [ ] Review ElectionList.tsx to see how data is displayed
- [ ] Look at useD21Program.ts for PDA derivation logic

---

## 💡 Questions to Ask

1. **Smart Contract:** Does the validation logic make sense?
2. **Testing:** Do the test scenarios cover your use cases?
3. **Frontend:** Are you happy with the current UI structure?
4. **PDAs:** Do you understand how double voting is prevented?
5. **Next Steps:** Should we proceed with the Create/Vote forms in Milestone 5?

