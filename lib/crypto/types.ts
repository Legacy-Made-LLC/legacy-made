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
  escrow: { configured: boolean; createdAt: string | null; removedAt: string | null };
  recoveryPhrase: { configured: boolean; createdAt: string | null; removedAt: string | null };
}

/** Algorithm identifiers for the user_keys table */
export const ALGORITHM_ID = "rsa-oaep-2048+aes-256-gcm" as const;

/**
 * Fixed salt for PBKDF2 key derivation in recovery documents.
 *
 * A fixed, application-specific salt is acceptable here because:
 * - Each recovery document starts with 128 bits of fresh random entropy (the
 *   BIP-39 mnemonic source), so the PBKDF2 input is already unique per user.
 * - The salt's purpose is to domain-separate this derivation from other uses of
 *   the same entropy, not to add per-user uniqueness (the entropy handles that).
 * - A per-user random salt would need to be stored alongside the encrypted DEK
 *   blob, adding complexity without meaningful security gain given the high
 *   entropy input.
 *
 * Must stay in sync across backup generation and recovery flows. Changing this
 * value would invalidate all existing recovery documents.
 */
export const RECOVERY_DOCUMENT_PBKDF2_SALT = "legacy-made-recovery-document-v1" as const;

/** PBKDF2 iteration count for recovery document key derivation */
export const RECOVERY_DOCUMENT_PBKDF2_ITERATIONS = 100_000;
