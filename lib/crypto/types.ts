/**
 * E2EE Types
 *
 * Core types for end-to-end encryption payloads, metadata, and key backup status.
 */

/** Encrypted payload — what the server stores for each encrypted field */
export interface EncryptedPayload {
  /** Base64 ciphertext (includes GCM auth tag appended by SubtleCrypto) */
  ct: string;
  /** Base64 12-byte IV */
  iv: string;
  /** Encryption version for future algorithm changes */
  v: 1;
}

/** Server-side encrypted metadata shape — replaces plaintext metadata on entries/wishes */
export interface EncryptedEntryMetadata {
  encrypted: EncryptedPayload;
  isEncrypted: true;
}

/** Key backup status tracking which methods the user has configured */
export interface KeyBackupStatus {
  escrow: boolean;
  keyFile: boolean;
  recoveryPhrase: boolean;
}

/** Algorithm identifiers for the user_keys table */
export const ALGORITHM_ID = "rsa-oaep-2048+aes-256-gcm" as const;
