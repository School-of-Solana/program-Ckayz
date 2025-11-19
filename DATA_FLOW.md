# D21 Voting System - Data Flow Visualization

## 🔄 Complete Voting Flow

### **Phase 1: Election Creation**
```
User (Election Creator)
  │
  ├─ Calls: frontend.createElection()
  │
  ├─ Sends Transaction:
  │    instruction: initialize_election
  │    args: {
  │      election_index: 0,
  │      title: "Best Language",
  │      candidates: ["Rust", "TypeScript"],
  │      positive_votes_per_voter: 2,
  │      negative_votes_per_voter: 1
  │    }
  │
  └─ Solana Program Validates:
      ├─ title.len() <= 200 ✓
      ├─ candidates.len() >= 2 ✓
      ├─ candidates.len() <= 20 ✓
      ├─ each candidate.name.len() <= 50 ✓
      ├─ positive_votes_per_voter > 0 OR negative_votes_per_voter > 0 ✓
      │
      └─ Creates Election Account:
          PDA: [b"election", creator_pubkey, index]
          Data: {
            authority: creator_pubkey,
            title: "Best Language",
            candidates: [
              { name: "Rust", positive: 0, negative: 0 },
              { name: "TypeScript", positive: 0, negative: 0 }
            ],
            positive_votes_per_voter: 2,
            negative_votes_per_voter: 1,
            total_voters: 0,
            is_active: true,
            created_at: now(),
            bump: seed
          }
```

### **Phase 2: Voting**
```
Voter
  │
  ├─ Calls: frontend.castVote()
  │
  ├─ Sends Transaction:
  │    instruction: cast_vote
  │    args: {
  │      positive_vote_indices: [0, 1],  // +votes to Rust, TypeScript
  │      negative_vote_indices: []        // -votes to nobody
  │    }
  │
  └─ Solana Program Validates:
      ├─ election.is_active == true ✓
      ├─ positive_votes.len() <= 2 ✓
      ├─ negative_votes.len() <= 1 ✓
      ├─ all indices < candidates.len() ✓
      ├─ no duplicate indices in positive ✓
      ├─ no duplicate indices in negative ✓
      ├─ no overlap (same index in both) ✓
      │
      ├─ Updates Election Account:
      │   candidates[0].positive_votes += 1  // Rust: +1
      │   candidates[1].positive_votes += 1  // TypeScript: +1
      │   total_voters += 1                  // 1 voter
      │
      └─ Creates Voter Ballot Account:
          PDA: [b"voter_ballot", election_pubkey, voter_pubkey]
          Data: {
            voter: voter_pubkey,
            election: election_pubkey,
            positive_votes_used: [0, 1],
            negative_votes_used: [],
            voted_at: now(),
            bump: seed
          }
```

### **Phase 3: Double Vote Attempt (Blocked)**
```
Same Voter (Attempting 2nd vote)
  │
  ├─ Calls: frontend.castVote()
  │
  ├─ Sends Transaction:
  │    Tries to initialize same Voter Ballot PDA
  │
  └─ Anchor Framework:
      ├─ Checks if PDA exists
      ├─ PDA ALREADY EXISTS from Phase 2
      ├─ Fails with error: "already in use"
      │
      └─ Result: ❌ DOUBLE VOTE BLOCKED
```

### **Phase 4: Election Results**
```
Anyone (No connection needed)
  │
  ├─ Calls: frontend.getElectionResults()
  │
  ├─ Reads Election Account from blockchain
  │
  └─ Frontend calculates scores:
      Rust: 
        positive_votes: 5
        negative_votes: 2
        score: 5 - 2 = 3
      
      TypeScript:
        positive_votes: 4
        negative_votes: 1
        score: 4 - 1 = 3
      
      Results sorted by score:
        1. Rust (3)
        1. TypeScript (3)  // tied
```

### **Phase 5: Close Election**
```
Election Creator Only
  │
  ├─ Calls: frontend.closeElection()
  │
  ├─ Sends Transaction:
  │    instruction: close_election
  │
  └─ Solana Program Validates:
      ├─ signer == election.authority ✓
      │
      ├─ Updates Election Account:
      │   is_active: false
      │
      └─ Result: ✅ ELECTION CLOSED
         No more votes can be cast
```

---

## 📊 Account State Timeline

```
TIME    ACCOUNT STATE                           ACTION
────────────────────────────────────────────────────────────

T0      [Nothing]                              User creates election

T1      Election Account Created:
        ├─ candidates: [
        │    {name: "Rust", +: 0, -: 0},
        │    {name: "TypeScript", +: 0, -: 0}
        │  ]
        ├─ total_voters: 0
        ├─ is_active: true
        └─ authority: creator

        (No Voter Ballots yet)                 Waiting for votes

T2      Election Account:
        ├─ candidates: [
        │    {name: "Rust", +: 1, -: 0},      ← Voter 1
        │    {name: "TypeScript", +: 1, -: 0} ← Voter 1
        │  ]
        ├─ total_voters: 1
        └─ is_active: true

        Voter Ballot 1:
        ├─ voter: voter1_pubkey
        ├─ positive_votes_used: [0, 1]
        ├─ negative_votes_used: []
        └─ voted_at: T2

T3      Election Account:                       Voter 2 votes
        ├─ candidates: [
        │    {name: "Rust", +: 1, -: 1},      ← Voter 2 gave -1
        │    {name: "TypeScript", +: 2, -: 0} ← Voter 2 gave +1
        │  ]
        ├─ total_voters: 2
        └─ is_active: true

        Voter Ballot 2:
        ├─ voter: voter2_pubkey
        ├─ positive_votes_used: [1]
        ├─ negative_votes_used: [0]
        └─ voted_at: T3

T4      Election Account:                       Creator closes
        ├─ candidates: [same as T3]
        ├─ total_voters: 2
        └─ is_active: false                    ← NOW CLOSED

        [Ballots remain unchanged]
```

---

## 🔐 Security Check Points

```
┌─────────────────────────────────────────────────────┐
│ ELECTION CREATION VALIDATION                        │
├─────────────────────────────────────────────────────┤
│ ✓ Title must be ≤ 200 characters                   │
│ ✓ Candidates must be 2-20                           │
│ ✓ Each candidate name ≤ 50 characters              │
│ ✓ Must allow at least 1 vote type                   │
│ ✓ Only creator can create                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ VOTING VALIDATION                                   │
├─────────────────────────────────────────────────────┤
│ ✓ Election must be active                           │
│ ✓ Positive votes ≤ configured limit                 │
│ ✓ Negative votes ≤ configured limit                 │
│ ✓ All indices valid (exist in candidates)          │
│ ✓ No duplicate votes to same candidate             │
│ ✓ No overlap (can't vote + and - for same)         │
│ ✓ PDA prevents double voting (auto)                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ELECTION CLOSURE VALIDATION                         │
├─────────────────────────────────────────────────────┤
│ ✓ Only creator (authority) can close               │
│ ✓ Sets is_active to false                          │
│ ✓ Existing votes remain valid                       │
└─────────────────────────────────────────────────────┘
```

---

## 🌐 Frontend Data Flow

```
┌──────────────────┐
│  User Browser    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ App.tsx                                  │
│ - Setup wallet providers                 │
│ - Render AppContent                      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ ElectionList.tsx                         │
│ - useD21Program() hook                   │
│ - Fetch elections: program.account.      │
│   election.all()                         │
│ - Map to ElectionCard components         │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ useD21Program.ts                         │
│ - Connect to wallet                      │
│ - Initialize Anchor Program              │
│ - Derive PDAs for elections/ballots      │
│ - Call RPC methods                       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Solana Cluster (DevNet)                  │
│ - Read election accounts                 │
│ - Verify transactions                    │
│ - Execute instructions                   │
└──────────────────────────────────────────┘
```

---

## 🎯 Key Data Structures Summary

### **Election (On-Chain)**
```rust
{
  authority: Pubkey,              // 32 bytes
  title: String,                  // 4 + 200 bytes
  candidates: Vec<Candidate>,     // 4 + (num × 200)
  positive_votes_per_voter: u8,   // 1 byte
  negative_votes_per_voter: u8,   // 1 byte
  total_voters: u64,              // 8 bytes
  is_active: bool,                // 1 byte
  created_at: i64,                // 8 bytes
  bump: u8,                       // 1 byte
}
```

### **Candidate (Embedded in Election)**
```rust
{
  name: String,           // 4 + 50 bytes
  positive_votes: i64,    // 8 bytes
  negative_votes: i64,    // 8 bytes
  score: i64 {            // calculated: pos - neg
    positive_votes - negative_votes
  }
}
```

### **VoterBallot (On-Chain)**
```rust
{
  voter: Pubkey,                   // 32 bytes
  election: Pubkey,                // 32 bytes
  positive_votes_used: Vec<u8>,    // 4 + num
  negative_votes_used: Vec<u8>,    // 4 + num
  voted_at: i64,                   // 8 bytes
  bump: u8,                        // 1 byte
}
```

---

## ✅ Verification Checklist

- [ ] Can describe the 5 phases above
- [ ] Understand how PDAs prevent double voting
- [ ] Know what happens when validation fails
- [ ] Can explain the data stored in each account
- [ ] Understand the frontend-to-blockchain flow
- [ ] Know which operations require signatures
- [ ] Know which operations are read-only

