/**
 * wrapDEKForRecipient - Wrap a DEK for each of a recipient's active device keys
 *
 * Used during trusted contact creation and restoration to atomically
 * pre-share the DEK with all of a recipient's devices.
 */

import type { PublicKeyRecord } from "@/api/keys";

import { importPublicKey, wrapDEK } from "./keys";

export interface WrappedDEKEntry {
  recipientId: string;
  encryptedDek: string;
  keyVersion: number;
}

/**
 * Wraps the given DEK with each of the recipient's active public keys.
 *
 * @param dekCryptoKey  The plan DEK to wrap
 * @param recipientId   The recipient's user ID
 * @param recipientKeys All public key records for the recipient
 * @returns Array of wrapped DEK entries (one per active device key)
 */
export async function wrapDEKForRecipient(
  dekCryptoKey: CryptoKey,
  recipientId: string,
  recipientKeys: PublicKeyRecord[],
): Promise<WrappedDEKEntry[]> {
  const activeKeys = recipientKeys.filter((k) => k.isActive === true);
  const deks: WrappedDEKEntry[] = [];

  for (const key of activeKeys) {
    const pubKey = await importPublicKey(key.publicKey);
    const encryptedDek = await wrapDEK(dekCryptoKey, pubKey);
    deks.push({ recipientId, encryptedDek, keyVersion: key.keyVersion });
  }

  return deks;
}
