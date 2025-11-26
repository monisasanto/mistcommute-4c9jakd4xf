"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { ethers } from "ethers";
import { FhevmProvider } from "@/fhevm/useFhevm";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { WalletConnect } from "@/components/wallet/WalletConnect";

interface AppContextValue {
  provider: ethers.BrowserProvider | null;
  account: string | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  openConnectModal: () => void;
  disconnect: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const { provider, chainId, account, isConnected } = useMetaMaskProvider();
  const { attemptSilentReconnect, saveWalletState, clearWalletState } = useWalletPersistence();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  // Attempt silent reconnection on mount
  useEffect(() => {
    if (!reconnected) {
      attemptSilentReconnect().then((result) => {
        if (result.success) {
          console.log("✅ Wallet silently reconnected");
        }
        setReconnected(true);
      });
    }
  }, [attemptSilentReconnect, reconnected]);

  // Save state when connection changes
  useEffect(() => {
    if (isConnected && account && chainId) {
      saveWalletState({
        connected: true,
        lastAccounts: [account],
        lastChainId: chainId,
      });
    }
  }, [isConnected, account, chainId, saveWalletState]);

  const openConnectModal = () => {
    setConnectModalOpen(true);
  };

  const disconnect = () => {
    clearWalletState();
    // Reload page to reset state
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleConnect = (provider: any, accounts: string[]) => {
    // Connection is handled by useMetaMaskProvider
    console.log("Wallet connected:", accounts[0]);
  };

  const value: AppContextValue = {
    provider,
    account,
    chainId,
    isConnected,
    openConnectModal,
    disconnect,
  };

  return (
    <AppContext.Provider value={value}>
      <FhevmProvider provider={provider} chainId={chainId}>
        {children}
        <WalletConnect
          onConnect={handleConnect}
          isOpen={connectModalOpen}
          onClose={() => setConnectModalOpen(false)}
        />
      </FhevmProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within Providers");
  }
  return context;
}

