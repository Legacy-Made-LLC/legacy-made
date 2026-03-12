/**
 * useMigration - Orchestrates client-side encryption of existing unencrypted data
 *
 * When an existing user upgrades to E2EE, this hook fetches all unencrypted
 * entries and wishes, encrypts them client-side, and PATCHes them back.
 * Progress is tracked per-item for crash resilience.
 */

import { useApi } from "@/api";
import type { Entry } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import {
  encryptForUpdate,
  isEncryptedEntry,
} from "@/lib/crypto/entryEncryption";
import { logger } from "@/lib/logger";
import { useCallback, useRef, useState } from "react";

export interface MigrationProgress {
  totalEntries: number;
  totalWishes: number;
  migratedEntries: number;
  migratedWishes: number;
  failedEntries: string[];
  failedWishes: string[];
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

const INITIAL_PROGRESS: MigrationProgress = {
  totalEntries: 0,
  totalWishes: 0,
  migratedEntries: 0,
  migratedWishes: 0,
  failedEntries: [],
  failedWishes: [],
  isRunning: false,
  isComplete: false,
  error: null,
};

/**
 * Hook to migrate unencrypted entries and wishes to encrypted format.
 *
 * Call `startMigration()` to begin. Progress is reported via the returned state.
 * If the app is killed mid-migration, call `startMigration()` again —
 * it will skip already-encrypted items.
 */
export function useMigration() {
  const { entries, wishes } = useApi();
  const { planId } = usePlan();
  const { dekCryptoKey } = useCrypto();
  const [progress, setProgress] = useState<MigrationProgress>(INITIAL_PROGRESS);
  const abortRef = useRef(false);

  const startMigration = useCallback(async () => {
    if (!planId || !dekCryptoKey) {
      setProgress((p) => ({
        ...p,
        error: "Encryption keys not ready",
      }));
      return;
    }

    abortRef.current = false;
    setProgress({ ...INITIAL_PROGRESS, isRunning: true });

    try {
      // 1. Fetch all entries and wishes
      const [allEntries, allWishes] = await Promise.all([
        entries.listAll(planId),
        wishes.listAll(planId),
      ]);

      // 2. Filter to only unencrypted items
      const unencryptedEntries = allEntries.filter(
        (e) => !isEncryptedEntry(e),
      );
      const unencryptedWishes = allWishes.filter(
        (w) => !isEncryptedEntry(w as Entry),
      );

      setProgress((p) => ({
        ...p,
        totalEntries: unencryptedEntries.length,
        totalWishes: unencryptedWishes.length,
      }));

      if (
        unencryptedEntries.length === 0 &&
        unencryptedWishes.length === 0
      ) {
        setProgress((p) => ({
          ...p,
          isRunning: false,
          isComplete: true,
        }));
        return;
      }

      // 3. Encrypt entries one at a time
      const failedEntries: string[] = [];
      for (const entry of unencryptedEntries) {
        if (abortRef.current) break;

        try {
          const encrypted = await encryptForUpdate(
            {
              title: entry.title ?? undefined,
              notes: entry.notes,
              metadata: entry.metadata,
            },
            entry.metadata,
            dekCryptoKey,
          );

          await entries.update(planId, entry.id, {
            title: encrypted.title,
            notes: encrypted.notes,
            metadata: encrypted.metadata,
          });

          setProgress((p) => ({
            ...p,
            migratedEntries: p.migratedEntries + 1,
          }));
        } catch (err) {
          logger.error("Migration: Failed to encrypt entry", {
            entryId: entry.id,
            error: err,
          });
          failedEntries.push(entry.id);
        }
      }

      // 4. Encrypt wishes one at a time
      const failedWishes: string[] = [];
      for (const wish of unencryptedWishes) {
        if (abortRef.current) break;

        try {
          const encrypted = await encryptForUpdate(
            {
              title: wish.title ?? undefined,
              notes: wish.notes,
              metadata: wish.metadata,
            },
            wish.metadata,
            dekCryptoKey,
          );

          await wishes.update(planId, wish.id, {
            title: encrypted.title,
            notes: encrypted.notes,
            metadata: encrypted.metadata,
          });

          setProgress((p) => ({
            ...p,
            migratedWishes: p.migratedWishes + 1,
          }));
        } catch (err) {
          logger.error("Migration: Failed to encrypt wish", {
            wishId: wish.id,
            error: err,
          });
          failedWishes.push(wish.id);
        }
      }

      setProgress((p) => ({
        ...p,
        failedEntries,
        failedWishes,
        isRunning: false,
        isComplete: true,
      }));

      logger.info("Migration complete", {
        entries: unencryptedEntries.length - failedEntries.length,
        wishes: unencryptedWishes.length - failedWishes.length,
        failed: failedEntries.length + failedWishes.length,
      });
    } catch (err) {
      setProgress((p) => ({
        ...p,
        isRunning: false,
        error:
          err instanceof Error
            ? err.message
            : "Migration failed unexpectedly",
      }));
      logger.error("Migration: Fatal error", err);
    }
  }, [planId, dekCryptoKey, entries, wishes]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    progress,
    startMigration,
    abort,
  };
}
