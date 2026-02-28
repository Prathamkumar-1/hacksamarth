# ⛓ ChainGive — Blockchain Donation Platform

> Transparent, trustless, and accountable donations powered by Ethereum smart contracts.

---

## 🏗 Project Structure

```
blockchain-donation/
├── contracts/
│   ├── DonationPlatform.sol    # Core smart contract (NGOs, Projects, Donations, Fund releases)
│   └── Treasury.sol            # Platform fee treasury
├── scripts/
│   └── deploy.js               # Deployment script
├── backend/
│   ├── server.js               # Express API server
│   ├── config/
│   │   ├── blockchain.js       # Web3 provider setup
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js             # JWT auth, rate limiting
│   │   └── security.js         # Helmet, CORS, XSS protection
│   ├── models/
│   │   ├── User.js             # User model with account lockout
│   │   ├── NGO.js              # NGO model
│   │   └── Project.js          # Project model
│   └── routes/
│       ├── auth.js             # Login, register, wallet-auth
│       ├── projects.js         # CRUD for projects
│       ├── ngo.js              # NGO management
│       └── donations.js        # Blockchain donation queries
└── frontend/
    └── src/
        ├── App.jsx             # Router & providers
        ├── context/
        │   └── AuthContext.jsx # Auth state (JWT + MetaMask)
        ├── components/
        │   ├── Navbar.jsx      # Navigation with wallet connection
        │   ├── ProjectCard.jsx # Project display card
        │   └── DonateModal.jsx # Donation flow modal
        ├── pages/
        │   ├── Home.jsx        # Landing page with live blockchain data
        │   ├── Projects.jsx    # Browse & filter projects
        │   ├── ProjectDetail.jsx # Full project + on-chain activity
        │   ├── Login.jsx       # Auth (email + MetaMask)
        │   ├── NGODashboard.jsx # NGO project management
        │   └── UserDashboard.jsx # Donor history & portfolio
        └── utils/
            ├── web3.js         # Ethers.js helpers
            └── api.js          # Axios API client
```

---

## 🔐 Security Features

| Layer | Protection |
|-------|-----------|
| Smart Contract | ReentrancyGuard, Pausable, AccessControl, CEI pattern |
| Funds | Held in contract until multi-sig auditor approval |
| Backend | Helmet, CORS, Rate limiting, XSS/NoSQL injection prevention |
| Auth | JWT (7d expiry), account lockout after 5 failed attempts |
| Wallet | ECDSA signature verification for wallet login |
| Refunds | Automatic on-chain refunds if project is suspended |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- MetaMask browser extension

### 1. Install Dependencies
```bash
npm install             # Root (Hardhat)
cd backend && npm install
cd frontend && npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Fill in MONGODB_URI, JWT_SECRET, PRIVATE_KEY, etc.
```

### 3. Start Local Blockchain
```bash
npm run node
```

### 4. Deploy Contracts
```bash
npm run deploy:local
# Copy CONTRACT_ADDRESS to backend/.env and frontend/.env
```

### 5. Run Backend
```bash
npm run backend
```

### 6. Run Frontend
```bash
npm run frontend
```

---

## 🔄 Donation Flow

1. **User** connects MetaMask → browses verified projects
2. **User** donates ETH → funds held in smart contract (2% platform fee)
3. **NGO** completes milestone → uploads proof to IPFS → requests fund release
4. **Auditors** (2/3 multi-sig) review proof → approve or flag
5. **Funds released** to NGO wallet if approved, or NGO reputation penalized if flagged
6. **Refunds** available automatically if project is suspended or deadline missed

---

## 📜 Smart Contract Roles

| Role | Permissions |
|------|------------|
| `ADMIN_ROLE` | Verify NGOs, activate/suspend projects, set platform fee |
| `AUDITOR_ROLE` | Review fund release requests (multi-sig approval) |
| `NGO_ROLE` | Create projects, request fund releases |
| Public | Donate, claim refunds |

---

## 🌐 Tech Stack

- **Blockchain**: Solidity 0.8.19, OpenZeppelin, Hardhat, Ethers.js v6
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT, bcrypt
- **Frontend**: React 18, React Router v6, Recharts, react-hot-toast
- **Security**: Helmet, CORS, express-rate-limit, xss-clean, hpp, mongo-sanitize
