"use client";

import { useEffect, useCallback } from "react";
import { WALLET_STORAGE_KEYS } from "@/lib/constants";

interface WalletState {
  connected: boolean;
  lastConnectorId: string | null;
  lastAccounts: string[];
  lastChainId: number | null;
}

/**
 * Hook to manage wallet persistence in localStorage
 * Enables silent reconnection on page refresh
 */
export function useWalletPersistence() {
  // Load wallet state from localStorage
  const loadWalletState = useCallback((): WalletState => {
    if (typeof window === "undefined") {
      return {
        connected: false,
        lastConnectorId: null,
        lastAccounts: [],
        lastChainId: null,
      };
    }

    try {
      const connected = localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTED) === "true";
      const lastConnectorId = localStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTOR_ID);
      const lastAccountsStr = localStorage.getItem(WALLET_STORAGE_KEYS.LAST_ACCOUNTS);
      const lastChainIdStr = localStorage.getItem(WALLET_STORAGE_KEYS.LAST_CHAIN_ID);

      return {
        connected,
        lastConnectorId,
        lastAccounts: lastAccountsStr ? JSON.parse(lastAccountsStr) : [],
        lastChainId: lastChainIdStr ? parseInt(lastChainIdStr, 10) : null,
      };
    } catch (error) {
      console.error("Failed to load wallet state:", error);
      return {
        connected: false,
        lastConnectorId: null,
        lastAccounts: [],
        lastChainId: null,
      };
    }
  }, []);

  // Save wallet state to localStorage
  const saveWalletState = useCallback((state: Partial<WalletState>) => {
    if (typeof window === "undefined") return;

    try {
      if (state.connected !== undefined) {
        localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTED, String(state.connected));
      }
      if (state.lastConnectorId !== undefined) {
        if (state.lastConnectorId) {
          localStorage.setItem(WALLET_STORAGE_KEYS.LAST_CONNECTOR_ID, state.lastConnectorId);
        } else {
          localStorage.removeItem(WALLET_STORAGE_KEYS.LAST_CONNECTOR_ID);
        }
      }
      if (state.lastAccounts !== undefined) {
        localStorage.setItem(WALLET_STORAGE_KEYS.LAST_ACCOUNTS, JSON.stringify(state.lastAccounts));
      }
      if (state.lastChainId !== undefined) {
        if (state.lastChainId) {
          localStorage.setItem(WALLET_STORAGE_KEYS.LAST_CHAIN_ID, String(state.lastChainId));
        } else {
          localStorage.removeItem(WALLET_STORAGE_KEYS.LAST_CHAIN_ID);
        }
      }
    } catch (error) {
      console.error("Failed to save wallet state:", error);
    }
  }, []);

  // Clear wallet state from localStorage
  const clearWalletState = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(WALLET_STORAGE_KEYS.CONNECTED);
      localStorage.removeItem(WALLET_STORAGE_KEYS.LAST_CONNECTOR_ID);
      localStorage.removeItem(WALLET_STORAGE_KEYS.LAST_ACCOUNTS);
      localStorage.removeItem(WALLET_STORAGE_KEYS.LAST_CHAIN_ID);
    } catch (error) {
      console.error("Failed to clear wallet state:", error);
    }
  }, []);

  // Attempt silent reconnection on mount
  const attemptSilentReconnect = useCallback(async (): Promise<{
    success: boolean;
    accounts?: string[];
    chainId?: number;
  }> => {
    const state = loadWalletState();

    if (!state.connected || typeof window === "undefined" || !window.ethereum) {
      return { success: false };
    }

    try {
      // Silent account request (no popup)
      const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];

      if (accounts.length === 0) {
        // No accounts, clear state
        clearWalletState();
        return { success: false };
      }

      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      const chainId = parseInt(chainIdHex, 16);

      console.log("✅ Silent reconnect successful:", accounts[0]);

      return {
        success: true,
        accounts,
        chainId,
      };
    } catch (error) {
      console.error("Silent reconnect failed:", error);
      clearWalletState();
      return { success: false };
    }
  }, [loadWalletState, clearWalletState]);

  return {
    loadWalletState,
    saveWalletState,
    clearWalletState,
    attemptSilentReconnect,
  };
}

