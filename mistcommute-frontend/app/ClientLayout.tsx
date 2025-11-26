"use client";

import { useApp } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { chainId, account, isConnected, openConnectModal, disconnect } = useApp();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        chainId={chainId}
        account={account}
        isConnected={isConnected}
        onConnect={openConnectModal}
        onDisconnect={disconnect}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

