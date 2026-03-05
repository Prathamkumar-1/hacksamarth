# Transaction Authenticity Tracker - Complete Implementation Guide

## Overview

The Transaction Authenticity Tracker is a decentralized, blockchain-based system that ensures donors can verify their money was used properly by NGOs. This implements an **escrow mechanism with proof verification** to build trust in the donation ecosystem.

## How It Works

### For Donors 💳

1. **Donate to a Project** → Money goes into escrow (smart contract holds it)
2. **Monitor Status** → View donation status in "My Donations" tracker
3. **Verify Proof** → NGO submits proof (receipts, videos, documents) within 30 days
4. **Auto Release** → Once proof is verified, funds are released to NGO
5. **Get Refund** → If proof is rejected or expires, funds automatically refund to donor

### For NGOs 🏢

1. **Receive Donations** → Money held in escrow for 30 days
2. **Submit Proof** → Upload receipts/videos/documents showing fund usage
3. **Get Verified** → System automatically verifies proof within 24 hours
4. **Receive Funds** → Once verified, money is released to your wallet
5. **Build Trust** → Successful proofs increase your reputation score

### For Admins/Auditors 👮

1. **Review Pending Proofs** → See all unverified proofs
2. **Verify Authenticity** → Check documents and approve/reject
3. **Manage Disputes** → Handle rejection appeals and issues
4. **Monitor System** → Track verification rates and fraud attempts

---

## Smart Contract Changes

### New Structs & Enums

```solidity
enum DonationStatus { 
  Pending,           // Awaiting proof submission (0-30 days)
  ProofSubmitted,    // NGO has uploaded proof
  Verified,          // Proof verified, funds can release
  Rejected,          // Proof rejected
  Released,          // Funds released to NGO
  Refunded           // Funds returned to donor
}

struct Donation {
  uint256 id;
  uint256 projectId;
  address donor;
  uint256 amount;
  uint256 timestamp;
  string message;
  DonationStatus status;      // NEW: Track donation status
  uint256 escrowUntil;        // NEW: When proof expires
  uint256 verifiedAt;         // NEW: When proof was verified
}

struct ProofSubmission {
  uint256 id;
  uint256 donationId;
  uint256 projectId;
  address ngo;
  string proofHash;           // IPFS hash
  string proofType;           // "receipt", "video", "document"
  uint256 submittedAt;
  DonationStatus status;
  string verificationReason;  // If rejected, why?
}

uint256 public constant PROOF_SUBMISSION_DEADLINE = 30 days;
```

### New Functions

#### 1. **submitProof()** - NGO submits proof
```solidity
function submitProof(
  uint256 _projectId,
  uint256 _donationId,
  string callo_proofHash,     // IPFS hash
  string calldata _proofType  // "receipt", "video", "document"
) external
```
- Only NGO of project can call
- Must be within 30 days of donation
- Proof types must be valid
- Emits `ProofSubmitted` event

#### 2. **verifyProof()** - Admin/Auditor verifies proof
```solidity
function verifyProof(
  uint256 _projectId,
  uint256 _donationId,
  bool _approve,
  string calldata _reason     // If rejected
) external onlyRole(AUDITOR_ROLE)
```
- Only AUDITOR_ROLE can call
- If approved: funds released to NGO, reputation +5
- If rejected: funds can be refunded, reputation -10

#### 3. **refundDonationIfExpired()** - Automatic refund
```solidity
function refundDonationIfExpired(
  uint256 _projectId,
  uint256 _donationId
) external nonReentrant
```
- Can be called by anyone after 30 days
- If proof not submitted or rejected → auto-refund
- Donor needs to initiate the refund claim

---

## Backend Implementation

### New Model: Proof.js
Stores proof submissions in MongoDB with:
- `donationId` - Reference to on-chain donation
- `projectId`, `ngoId` - Project and NGO references
- `proofType` - "receipt", "video", or "document"
- `proofIPFS` - IPFS hash of the file
- `status` - Track verification status
- `expiresAt` - 30-day deadline
- `verifiedAt`, `verifiedBy` - Verification details

### New Routes: proofs.js

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/proofs/donation-status/:projectId/:donationId` | GET | Get full donation status |
| `/api/proofs/project/:projectId` | GET | All proofs for project |
| `/api/proofs/donor/:address` | GET | All proofs from donor |
| `/api/proofs/ngo/:ngoId` | GET | NGO's proof management |
| `/api/proofs/submit/:projectId/:donationId` | POST | Submit new proof |
| `/api/proofs/verify/:projectId/:donationId` | POST | Verify/reject proof |
| `/api/proofs/verify-pending` | GET | Admin view pending |
| `/api/proofs/sync-blockchain` | POST | Sync status |

---

## Frontend Implementation

### New Pages

#### 1. **DonationTracker.jsx** (`/donation-tracker`)
- **Who:** Donors
- **Shows:**
  - All donations with status
  - Proof verification status
  - Days remaining before auto-refund
  - Emergency refund button if expired
  - Status timeline visualization
  - Help section explaining the process

#### 2. **Enhanced NGODashboard.jsx**
- **New Tab:** "Proofs"
- **Shows:**
  - Pending proof submissions
  - Verification progress
  - Statistics (pending, verified, rejected)
  - Instructions for NGOs

### New Components

#### 1. **ProofUploadModal.jsx**
- Modal for NGO to upload proof
- Input fields:
  - Proof type (receipt, video, document)
  - Description of what was done
  - File upload (drag-drop support)
- Validation:
  - File size limit: 50MB
  - Description: 20-500 characters
  - File required
- Upload process:
  1. Upload file to IPFS
  2. Submit proof metadata to backend
  3. Create on-chain proof submission

---

## User Flows

### Donor Flow

```
1. Browse & Donate to Project
   ↓
2. Money goes to escrow (held on blockchain)
   ↓
3. Donation appears in "My Donations" tracker
   Status: ⏳ "Awaiting Proof"
   ↓
4. NGO has 30 days to submit proof
   ↓
5a. Proof Submitted ✓
    Status: 📤 "Proof Submitted"
    (Wait for verification)
    ↓
6a. Proof Verified ✓
    Status: ✅ "Verified"
    Funds released to NGO
    ↓
7. Donation Complete 🎉
    
5b. No Proof or Rejected ✗
    Status: ❌ "Proof Rejected" or expired
    ↓
6b. Automatic Refund
    Status: ↩️ "Refunded"
    Money returned to your wallet
```

### NGO Flow

```
1. Receive Donation
   Money held in escrow
   ↓
2. Use money for the project
   ↓
3. Go to "Proofs" tab in Dashboard
   ↓
4. Click "Submit Proof" for donation
   ↓
5. Upload proof (receipt/video/document)
   Write description: "Purchased 50 textbooks for school..."
   ↓
6. Submit to blockchain
   ↓
7. Proof status: 📤 "Submitted"
   (Auditors reviewing)
   ↓
8a. Proof Approved ✓
    Status: ✅ "Verified"
    Funds released to your wallet +0.5 ETH
    Reputation +5 points
    ↓
    
8b. Proof Rejected ✗
    Status: ❌ "Rejected"
    Reason shown (e.g., "No evidence of work")
    Reputation -10 points
    Funds refunded to donor
    ↓
    Can resubmit better proof
```

---

## Key Features

### 1. **Automatic Escrow**
- Funds held in smart contract
- Not with NGO until verified
- Transparent, on-chain holding

### 2. **30-Day Proof Window**
- NGO must submit proof within 30 days
- Automatic refund if expired
- Countdown visible to donor

### 3. **Multiple Proof Types**
- **Receipt/Invoice** - Show purchase proof
- **Video** - Document work being done
- **Document** - Reports, photos, etc.

### 4. **IPFS Storage**
- All proofs stored decentralized on IPFS
- Publicly verifiable
- Immutable records

### 5. **Reputation System**
- Verified proof → +5 points
- Rejected proof → -10 points
- Helps donors choose trusted NGOs

### 6. **Automatic Verification**
- System checks proof automatically
- No manual review delay
- Instant fund release on approval

---

## API Examples

### Check Donation Status
```bash
GET /api/proofs/donation-status/5/0
```
Response:
```json
{
  "donation": {
    "id": 0,
    "amount": "1000000000000000000",
    "status": "ProofSubmitted",
    "timestamp": "1709400000",
    "escrowUntil": "1712078400",
    "verifiedAt": "0"
  },
  "proof": {
    "type": "receipt",
    "status": "submitted",
    "submittedAt": "2026-02-15T10:30:00Z",
    "expiresAt": "2026-03-17T10:30:00Z"
  },
  "escrowBalance": "1000000000000000000"
}
```

### Submit Proof
```bash
POST /api/proofs/submit/5/0
Content-Type: application/json

{
  "proofType": "receipt",
  "proofIPFS": "QmXxxx...",
  "description": "Purchased educational materials for 50 students including textbooks and notebooks..."
}
```

### Get Donor's Donations
```bash
GET /api/proofs/donor/0x1234...
```
Response:
```json
{
  "total": 5,
  "verified": 3,
  "pending": 1,
  "proofs": [...]
}
```

---

## Testing Checklist

### Smart Contract Tests
- [ ] Donation enters escrow on donation
- [ ] Escrow deadline tracks correctly
- [ ] NGO can submit proof within deadline
- [ ] Admin can verify/reject proof
- [ ] Funds release on verification
- [ ] Funds refund on expiry/rejection
- [ ] Reputation updates correctly

### Backend Tests
- [ ] Proof model saves correctly
- [ ] Routes validate input
- [ ] IPFS upload integration works
- [ ] Blockchain sync functions
- [ ] Status queries accurate

### Frontend Tests
- [ ] Donation tracker loads
- [ ] Status updates reflect blockchain
- [ ] Proof upload modal works
- [ ] File validation works
- [ ] Countdown timer accurate
- [ ] Refund button appears correctly

### User Flow Tests
- [ ] Donor can see all donations
- [ ] Status changes as proof submitted
- [ ] NGO can upload proof
- [ ] Proof appears in donor view
- [ ] Refund works after expiry
- [ ] Reputation updates shown

---

## Security Considerations

1. **File Upload**
   - Max 50MB file size
   - IPFS immutability
   - No direct server storage

2. **Smart Contract**
   - ReentrancyGuard on fund releases
   - Proper access controls (AUDITOR_ROLE)
   - Safe math operations

3. **Database**
   - Input validation on all routes
   - Authentication required
   - Rate limiting applied

4. **Fraud Prevention**
   - Require descriptive proofs
   - Time-locked verification
   - Auditor review of disputed cases
   - Reputation penalty system

---

## Future Enhancements

1. **AI Proof Verification** - Use AI to auto-verify receipts
2. **Multi-Signature Approvals** - Multiple auditors required
3. **Proof Templates** - Provide standard forms
4. **Dispute Resolution** - Formal appeals process
5. **Insurance** - Fraud protection insurance
6. **NFT Certificates** - Issue proof-of-impact NFTs

---

## Support & Documentation

### For Donors
- Video: "How to Verify Your Donations"
- FAQ: Tracking and refunds
- Support email: donors@chaingive.io

### For NGOs
- Guide: "Submitting Proof of Fund Usage"
- Video: "Uploading Receipts"
- Support email: ngos@chaingive.io

### For Admins
- Manual: "Proof Verification Process"
- Training: "Identifying Fraud"
- Dashboard: Metrics & analytics
