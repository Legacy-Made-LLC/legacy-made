/**
 * CryptoProvider - React context for E2EE key management
 *
 * Uses TanStack Query for reactive key initialization:
 * - hasEncryptionKeys, getDEK, getKeyVersion are queries with automatic retries
 * - getDEK is enabled only when hasEncryptionKeys === true
 * - Initialization logic is reactive derivations from query state
 * - Invalidating hasEncryptionKeys safely re-triggers the init flow
 *
 * The public interface (CryptoContextType) is unchanged — all consumers
 * continue working without modification.
 */

import { useApi } from "@/api";
import { usePlan } from "@/data/PlanProvider";
import {
  useBackupStatusQuery,
  useDEKQuery,
  useEscrowRecoveryMutation,
  useHasEncryptionKeysQuery,
  useKeySyncMutation,
  useKeyVersionQuery,
  usePlanE2EEStatusQuery,
  useRetrySetupMutation,
  useServerKeysQuery,
  useSetupKeysMutation,
  useSharedPlanDEKQuery,
} from "@/hooks/queries/useCryptoQueries";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { decryptString, encryptString } from "./aes";
import { decryptDownloadedFile, encryptFileForUpload } from "./fileEncryption";
import { getKeyVersion, getPrivateKey, unwrapDEK } from "./keys";
import type { EncryptedPayload, KeyBackupStatus } from "./types";

interface CryptoContextType {
  /** Whether keys are loaded and ready for encrypt/decrypt operations */
  isReady: boolean;
  /** Whether key initialization is in progress */
  isLoading: boolean;
  /** In-memory DEK as CryptoKey (null if not ready) */
  dekCryptoKey: CryptoKey | null;
  /** The DEK to use for current plan (own DEK or shared plan DEK) */
  activeDEK: CryptoKey | null;
  /** True while resolving a shared plan's DEK */
  isActiveDEKLoading: boolean;
  /** True when viewing a shared plan but no DEK exists for the contact */
  sharedPlanDEKUnavailable: boolean;
  /** True when this device needs key recovery (returning user, no local keys) */
  needsRecovery: boolean;
  /** Encrypt a plaintext string */
  encrypt: (plaintext: string) => Promise<EncryptedPayload>;
  /** Decrypt an encrypted payload */
  decrypt: (payload: EncryptedPayload) => Promise<string>;
  /** Encrypt file data for upload */
  encryptFile: (data: ArrayBuffer) => Promise<ArrayBuffer>;
  /** Decrypt downloaded file data */
  decryptFile: (data: ArrayBuffer) => Promise<ArrayBuffer>;
  /** Current backup status */
  backupStatus: KeyBackupStatus;
  /** Get the DEK for a shared plan (unwrap with our private key) */
  getSharedPlanDEK: (
    planId: string,
    ownerId: string,
  ) => Promise<CryptoKey | null>;
  /** Recover keys from escrow (new device without local keys) */
  recoverFromEscrow: () => Promise<boolean>;
  /** Clear cached shared plan DEK (e.g. on revocation) */
  clearSharedDEKCache: (planId: string) => void;
  /** Complete recovery — reload DEK from SecureStore and mark ready */
  completeRecovery: () => Promise<void>;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

interface CryptoProviderProps {
  children: ReactNode;
}

export function CryptoProvider({ children }: CryptoProviderProps) {
  const { isSignedIn, userId } = useAuth();
  const { keys } = useApi();
  const { myPlanId, isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const queryClient = useQueryClient();

  // ── Core queries ─────────────────────────────────────────────────────

  const hasKeysQuery = useHasEncryptionKeysQuery(userId);

  const dekQuery = useDEKQuery(userId, hasKeysQuery.data);

  // Derived: DEK is loaded and ready
  const isReady = dekQuery.data != null;
  const dekCryptoKey = dekQuery.data ?? null;

  const keyVersionQuery = useKeyVersionQuery(userId, isReady);

  // Verify local keys are actually registered on the server
  const serverKeysQuery = useServerKeysQuery(
    userId,
    isReady,
    keyVersionQuery.data,
  );

  // Only check E2EE status when no local keys (detecting returning user).
  // Always uses the user's own plan — shared plans are irrelevant here.
  const e2eeStatusQuery = usePlanE2EEStatusQuery(
    myPlanId,
    hasKeysQuery.data === false,
  );

  // Backup status is always for the user's own plan (not shared plans).
  const backupStatusQuery = useBackupStatusQuery(myPlanId, isReady);
  const backupStatus: KeyBackupStatus = useMemo(
    () =>
      backupStatusQuery.data ?? {
        escrow: { configured: false, createdAt: null, removedAt: null },
        recoveryPhrase: { configured: false, createdAt: null, removedAt: null },
      },
    [backupStatusQuery.data],
  );

  // ── Shared plan DEK (via query) ──────────────────────────────────────

  const sharedDEKQuery = useSharedPlanDEKQuery(
    isViewingSharedPlan ? sharedPlanInfo?.planId : undefined,
    isViewingSharedPlan ? sharedPlanInfo?.ownerId : undefined,
    userId,
    isViewingSharedPlan && !!sharedPlanInfo,
  );

  const sharedDEK = sharedDEKQuery.data ?? null;
  const isActiveDEKLoading =
    isViewingSharedPlan && sharedPlanInfo ? sharedDEKQuery.isLoading : false;
  const sharedPlanDEKUnavailable =
    isViewingSharedPlan &&
    !!sharedPlanInfo &&
    sharedDEKQuery.isFetched &&
    sharedDEK === null;

  // The DEK to use for all encrypt/decrypt operations
  const activeDEK = isViewingSharedPlan ? sharedDEK : dekCryptoKey;

  // ── Mutations ────────────────────────────────────────────────────────

  const setupMutation = useSetupKeysMutation();
  const retrySetupMutation = useRetrySetupMutation();
  const keySyncMutation = useKeySyncMutation();
  const keySyncMutate = keySyncMutation.mutate;
  const isKeySyncPending = keySyncMutation.isPending;
  const escrowRecoveryMutation = useEscrowRecoveryMutation();
  // ── Derived state ────────────────────────────────────────────────────

  const isLoading =
    (!!userId && hasKeysQuery.isLoading) ||
    dekQuery.isLoading ||
    setupMutation.isPending;

  // needsRecovery: no local keys but plan already has E2EE enabled
  // Important: hasKeysQuery.data is undefined while loading, NOT false
  // Suppress while escrow recovery is in-flight OR just succeeded — there is
  // a window after the mutation completes where hasKeysQuery hasn't refetched
  // yet, so data is still `false`. isSuccess stays true until the mutation
  // is reset, closing that gap.
  const needsRecovery =
    !escrowRecoveryMutation.isPending &&
    !escrowRecoveryMutation.isSuccess &&
    hasKeysQuery.data === false &&
    e2eeStatusQuery.data?.e2eeEnabled === true;

  // shouldAutoSetup: no local keys, E2EE not yet enabled, ready to set up
  const shouldAutoSetup =
    hasKeysQuery.data === false &&
    e2eeStatusQuery.data?.e2eeEnabled === false &&
    !!myPlanId &&
    !!userId;

  // ── Auto-setup effect (new user) ─────────────────────────────────────

  useEffect(() => {
    if (
      shouldAutoSetup &&
      !setupMutation.isPending &&
      !setupMutation.isSuccess
    ) {
      setupMutation.mutate({ planId: myPlanId!, userId: userId! });
    }
  }, [shouldAutoSetup, setupMutation, myPlanId, userId]);

  // ── Retry-setup effect (incomplete backend setup) ────────────────────

  useEffect(() => {
    if (
      isReady &&
      dekCryptoKey &&
      keyVersionQuery.data === null &&
      keyVersionQuery.isFetched &&
      myPlanId &&
      userId &&
      !retrySetupMutation.isPending
    ) {
      retrySetupMutation.mutate({
        dek: dekCryptoKey,
        planId: myPlanId,
        userId,
      });
    }
  }, [
    isReady,
    dekCryptoKey,
    keyVersionQuery.data,
    keyVersionQuery.isFetched,
    myPlanId,
    userId,
    retrySetupMutation,
  ]);

  // ── Server key sync (verify local keys exist on backend) ────────────

  useEffect(() => {
    if (
      isReady &&
      dekCryptoKey &&
      keyVersionQuery.data != null &&
      serverKeysQuery.isFetched &&
      serverKeysQuery.data &&
      myPlanId &&
      userId &&
      !isKeySyncPending &&
      !retrySetupMutation.isPending
    ) {
      const localVersion = keyVersionQuery.data;
      const serverHasKey = serverKeysQuery.data.some(
        (k) => k.keyVersion === localVersion,
      );

      if (!serverHasKey) {
        logger.warn(
          "E2EE: Local keyVersion=" +
            localVersion +
            " not found on server (server has " +
            serverKeysQuery.data.length +
            " keys). Re-syncing...",
        );
        keySyncMutate({ dek: dekCryptoKey, planId: myPlanId, userId });
      }
    }
  }, [
    isReady,
    dekCryptoKey,
    keyVersionQuery.data,
    serverKeysQuery.isFetched,
    serverKeysQuery.data,
    myPlanId,
    userId,
    isKeySyncPending,
    keySyncMutate,
    retrySetupMutation,
  ]);

  // ── Background security: clear DEK from memory ──────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (!userId) return;

      if (nextState === "background" || nextState === "inactive") {
        // Remove DEK + shared DEK queries so they re-fetch on foreground
        queryClient.removeQueries({
          queryKey: queryKeys.crypto.dek(userId),
        });
        queryClient.removeQueries({
          predicate: (query) =>
            query.queryKey[0] === "crypto" && query.queryKey[1] === "sharedDEK",
        });
      }
      // On "active", useDEKQuery automatically re-executes since the query
      // was removed (treated as fresh mount)
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [userId, queryClient]);

  // ── Sign-out cleanup ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isSignedIn) {
      queryClient.removeQueries({ queryKey: queryKeys.crypto.all() });
    }
  }, [isSignedIn, queryClient]);

  // ── Convenience methods ──────────────────────────────────────────────
  // These use `activeDEK` so they work correctly whether viewing the
  // user's own plan or a shared (trusted contact) plan.

  const encrypt = useCallback(
    async (plaintext: string): Promise<EncryptedPayload> => {
      if (!activeDEK) throw new Error("Encryption keys not ready");
      return encryptString(plaintext, activeDEK);
    },
    [activeDEK],
  );

  const decrypt = useCallback(
    async (payload: EncryptedPayload): Promise<string> => {
      if (!activeDEK) throw new Error("Encryption keys not ready");
      return decryptString(payload, activeDEK);
    },
    [activeDEK],
  );

  const encryptFile = useCallback(
    async (data: ArrayBuffer): Promise<ArrayBuffer> => {
      if (!activeDEK) throw new Error("Encryption keys not ready");
      return encryptFileForUpload(data, activeDEK);
    },
    [activeDEK],
  );

  const decryptFile = useCallback(
    async (data: ArrayBuffer): Promise<ArrayBuffer> => {
      if (!activeDEK) throw new Error("Encryption keys not ready");
      return decryptDownloadedFile(data, activeDEK);
    },
    [activeDEK],
  );

  // Imperative getSharedPlanDEK — fetches/reads the query cache, or triggers fetch
  const getSharedPlanDEK = useCallback(
    async (
      sharedPlanId: string,
      ownerId: string,
    ): Promise<CryptoKey | null> => {
      if (!userId) return null;
      try {
        return await queryClient.fetchQuery({
          queryKey: queryKeys.crypto.sharedDEK(sharedPlanId, ownerId),
          queryFn: async () => {
            const dekRecords = await keys.getMyDeks(sharedPlanId, ownerId);
            if (!dekRecords || dekRecords.length === 0) return null;

            const myKeyVersion = await getKeyVersion(userId);
            if (!myKeyVersion) return null; // No local keyVersion = can't unwrap
            const matchingDek = dekRecords.find(
              (d) => d.keyVersion === myKeyVersion,
            );
            if (!matchingDek) return null;

            const privateKey = await getPrivateKey(userId);
            if (!privateKey) return null;

            return unwrapDEK(matchingDek.encryptedDek, privateKey);
          },
          staleTime: Infinity,
        });
      } catch (error) {
        logger.error("E2EE: Failed to get shared plan DEK", error);
        return null;
      }
    },
    [userId, keys, queryClient],
  );

  const clearSharedDEKCache = useCallback(
    (planIdToClear: string) => {
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "crypto" &&
          query.queryKey[1] === "sharedDEK" &&
          query.queryKey[2] === planIdToClear,
      });
      logger.info("E2EE: Cleared shared DEK cache for plan " + planIdToClear);
    },
    [queryClient],
  );

  // ── Recovery methods (thin wrappers around mutations) ────────────────

  const recoverFromEscrow = useCallback(async (): Promise<boolean> => {
    if (!myPlanId || !userId) {
      logger.error("E2EE: Cannot recover without myPlanId and userId");
      return false;
    }
    try {
      await escrowRecoveryMutation.mutateAsync({ planId: myPlanId, userId });
      return true;
    } catch (error) {
      logger.warn("E2EE: Escrow recovery failed", { error });
      return false;
    }
  }, [escrowRecoveryMutation, myPlanId, userId]);

  const completeRecovery = useCallback(async () => {
    if (!userId) return;
    // Refetch key queries and wait for them to resolve before returning.
    // The escrow mutation's onSuccess already invalidated these, but the
    // refetches may still be in-flight. Using refetchQueries ensures we
    // block until hasKeysQuery.data is true, preventing the app layout's
    // needsRecovery guard from redirecting back to the recovery screen.
    await queryClient.refetchQueries({
      queryKey: queryKeys.crypto.hasKeys(userId),
    });
    await queryClient.refetchQueries({
      queryKey: queryKeys.crypto.dek(userId),
    });
    await queryClient.refetchQueries({
      queryKey: queryKeys.crypto.keyVersion(userId),
    });
    logger.info("E2EE: Recovery complete, key queries settled");
  }, [userId, queryClient]);

  // ── Context value ────────────────────────────────────────────────────

  const value = useMemo<CryptoContextType>(
    () => ({
      isReady,
      isLoading,
      dekCryptoKey,
      activeDEK,
      isActiveDEKLoading,
      sharedPlanDEKUnavailable,
      needsRecovery,
      encrypt,
      decrypt,
      encryptFile,
      decryptFile,
      backupStatus,
      getSharedPlanDEK,
      recoverFromEscrow,
      clearSharedDEKCache,
      completeRecovery,
    }),
    [
      isReady,
      isLoading,
      dekCryptoKey,
      activeDEK,
      isActiveDEKLoading,
      sharedPlanDEKUnavailable,
      needsRecovery,
      encrypt,
      decrypt,
      encryptFile,
      decryptFile,
      backupStatus,
      getSharedPlanDEK,
      recoverFromEscrow,
      clearSharedDEKCache,
      completeRecovery,
    ],
  );

  return (
    <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>
  );
}

/**
 * Hook to access the crypto context.
 * Must be used within a CryptoProvider.
 */
export function useCrypto(): CryptoContextType {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}

/**
 * Hook to get the DEK CryptoKey if available.
 * Returns null if keys aren't ready (for optional encryption paths).
 */
export function useOptionalCrypto(): CryptoContextType | null {
  return useContext(CryptoContext);
}
