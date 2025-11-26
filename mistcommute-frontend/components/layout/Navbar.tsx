"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES, truncateAddress } from "@/lib/constants";
import { useState } from "react";

interface NavbarProps {
  chainId?: number;
  account?: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Navbar({ chainId, account, isConnected, onConnect, onDisconnect }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: APP_ROUTES.DASHBOARD, label: "Dashboard" },
    { href: APP_ROUTES.SUBMIT, label: "Submit Commute" },
    { href: APP_ROUTES.COMMUNITY, label: "Community Stats" },
    { href: APP_ROUTES.ADMIN, label: "Admin" },
  ];

  const isActive = (path: string) => pathname === path;

  const getNetworkName = () => {
    if (!chainId) return "Not Connected";
    if (chainId === 31337) return "Local";
    if (chainId === 11155111) return "Sepolia";
    return `Chain ${chainId}`;
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors font-heading">
              MistCommute
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-150 font-medium ${
                  isActive(link.href)
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Network Indicator */}
            {isConnected && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                <div className={`w-2 h-2 rounded-full ${chainId === 31337 || chainId === 11155111 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-gray-700 font-medium">{getNetworkName()}</span>
              </div>
            )}

            {/* Wallet Button */}
            {isConnected && account ? (
              <div className="relative group">
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-md font-medium hover:bg-primary/20 transition-colors">
                  {truncateAddress(account)}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <button
                    onClick={onDisconnect}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="btn-primary"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              {isConnected && account ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {truncateAddress(account)}
                  </div>
                  <button
                    onClick={() => {
                      onDisconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onConnect();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full btn-primary"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

