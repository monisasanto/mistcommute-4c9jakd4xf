"use client";

import { useState, useEffect } from "react";
import { useEip6963 } from "@/hooks/metamask/useEip6963";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect: (provider: any, accounts: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnect({ onConnect, isOpen, onClose }: WalletConnectProps) {
  const { providers } = useEip6963();
  const { saveWalletState } = useWalletPersistence();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (provider: any, connectorId: string) => {
    setConnecting(connectorId);

    try {
      // Request accounts (will trigger wallet popup)
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      
      if (accounts && accounts.length > 0) {
        // Get chain ID
        const chainIdHex = await provider.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        // Save to localStorage
        saveWalletState({
          connected: true,
          lastConnectorId: connectorId,
          lastAccounts: accounts,
          lastChainId: chainId,
        });

        onConnect(provider, accounts);
        onClose();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(null);
    }
  };

  // Connect to MetaMask directly if no EIP-6963 providers found
  const handleMetaMaskDirectConnect = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setConnecting("metamask");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      if (accounts && accounts.length > 0) {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        saveWalletState({
          connected: true,
          lastConnectorId: "metamask",
          lastAccounts: accounts,
          lastChainId: chainId,
        });

        onConnect(window.ethereum, accounts);
        onClose();
      }
    } catch (error) {
      console.error("Failed to connect MetaMask:", error);
    } finally {
      setConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <button
                key={provider.info.uuid}
                onClick={() => handleConnect(provider.provider, provider.info.uuid)}
                disabled={connecting !== null}
                className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {provider.info.icon && (
                  <img src={provider.info.icon} alt={provider.info.name} className="w-8 h-8" />
                )}
                <span className="font-medium text-gray-700">
                  {connecting === provider.info.uuid ? "Connecting..." : provider.info.name}
                </span>
              </button>
            ))
          ) : (
            <button
              onClick={handleMetaMaskDirectConnect}
              disabled={connecting !== null}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">
                {connecting ? "Connecting..." : "Connect MetaMask"}
              </span>
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500 text-center">
          By connecting, you agree to MistCommute's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

