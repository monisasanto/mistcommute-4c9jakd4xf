"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "../providers";
import { useMistCommuteContract } from "@/hooks/useMistCommuteContract";
import { useCommuteDecryption } from "@/hooks/useCommuteDecryption";
import { APP_ROUTES, minutesToTime, formatDuration } from "@/lib/constants";

interface DecryptedCommute {
  commuteId: number;
  departure: number;
  arrival: number;
  duration: number;
  routeName: string;
  commuteType: number;
  timestamp: number;
}

export default function DashboardPage() {
  const { provider, account, chainId, isConnected, openConnectModal } = useApp();
  const { contract, contractAddress, getUserCommuteIds, getCongestionLevel } = useMistCommuteContract(provider, account, chainId);
  const { decryptMultiple, decrypting } = useCommuteDecryption(contract, contractAddress, account, provider);

  const [commuteIds, setCommuteIds] = useState<number[]>([]);
  const [decryptedCommutes, setDecryptedCommutes] = useState<DecryptedCommute[]>([]);
  const [loading, setLoading] = useState(true);
  const [morningCongestion, setMorningCongestion] = useState<number | null>(null);
  const [eveningCongestion, setEveningCongestion] = useState<number | null>(null);

  useEffect(() => {
    if (!isConnected || !account) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ids = await getUserCommuteIds();
        setCommuteIds(ids);

        const morning = await getCongestionLevel(0); // MorningRush
        const evening = await getCongestionLevel(1); // EveningRush
        setMorningCongestion(morning);
        setEveningCongestion(evening);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isConnected, account, getUserCommuteIds, getCongestionLevel]);

  const handleDecrypt = async () => {
    if (commuteIds.length === 0) return;

    try {
      const decrypted = await decryptMultiple(commuteIds);
      setDecryptedCommutes(decrypted);
    } catch (error) {
      console.error("Failed to decrypt commutes:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-6 font-heading">Dashboard</h1>
        <p className="text-xl text-gray-600 mb-8">
          Please connect your wallet to view your dashboard
        </p>
        <button onClick={openConnectModal} className="btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  const getCongestionBadge = (level: number | null) => {
    if (level === null) return { label: "Loading...", color: "gray" };
    if (level === 0) return { label: "🟢 Low", color: "green" };
    if (level === 1) return { label: "🟡 Moderate", color: "yellow" };
    return { label: "🔴 High", color: "red" };
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 font-heading">Your Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Commutes</h3>
          <div className="text-4xl font-bold text-primary">
            {loading ? "..." : commuteIds.length}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Morning Congestion</h3>
          <div className="text-2xl font-bold">
            {getCongestionBadge(morningCongestion).label}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Evening Congestion</h3>
          <div className="text-2xl font-bold">
            {getCongestionBadge(eveningCongestion).label}
          </div>
        </div>
      </div>

      {/* Commute History */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Your Commute History</h2>
          {commuteIds.length > 0 && decryptedCommutes.length === 0 && (
            <button
              onClick={handleDecrypt}
              disabled={decrypting}
              className="btn-primary disabled:opacity-50"
            >
              {decrypting ? "Decrypting..." : "Decrypt All"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading your commutes...</p>
          </div>
        ) : commuteIds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">You haven't submitted any commutes yet</p>
            <Link href={APP_ROUTES.SUBMIT} className="btn-primary">
              Submit Your First Commute
            </Link>
          </div>
        ) : decryptedCommutes.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              You have {commuteIds.length} encrypted commute{commuteIds.length !== 1 ? "s" : ""} on-chain.
            </p>
            <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
              <p className="text-sm text-gray-700">
                🔒 Your data is encrypted. Click "Decrypt All" to view your commute details.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Showing {decryptedCommutes.length} decrypted commute{decryptedCommutes.length !== 1 ? "s" : ""}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Departure</th>
                    <th className="text-left py-3 px-4 font-semibold">Arrival</th>
                    <th className="text-left py-3 px-4 font-semibold">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold">Route</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {decryptedCommutes.map((commute) => (
                    <tr key={commute.commuteId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(commute.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono">{minutesToTime(commute.departure)}</td>
                      <td className="py-3 px-4 font-mono">{minutesToTime(commute.arrival)}</td>
                      <td className="py-3 px-4 font-semibold">{formatDuration(commute.duration)}</td>
                      <td className="py-3 px-4">{commute.routeName || "Unnamed"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          commute.commuteType === 0 ? "bg-orange-100 text-orange-700" :
                          commute.commuteType === 1 ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {commute.commuteType === 0 ? "Morning" : commute.commuteType === 1 ? "Evening" : "Other"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={APP_ROUTES.SUBMIT} className="btn-primary">
          Submit New Commute
        </Link>
        <Link href={APP_ROUTES.COMMUNITY} className="btn-outline">
          View Community Stats
        </Link>
      </div>
    </div>
  );
}

