"use client";

import { useState, useCallback } from "react";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

/**
 * In-memory storage implementation for FHEVM signatures
 * Uses Map for fast lookup and persistence via localStorage
 */
export function useInMemoryStorage() {
  const [storageMap] = useState<Map<string, string>>(new Map());

  const storage: GenericStringStorage = {
    getItem: useCallback(
      async (key: string): Promise<string | null> => {
        // Try memory first
        if (storageMap.has(key)) {
          return storageMap.get(key) || null;
        }

        // Fallback to localStorage
        if (typeof window !== "undefined") {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              storageMap.set(key, value);
              return value;
            }
          } catch (error) {
            console.error("Failed to read from localStorage:", error);
          }
        }

        return null;
      },
      [storageMap]
    ),

    setItem: useCallback(
      async (key: string, value: string): Promise<void> => {
        storageMap.set(key, value);

        // Persist to localStorage
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error("Failed to write to localStorage:", error);
          }
        }
      },
      [storageMap]
    ),

    removeItem: useCallback(
      async (key: string): Promise<void> => {
        storageMap.delete(key);

        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error("Failed to remove from localStorage:", error);
          }
        }
      },
      [storageMap]
    ),
  };

  return { storage };
}

