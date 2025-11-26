"use client";

import { useState, useEffect, useCallback } from "react";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMistCommuteContract } from "@/hooks/useMistCommuteContract";
import { designTokens } from "@/lib/design-tokens";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignatureClass";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

export default function AdminPage() {
  const { provider, accounts, chainId } = useMetaMaskProvider();
  const { instance: fhevmInstance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const { contract, contractAddress } = useMistCommuteContract(
    provider,
    accounts?.[0],
    chainId
  );

  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Grant access form
  const [grantAddress, setGrantAddress] = useState<string>("");

  // Update thresholds form
  const [lowThreshold, setLowThreshold] = useState<string>("30");
  const [highThreshold, setHighThreshold] = useState<string>("45");

  // Decrypted stats
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
      if (!contract || !accounts?.[0]) {
        setIsOwner(false);
        return;
      }

      try {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());
      } catch (error) {
        console.error("Failed to check owner:", error);
        setIsOwner(false);
      }
    };

    checkOwner();
  }, [contract, accounts]);

  /**
   * Grant stats access to an address
   */
  const handleGrantAccess = useCallback(async () => {
    if (!contract || !grantAddress) {
      setMessage("❌ Please enter a valid address");
      return;
    }

    setLoading(true);
    setMessage("⏳ Granting access...");

    try {
      const tx = await contract.grantStatsAccess(grantAddress);
      await tx.wait();

      setMessage(`✅ Access granted to ${grantAddress}`);
      setGrantAddress("");
    } catch (error: any) {
      console.error("Failed to grant access:", error);
      setMessage(`❌ Failed: ${error.message || "Transaction failed"}`);
    } finally {
      setLoading(false);
    }
  }, [contract, grantAddress]);

  /**
   * Update congestion thresholds
   */
  const handleUpdateThresholds = useCallback(async () => {
    if (!contract || !fhevmInstance || !accounts?.[0] || !contractAddress) {
      setMessage("❌ Contract or FHEVM not ready");
      return;
    }

    const low = parseInt(lowThreshold);
    const high = parseInt(highThreshold);

    if (isNaN(low) || isNaN(high) || low >= high) {
      setMessage("❌ Invalid thresholds (low must be < high)");
      return;
    }

    setLoading(true);
    setMessage("⏳ Updating thresholds...");

    try {
      // Create encrypted input
      const input = fhevmInstance.createEncryptedInput(
        contractAddress,
        accounts[0]
      );
      input.add32(low);
      input.add32(high);

      const encryptedData = await input.encrypt();

      // Submit transaction
      const tx = await contract.updateThresholds(
        encryptedData.handles[0],
        encryptedData.handles[1],
        encryptedData.inputProof
      );

      await tx.wait();

      setMessage(
        `✅ Thresholds updated: Low=${low} min, High=${high} min`
      );
    } catch (error: any) {
      console.error("Failed to update thresholds:", error);
      setMessage(`❌ Failed: ${error.message || "Transaction failed"}`);
    } finally {
      setLoading(false);
    }
  }, [
    contract,
    fhevmInstance,
    accounts,
    contractAddress,
    lowThreshold,
    highThreshold,
  ]);

  /**
   * Decrypt community statistics (requires prior access grant)
   */
  const handleDecryptStats = useCallback(async () => {
    if (!contract || !fhevmInstance || !accounts?.[0] || !contractAddress) {
      setMessage("❌ Contract or FHEVM not ready");
      return;
    }

    setLoading(true);
    setMessage("⏳ Decrypting statistics...");

    try {
      // First, grant access to self if not already done
      try {
        const tx = await contract.grantStatsAccess(accounts[0]);
        await tx.wait();
        console.log("✅ Self-granted stats access");
      } catch (error) {
        // Might already have access, continue
        console.log("Access grant skipped (might already have access)");
      }

      // Get encrypted handles using the getter function
      const [totalDurationSum, morningDurationSum, eveningDurationSum] = 
        await contract.getEncryptedStats();
      const totalCommutes = await contract.totalCommutes();
      const morningCount = await contract.morningCount();
      const eveningCount = await contract.eveningCount();

      // Get signer for decryption signature
      if (!provider) {
        throw new Error("Provider not available");
      }
      const signer = await provider.getSigner(accounts[0]);

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

      setMessage("✅ Statistics decrypted successfully");
    } catch (error: any) {
      console.error("Failed to decrypt stats:", error);
      setMessage(`❌ Failed: ${error.message || "Decryption failed"}`);
    } finally {
      setLoading(false);
    }
  }, [contract, fhevmInstance, accounts, contractAddress]);

  if (!accounts || accounts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div
          className="max-w-2xl mx-auto p-8 rounded-xl text-center"
          style={{ backgroundColor: designTokens.colors.surface }}
        >
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: designTokens.colors.error }}
          >
            🔒 Admin Access Required
          </h1>
          <p style={{ color: designTokens.colors.textSecondary }}>
            Please connect your wallet to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div
          className="max-w-2xl mx-auto p-8 rounded-xl text-center"
          style={{ backgroundColor: designTokens.colors.surface }}
        >
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: designTokens.colors.error }}
          >
            ⛔ Access Denied
          </h1>
          <p style={{ color: designTokens.colors.textSecondary }}>
            Only the contract owner can access this page.
          </p>
          <p className="mt-4 text-sm" style={{ color: designTokens.colors.textMuted }}>
            Connected as: {accounts[0]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: designTokens.colors.primary[500]}}
          >
            🛡️ Admin Panel
          </h1>
          <p style={{ color: designTokens.colors.textSecondary }}>
            Manage MistCommute contract settings and decrypt community statistics
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: message.startsWith("✅")
                ? `${designTokens.colors.success}20`
                : message.startsWith("❌")
                ? `${designTokens.colors.error}20`
                : `${designTokens.colors.info}20`,
              border: `1px solid ${
                message.startsWith("✅")
                  ? designTokens.colors.success
                  : message.startsWith("❌")
                  ? designTokens.colors.error
                  : designTokens.colors.info
              }`,
            }}
          >
            <p
              style={{
                color: message.startsWith("✅")
                  ? designTokens.colors.success
                  : message.startsWith("❌")
                  ? designTokens.colors.error
                  : designTokens.colors.info,
              }}
            >
              {message}
            </p>
          </div>
        )}

        {/* Grant Access Section */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{ backgroundColor: designTokens.colors.surface }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: designTokens.colors.text }}>
            🔑 Grant Stats Access
          </h2>
          <p className="mb-4" style={{ color: designTokens.colors.textSecondary }}>
            Grant an address permission to decrypt community statistics
          </p>

          <input
            type="text"
            placeholder="0x..."
            value={grantAddress}
            onChange={(e) => setGrantAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-lg mb-4"
            style={{
              backgroundColor: designTokens.colors.background,
              border: `1px solid ${designTokens.colors.border}`,
              color: designTokens.colors.text,
            }}
          />

          <button
            onClick={handleGrantAccess}
            disabled={loading || !grantAddress}
            className="btn-primary w-full"
          >
            {loading ? "⏳ Processing..." : "Grant Access"}
          </button>
        </div>

        {/* Update Thresholds Section */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{ backgroundColor: designTokens.colors.surface }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: designTokens.colors.text }}>
            ⚙️ Update Congestion Thresholds
          </h2>
          <p className="mb-4" style={{ color: designTokens.colors.textSecondary }}>
            Set the thresholds for congestion level calculations (in minutes)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: designTokens.colors.textSecondary }}
              >
                Low Threshold (Yellow → Red)
              </label>
              <input
                type="number"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: designTokens.colors.background,
                  border: `1px solid ${designTokens.colors.border}`,
                  color: designTokens.colors.text,
                }}
                min="1"
              />
            </div>

            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: designTokens.colors.textSecondary }}
              >
                High Threshold (Green → Yellow)
              </label>
              <input
                type="number"
                value={highThreshold}
                onChange={(e) => setHighThreshold(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: designTokens.colors.background,
                  border: `1px solid ${designTokens.colors.border}`,
                  color: designTokens.colors.text,
                }}
                min="1"
              />
            </div>
          </div>

          <button
            onClick={handleUpdateThresholds}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "⏳ Processing..." : "Update Thresholds"}
          </button>
        </div>

        {/* Decrypt Statistics Section */}
        <div
          className="p-6 rounded-xl"
          style={{ backgroundColor: designTokens.colors.surface }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: designTokens.colors.text }}>
            🔓 Decrypt Community Statistics
          </h2>
          <p className="mb-4" style={{ color: designTokens.colors.textSecondary }}>
            View the encrypted average commute durations
          </p>

          <button
            onClick={handleDecryptStats}
            disabled={loading}
            className="btn-primary w-full mb-6"
          >
            {loading ? "⏳ Decrypting..." : "Decrypt Statistics"}
          </button>

          {/* Decrypted Results */}
          {(decryptedStats.totalAvg !== null ||
            decryptedStats.morningAvg !== null ||
            decryptedStats.eveningAvg !== null) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: designTokens.colors.background }}
              >
                <div
                  className="text-sm mb-2"
                  style={{ color: designTokens.colors.textSecondary }}
                >
                  Overall Average
                </div>
                <div className="text-3xl font-bold" style={{ color: designTokens.colors.primary[500]}}>
                  {decryptedStats.totalAvg !== null
                    ? `${decryptedStats.totalAvg} min`
                    : "N/A"}
                </div>
              </div>

              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: designTokens.colors.background }}
              >
                <div
                  className="text-sm mb-2"
                  style={{ color: designTokens.colors.textSecondary }}
                >
                  Morning Rush Average
                </div>
                <div className="text-3xl font-bold" style={{ color: designTokens.colors.warning }}>
                  {decryptedStats.morningAvg !== null
                    ? `${decryptedStats.morningAvg} min`
                    : "N/A"}
                </div>
              </div>

              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: designTokens.colors.background }}
              >
                <div
                  className="text-sm mb-2"
                  style={{ color: designTokens.colors.textSecondary }}
                >
                  Evening Rush Average
                </div>
                <div className="text-3xl font-bold" style={{ color: designTokens.colors.info }}>
                  {decryptedStats.eveningAvg !== null
                    ? `${decryptedStats.eveningAvg} min`
                    : "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

