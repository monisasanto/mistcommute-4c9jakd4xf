/**
 * Mock FHEVM Implementation for Local Development
 * Uses @fhevm/mock-utils for Hardhat local testing (chainId 31337)
 */

import { JsonRpcProvider } from "ethers";
import type { FhevmInstance, FhevmConfig } from "../fhevmTypes";

interface FhevmMetadata {
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
}

interface MockFhevmConfig extends FhevmConfig {
  metadata: FhevmMetadata;
}

/**
 * Create Mock FHEVM instance for local development
 * Requires metadata from Hardhat node with @fhevm/hardhat-plugin
 */
export async function createMockFhevmClient(
  config: MockFhevmConfig
): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("Mock FHEVM client can only be created in browser environment");
  }

  if (!config.rpcUrl) {
    throw new Error("RPC URL is required for Mock mode");
  }

  if (!config.metadata) {
    throw new Error("FHEVM metadata is required for Mock mode");
  }

  // Dynamically import mock utils (browser-only, avoid including in production bundle)
  const { MockFhevmInstance } = await import("@fhevm/mock-utils");
  const { Contract } = await import("ethers");

  const provider = new JsonRpcProvider(config.rpcUrl);

  // Query InputVerifier's EIP712 domain for correct verifyingContract address
  console.log("[fhevmMock] Querying InputVerifier EIP712 domain...");
  const inputVerifierContract = new Contract(
    config.metadata.InputVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
    ],
    provider
  );

  // Query InputVerifier's EIP712 domain
  const inputVerifierDomain = await inputVerifierContract.eip712Domain();
  const verifyingContractAddressInputVerification = inputVerifierDomain[4]; // index 4 is verifyingContract
  const inputVerifierDomainChainId = Number(inputVerifierDomain[3]); // index 3 is chainId

  console.log(
    `[fhevmMock] InputVerifier EIP712 domain chainId: ${inputVerifierDomainChainId}`
  );
  console.log(
    `[fhevmMock] InputVerifier EIP712 verifyingContract: ${verifyingContractAddressInputVerification}`
  );
  
  // Validate the verifyingContract address
  if (!verifyingContractAddressInputVerification || verifyingContractAddressInputVerification === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid verifyingContract address from InputVerifier EIP712 domain");
  }

  // Query KMSVerifier's EIP712 domain for decryption signature verification
  console.log("[fhevmMock] Querying KMSVerifier EIP712 domain...");
  const kmsVerifierContract = new Contract(
    config.metadata.KMSVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
    ],
    provider
  );

  const kmsVerifierDomain = await kmsVerifierContract.eip712Domain();
  const verifyingContractAddressDecryption = kmsVerifierDomain[4]; // index 4 is verifyingContract
  const kmsVerifierDomainChainId = Number(kmsVerifierDomain[3]); // index 3 is chainId

  console.log(
    `[fhevmMock] KMSVerifier EIP712 domain chainId: ${kmsVerifierDomainChainId}`
  );
  console.log(
    `[fhevmMock] KMSVerifier EIP712 verifyingContract: ${verifyingContractAddressDecryption}`
  );

  // Validate the verifyingContract address
  if (!verifyingContractAddressDecryption || verifyingContractAddressDecryption === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid verifyingContract address from KMSVerifier EIP712 domain");
  }

  // Use network chainId (31337) for MockFhevmInstance
  // gatewayChainId MUST match InputVerifier EIP712 domain chainId (10901)
  // This is required by MockFhevmInstance.createEncryptedInput and createEIP712 assertions
  const networkChainId = config.chainId || 31337;
  
  // Verify that both domains use the same gateway chainId
  if (inputVerifierDomainChainId !== kmsVerifierDomainChainId) {
    console.warn(
      `⚠️ InputVerifier and KMSVerifier have different gateway chainIds: ${inputVerifierDomainChainId} vs ${kmsVerifierDomainChainId}`
    );
  }
  
  console.log("[fhevmMock] Creating MockFhevmInstance with config:", {
    aclContractAddress: config.metadata.ACLAddress,
    chainId: networkChainId,
    gatewayChainId: inputVerifierDomainChainId, // MUST match InputVerifier EIP712 domain chainId
    inputVerifierContractAddress: config.metadata.InputVerifierAddress,
    kmsContractAddress: config.metadata.KMSVerifierAddress,
    verifyingContractAddressInputVerification,
    verifyingContractAddressDecryption,
  });
  
  const mockInstance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: config.metadata.ACLAddress,
      chainId: networkChainId, // Use network chainId (31337) for contract interactions
      gatewayChainId: inputVerifierDomainChainId, // MUST match InputVerifier EIP712 domain chainId (10901)
      inputVerifierContractAddress: config.metadata.InputVerifierAddress,
      kmsContractAddress: config.metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption, // Use dynamically queried address from KMSVerifier
      verifyingContractAddressInputVerification, // Use dynamically queried address from InputVerifier
    },
    {
      // v0.3.0 requires 4th parameter: properties
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );

  console.log(
    `✅ Mock FHEVM instance created for chainId ${networkChainId}`
  );
  console.log("  Using metadata from Hardhat FHEVM plugin");

  return mockInstance as unknown as FhevmInstance;
}
