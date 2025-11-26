/**
 * Internal constants for FHEVM integration
 */

export const FHEVM_CONSTANTS = {
  // Mock mode detection
  MOCK_CHAIN_ID: 31337,
  MOCK_METADATA_KEY: "fhevm_relayer_metadata",

  // Relayer SDK (v0.3.0-5 - UMD format)
  RELAYER_SDK_CDN: "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs",
  RELAYER_SDK_LOCAL: "/relayer-sdk-js.umd.cjs",
  RELAYER_SDK_WINDOW_KEY: "relayerSDK",

  // Timeouts
  ENCRYPTION_TIMEOUT: 30000, // 30 seconds
  DECRYPTION_TIMEOUT: 60000, // 60 seconds

  // Retry config
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

