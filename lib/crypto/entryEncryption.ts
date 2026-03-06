/**
 * Entry/Wish-Level Encryption
 *
 * Encrypts and decrypts the sensitive fields of entries and wishes:
 * - title, notes, metadata → encrypted as a single JSON blob
 *
 * Plaintext fields preserved for server queries:
 * - id, planId, taskKey, sortOrder, completionStatus, createdAt, updatedAt
 */

import { decryptString, encryptString } from "./aes";
import type { EncryptedEntryMetadata, EncryptedPayload } from "./types";

/** Fields that get encrypted together as a JSON blob */
interface SensitiveFields<T> {
  title?: string | null;
  notes?: string | null;
  metadata: T;
}

/**
 * Check if an entry/wish has encrypted metadata.
 */
export function isEncryptedEntry(
  entry: { metadata: unknown },
): entry is { metadata: EncryptedEntryMetadata } {
  const meta = entry.metadata as Record<string, unknown>;
  return meta?.isEncrypted === true && meta?.encrypted != null;
}

/**
 * Encrypt the sensitive fields of a create request.
 * Returns a new request object with encrypted metadata replacing the plaintext fields.
 */
export async function encryptForCreate<T>(
  fields: {
    title?: string;
    notes?: string | null;
    metadata: T;
  },
  dek: CryptoKey,
): Promise<{
  title: undefined;
  notes: undefined;
  metadata: EncryptedEntryMetadata;
}> {
  const sensitive: SensitiveFields<T> = {
    title: fields.title,
    notes: fields.notes,
    metadata: fields.metadata,
  };

  const encrypted = await encryptString(JSON.stringify(sensitive), dek);

  return {
    title: undefined,
    notes: undefined,
    metadata: {
      encrypted,
      isEncrypted: true,
    },
  };
}

/**
 * Encrypt the sensitive fields of an update request.
 * Only encrypts fields that are present in the update.
 */
export async function encryptForUpdate<T>(
  fields: {
    title?: string;
    notes?: string | null;
    metadata?: Partial<T>;
  },
  currentMetadata: T | EncryptedEntryMetadata,
  dek: CryptoKey,
): Promise<{
  title: undefined;
  notes: undefined;
  metadata: EncryptedEntryMetadata;
}> {
  // If current metadata is encrypted, decrypt it first to merge updates
  let baseMetadata: T;
  if (
    isEncryptedEntry({ metadata: currentMetadata })
  ) {
    const decrypted = await decryptSensitiveFields(
      (currentMetadata as EncryptedEntryMetadata).encrypted,
      dek,
    );
    baseMetadata = decrypted.metadata as T;
  } else {
    baseMetadata = currentMetadata as T;
  }

  // Merge update into base
  const mergedMetadata = fields.metadata
    ? { ...baseMetadata, ...fields.metadata }
    : baseMetadata;

  const sensitive: SensitiveFields<T> = {
    title: fields.title,
    notes: fields.notes,
    metadata: mergedMetadata as T,
  };

  const encrypted = await encryptString(JSON.stringify(sensitive), dek);

  return {
    title: undefined,
    notes: undefined,
    metadata: {
      encrypted,
      isEncrypted: true,
    },
  };
}

/**
 * Decrypt the sensitive fields from an encrypted entry/wish.
 * Returns the original title, notes, and metadata.
 */
export async function decryptSensitiveFields<T>(
  encrypted: EncryptedPayload,
  dek: CryptoKey,
): Promise<SensitiveFields<T>> {
  const json = await decryptString(encrypted, dek);
  return JSON.parse(json) as SensitiveFields<T>;
}

/**
 * Decrypt an encrypted entry, returning the entry with plaintext fields restored.
 */
export async function decryptEntry<T>(
  entry: {
    metadata: EncryptedEntryMetadata;
    title: string | null;
    notes: string | null;
    [key: string]: unknown;
  },
  dek: CryptoKey,
): Promise<typeof entry & { metadata: T; title: string | null; notes: string | null }> {
  const decrypted = await decryptSensitiveFields<T>(
    entry.metadata.encrypted,
    dek,
  );

  return {
    ...entry,
    title: (decrypted.title as string | null) ?? entry.title,
    notes: (decrypted.notes as string | null) ?? entry.notes,
    metadata: decrypted.metadata,
  };
}
