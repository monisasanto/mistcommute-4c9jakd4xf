"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

/**
 * Hook to get MetaMask provider and network info
 */
export function useMetaMaskProvider() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(ethersProvider);

    // Get initial chain ID
    ethersProvider.getNetwork().then((network) => {
      setChainId(Number(network.chainId));
    }).catch(console.error);

    // Get initial accounts (silent, no popup)
    window.ethereum.request({ method: "eth_accounts" })
      .then((accts: string[]) => {
        setAccounts(accts);
        setIsConnected(accts.length > 0);
      })
      .catch(console.error);

    // Listen for account changes
    const handleAccountsChanged = (accts: string[]) => {
      setAccounts(accts);
      setIsConnected(accts.length > 0);
    };

    // Listen for chain changes
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      // Reload provider to avoid stale data
      const newProvider = new ethers.BrowserProvider(window.ethereum!);
      setProvider(newProvider);
    };

    // Listen for disconnect
    const handleDisconnect = () => {
      setAccounts([]);
      setIsConnected(false);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, []);

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    account: accounts[0],
  };
}

