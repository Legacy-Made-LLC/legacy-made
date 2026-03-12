/**
 * useShareDEK - Share encryption key with a trusted contact
 *
 * When a trusted contact accepts an invitation, the plan owner
 * wraps their DEK with each of the contact's device public keys
 * (RSA-OAEP) and stores the wrapped keys on the server.
 * The contact can then unwrap with their private key on any device.
 */

import { useApi } from "@/api";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { importPublicKey, wrapDEK } from "@/lib/crypto/keys";
import { logger } from "@/lib/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to share the plan owner's DEK with a trusted contact.
 *
 * Flow:
 * 1. Fetch ALL of the contact's public keys (multiple devices)
 * 2. Wrap the plan DEK with each public key (RSA-OAEP)
 * 3. Store each wrapped DEK copy on the server
 */
export function useShareDEK() {
  const { keys } = useApi();
  const { dekCryptoKey } = useCrypto();
  const { planId } = usePlan();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientUserId }: { recipientUserId: string }) => {
      if (!dekCryptoKey) {
        throw new Error("Encryption keys not ready");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      // 1. Get ALL of the recipient's public keys (one per device)
      const recipientKeys = await keys.getPublicKeys(recipientUserId);

      if (recipientKeys.length === 0) {
        throw new Error("Recipient has no registered encryption keys");
      }

      // 2. Wrap DEK for each device key and store on server
      for (const key of recipientKeys) {
        const recipientPubKey = await importPublicKey(key.publicKey);
        const wrappedDEK = await wrapDEK(dekCryptoKey, recipientPubKey);

        await keys.storeDek({
          planId,
          recipientId: recipientUserId,
          dekType: "contact",
          encryptedDek: wrappedDEK,
          keyVersion: key.keyVersion,
        });
      }

      logger.info("E2EE: DEK shared with trusted contact", {
        recipientUserId,
        deviceCount: recipientKeys.length,
      });
    },
    onSettled: () => {
      if (planId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trustedContacts.all(planId),
        });
      }
    },
  });
}

/**
 * Hook to revoke a trusted contact's DEK access.
 * Called when a contact is removed or their access is revoked.
 */
export function useRevokeDEK() {
  const { keys } = useApi();
  const { planId } = usePlan();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientUserId: string) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      await keys.deleteDek(planId, "contact", undefined, recipientUserId);
      logger.info("E2EE: DEK access revoked for user", {
        recipientUserId,
      });
    },
    onSettled: () => {
      if (planId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.trustedContacts.all(planId),
        });
      }
    },
  });
}
