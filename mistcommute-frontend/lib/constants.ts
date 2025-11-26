/**
 * Application-wide constants for MistCommute
 */

// Network configurations
export const SUPPORTED_CHAINS = {
  LOCALHOST: {
    chainId: 31337,
    name: "Local Hardhat",
    rpcUrl: "http://localhost:8545",
    useMock: true,
  },
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    useMock: false,
    relayerUrl: "https://gateway.sepolia.zama.ai",
    // FHEVM addresses for Sepolia - from Zama's official deployment
    // See: https://docs.zama.ai/fhevm/getting_started/connect
    decryptionOracleAddress: "0x469f2952454Fc7E6bcD0EDf8129F7F5679B7E4F0",
    kmsVerifierAddress: "0x904Cf0424F2503470d6e41Cd1dE2Ff1054Ca2d4C",
  },
} as const;

export type ChainId = typeof SUPPORTED_CHAINS.LOCALHOST.chainId | typeof SUPPORTED_CHAINS.SEPOLIA.chainId;

// Wallet persistence keys
export const WALLET_STORAGE_KEYS = {
  CONNECTED: "wallet.connected",
  LAST_CONNECTOR_ID: "wallet.lastConnectorId",
  LAST_ACCOUNTS: "wallet.lastAccounts",
  LAST_CHAIN_ID: "wallet.lastChainId",
} as const;

// FHEVM storage keys (account-specific)
export const FHEVM_STORAGE_KEYS = {
  DECRYPTION_SIGNATURE_PREFIX: "fhevm.decryptionSignature.",
  PUBLIC_KEY: "fhevm.publicKey",
} as const;

// Commute type enum (matches contract)
export enum CommuteType {
  Morning = 0,
  Evening = 1,
  Other = 2,
}

// Congestion level enum (matches contract)
export enum CongestionLevel {
  Green = 0,
  Yellow = 1,
  Red = 2,
}

// Time slot enum (matches contract)
export enum TimeSlot {
  MorningRush = 0,   // 6-9 AM
  EveningRush = 1,   // 5-8 PM
  Other = 2,
}

// Time conversion utilities
export const TIME_CONSTANTS = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MORNING_RUSH_START: 360,  // 6:00 AM in minutes
  MORNING_RUSH_END: 540,    // 9:00 AM in minutes
  EVENING_RUSH_START: 1020, // 5:00 PM in minutes
  EVENING_RUSH_END: 1200,   // 8:00 PM in minutes
} as const;

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * TIME_CONSTANTS.MINUTES_PER_HOUR + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / TIME_CONSTANTS.MINUTES_PER_HOUR);
  const mins = minutes % TIME_CONSTANTS.MINUTES_PER_HOUR;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Determine time slot from minutes since midnight
 */
export function getTimeSlot(minutes: number): TimeSlot {
  if (minutes >= TIME_CONSTANTS.MORNING_RUSH_START && minutes < TIME_CONSTANTS.MORNING_RUSH_END) {
    return TimeSlot.MorningRush;
  } else if (minutes >= TIME_CONSTANTS.EVENING_RUSH_START && minutes < TIME_CONSTANTS.EVENING_RUSH_END) {
    return TimeSlot.EveningRush;
  }
  return TimeSlot.Other;
}

/**
 * Get congestion level color
 */
export function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case CongestionLevel.Green:
      return "#10b981"; // success color
    case CongestionLevel.Yellow:
      return "#f59e0b"; // warning color
    case CongestionLevel.Red:
      return "#ef4444"; // error color
    default:
      return "#6b7280"; // neutral
  }
}

/**
 * Get congestion level label
 */
export function getCongestionLabel(level: CongestionLevel): string {
  switch (level) {
    case CongestionLevel.Green:
      return "Low Congestion";
    case CongestionLevel.Yellow:
      return "Moderate Congestion";
    case CongestionLevel.Red:
      return "High Congestion";
    default:
      return "Unknown";
  }
}

/**
 * Truncate Ethereum address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// UI constants
export const UI_CONSTANTS = {
  MAX_COMMUTE_DURATION: 240,  // 4 hours in minutes
  MIN_COMMUTE_DURATION: 5,    // 5 minutes minimum
  DEFAULT_TOAST_DURATION: 3000, // 3 seconds
  DECRYPTION_TIMEOUT: 30000,    // 30 seconds
} as const;

// Route names
export const APP_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SUBMIT: "/submit",
  COMMUNITY: "/community",
  ADMIN: "/admin",
} as const;

