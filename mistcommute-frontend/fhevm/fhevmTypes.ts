/**
 * Type definitions for FHEVM integration
 */

// Core FHEVM types (compatible with both Mock and Real SDK)
export interface FhevmInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
  getPublicKey: () => Promise<string>;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => EIP712Type;
  userDecrypt: (
    handles: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<DecryptedResults>;
}

export interface EncryptedInputBuilder {
  add32: (value: number) => EncryptedInputBuilder;
  add64: (value: bigint) => EncryptedInputBuilder;
  addAddress: (address: string) => EncryptedInputBuilder;
  addBool: (value: boolean) => EncryptedInputBuilder;
  encrypt: () => Promise<EncryptedInput>;
}

export interface EncryptedInput {
  handles: string[];
  inputProof: string;
}

export interface FhevmConfig {
  chainId: number;
  provider: any;
  rpcUrl?: string;
  relayerUrl?: string;
  decryptionOracleAddress?: string;
  kmsContractAddress?: string;
}

export type FhevmMode = "mock" | "real";

// Handle and decryption types
export type HandleContractPair = {
  handle: string;
  contractAddress: string;
};

// v0.3.0 renamed DecryptedResults to UserDecryptResults
export type UserDecryptResults = Record<string, bigint | boolean | string>;

// Backward compatibility alias
export type DecryptedResults = UserDecryptResults;

// EIP-712 types for decryption signatures
export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: string;
    version: string;
  };
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

// Decryption signature type
export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: string;
  contractAddresses: string[];
  eip712: EIP712Type;
};

