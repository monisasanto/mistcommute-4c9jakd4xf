/**
 * FHEVM Client Integration with Auto Mock Detection
 * - Uses @zama-fhe/relayer-sdk for production networks (Sepolia, etc.)
 * - Automatically detects Hardhat + FHEVM plugin and uses @fhevm/mock-utils
 */

import { JsonRpcProvider } from "ethers";
import type { FhevmInstance, FhevmConfig } from "../fhevmTypes";

/**
 * Get Web3 client version from RPC endpoint
 */
async function getWeb3Client(rpcUrl: string): Promise<string | undefined> {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } catch (e) {
    console.warn(`Failed to get web3_clientVersion from ${rpcUrl}:`, e);
    return undefined;
  } finally {
    rpc.destroy();
  }
}

/**
 * Fetch FHEVM Relayer Metadata from Hardhat node
 * This metadata is provided by @fhevm/hardhat-plugin
 */
async function getFHEVMRelayerMetadata(rpcUrl: string): Promise<any> {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    return metadata;
  } catch (e) {
    console.warn(`Failed to get fhevm_relayer_metadata from ${rpcUrl}:`, e);
    return undefined;
  } finally {
    rpc.destroy();
  }
}

/**
 * Try to fetch FHEVM metadata from Hardhat node
 * Returns metadata if successful, undefined otherwise
 */
async function tryFetchFHEVMHardhatNodeRelayerMetadata(
  rpcUrl: string
): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl);
  if (
    typeof version !== "string" ||
    !version.toLowerCase().includes("hardhat")
  ) {
    // Not a Hardhat Node
    return undefined;
  }

  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl);
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }

    // Validate metadata structure
    if (
      !(
        "ACLAddress" in metadata &&
        typeof metadata.ACLAddress === "string" &&
        metadata.ACLAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "InputVerifierAddress" in metadata &&
        typeof metadata.InputVerifierAddress === "string" &&
        metadata.InputVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "KMSVerifierAddress" in metadata &&
        typeof metadata.KMSVerifierAddress === "string" &&
        metadata.KMSVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }

    return {
      ACLAddress: metadata.ACLAddress as `0x${string}`,
      InputVerifierAddress: metadata.InputVerifierAddress as `0x${string}`,
      KMSVerifierAddress: metadata.KMSVerifierAddress as `0x${string}`,
    };
  } catch (e) {
    console.warn("Failed to fetch FHEVM metadata:", e);
    return undefined;
  }
}

/**
 * Check if Relayer SDK is loaded on window
 */
function isRelayerSDKLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).relayerSDK;
}

/**
 * Load Relayer SDK dynamically
 * Tries CDN injection first, falls back to npm package
 */
async function loadRelayerSDK(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Relayer SDK can only be loaded in browser environment");
  }

  // Check if already loaded via CDN
  if (isRelayerSDKLoaded()) {
    console.log("✅ Relayer SDK loaded from CDN");
    return (window as any).relayerSDK;
  }

  // Fallback: Load from npm package
  console.log("Loading Relayer SDK from npm package...");
  try {
    const sdk = await import("@zama-fhe/relayer-sdk/web");
    (window as any).relayerSDK = sdk;
    console.log("✅ Relayer SDK loaded from npm");
    return sdk;
  } catch (error) {
    console.warn("Failed to load Relayer SDK from npm:", error);
    throw new Error(
      "Relayer SDK not available. Please ensure @zama-fhe/relayer-sdk is installed."
    );
  }
}

/**
 * Main entry point: Create FHEVM instance (Mock or Real)
 * Automatically detects if connected to Hardhat node with FHEVM plugin
 */
export async function createFhevmClient(
  config: FhevmConfig
): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM client can only be created in browser environment");
  }

  // For local Hardhat (chainId 31337), try Mock mode first
  if (config.chainId === 31337 && config.rpcUrl) {
    console.log("Detected chainId 31337, checking for FHEVM Hardhat node...");
    const metadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(
      config.rpcUrl
    );

    if (metadata) {
      console.log("✅ FHEVM Hardhat metadata found, using Mock mode");
      console.log("  ACL:", metadata.ACLAddress);
      console.log("  InputVerifier:", metadata.InputVerifierAddress);
      console.log("  KMSVerifier:", metadata.KMSVerifierAddress);

      // Dynamically import Mock utils (avoid including in production bundle)
      const { createMockFhevmClient } = await import("./fhevmMock");
      return createMockFhevmClient({
        ...config,
        metadata,
      });
    }

    console.warn(
      "⚠️ Hardhat node detected but no FHEVM metadata found. Make sure @fhevm/hardhat-plugin is enabled and Hardhat node is running."
    );
    throw new Error(
      "Mock mode requires window.fhevm_relayer_metadata. Make sure Hardhat node is running with FHEVM plugin."
    );
  }

  // Fall back to Real mode for other chains
  console.log("Using Real FHEVM mode with Relayer SDK");
  return createRealFhevmClient(config);
}

/**
 * Create Real FHEVM instance for production networks
 */
async function createRealFhevmClient(
  config: FhevmConfig
): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("Real FHEVM client can only be created in browser environment");
  }

  if (!config.relayerUrl) {
    throw new Error("Relayer URL is required for real FHEVM mode");
  }

  // Load SDK
  const sdk = await loadRelayerSDK();

  // Initialize SDK if needed
  if (!(window as any).relayerSDK?.__initialized__) {
    console.log("Initializing Relayer SDK with config:", {
      chain: config.chainId,
      relayerUrl: config.relayerUrl,
      decryptionOracleAddress: config.decryptionOracleAddress,
      kmsContractAddress: config.kmsContractAddress,
    });

    const initResult = await sdk.initSDK({
      chain: config.chainId,
      relayerUrl: config.relayerUrl,
      decryptionOracleAddress: config.decryptionOracleAddress,
      kmsContractAddress: config.kmsContractAddress,
    });

    if (!initResult) {
      throw new Error("Failed to initialize Relayer SDK");
    }

    (window as any).relayerSDK.__initialized__ = true;
    console.log("✅ Relayer SDK initialized");
  }

  // Create FHEVM instance with full config
  // After initSDK, the SDK exposes a config object (e.g., SepoliaConfig)
  // based on the chain parameter
  console.log("Creating FHEVM instance for chainId:", config.chainId);
  
  // Get the network config from SDK (set by initSDK)
  const networkConfig = config.chainId === 11155111 
    ? sdk.SepoliaConfig 
    : sdk.EthereumConfig;
  
  if (!networkConfig) {
    throw new Error(`No network config found for chainId ${config.chainId}`);
  }
  
  const instanceConfig: any = {
    ...networkConfig,
    network: config.provider,
  };
  
  console.log("Creating instance with config:", instanceConfig);
  const instance = await sdk.createInstance(instanceConfig);

  console.log("✅ FHEVM instance created");
  return instance;
}
