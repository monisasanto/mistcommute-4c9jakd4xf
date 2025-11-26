# MistCommute

A privacy-preserving commute analytics dApp powered by FHEVM (Fully Homomorphic Encryption Virtual Machine). Track your commute patterns without exposing personal data.

## Overview

MistCommute enables users to submit encrypted commute data to the blockchain, where it remains encrypted while still allowing for aggregated community statistics and congestion analysis. Built with FHEVM, all computations happen on encrypted data without decryption.

## Features

- 🔒 **Privacy-First**: Commute times are encrypted before leaving your browser
- 📊 **Community Insights**: View aggregated congestion trends without individual exposure
- ⚡ **Real-Time Alerts**: Get notified of congestion changes based on encrypted threshold comparisons
- 🔐 **Owner Controls**: Contract owner can manage thresholds and decrypt aggregated statistics

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/             # Solidity contracts (MistCommute.sol)
│   ├── deploy/                # Deployment scripts
│   ├── test/                  # Contract tests
│   └── tasks/                 # Hardhat tasks
│
└── mistcommute-frontend/      # Next.js frontend application
    ├── app/                   # Next.js app directory
    ├── components/            # React components
    ├── fhevm/                 # FHEVM integration logic
    ├── hooks/                 # React hooks
    └── lib/                   # Utilities and constants
```

## Prerequisites

- Node.js 18+ and npm
- Hardhat node (for local development)
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for testnet deployment)

## Getting Started

### 1. Install Dependencies

```bash
# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../mistcommute-frontend
npm install
```

### 2. Start Local Hardhat Node

```bash
cd fhevm-hardhat-template
npx hardhat node
```

### 3. Deploy Contracts

In a new terminal:

```bash
cd fhevm-hardhat-template
npx hardhat deploy --network localhost
```

### 4. Generate ABI and Addresses

```bash
cd mistcommute-frontend
npm run genabi
```

### 5. Start Frontend

For local development with mock FHEVM:

```bash
cd mistcommute-frontend
npm run dev:mock
```

For Sepolia testnet (real FHEVM):

```bash
cd mistcommute-frontend
npm run dev
```

## Available Scripts

### Contract Scripts (fhevm-hardhat-template/)

- `npx hardhat compile` - Compile contracts
- `npx hardhat test` - Run tests
- `npx hardhat deploy --network localhost` - Deploy to local node
- `npx hardhat deploy --network sepolia` - Deploy to Sepolia testnet

### Frontend Scripts (mistcommute-frontend/)

- `npm run dev:mock` - Start dev server with mock FHEVM (localhost)
- `npm run dev` - Start dev server with real FHEVM (Sepolia)
- `npm run build` - Build for production
- `npm run genabi` - Generate ABI and contract addresses
- `npm run check:static` - Verify static export compliance

## Smart Contract

The `MistCommute` contract stores encrypted commute data and performs homomorphic operations:

- **submitCommute**: Submit encrypted commute duration and time
- **getEncryptedStats**: Retrieve encrypted aggregated statistics
- **getCongestionLevel**: Get current congestion level (Green/Yellow/Red)
- **updateThresholds**: Owner-only function to update congestion thresholds
- **grantDecryptionAccess**: Owner-only function to grant decryption permissions

## Frontend Features

- **Dashboard**: View your personal encrypted commute history
- **Submit**: Submit new commute data (encrypted before submission)
- **Community Stats**: View aggregated community statistics (encrypted)
- **Admin**: Owner-only page for managing contract settings and decrypting stats

## Technology Stack

- **Smart Contracts**: Solidity with FHEVM
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js v6
- **FHEVM**: @zama-fhe/relayer-sdk v0.3.0-5

## Network Support

- **Localhost**: Hardhat node (chainId: 31337) with mock FHEVM
- **Sepolia**: Ethereum testnet (chainId: 11155111) with real FHEVM

## License

BSD-3-Clause-Clear

## Contributing

This project uses FHEVM for privacy-preserving computations. When contributing, ensure all sensitive data remains encrypted and follows FHEVM best practices.

