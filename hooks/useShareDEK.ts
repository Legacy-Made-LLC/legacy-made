/**
 * useShareDEK - Share encryption key with a trusted contact
 *
 * When a trusted contact accepts an invitation, the plan owner
 * wraps their DEK with the contact's public key (RSA-OAEP) and
 * stores the wrapped key on the server. The contact can then
 * unwrap it with their private key to decrypt shared plan data.
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
 * 1. Fetch the contact's public key from server
 * 2. Wrap the plan DEK with their public key (RSA-OAEP)
 * 3. Upload the wrapped DEK to the server
 */
export function useShareDEK() {
  const { keys } = useApi();
  const { dekCryptoKey } = useCrypto();
  const { planId } = usePlan();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trustedContactId,
      recipientUserId,
    }: {
      trustedContactId: string;
      recipientUserId: string;
    }) => {
      if (!dekCryptoKey) {
        throw new Error("Encryption keys not ready");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      // 1. Get the recipient's public key
      const { publicKey: recipientPubKeyB64, keyId: recipientKeyId } =
        await keys.getPublicKey(recipientUserId);

      // 2. Import the recipient's public key
      const recipientPubKey = await importPublicKey(recipientPubKeyB64);

      // 3. Export our DEK as raw bytes, then wrap with recipient's public key
      const wrappedDEK = await wrapDEK(dekCryptoKey, recipientPubKey);

      // 4. Upload the wrapped DEK to the server
      const result = await keys.shareDEK(planId, {
        trustedContactId,
        recipientUserId,
        encryptedDek: wrappedDEK,
        recipientKeyId,
      });

      logger.info("E2EE: DEK shared with trusted contact", {
        trustedContactId,
      });

      return result;
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
    mutationFn: async (trustedContactId: string) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      await keys.revokeSharedDEK(planId, trustedContactId);
      logger.info("E2EE: DEK access revoked for trusted contact", {
        trustedContactId,
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

