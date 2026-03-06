/**
 * AES-256-GCM Encryption/Decryption
 *
 * Uses SubtleCrypto from react-native-quick-crypto for all operations.
 * GCM auth tag is automatically appended to ciphertext by SubtleCrypto.
 */

import QuickCrypto from "react-native-quick-crypto";

import type { EncryptedPayload } from "./types";

const subtle = QuickCrypto.subtle;

/** IV size for AES-GCM (12 bytes recommended by NIST) */
const IV_LENGTH = 12;

/**
 * Encrypt a string with AES-256-GCM.
 * Returns an EncryptedPayload with base64-encoded ciphertext and IV.
 */
export async function encryptString(
  plaintext: string,
  dekCryptoKey: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = QuickCrypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    dekCryptoKey,
    encoded,
  );

  return {
    ct: uint8ToBase64(new Uint8Array(ciphertext)),
    iv: uint8ToBase64(iv),
    v: 1,
  };
}

/**
 * Decrypt an EncryptedPayload back to a string.
 */
export async function decryptString(
  payload: EncryptedPayload,
  dekCryptoKey: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToUint8(payload.ct);
  const iv = base64ToUint8(payload.iv);

  const decrypted = await subtle.decrypt(
    { name: "AES-GCM", iv },
    dekCryptoKey,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt an ArrayBuffer with AES-256-GCM.
 * Returns the encrypted data and the IV used.
 */
export async function encryptBuffer(
  data: ArrayBuffer,
  dekCryptoKey: CryptoKey,
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const iv = QuickCrypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await subtle.encrypt(
    { name: "AES-GCM", iv },
    dekCryptoKey,
    data,
  );

  return { encrypted, iv };
}

/**
 * Decrypt an ArrayBuffer with AES-256-GCM.
 */
export async function decryptBuffer(
  encrypted: ArrayBuffer,
  dekCryptoKey: CryptoKey,
  iv: Uint8Array,
): Promise<ArrayBuffer> {
  return subtle.decrypt({ name: "AES-GCM", iv }, dekCryptoKey, encrypted);
}

// ============================================================================
// Base64 Helpers
// ============================================================================

/** Convert Uint8Array to base64 string */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert base64 string to Uint8Array */
export function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
