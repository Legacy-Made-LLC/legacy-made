/**
 * Key Management
 *
 * Handles RSA-OAEP-2048 key pair generation, AES-256-GCM DEK generation,
 * key import/export, SecureStore persistence, and DEK wrapping/unwrapping.
 */

import * as SecureStore from "expo-secure-store";
import QuickCrypto from "react-native-quick-crypto";

import { base64ToUint8, uint8ToBase64 } from "./aes";

const subtle = QuickCrypto.subtle;

// SecureStore keys
const PRIVATE_KEY_STORE_KEY = "e2ee_private_key";
const DEK_STORE_KEY = "e2ee_dek";
const KEY_ID_STORE_KEY = "e2ee_key_id";

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generate an RSA-OAEP-2048 key pair for DEK wrapping.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generate an AES-256-GCM Data Encryption Key (DEK).
 */
export async function generateDEK(): Promise<CryptoKey> {
  return subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

// ============================================================================
// Key Export/Import
// ============================================================================

/**
 * Export private key to base64-encoded PKCS8 DER.
 * RSA-2048 PKCS8 DER ~ 1218 bytes -> base64 ~ 1624 chars (within SecureStore 2048 limit).
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("pkcs8", key);
  return uint8ToBase64(new Uint8Array(exported));
}

/**
 * Import a private key from base64-encoded PKCS8 DER.
 */
export async function importPrivateKey(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  return subtle.importKey(
    "pkcs8",
    keyData.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );
}

/**
 * Export public key to base64-encoded SPKI DER.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("spki", key);
  return uint8ToBase64(new Uint8Array(exported));
}

/**
 * Import a public key from base64-encoded SPKI DER.
 */
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  return subtle.importKey(
    "spki",
    keyData.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
}

/**
 * Export DEK to base64-encoded raw bytes (44 chars for 32-byte key).
 */
export async function exportDEK(key: CryptoKey): Promise<string> {
  const exported = await subtle.exportKey("raw", key);
  return uint8ToBase64(new Uint8Array(exported));
}

/**
 * Import DEK from base64-encoded raw bytes.
 */
export async function importDEK(b64: string): Promise<CryptoKey> {
  const keyData = base64ToUint8(b64);
  return subtle.importKey("raw", keyData.buffer, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

// ============================================================================
// SecureStore Persistence
// ============================================================================

/**
 * Store private key in SecureStore.
 */
export async function storePrivateKey(key: CryptoKey): Promise<void> {
  const b64 = await exportPrivateKey(key);
  await SecureStore.setItemAsync(PRIVATE_KEY_STORE_KEY, b64, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Retrieve private key from SecureStore.
 */
export async function getPrivateKey(): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);
  if (!b64) return null;
  return importPrivateKey(b64);
}

/**
 * Store DEK in SecureStore.
 */
export async function storeDEK(key: CryptoKey): Promise<void> {
  const b64 = await exportDEK(key);
  await SecureStore.setItemAsync(DEK_STORE_KEY, b64, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

/**
 * Retrieve DEK from SecureStore.
 */
export async function getDEK(): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(DEK_STORE_KEY);
  if (!b64) return null;
  return importDEK(b64);
}

/**
 * Store key ID in SecureStore.
 */
export async function storeKeyId(keyId: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_ID_STORE_KEY, keyId);
}

/**
 * Retrieve key ID from SecureStore.
 */
export async function getKeyId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_ID_STORE_KEY);
}

/**
 * Check if encryption keys exist in SecureStore.
 */
export async function hasEncryptionKeys(): Promise<boolean> {
  const [privateKey, dek] = await Promise.all([
    SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY),
    SecureStore.getItemAsync(DEK_STORE_KEY),
  ]);
  return privateKey !== null && dek !== null;
}

/**
 * Clear all encryption keys from SecureStore.
 */
export async function clearEncryptionKeys(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(PRIVATE_KEY_STORE_KEY),
    SecureStore.deleteItemAsync(DEK_STORE_KEY),
    SecureStore.deleteItemAsync(KEY_ID_STORE_KEY),
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
  const rawDEK = await subtle.exportKey("raw", dek);
  const encrypted = await subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
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
    privateKey,
    ciphertext,
  );
  return subtle.importKey("raw", rawDEK, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}
