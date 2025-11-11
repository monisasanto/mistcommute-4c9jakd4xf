# MistCommute

Privacy-preserving commute analytics dApp built with FHEVM.

## Overview

MistCommute is a decentralized application that enables privacy-preserving commute analytics using fully homomorphic encryption (FHE) through the FHEVM protocol.

## Project Structure

- `fhevm-hardhat-template/` - Hardhat project with FHEVM contracts
  - `contracts/` - Smart contract source files
  - `deploy/` - Deployment scripts
  - `test/` - Contract tests
- `mistcommute-frontend/` - Next.js frontend application
  - `app/` - Next.js app directory
  - `components/` - React components
  - `hooks/` - Custom React hooks

## Getting Started

### Prerequisites

- Node.js 18+
- Hardhat
- FHEVM dependencies
- MetaMask or compatible Web3 wallet

### Installation

```bash
npm install
```

### Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat deploy --network localhost

# Run frontend
cd mistcommute-frontend
npm run dev
```

## License

See LICENSE file for details.

