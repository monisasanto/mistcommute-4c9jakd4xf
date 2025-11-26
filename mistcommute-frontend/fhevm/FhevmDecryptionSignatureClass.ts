/**
 * FHEVM Decryption Signature Management
 * Handles creation, storage, and retrieval of decryption signatures
 */

import { ethers } from "ethers";
import type {
  EIP712Type,
  FhevmDecryptionSignatureType,
  FhevmInstance,
} from "./fhevmTypes";
import type { GenericStringStorage } from "./GenericStringStorage";

function timestampNow(): number {
  return Math.floor(Date.now() / 1000);
}

class FhevmDecryptionSignatureStorageKey {
  private contractAddresses: string[];
  private userAddress: string;
  private publicKey: string | undefined;
  private storageKey: string;

  constructor(
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ) {
    if (!ethers.isAddress(userAddress)) {
      throw new TypeError(`Invalid address ${userAddress}`);
    }

    const sortedContractAddresses = [...contractAddresses].sort();

    const emptyEIP712 = instance.createEIP712(
      publicKey ?? ethers.ZeroAddress,
      sortedContractAddresses,
      0,
      0
    );

    try {
      const hash = ethers.TypedDataEncoder.hash(
        emptyEIP712.domain,
        { UserDecryptRequestVerification: emptyEIP712.types.UserDecryptRequestVerification },
        emptyEIP712.message
      );

      this.contractAddresses = sortedContractAddresses;
      this.userAddress = userAddress;
      this.publicKey = publicKey;
      this.storageKey = `${userAddress}:${hash}`;
    } catch (e) {
      console.error("Failed to create storage key:", e);
      throw e;
    }
  }

  get key(): string {
    return this.storageKey;
  }
}

export class FhevmDecryptionSignature {
  private _publicKey: string;
  private _privateKey: string;
  private _signature: string;
  private _startTimestamp: number;
  private _durationDays: number;
  private _userAddress: string;
  private _contractAddresses: string[];
  private _eip712: EIP712Type;

  private constructor(parameters: FhevmDecryptionSignatureType) {
    if (!FhevmDecryptionSignature.checkIs(parameters)) {
      throw new TypeError("Invalid FhevmDecryptionSignatureType");
    }
    this._publicKey = parameters.publicKey;
    this._privateKey = parameters.privateKey;
    this._signature = parameters.signature;
    this._startTimestamp = parameters.startTimestamp;
    this._durationDays = parameters.durationDays;
    this._userAddress = parameters.userAddress;
    this._contractAddresses = parameters.contractAddresses;
    this._eip712 = parameters.eip712;
  }

  get privateKey() { return this._privateKey; }
  get publicKey() { return this._publicKey; }
  get signature() { return this._signature; }
  get contractAddresses() { return this._contractAddresses; }
  get startTimestamp() { return this._startTimestamp; }
  get durationDays() { return this._durationDays; }
  get userAddress() { return this._userAddress; }

  static checkIs(s: unknown): s is FhevmDecryptionSignatureType {
    if (!s || typeof s !== "object") return false;
    if (!("publicKey" in s && typeof s.publicKey === "string")) return false;
    if (!("privateKey" in s && typeof s.privateKey === "string")) return false;
    if (!("signature" in s && typeof s.signature === "string")) return false;
    if (!("startTimestamp" in s && typeof s.startTimestamp === "number")) return false;
    if (!("durationDays" in s && typeof s.durationDays === "number")) return false;
    if (!("contractAddresses" in s && Array.isArray(s.contractAddresses))) return false;
    if (!("userAddress" in s && typeof s.userAddress === "string")) return false;
    if (!("eip712" in s && typeof s.eip712 === "object" && s.eip712 !== null)) return false;
    return true;
  }

  toJSON() {
    return {
      publicKey: this._publicKey,
      privateKey: this._privateKey,
      signature: this._signature,
      startTimestamp: this._startTimestamp,
      durationDays: this._durationDays,
      userAddress: this._userAddress,
      contractAddresses: this._contractAddresses,
      eip712: this._eip712,
    };
  }

  static fromJSON(json: unknown) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    return new FhevmDecryptionSignature(data);
  }

  isValid(): boolean {
    return timestampNow() < this._startTimestamp + this._durationDays * 24 * 60 * 60;
  }

  async saveToStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    withPublicKey: boolean
  ) {
    try {
      const value = JSON.stringify(this);
      const storageKey = new FhevmDecryptionSignatureStorageKey(
        instance,
        this._contractAddresses,
        this._userAddress,
        withPublicKey ? this._publicKey : undefined
      );
      await storage.setItem(storageKey.key, value);
      console.log(`✅ Signature saved for ${this._contractAddresses.length} contract(s)`);
    } catch (error) {
      console.error("Failed to save signature:", error);
    }
  }

  static async loadFromStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const storageKey = new FhevmDecryptionSignatureStorageKey(
        instance,
        contractAddresses,
        userAddress,
        publicKey
      );

      const result = await storage.getItem(storageKey.key);
      if (!result) {
        console.warn(`No cached signature found`);
        return null;
      }

      const sig = FhevmDecryptionSignature.fromJSON(result);
      if (!sig.isValid()) {
        console.warn("Cached signature expired");
        return null;
      }

      return sig;
    } catch (error) {
      console.error("Failed to load signature:", error);
      return null;
    }
  }

  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = await signer.getAddress();
      const startTimestamp = timestampNow();
      const durationDays = 365;

      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses,
        startTimestamp,
        durationDays,
        signature,
        eip712,
        userAddress,
      });
    } catch (error) {
      console.error("Failed to create new signature:", error);
      return null;
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress();

    // Try to load cached signature
    const cached = await FhevmDecryptionSignature.loadFromStorage(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey
    );

    if (cached) {
      console.log("✅ Using cached decryption signature");
      return cached;
    }

    // Generate new signature
    console.log("🔑 Generating new decryption signature...");
    const { publicKey, privateKey } = keyPair ?? instance.generateKeypair();

    const sig = await FhevmDecryptionSignature.new(
      instance,
      contractAddresses,
      publicKey,
      privateKey,
      signer
    );

    if (!sig) return null;

    await sig.saveToStorage(storage, instance, Boolean(keyPair?.publicKey));
    return sig;
  }
}

