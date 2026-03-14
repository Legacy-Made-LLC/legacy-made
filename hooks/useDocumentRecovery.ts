/**
 * useDocumentRecovery - Shared recovery logic for recovery document screens
 *
 * Encapsulates the mnemonic → DEK recovery flow so both QR scan
 * and manual word entry screens can reuse the same logic.
 */

import { useApi } from "@/api";
import { usePlan } from "@/data/PlanProvider";
import { base64ToUint8, uint8ToBase64 } from "@/lib/crypto/aes";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { getDeviceLabel } from "@/lib/crypto/deviceLabel";
import {
  exportPublicKey,
  generateKeyPair,
  importDEK,
  storeDEK,
  storeKeyVersion,
  storePrivateKey,
  storePublicKey,
  wrapDEK,
} from "@/lib/crypto/keys";
import {
  RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
  RECOVERY_DOCUMENT_PBKDF2_SALT,
} from "@/lib/crypto/types";
import { logger } from "@/lib/logger";
import { useAuth } from "@clerk/clerk-expo";
import { mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { useCallback, useState } from "react";
import QuickCrypto from "react-native-quick-crypto";

export function useDocumentRecovery() {
  const { keys } = useApi();
  const { myPlanId: planId } = usePlan();
  const { userId } = useAuth();
  const { completeRecovery } = useCrypto();

  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const recoverFromMnemonic = useCallback(
    async (mnemonicString: string) => {
      if (!planId || !userId) return;

      setIsRecovering(true);
      setError(null);

      try {
        // 1. Validate mnemonic
        if (!validateMnemonic(mnemonicString, wordlist)) {
          throw new Error(
            "Invalid recovery words. Please check that all 12 words are correct.",
          );
        }

        // 2. Get entropy from mnemonic
        const entropy = mnemonicToEntropy(mnemonicString, wordlist);

        // 3. Derive wrapping key from entropy
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
          ["decrypt"],
        );

        // 4. Fetch encrypted DEK blobs from server
        const dekRecords = await keys.listDeks(planId);

        // Find the recovery document DEK
        const mnemonicDek = dekRecords.find((d) => d.dekType === "recovery");
        if (!mnemonicDek) {
          throw new Error(
            "We couldn\u2019t find a matching backup for this recovery document. It may be from a different account, or the backup may no longer be available.",
          );
        }

        // 5. Parse and decrypt the DEK blob
        const blob = JSON.parse(mnemonicDek.encryptedDek) as {
          v: number;
          iv: string;
          data: string;
        };
        const iv = base64ToUint8(blob.iv);
        const encryptedData = base64ToUint8(blob.data);

        let decryptedDEKBytes: ArrayBuffer;
        try {
          decryptedDEKBytes = await QuickCrypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            wrappingKey,
            encryptedData,
          );
        } catch {
          throw new Error(
            "These words don\u2019t seem to match. Please double-check that you\u2019ve entered them exactly as they appear on your recovery document.",
          );
        }

        // 6. Import DEK
        const dekB64 = uint8ToBase64(new Uint8Array(decryptedDEKBytes));
        const dek = await importDEK(dekB64);

        // 7. Generate fresh key pair for this device
        const newKeyPair = await generateKeyPair();
        await storePrivateKey(newKeyPair.privateKey, userId);
        await storePublicKey(newKeyPair.publicKey, userId);
        await storeDEK(dek, userId);

        // 8. Register new public key on server
        const publicKeyB64 = await exportPublicKey(newKeyPair.publicKey);
        const keyRecord = await keys.registerKey({
          publicKey: publicKeyB64,
          deviceLabel: getDeviceLabel("recovered"),
          keyType: "device",
        });
        await storeKeyVersion(keyRecord.keyVersion, userId);

        // 9. Store wrapped DEK for new key
        const wrappedDEK = await wrapDEK(dek, newKeyPair.publicKey);
        await keys.storeDek({
          planId,
          recipientId: keyRecord.userId,
          dekType: "device",
          encryptedDek: wrappedDEK,
          keyVersion: keyRecord.keyVersion,
        });

        // 10. Complete recovery
        await completeRecovery();
        setIsComplete(true);
        logger.info("E2EE: Keys recovered from recovery document");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Recovery failed");
      } finally {
        setIsRecovering(false);
      }
    },
    [planId, userId, keys, completeRecovery],
  );

  return { recoverFromMnemonic, isRecovering, error, setError, isComplete };
}
