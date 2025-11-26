"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignatureClass";
import { useInMemoryStorage } from "./useInMemoryStorage";

interface CommuteData {
  departure: number;
  arrival: number;
  duration: number;
  routeName: string;
  commuteType: number;
  timestamp: number;
}

interface DecryptedCommute extends CommuteData {
  commuteId: number;
}

/**
 * Hook to decrypt commute data
 */
export function useCommuteDecryption(
  contract: ethers.Contract | null,
  contractAddress: string | null,
  account: string | undefined,
  provider: ethers.BrowserProvider | null
) {
  const { instance: fhevmInstance } = useFhevm();
  const { storage } = useInMemoryStorage();
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decryptCommute = useCallback(
    async (commuteId: number): Promise<DecryptedCommute | null> => {
      if (!contract || !fhevmInstance || !account || !contractAddress || !provider) {
        setError("Contract or FHEVM not ready");
        return null;
      }

      setDecrypting(true);
      setError(null);

      try {
        // Get encrypted commute data from contract
        const commuteData = await contract.getUserCommuteDetails(commuteId);

        const [
          departureHandle,
          arrivalHandle,
          durationHandle,
          routeName,
          commuteType,
          timestamp,
        ] = commuteData;

        // Get signer
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

        // Decrypt handles
        const handles = [
          { handle: departureHandle, contractAddress },
          { handle: arrivalHandle, contractAddress },
          { handle: durationHandle, contractAddress },
        ];

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

        return {
          commuteId,
          departure: Number(decryptedResults[departureHandle]),
          arrival: Number(decryptedResults[arrivalHandle]),
          duration: Number(decryptedResults[durationHandle]),
          routeName,
          commuteType: Number(commuteType),
          timestamp: Number(timestamp),
        };
      } catch (err: any) {
        console.error("Decryption failed:", err);
        setError(err.message || "Decryption failed");
        return null;
      } finally {
        setDecrypting(false);
      }
    },
    [contract, fhevmInstance, account, contractAddress, provider, storage]
  );

  const decryptMultiple = useCallback(
    async (commuteIds: number[]): Promise<DecryptedCommute[]> => {
      const results: DecryptedCommute[] = [];

      for (const id of commuteIds) {
        const decrypted = await decryptCommute(id);
        if (decrypted) {
          results.push(decrypted);
        }
      }

      return results;
    },
    [decryptCommute]
  );

  return {
    decryptCommute,
    decryptMultiple,
    decrypting,
    error,
  };
}

