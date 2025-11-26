/**
 * Storage and retrieval of FHEVM decryption signatures
 * Signatures are account-specific and stored in localStorage
 */

import { FHEVM_STORAGE_KEYS } from "@/lib/constants";

/**
 * Generate storage key for account's decryption signature
 */
function getSignatureKey(account: string): string {
  return `${FHEVM_STORAGE_KEYS.DECRYPTION_SIGNATURE_PREFIX}${account.toLowerCase()}`;
}

/**
 * Store decryption signature for an account
 */
export function storeDecryptionSignature(account: string, signature: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getSignatureKey(account), signature);
  } catch (error) {
    console.error("Failed to store decryption signature:", error);
  }
}

/**
 * Retrieve decryption signature for an account
 */
export function getDecryptionSignature(account: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getSignatureKey(account));
  } catch (error) {
    console.error("Failed to retrieve decryption signature:", error);
    return null;
  }
}

/**
 * Remove decryption signature for an account
 */
export function removeDecryptionSignature(account: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getSignatureKey(account));
  } catch (error) {
    console.error("Failed to remove decryption signature:", error);
  }
}

/**
 * Clear all decryption signatures
 */
export function clearAllDecryptionSignatures(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    const prefix = FHEVM_STORAGE_KEYS.DECRYPTION_SIGNATURE_PREFIX;
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear decryption signatures:", error);
  }
}

