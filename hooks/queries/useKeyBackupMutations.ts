/**
 * Key Backup Mutations
 *
 * TanStack Query mutations for key backup management (escrow + recovery document).
 * Follows the crypto mutation pattern: no optimistic updates, onSuccess invalidation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import { base64ToUint8, uint8ToBase64 } from "@/lib/crypto/aes";
import { exportDEK, getDEK, getKeyVersion } from "@/lib/crypto/keys";
import type { KeysService } from "@/api/keys";
import {
  RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
  RECOVERY_DOCUMENT_PBKDF2_SALT,
} from "@/lib/crypto/types";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { entropyToMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import QuickCrypto from "react-native-quick-crypto";

// ============================================================================
// Recovery document mutations
// ============================================================================

/**
 * Generate (or replace) a recovery document.
 *
 * Generates a 12-word BIP-39 mnemonic, derives a wrapping key from entropy,
 * encrypts the DEK, and stores the encrypted blob on the server via rotateDek
 * (atomic replace of any existing recovery DEK).
 *
 * Returns the 12 words so the screen can display them and generate a PDF.
 */
export function useGenerateRecoveryDocumentMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({
      planId,
      userId,
    }: {
      planId: string;
      userId: string;
    }) => {
      // 1. Generate 16 bytes of random entropy (128 bits → 12 words)
      const entropy = QuickCrypto.getRandomValues(
        new Uint8Array(16),
      ) as Uint8Array;

      // 2. Convert to 12-word mnemonic
      const mnemonic = entropyToMnemonic(entropy, wordlist);
      const words = mnemonic.split(" ");

      // 3. Derive wrapping key from entropy via PBKDF2
      const salt = new TextEncoder().encode(RECOVERY_DOCUMENT_PBKDF2_SALT);
      const derivedKey = QuickCrypto.pbkdf2Sync(
        entropy,
        salt,
        RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
        32,
        "sha256",
      );

      const wrappingKey = await QuickCrypto.subtle.importKey(
        "raw",
        derivedKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );

      // 4. Export current DEK
      const dek = await getDEK(userId);
      if (!dek) throw new Error("No encryption key found");
      const dekB64 = await exportDEK(dek);
      const dekBytes = base64ToUint8(dekB64);

      // 5. Encrypt DEK with wrapping key
      const iv = QuickCrypto.getRandomValues(
        new Uint8Array(12),
      ) as Uint8Array;
      const encryptedDEK = await QuickCrypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        dekBytes,
      );

      // 6. Store encrypted blob on server (atomic create/replace)
      const blob = JSON.stringify({
        v: 1,
        iv: uint8ToBase64(iv),
        data: uint8ToBase64(new Uint8Array(encryptedDEK)),
        salt: uint8ToBase64(salt),
        kdf: "pbkdf2",
        iterations: RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
      });

      const currentKeyVersion = await getKeyVersion(userId);
      if (!currentKeyVersion) throw new Error("No key version found");

      await keys.rotateDek({
        planId,
        newDeks: [
          {
            recipientId: userId,
            dekType: "recovery",
            encryptedDek: blob,
            keyVersion: currentKeyVersion,
          },
        ],
      });

      return { words };
    },
    onSuccess: (_data, { planId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.backupStatus(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.recoveryEvents(),
      });
    },
    onError: (err) => {
      logger.error("E2EE: Failed to generate recovery document", err);
    },
  });
}

/**
 * Permanently disable an existing recovery document.
 * Deletes recovery DEK records so the old document's words no longer work.
 */
export function useDisableRecoveryDocumentMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      await keys.deleteDek(planId, "recovery");
    },
    onSuccess: (_data, { planId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.backupStatus(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.recoveryEvents(),
      });
    },
    onError: (err) => {
      logger.error("E2EE: Failed to disable recovery document", err);
    },
  });
}

// ============================================================================
// Escrow mutations
// ============================================================================

/**
 * Encrypt the DEK with the escrow RSA public key (RSA-OAEP, SHA-256).
 * The server never sees the plaintext DEK during enrollment.
 */
async function encryptDekForEscrow(
  dekB64: string,
  keysService: KeysService,
): Promise<string> {
  // 1. Fetch the escrow RSA public key (SPKI/DER, base64)
  const { publicKey: publicKeyBase64 } =
    await keysService.getEscrowPublicKey();

  // 2. Import as RSA-OAEP public key
  const keyData = base64ToUint8(publicKeyBase64);
  const publicKey = await QuickCrypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  // 3. Encrypt the DEK
  const dekBytes = base64ToUint8(dekB64);
  const ciphertext = await QuickCrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    dekBytes,
  );

  return uint8ToBase64(new Uint8Array(ciphertext));
}

/**
 * Enable KMS escrow for a plan.
 * Encrypts the DEK client-side with the escrow RSA public key,
 * then sends the ciphertext to the server. Server never sees the plaintext.
 */
export function useEnableEscrowMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({
      planId,
      userId,
    }: {
      planId: string;
      userId: string;
    }) => {
      const dek = await getDEK(userId);
      if (!dek) throw new Error("No encryption key found");
      const dekB64 = await exportDEK(dek);

      // Encrypt DEK with escrow public key before sending
      const encryptedDek = await encryptDekForEscrow(dekB64, keys);

      await keys.enableEscrow({ planId, encryptedDek });
    },
    onSuccess: (_data, { planId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.backupStatus(planId),
      });
    },
    onError: (err) => {
      logger.error("E2EE: Failed to enable escrow recovery", err);
    },
  });
}

/**
 * Revoke KMS escrow for a plan.
 * Server deletes the escrowed DEK.
 */
export function useRevokeEscrowMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      await keys.revokeEscrow(planId);
    },
    onSuccess: (_data, { planId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.backupStatus(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.recoveryEvents(),
      });
    },
    onError: (err) => {
      logger.error("E2EE: Failed to revoke escrow recovery", err);
    },
  });
}
