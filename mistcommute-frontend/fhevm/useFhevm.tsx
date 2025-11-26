"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { FhevmInstance, FhevmConfig, FhevmMode } from "./fhevmTypes";
import { createFhevmClient } from "./internal/fhevm";
import { SUPPORTED_CHAINS } from "@/lib/constants";

interface FhevmContextValue {
  instance: FhevmInstance | null;
  mode: FhevmMode | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

interface FhevmProviderProps {
  children: React.ReactNode;
  provider: any; // ethers provider
  chainId: number | undefined;
}

export function FhevmProvider({ children, provider, chainId }: FhevmProviderProps) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [mode, setMode] = useState<FhevmMode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const createInstance = useCallback(async () => {
    if (!provider || !chainId) {
      setInstance(null);
      setMode(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fhevmInstance: FhevmInstance;
      let fhevmMode: FhevmMode;

      if (chainId === SUPPORTED_CHAINS.LOCALHOST.chainId) {
        console.log("🔧 Creating FHEVM instance for localhost (will auto-detect Mock mode)...");
        const config: FhevmConfig = {
          chainId,
          provider,
          rpcUrl: SUPPORTED_CHAINS.LOCALHOST.rpcUrl,
        };
        fhevmInstance = await createFhevmClient(config);
        fhevmMode = "mock";
      } else if (chainId === SUPPORTED_CHAINS.SEPOLIA.chainId) {
        console.log("🔧 Creating FHEVM instance for Sepolia (Real mode)...");
        
        // For Sepolia, we need a valid EIP-1193 provider
        // Use window.ethereum if available, otherwise use provider from hook
        const eip1193Provider = typeof window !== "undefined" && (window as any).ethereum 
          ? (window as any).ethereum 
          : provider;
        
        if (!eip1193Provider) {
          throw new Error("No EIP-1193 provider available. Please connect your wallet.");
        }
        
        const config: FhevmConfig = {
          chainId,
          provider: eip1193Provider,
          relayerUrl: SUPPORTED_CHAINS.SEPOLIA.relayerUrl,
          decryptionOracleAddress: SUPPORTED_CHAINS.SEPOLIA.decryptionOracleAddress,
          kmsContractAddress: SUPPORTED_CHAINS.SEPOLIA.kmsVerifierAddress,
        };
        fhevmInstance = await createFhevmClient(config);
        fhevmMode = "real";
      } else {
        throw new Error(`Unsupported chainId: ${chainId}`);
      }

      setInstance(fhevmInstance);
      setMode(fhevmMode);
      console.log(`✅ FHEVM instance ready (${fhevmMode} mode)`);
    } catch (err) {
      console.error("Failed to create FHEVM instance:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setInstance(null);
      setMode(null);
    } finally {
      setLoading(false);
    }
  }, [provider, chainId]);

  const refresh = useCallback(() => {
    setInstance(null);
    setMode(null);
    setError(null);
    createInstance();
  }, [createInstance]);

  useEffect(() => {
    createInstance();
  }, [createInstance]);

  const value: FhevmContextValue = {
    instance,
    mode,
    loading,
    error,
    refresh,
  };

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>;
}

/**
 * Hook to access FHEVM instance from context
 */
export function useFhevm(): FhevmContextValue {
  const context = useContext(FhevmContext);
  if (context === undefined) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }
  return context;
}

