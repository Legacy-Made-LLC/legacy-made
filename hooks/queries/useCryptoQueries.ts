/**
 * Crypto Query Hooks
 *
 * TanStack Query hooks for E2EE key management.
 * These replace the manual state/refs/effects in CryptoProvider with reactive queries.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useApi } from "@/api";
import { getDeviceLabel } from "@/lib/crypto/deviceLabel";
import {
  exportPublicKey,
  generateDEK,
  generateKeyPair,
  getDEK,
  getKeyVersion,
  getPrivateKey,
  getPublicKey,
  hasEncryptionKeys,
  importDEK,
  storeDEK,
  storeKeyVersion,
  storePrivateKey,
  storePublicKey,
  unwrapDEK,
  wrapDEK,
} from "@/lib/crypto/keys";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

// ============================================================================
// Queries
// ============================================================================

export function getHasEncryptionKeysQueryOptions(
  userId: string | null | undefined,
) {
  return queryOptions({
    queryKey: queryKeys.crypto.hasKeys(userId!),
    queryFn: () => hasEncryptionKeys(userId!),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

/**
 * Query whether local encryption keys exist in SecureStore.
 * staleTime: Infinity — only changes when we explicitly mutate.
 */
export function useHasEncryptionKeysQuery(userId: string | null | undefined) {
  return useQuery(getHasEncryptionKeysQueryOptions(userId));
}

/**
 * Query the DEK from SecureStore and import it as a CryptoKey.
 * Only enabled when hasKeys is confirmed true.
 * structuralSharing: false because CryptoKey is an opaque object.
 */
export function useDEKQuery(
  userId: string | null | undefined,
  hasKeys: boolean | undefined,
) {
  return useQuery({
    queryKey: queryKeys.crypto.dek(userId!),
    queryFn: () => getDEK(userId!),
    enabled: !!userId && hasKeys === true,
    staleTime: Infinity,
    structuralSharing: false,
  });
}

/**
 * Query the server-assigned key version from SecureStore.
 */
export function useKeyVersionQuery(
  userId: string | null | undefined,
  isReady: boolean,
) {
  return useQuery({
    queryKey: queryKeys.crypto.keyVersion(userId!),
    queryFn: () => getKeyVersion(userId!),
    enabled: !!userId && isReady,
    staleTime: Infinity,
  });
}

/**
 * Query the plan's E2EE status from the server.
 * Only enabled when hasKeys is false (to detect returning users who need recovery).
 */
export function usePlanE2EEStatusQuery(
  planId: string | null | undefined,
  shouldCheck: boolean,
) {
  const { keys } = useApi();
  return useQuery({
    queryKey: queryKeys.crypto.e2eeStatus(planId!),
    queryFn: () => keys.getPlanE2EEStatus(planId!),
    enabled: !!planId && shouldCheck,
  });
}

/**
 * Query backup status (escrow + recovery phrase).
 * Server DEK records are the single source of truth.
 * Also fetches recovery events to populate `removedAt` for revoked methods.
 */
export function useBackupStatusQuery(
  planId: string | null | undefined,
  isReady: boolean,
) {
  const { keys } = useApi();
  return useQuery({
    queryKey: queryKeys.crypto.backupStatus(planId!),
    queryFn: async () => {
      // Let network errors propagate so TanStack Query retries and stays
      // in loading/error state rather than returning a false "not configured".
      const [dekRecords, recoveryEvents] = await Promise.all([
        keys.listDeks(planId ?? undefined),
        keys.listRecoveryEvents().catch(() => []),
      ]);

      const escrowRecord = dekRecords.find((d) => d.dekType === "escrow");
      const recoveryRecord = dekRecords.find((d) => d.dekType === "recovery");

      // Find most recent revocation events for each method
      const escrowRevokedEvent = recoveryEvents
        .filter((e) => e.eventType === "escrow_revoked")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

      const recoveryDeregisteredEvent = recoveryEvents
        .filter((e) => e.eventType === "recovery_key_deregistered")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

      return {
        escrow: escrowRecord
          ? {
              configured: true,
              createdAt: escrowRecord.createdAt,
              removedAt: null,
            }
          : {
              configured: false,
              createdAt: null,
              removedAt: escrowRevokedEvent?.createdAt ?? null,
            },
        recoveryPhrase: recoveryRecord
          ? {
              configured: true,
              createdAt: recoveryRecord.createdAt,
              removedAt: null,
            }
          : {
              configured: false,
              createdAt: null,
              removedAt: recoveryDeregisteredEvent?.createdAt ?? null,
            },
      };
    },
    enabled: !!planId && isReady,
  });
}

/**
 * Query a shared plan's DEK — fetch from server and unwrap with our private key.
 * structuralSharing: false because CryptoKey is an opaque object.
 */
export function useSharedPlanDEKQuery(
  planId: string | null | undefined,
  ownerId: string | null | undefined,
  userId: string | null | undefined,
  shouldFetch: boolean,
) {
  const { keys } = useApi();
  return useQuery({
    queryKey: queryKeys.crypto.sharedDEK(planId!, ownerId!),
    queryFn: async (): Promise<CryptoKey | null> => {
      const dekRecords = await keys.getMyDeks(planId!, ownerId!);
      if (!dekRecords || dekRecords.length === 0) return null;

      const myKeyVersion = await getKeyVersion(userId!);
      if (!myKeyVersion) return null; // No local keyVersion = can't unwrap
      const matchingDek = dekRecords.find((d) => d.keyVersion === myKeyVersion);
      if (!matchingDek) return null;

      const privateKey = await getPrivateKey(userId!);
      if (!privateKey) return null;

      return unwrapDEK(matchingDek.encryptedDek, privateKey);
    },
    enabled: !!planId && !!ownerId && !!userId && shouldFetch,
    staleTime: Infinity,
    structuralSharing: false,
  });
}

// ============================================================================
// Server key sync
// ============================================================================

/**
 * Query the server's key records for the current user.
 * Used to verify that locally-stored keys are actually registered on the backend.
 * Only runs once per app launch (staleTime: Infinity) after crypto is ready.
 */
export function useServerKeysQuery(
  userId: string | null | undefined,
  isReady: boolean,
  localKeyVersion: number | null | undefined,
) {
  const { keys } = useApi();
  return useQuery({
    queryKey: queryKeys.crypto.serverKeys(userId!),
    queryFn: () => keys.getMyKeys(),
    enabled: !!userId && isReady && localKeyVersion != null,
    staleTime: Infinity,
  });
}

/**
 * Mutation: re-register a locally-stored key with the server.
 * Used when keys exist locally and work for encrypt/decrypt, but the
 * server has no matching key record (e.g., network failure during initial
 * setup that was partially saved locally).
 */
export function useKeySyncMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({
      dek,
      planId,
      userId,
    }: {
      dek: CryptoKey;
      planId: string;
      userId: string;
    }) => {
      logger.info(
        "E2EE: Key sync — local keys not found on server, re-registering...",
      );

      let publicKey = await getPublicKey(userId);

      if (!publicKey) {
        logger.info(
          "E2EE: Key sync — no stored public key, generating new pair",
        );
        const keyPair = await generateKeyPair();
        await storePrivateKey(keyPair.privateKey, userId);
        await storePublicKey(keyPair.publicKey, userId);
        publicKey = keyPair.publicKey;
      }

      const publicKeyB64 = await exportPublicKey(publicKey);
      const wrappedDEK = await wrapDEK(dek, publicKey);

      const { keyVersion } = await keys.setup({
        publicKey: publicKeyB64,
        planId,
        encryptedDek: wrappedDEK,
        deviceLabel: getDeviceLabel(),
      });
      await storeKeyVersion(keyVersion, userId);
      await keys.enablePlanE2EE(planId);
      logger.info("E2EE: Key sync complete, new keyVersion=" + keyVersion);
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.keyVersion(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.serverKeys(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.deviceKeys(userId),
      });
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Mutation: generate new keys, store locally, call keys.setup(), enable E2EE.
 * Used for new users who have never set up encryption.
 */
export function useSetupKeysMutation() {
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
      logger.info("E2EE: Generating new key pair and DEK...");

      const keyPair = await generateKeyPair();
      const dek = await generateDEK();

      await storePrivateKey(keyPair.privateKey, userId);
      await storePublicKey(keyPair.publicKey, userId);
      await storeDEK(dek, userId);

      const publicKeyB64 = await exportPublicKey(keyPair.publicKey);
      const wrappedDEK = await wrapDEK(dek, keyPair.publicKey);

      try {
        const { keyVersion } = await keys.setup({
          publicKey: publicKeyB64,
          planId,
          encryptedDek: wrappedDEK,
          deviceLabel: getDeviceLabel(),
        });
        await storeKeyVersion(keyVersion, userId);
        await keys.enablePlanE2EE(planId);
        logger.info("E2EE: Setup complete, keyVersion=" + keyVersion);
      } catch (uploadError) {
        // Setup failed — keys are still usable locally.
        // retrySetupMutation will catch this on next cycle via keyVersion === null.
        logger.error("E2EE: Failed to complete setup", uploadError);
      }

      logger.info("E2EE: Key generation complete");
    },
    onSuccess: (_data, { userId, planId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.hasKeys(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.dek(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.keyVersion(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.e2eeStatus(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.deviceKeys(userId),
      });
    },
  });
}

/**
 * Mutation: retry backend setup when keys exist locally but keyVersion is null.
 * Loads the stored public key, wraps the DEK, calls keys.setup().
 */
export function useRetrySetupMutation() {
  const queryClient = useQueryClient();
  const { keys } = useApi();

  return useMutation({
    mutationFn: async ({
      dek,
      planId,
      userId,
    }: {
      dek: CryptoKey;
      planId: string;
      userId: string;
    }) => {
      let publicKey = await getPublicKey(userId);

      if (!publicKey) {
        logger.info(
          "E2EE: No stored public key — generating new key pair for setup retry",
        );
        const keyPair = await generateKeyPair();
        await storePrivateKey(keyPair.privateKey, userId);
        await storePublicKey(keyPair.publicKey, userId);
        publicKey = keyPair.publicKey;
      }

      const publicKeyB64 = await exportPublicKey(publicKey);
      const wrappedDEK = await wrapDEK(dek, publicKey);

      const { keyVersion } = await keys.setup({
        publicKey: publicKeyB64,
        planId,
        encryptedDek: wrappedDEK,
        deviceLabel: getDeviceLabel(),
      });
      await storeKeyVersion(keyVersion, userId);
      await keys.enablePlanE2EE(planId);
      logger.info("E2EE: Setup retry succeeded, keyVersion=" + keyVersion);
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.keyVersion(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.deviceKeys(userId),
      });
    },
  });
}

/**
 * Mutation: recover DEK from KMS escrow, register new key.
 */
export function useEscrowRecoveryMutation() {
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
      const keyPair = await generateKeyPair();
      const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

      const response = await keys.recoverFromEscrow({
        planId,
        newPublicKey: publicKeyB64,
        deviceLabel: getDeviceLabel("recovered"),
      });

      const dek = await importDEK(response.dekPlaintext);

      await storePrivateKey(keyPair.privateKey, userId);
      await storePublicKey(keyPair.publicKey, userId);
      await storeDEK(dek, userId);

      // recoverFromEscrow does not store the new public key — a separate
      // registerKey call is needed to persist it on the server.
      const keyRecord = await keys.registerKey({
        publicKey: publicKeyB64,
        deviceLabel: getDeviceLabel("recovered"),
        keyType: "device",
      });
      await storeKeyVersion(keyRecord.keyVersion, userId);

      const wrappedDEK = await wrapDEK(dek, keyPair.publicKey);
      await keys.storeDek({
        planId,
        recipientId: keyRecord.userId,
        dekType: "device",
        encryptedDek: wrappedDEK,
        keyVersion: keyRecord.keyVersion,
      });

      logger.info("E2EE: Keys recovered from escrow");
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.hasKeys(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.dek(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.keyVersion(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.deviceKeys(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crypto.serverKeys(userId),
      });
    },
  });
}
