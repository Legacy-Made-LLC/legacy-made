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
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { useKeyValue } from "@/contexts/KeyValueContext";
import { nudgeStateKey } from "./useKeyBackupNudge";
import { MigrationProgress, useMigration } from "./useMigration";

// v3: also nulls out plaintext metadata keys alongside the encrypted blob.
export const MIGRATION_COMPLETE_KEY = "e2ee_migration_complete_v3";

export type MigrationModalPhase =
  | "hidden" // No migration needed or already completed
  | "encrypting" // Actively encrypting items
  | "failed" // Some items failed, user can retry
  | "complete"; // All done, show backup key encouragement

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
  const { userStorage } = useKeyValue();
  const { startMigration, progress } = useMigration();
  const attemptedRef = useRef(false);

  const [dismissed, setDismissed] = useState(false);

  const readyToMigrate = isReady && dekCryptoKey && planId;
  const migrationAlreadyComplete = !!userStorage.getBoolean(
    MIGRATION_COMPLETE_KEY,
  );

  const onSuccessfulMigration = useEffectEvent((attemptedCount: number) => {
    userStorage.set(MIGRATION_COMPLETE_KEY, true);

    if (attemptedCount === 0) {
      logger.info("E2EE: No items needed migration, skipping modal");
    } else {
      if (planId) {
        userStorage.set(nudgeStateKey(planId), "modal_shown");
      }
      logger.info("E2EE: Auto-migration complete, flag saved");
    }
  });

  const runMigration = useCallback(() => {
    startMigration({
      onComplete: ({ attemptedCount }) => {
        onSuccessfulMigration(attemptedCount);
      },
    });
  }, [startMigration, onSuccessfulMigration]);

  // Check if migration is needed and start it silently.
  // Don't show the modal yet — only present it once we know there are items.
  useEffect(() => {
    if (!attemptedRef.current && readyToMigrate && !migrationAlreadyComplete) {
      attemptedRef.current = true;
      logger.info("E2EE: Auto-migration starting (silent until items found)");
      runMigration();
    }
  }, [runMigration, readyToMigrate, migrationAlreadyComplete]);

  const totalItems =
    progress.totalEntries + progress.totalWishes + progress.totalMessages;

  const phase = ((): MigrationModalPhase => {
    if (dismissed) {
      return "hidden";
    }

    if (progress.error) {
      return "failed";
    }

    if (progress.isComplete) {
      const hasFailures =
        progress.failedEntries.length > 0 ||
        progress.failedWishes.length > 0 ||
        progress.failedMessages.length > 0;
      if (hasFailures) {
        return "failed";
      }

      if (totalItems === 0) {
        return "hidden";
      }

      return "complete";
    }

    // Show the modal once we know there are items to migrate
    if (progress.isRunning && totalItems > 0) {
      return "encrypting";
    }

    return "hidden";
  })();

  const retry = useCallback(() => {
    runMigration();
  }, [runMigration]);

  const dismiss = () => {
    setDismissed(true);
  };

  return { phase, progress, retry, dismiss };
}
