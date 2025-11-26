/**
 * Dynamic loader for Relayer SDK
 * Handles CDN injection and fallback to npm package
 */

import { FHEVM_CONSTANTS } from "./constants";

export class RelayerSDKLoader {
  private loaded: boolean = false;

  /**
   * Check if SDK is already loaded on window
   */
  isLoaded(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window as any)[FHEVM_CONSTANTS.RELAYER_SDK_WINDOW_KEY];
  }

  /**
   * Load SDK from CDN (v0.3.0-5 UMD format)
   */
  async loadFromCDN(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = FHEVM_CONSTANTS.RELAYER_SDK_CDN;
      // Use text/javascript for UMD format (not module)
      script.type = "text/javascript";
      script.crossOrigin = "anonymous";

      script.onload = () => {
        console.log("✅ Relayer SDK (v0.3.0-5 UMD) loaded from CDN");
        this.loaded = true;
        resolve(true);
      };

      script.onerror = () => {
        console.warn("⚠️ Failed to load Relayer SDK from CDN");
        // Try local fallback
        const localScript = document.createElement("script");
        localScript.src = FHEVM_CONSTANTS.RELAYER_SDK_LOCAL;
        localScript.type = "text/javascript";
        
        localScript.onload = () => {
          console.log("✅ Relayer SDK loaded from local copy");
          this.loaded = true;
          resolve(true);
        };
        
        localScript.onerror = () => {
          console.warn("⚠️ Failed to load local Relayer SDK, will try npm package");
          resolve(false);
        };
        
        document.head.appendChild(localScript);
      };

      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.loaded) {
          resolve(false);
        }
      }, 10000);
    });
  }

  /**
   * Load SDK from npm package
   */
  async loadFromNPM(): Promise<any> {
    console.log("Loading Relayer SDK from npm package...");
    // @ts-ignore - Dynamic import for browser-only SDK
    const sdk = await import("@zama-fhe/relayer-sdk/web");
    (window as any)[FHEVM_CONSTANTS.RELAYER_SDK_WINDOW_KEY] = sdk;
    this.loaded = true;
    console.log("✅ Relayer SDK loaded from npm");
    return sdk;
  }

  /**
   * Load SDK (try CDN first, fallback to npm)
   */
  async load(): Promise<any> {
    if (this.isLoaded()) {
      console.log("✅ Relayer SDK already loaded");
      return (window as any)[FHEVM_CONSTANTS.RELAYER_SDK_WINDOW_KEY];
    }

    // Try CDN first
    const cdnSuccess = await this.loadFromCDN();
    if (cdnSuccess && this.isLoaded()) {
      return (window as any)[FHEVM_CONSTANTS.RELAYER_SDK_WINDOW_KEY];
    }

    // Fallback to npm
    return await this.loadFromNPM();
  }
}

export const relayerSDKLoader = new RelayerSDKLoader();

