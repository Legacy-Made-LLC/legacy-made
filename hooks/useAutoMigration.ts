/**
 * useAutoMigration - Triggers E2EE migration for pre-encryption users
 *
 * On app launch, if the DEK is ready and the migration hasn't been completed,
 * checks whether migration is needed and exposes state for the migration modal.
 * The modal is non-dismissable until migration completes.
 *
 * Temporary: Remove once all existing users have been migrated.
 */

import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { logger } from "@/lib/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { nudgeStateKey } from "./useKeyBackupNudge";
import { MigrationProgress, useMigration } from "./useMigration";

/**
 * Mark the KeyBackupNudge as "modal_shown" so it shows a subtle guidance card
 * instead of a second modal. This prevents two nearly identical backup prompts
 * from stacking on top of each other after migration completes.
 */
function suppressBackupNudgeModal(planId: string) {
  AsyncStorage.setItem(nudgeStateKey(planId), "modal_shown").catch(
    (err) => logger.error("Failed to suppress backup nudge modal", err),
  );
}

// v3: also nulls out plaintext metadata keys alongside the encrypted blob.
export const MIGRATION_COMPLETE_KEY = "e2ee_migration_complete_v3";

export type MigrationModalPhase =
  | "hidden"       // No migration needed or already completed
  | "encrypting"   // Actively encrypting items
  | "failed"       // Some items failed, user can retry
  | "complete";    // All done, show backup key encouragement

export interface UseAutoMigrationReturn {
  /** Current phase of the migration modal */
  phase: MigrationModalPhase;
  /** Detailed progress from the migration engine */
  progress: MigrationProgress;
  /** Retry failed migration */
  retry: () => void;
  /** Dismiss the modal (only available in "complete" phase) */
  dismiss: () => void;
}

/**
 * Call this once near the top of the authenticated app tree.
 * Returns state to drive the EncryptionMigrationModal.
 */
export function useAutoMigration(): UseAutoMigrationReturn {
  const { isReady, dekCryptoKey } = useCrypto();
  const { planId } = usePlan();
  const { startMigration, progress } = useMigration();
  const attemptedRef = useRef(false);
  const [phase, setPhase] = useState<MigrationModalPhase>("hidden");

  // Check if migration is needed and start it
  useEffect(() => {
    if (!isReady || !dekCryptoKey || !planId || attemptedRef.current) return;

    attemptedRef.current = true;

    (async () => {
      try {
        // Check if migration already completed
        const alreadyDone = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
        if (alreadyDone === "true") return;

        logger.info("E2EE: Auto-migration starting");
        setPhase("encrypting");
        await startMigration();
      } catch (err) {
        logger.error("E2EE: Auto-migration check failed", err);
        setPhase("failed");
      }
    })();
  }, [isReady, dekCryptoKey, planId, startMigration]);

  // React to progress changes
  useEffect(() => {
    if (!progress.isComplete && !progress.error) return;

    if (progress.error) {
      setPhase("failed");
      return;
    }

    if (progress.isComplete) {
      const hasFailures =
        progress.failedEntries.length > 0 ||
        progress.failedWishes.length > 0 ||
        progress.failedMessages.length > 0;
      const totalItems =
        progress.totalEntries +
        progress.totalWishes +
        progress.totalMessages;

      if (hasFailures) {
        setPhase("failed");
      } else if (totalItems === 0) {
        // Nothing needed migrating (e.g. new device after recovery, or
        // data was already encrypted). Skip the modal entirely.
        AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, "true").catch((err) =>
          logger.error("E2EE: Failed to save migration flag", err),
        );
        logger.info("E2EE: No items needed migration, skipping modal");
        setPhase("hidden");
      } else {
        AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, "true").catch((err) =>
          logger.error("E2EE: Failed to save migration flag", err),
        );
        // The migration "complete" phase already shows a "Back up key" prompt.
        // Suppress the separate KeyBackupNudge modal so users don't see two
        // nearly identical backup prompts stacked on top of each other.
        if (planId) {
          suppressBackupNudgeModal(planId);
        }
        logger.info("E2EE: Auto-migration complete, flag saved");
        setPhase("complete");
      }
    }
  }, [progress.isComplete, progress.error, progress.failedEntries, progress.failedWishes, progress.failedMessages, progress.totalEntries, progress.totalWishes, progress.totalMessages, planId]);

  const retry = useCallback(() => {
    setPhase("encrypting");
    attemptedRef.current = false;
    // Allow the effect to re-trigger by resetting the ref
    // but we need to call startMigration directly since deps haven't changed
    startMigration().catch((err) => {
      logger.error("E2EE: Migration retry failed", err);
      setPhase("failed");
    });
  }, [startMigration]);

  const dismiss = useCallback(() => {
    setPhase("hidden");
  }, []);

  return { phase, progress, retry, dismiss };
}
