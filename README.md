# MistCommute

Privacy-preserving commute analytics dApp built with FHEVM.

## Overview

MistCommute is a decentralized application that enables privacy-preserving commute analytics using fully homomorphic encryption (FHE) through the FHEVM protocol.

## Project Structure

- `fhevm-hardhat-template/` - Hardhat project with FHEVM contracts
- `mistcommute-frontend/` - Next.js frontend application

## Getting Started

### Prerequisites

- Node.js 18+
- Hardhat
- FHEVM dependencies

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

