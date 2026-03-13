/**
 * useAutoMigration - Silently triggers E2EE migration for pre-encryption users
 *
 * On app launch, if the DEK is ready and the migration hasn't been completed,
 * automatically runs the migration to encrypt existing plaintext entries, wishes, and messages.
 * Completely invisible to the user — no UI, no loading states.
 *
 * Temporary: Remove once all existing users have been migrated.
 */

import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { logger } from "@/lib/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";

import { useMigration } from "./useMigration";

// v3: also nulls out plaintext metadata keys alongside the encrypted blob.
export const MIGRATION_COMPLETE_KEY = "e2ee_migration_complete_v3";

/**
 * Call this once near the top of the authenticated app tree.
 * It will silently migrate unencrypted data when keys are ready.
 */
export function useAutoMigration() {
  const { isReady, dekCryptoKey } = useCrypto();
  const { planId } = usePlan();
  const { startMigration, progress } = useMigration();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isReady || !dekCryptoKey || !planId || attemptedRef.current) return;

    attemptedRef.current = true;

    (async () => {
      try {
        // Check if migration already completed
        const alreadyDone = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
        if (alreadyDone === "true") return;

        logger.info("E2EE: Auto-migration starting");
        await startMigration();
      } catch (err) {
        logger.error("E2EE: Auto-migration check failed", err);
      }
    })();
  }, [isReady, dekCryptoKey, planId, startMigration]);

  // Set the flag once migration completes successfully with no failures
  useEffect(() => {
    if (
      progress.isComplete &&
      progress.failedEntries.length === 0 &&
      progress.failedWishes.length === 0 &&
      progress.failedMessages.length === 0
    ) {
      AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, "true").catch((err) =>
        logger.error("E2EE: Failed to save migration flag", err),
      );
      logger.info("E2EE: Auto-migration complete, flag saved");
    }
  }, [progress.isComplete, progress.failedEntries, progress.failedWishes, progress.failedMessages]);
}
