/**
 * File Encryption
 *
 * Encrypts/decrypts file data for R2 storage.
 * Format: [12-byte IV][ciphertext + GCM auth tag]
 *
 * The 12-byte IV is prepended as a header so the decryptor knows what IV was used.
 * SubtleCrypto automatically appends the 16-byte GCM auth tag to the ciphertext.
 */

import { decryptBuffer, encryptBuffer } from "./aes";

/** IV header size in the encrypted file format */
const IV_HEADER_LENGTH = 12;

/**
 * Encrypt file data for upload to R2.
 * Returns a single ArrayBuffer: [12-byte IV][ciphertext + GCM tag]
 */
export async function encryptFileForUpload(
  fileData: ArrayBuffer,
  dekCryptoKey: CryptoKey,
): Promise<ArrayBuffer> {
  const { encrypted, iv } = await encryptBuffer(fileData, dekCryptoKey);

  // Combine IV header + encrypted data into a single buffer
  const combined = new Uint8Array(IV_HEADER_LENGTH + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), IV_HEADER_LENGTH);

  return combined.buffer;
}

/**
 * Decrypt file data downloaded from R2.
 * Expects format: [12-byte IV][ciphertext + GCM tag]
 */
export async function decryptDownloadedFile(
  encryptedData: ArrayBuffer,
  dekCryptoKey: CryptoKey,
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encryptedData);

  // Extract IV header
  const iv = data.slice(0, IV_HEADER_LENGTH);

  // Extract ciphertext (includes GCM auth tag)
  const ciphertext = data.slice(IV_HEADER_LENGTH);

  return decryptBuffer(ciphertext.buffer, dekCryptoKey, iv);
}
