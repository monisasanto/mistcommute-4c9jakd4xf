"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "../providers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMistCommuteContract } from "@/hooks/useMistCommuteContract";
import { getCongestionColor, getCongestionLabel } from "@/lib/constants";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignatureClass";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

export default function CommunityPage() {
  const { provider, account, chainId } = useApp();
  const { instance: fhevmInstance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const {
    contract,
    contractAddress,
    getCommunityStats,
    getCongestionLevel,
  } = useMistCommuteContract(provider, account, chainId);

  const [stats, setStats] = useState<{
    totalCommutes: number;
    morningCongested: boolean;
    eveningCongested: boolean;
  } | null>(null);
  const [morningLevel, setMorningLevel] = useState<number | null>(null);
  const [eveningLevel, setEveningLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [decrypting, setDecrypting] = useState<boolean>(false);
  const [decryptMessage, setDecryptMessage] = useState<string>("");
  const [decryptedStats, setDecryptedStats] = useState<{
    totalAvg: number | null;
    morningAvg: number | null;
    eveningAvg: number | null;
  }>({
    totalAvg: null,
    morningAvg: null,
    eveningAvg: null,
  });

  // Check if current user is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!contract || !account) {
        setIsOwner(false);
        return;
      }

      try {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error("Failed to check owner:", error);
        setIsOwner(false);
      }
    };

    checkOwner();
  }, [contract, account]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const communityStats = await getCommunityStats();
        const morning = await getCongestionLevel(0);
        const evening = await getCongestionLevel(1);

        setStats(communityStats);
        setMorningLevel(morning);
        setEveningLevel(evening);
      } catch (error) {
        console.error("Failed to fetch community stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [getCommunityStats, getCongestionLevel]);

  /**
   * Decrypt community statistics (owner only)
   */
  const handleDecryptStats = useCallback(async () => {
    if (!contract || !fhevmInstance || !account || !contractAddress || !provider) {
      setDecryptMessage("❌ Contract or FHEVM not ready");
      return;
    }

    setDecrypting(true);
    setDecryptMessage("⏳ Decrypting statistics...");

    try {
      // First, grant access to self
      try {
        const tx = await contract.grantStatsAccess(account);
        await tx.wait();
        console.log("✅ Self-granted stats access");
      } catch (error) {
        // Might already have access, continue
        console.log("Access grant skipped (might already have access)");
      }

      // Get encrypted handles
      const [totalDurationSum, morningDurationSum, eveningDurationSum] =
        await contract.getEncryptedStats();
      const totalCommutes = await contract.totalCommutes();
      const morningCount = await contract.morningCount();
      const eveningCount = await contract.eveningCount();

      // Get signer for decryption signature
      const signer = await provider.getSigner(account);

      // Load or create decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress],
        signer,
        storage
      );

      if (!sig) {
        throw new Error("Failed to get decryption signature");
      }

      // Prepare handles for batch decryption
      const handles = [
        { handle: totalDurationSum, contractAddress },
        { handle: morningDurationSum, contractAddress },
        { handle: eveningDurationSum, contractAddress },
      ];

      // Decrypt all values in one call
      const decryptedResults = await fhevmInstance.userDecrypt(
        handles,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      // Extract decrypted values
      const totalDecrypted = Number(decryptedResults[totalDurationSum]);
      const morningDecrypted = Number(decryptedResults[morningDurationSum]);
      const eveningDecrypted = Number(decryptedResults[eveningDurationSum]);

      // Calculate averages
      const totalCommutesBN = Number(totalCommutes);
      const morningCountBN = Number(morningCount);
      const eveningCountBN = Number(eveningCount);

      const totalAvg =
        totalCommutesBN > 0 ? totalDecrypted / totalCommutesBN : 0;
      const morningAvg =
        morningCountBN > 0 ? morningDecrypted / morningCountBN : 0;
      const eveningAvg =
        eveningCountBN > 0 ? eveningDecrypted / eveningCountBN : 0;

      setDecryptedStats({
        totalAvg: Math.round(totalAvg),
        morningAvg: Math.round(morningAvg),
        eveningAvg: Math.round(eveningAvg),
      });

      setDecryptMessage("✅ Statistics decrypted successfully");
    } catch (error: any) {
      console.error("Failed to decrypt stats:", error);
      setDecryptMessage(`❌ Failed: ${error.message || "Decryption failed"}`);
    } finally {
      setDecrypting(false);
    }
  }, [contract, fhevmInstance, account, contractAddress, provider, storage]);

  const renderCongestionBadge = (level: number | null) => {
    if (level === null) return <div className="text-gray-500">Loading...</div>;

    const color = getCongestionColor(level);
    const label = getCongestionLabel(level);

    return (
      <div className="flex items-center space-x-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold">{label}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2 font-heading">Community Statistics</h1>
      <p className="text-gray-600 mb-8">
        Aggregated congestion insights from encrypted commute data
      </p>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading community data...</p>
        </div>
      ) : (
        <>
          {/* Live Congestion Dashboard */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-6 font-heading">Live Congestion Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  🌅 Morning Rush (6-9 AM)
                </h3>
                {renderCongestionBadge(morningLevel)}
                {stats?.morningCongested && (
                  <p className="mt-2 text-sm text-gray-600">
                    Average commute time exceeds threshold
                  </p>
                )}
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  🌆 Evening Rush (5-8 PM)
                </h3>
                {renderCongestionBadge(eveningLevel)}
                {stats?.eveningCongested && (
                  <p className="mt-2 text-sm text-gray-600">
                    Average commute time exceeds threshold
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Community Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Commutes</h3>
              <div className="text-5xl font-bold text-primary mb-2">
                {stats?.totalCommutes || 0}
              </div>
              <p className="text-sm text-gray-500">Encrypted records on-chain</p>
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Encrypted Average</h3>
              {decryptedStats.totalAvg !== null ? (
                <>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {decryptedStats.totalAvg} min
                  </div>
                  <p className="text-sm text-green-600">🔓 Decrypted</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-700 mb-2">
                    🔒 Private
                  </div>
                  {isOwner ? (
                    <button
                      onClick={handleDecryptStats}
                      disabled={decrypting}
                      className="mt-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {decrypting ? "⏳ Decrypting..." : "🔓 Decrypt (Owner)"}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Only admin can decrypt</p>
                  )}
                </>
              )}
            </div>

            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Privacy Level</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                100%
              </div>
              <p className="text-sm text-gray-500">Fully encrypted on-chain</p>
            </div>
          </div>

          {/* Decryption Message */}
          {decryptMessage && (
            <div
              className={`card mb-8 ${
                decryptMessage.startsWith("✅")
                  ? "bg-green-50 border-green-200"
                  : decryptMessage.startsWith("❌")
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              } border`}
            >
              <p
                className={`${
                  decryptMessage.startsWith("✅")
                    ? "text-green-700"
                    : decryptMessage.startsWith("❌")
                    ? "text-red-700"
                    : "text-blue-700"
                }`}
              >
                {decryptMessage}
              </p>
            </div>
          )}

          {/* Decrypted Details (Owner Only) */}
          {isOwner && (decryptedStats.morningAvg !== null || decryptedStats.eveningAvg !== null) && (
            <div className="card mb-8 bg-gradient-to-r from-primary/5 to-secondary/5">
              <h2 className="text-2xl font-bold mb-4 font-heading">🔓 Decrypted Statistics (Owner View)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Overall Average</div>
                  <div className="text-3xl font-bold text-primary">
                    {decryptedStats.totalAvg !== null ? `${decryptedStats.totalAvg} min` : "N/A"}
                  </div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Morning Rush Average</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {decryptedStats.morningAvg !== null ? `${decryptedStats.morningAvg} min` : "N/A"}
                  </div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Evening Rush Average</div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {decryptedStats.eveningAvg !== null ? `${decryptedStats.eveningAvg} min` : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="card bg-gradient-to-r from-primary/5 to-secondary/5">
            <h2 className="text-2xl font-bold mb-4 font-heading">How It Works</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>🔐 Fully Homomorphic Encryption (FHE):</strong> All commute times are encrypted
                before leaving your browser. The blockchain computes statistics without ever decrypting
                individual records.
              </p>
              <p>
                <strong>📊 Encrypted Computations:</strong> Average durations and congestion levels are
                calculated on encrypted data using FHEVM primitives like FHE.add, FHE.gt, etc.
              </p>
              <p>
                <strong>✅ Public Results:</strong> Only comparison results (congested: yes/no) are
                revealed publicly. Actual commute times remain encrypted.
              </p>
              <p>
                <strong>🔓 Controlled Access:</strong> Community managers can be granted permission to
                decrypt aggregated statistics for infrastructure planning, while individual data stays
                private.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

