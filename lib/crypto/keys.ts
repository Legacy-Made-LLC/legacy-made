/**
 * Key Management
 *
 * Handles RSA-OAEP-2048 key pair generation, AES-256-GCM DEK generation,
 * key import/export, SecureStore persistence, and DEK wrapping/unwrapping.
 */

import * as SecureStore from "expo-secure-store";
import type { CryptoKey as QCCryptoKey } from "react-native-quick-crypto";
import QuickCrypto from "react-native-quick-crypto";

import { base64ToUint8, uint8ToBase64 } from "./aes";

const subtle = QuickCrypto.subtle;

/**
 * Cast a standard CryptoKey to the react-native-quick-crypto CryptoKey type.
 * The two types are structurally compatible at runtime but TypeScript sees them
 * as distinct because quick-crypto adds extra internal properties.
 */
function toQC(key: CryptoKey): QCCryptoKey {
  return key as unknown as QCCryptoKey;
}

/**
 * Cast a react-native-quick-crypto CryptoKey back to the standard CryptoKey type.
 */
function fromQC(key: QCCryptoKey): CryptoKey {
  return key as unknown as CryptoKey;
}

// SecureStore key prefixes (scoped per user to prevent cross-account key leakage)
const PRIVATE_KEY_PREFIX = "e2ee_private_key";
const PUBLIC_KEY_PREFIX = "e2ee_public_key";
const DEK_PREFIX = "e2ee_dek";
const KEY_ID_PREFIX = "e2ee_key_id";
const KEY_VERSION_PREFIX = "e2ee_key_version";

/** Build a user-scoped SecureStore key */
function scopedKey(prefix: string, userId: string): string {
  return `${prefix}_${userId}`;
}

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generate an RSA-OAEP-2048 key pair for DEK wrapping.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  const pair = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  // quick-crypto returns CryptoKeyPair; cast to standard types
  const kp = pair as { privateKey: QCCryptoKey; publicKey: QCCryptoKey };
  return {
    privateKey: fromQC(kp.privateKey),
    publicKey: fromQC(kp.publicKey),
  };
}

/**
 * Generate an AES-256-GCM Data Encryption Key (DEK).
 */
export async function generateDEK(): Promise<CryptoKey> {
  const key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  return fromQC(key as QCCryptoKey);
}

// ============================================================================
// Key Export/Import
// ============================================================================

/**
 * Export private key to base64-encoded PKCS8 DER.
 * RSA-2048 PKCS8 DER ~ 1218 bytes -> base64 ~ 1624 chars (within SecureStore 2048 limit).
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("pkcs8", toQC(key));
  return uint8ToBase64(new Uint8Array(exported as ArrayBuffer));
}

/**
 * Import a private key from base64-encoded PKCS8 DER.
 */
export async function importPrivateKey(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  const key = await subtle.importKey(
    "pkcs8",
    keyData.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );
  return fromQC(key);
}

/**
 * Export public key to base64-encoded SPKI DER.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("spki", toQC(key));
  return uint8ToBase64(new Uint8Array(exported as ArrayBuffer));
}

/**
 * Import a public key from base64-encoded SPKI DER.
 */
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  const key = await subtle.importKey(
    "spki",
    keyData.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
  return fromQC(key);
}

/**
 * Export DEK to base64-encoded raw bytes (44 chars for 32-byte key).
 */
export async function exportDEK(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("raw", toQC(key));
  return uint8ToBase64(new Uint8Array(exported as ArrayBuffer));
}

/**
 * Import DEK from base64-encoded raw bytes.
 */
export async function importDEK(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  const key = await subtle.importKey(
    "raw",
    keyData.buffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  );
  return fromQC(key);
}

// ============================================================================
// SecureStore Persistence
// ============================================================================

/**
 * Store private key in SecureStore.
 */
export async function storePrivateKey(
  key: CryptoKey,
  userId: string,
): Promise<void> {
  const b64 = await exportPrivateKey(key);
  await SecureStore.setItemAsync(scopedKey(PRIVATE_KEY_PREFIX, userId), b64, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Retrieve private key from SecureStore.
 */
export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(
    scopedKey(PRIVATE_KEY_PREFIX, userId),
  );
  if (!b64) return null;
  return importPrivateKey(b64);
}

/**
 * Store public key in SecureStore (for setup retry after failed initial upload).
 */
export async function storePublicKey(
  key: CryptoKey,
  userId: string,
): Promise<void> {
  const b64 = await exportPublicKey(key);
  await SecureStore.setItemAsync(scopedKey(PUBLIC_KEY_PREFIX, userId), b64, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Retrieve public key from SecureStore.
 */
export async function getPublicKey(userId: string): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(
    scopedKey(PUBLIC_KEY_PREFIX, userId),
  );
  if (!b64) return null;
  return importPublicKey(b64);
}

/**
 * Store DEK in SecureStore.
 */
export async function storeDEK(key: CryptoKey, userId: string): Promise<void> {
  const b64 = await exportDEK(key);
  await SecureStore.setItemAsync(scopedKey(DEK_PREFIX, userId), b64, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Retrieve DEK from SecureStore.
 */
export async function getDEK(userId: string): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(scopedKey(DEK_PREFIX, userId));
  if (!b64) return null;
  return importDEK(b64);
}

/**
 * Store key ID in SecureStore.
 */
export async function storeKeyId(keyId: string, userId: string): Promise<void> {
  await SecureStore.setItemAsync(scopedKey(KEY_ID_PREFIX, userId), keyId);
}

/**
 * Retrieve key ID from SecureStore.
 */
export async function getKeyId(userId: string): Promise<string | null> {
  return SecureStore.getItemAsync(scopedKey(KEY_ID_PREFIX, userId));
}

/**
 * Store the server-assigned key version in SecureStore.
 */
export async function storeKeyVersion(
  version: number,
  userId: string,
): Promise<void> {
  await SecureStore.setItemAsync(
    scopedKey(KEY_VERSION_PREFIX, userId),
    String(version),
  );
}

/**
 * Retrieve key version from SecureStore.
 */
export async function getKeyVersion(userId: string): Promise<number | null> {
  const val = await SecureStore.getItemAsync(
    scopedKey(KEY_VERSION_PREFIX, userId),
  );
  return val ? parseInt(val, 10) : null;
}

/**
 * Check if encryption keys exist in SecureStore.
 */
export async function hasEncryptionKeys(userId: string): Promise<boolean> {
  const [privateKey, dek] = await Promise.all([
    SecureStore.getItemAsync(scopedKey(PRIVATE_KEY_PREFIX, userId)),
    SecureStore.getItemAsync(scopedKey(DEK_PREFIX, userId)),
  ]);

  return privateKey !== null && dek !== null;
}

/**
 * Clear all encryption keys from SecureStore.
 */
export async function clearEncryptionKeys(userId: string): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(scopedKey(PRIVATE_KEY_PREFIX, userId)),
    SecureStore.deleteItemAsync(scopedKey(PUBLIC_KEY_PREFIX, userId)),
    SecureStore.deleteItemAsync(scopedKey(DEK_PREFIX, userId)),
    SecureStore.deleteItemAsync(scopedKey(KEY_ID_PREFIX, userId)),
    SecureStore.deleteItemAsync(scopedKey(KEY_VERSION_PREFIX, userId)),
  ]);
}

// ============================================================================
// DEK Wrapping (RSA-OAEP) — matches security doc T5
// ============================================================================

/**
 * Wrap (encrypt) a DEK with a recipient's RSA-OAEP public key.
 * Returns base64-encoded ciphertext (~344 chars for 256-byte RSA output).
 */
export async function wrapDEK(
  dek: CryptoKey,
  recipientPublicKey: CryptoKey,
): Promise<string> {
  const rawDEK = (await subtle.exportKey("raw", toQC(dek))) as ArrayBuffer;
  const encrypted = await subtle.encrypt(
    { name: "RSA-OAEP" },
    toQC(recipientPublicKey),
    rawDEK,
  );
  return uint8ToBase64(new Uint8Array(encrypted));
}

/**
 * Unwrap (decrypt) a DEK using the private key.
 * Returns a CryptoKey ready for AES-GCM operations.
 */
export async function unwrapDEK(
  wrappedDEK: string,
  privateKey: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = base64ToUint8(wrappedDEK);
  const rawDEK = await subtle.decrypt(
    { name: "RSA-OAEP" },
    toQC(privateKey),
    ciphertext,
  );
  const key = await subtle.importKey("raw", rawDEK, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
  return fromQC(key);
}
