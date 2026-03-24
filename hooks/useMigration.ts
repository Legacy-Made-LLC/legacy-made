/**
 * useMigration - Orchestrates client-side encryption of existing unencrypted data
 *
 * When an existing user upgrades to E2EE, this hook fetches all unencrypted
 * entries, wishes, and messages, encrypts them client-side, and PATCHes them back.
 * Progress is tracked per-item for crash resilience.
 *
 * Also catches "partially encrypted" items where metadata was encrypted but
 * title/notes still contain plaintext (from a prior bug where undefined values
 * were omitted from PATCH requests instead of being explicitly set to null).
 */

import { useApi } from "@/api";
import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import {
  encryptForUpdate,
  isEncryptedEntry,
} from "@/lib/crypto/entryEncryption";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

export interface MigrationProgress {
  totalEntries: number;
  totalWishes: number;
  totalMessages: number;
  migratedEntries: number;
  migratedWishes: number;
  migratedMessages: number;
  failedEntries: string[];
  failedWishes: string[];
  failedMessages: string[];
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

const INITIAL_PROGRESS: MigrationProgress = {
  totalEntries: 0,
  totalWishes: 0,
  totalMessages: 0,
  migratedEntries: 0,
  migratedWishes: 0,
  migratedMessages: 0,
  failedEntries: [],
  failedWishes: [],
  failedMessages: [],
  isRunning: false,
  isComplete: false,
  error: null,
};

/**
 * Check if an item needs migration — either fully unencrypted,
 * or partially encrypted (metadata encrypted but title/notes still plaintext).
 */
function needsMigration(item: {
  title: string | null;
  notes: string | null;
  metadata: unknown;
}): boolean {
  if (!isEncryptedEntry(item)) return true;
  // Partially encrypted: title/notes still have plaintext
  if (item.title != null || item.notes != null) return true;
  // Partially encrypted: metadata has plaintext keys alongside the encrypted blob
  const meta = item.metadata as unknown as Record<string, unknown>;
  const hasPlaintextKeys = Object.keys(meta).some(
    (k) => k !== "encrypted" && k !== "isEncrypted" && meta[k] != null,
  );
  if (hasPlaintextKeys) return true;
  return false;
}

/**
 * Hook to migrate unencrypted entries, wishes, and messages to encrypted format.
 *
 * Call `startMigration()` to begin. Progress is reported via the returned state.
 * If the app is killed mid-migration, call `startMigration()` again —
 * it will skip already-migrated items.
 */
export function useMigration() {
  const { entries, wishes, messages } = useApi();
  const { planId } = usePlan();
  const { dekCryptoKey } = useCrypto();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<MigrationProgress>(INITIAL_PROGRESS);
  const abortRef = useRef(false);

  const startMigration = useCallback(
    async ({
      onComplete,
      onError,
      onAbort,
    }: {
      onComplete?: (counts: {
        attemptedCount: number;
        successCount: number;
        failedCount: number;
      }) => void;
      onError?: (e: string) => void;
      onAbort?: () => void;
    } = {}) => {
      if (!planId || !dekCryptoKey) {
        const error = "Encryption keys not ready";
        setProgress((p) => ({
          ...p,
          error,
        }));
        onError?.(error);
        return;
      }

      abortRef.current = false;
      setProgress({ ...INITIAL_PROGRESS, isRunning: true });

      try {
        // 1. Fetch all entries, wishes, and messages
        const [allEntries, allWishes, allMessages] = await Promise.all([
          entries.listAll(planId),
          wishes.listAll(planId),
          messages.listAll(planId),
        ]);

        // 2. Filter to items that need migration (unencrypted or partially encrypted)
        const entriesToMigrate = allEntries.filter(needsMigration);
        const wishesToMigrate = allWishes.filter(needsMigration);
        const messagesToMigrate = allMessages.filter(needsMigration);

        setProgress((p) => ({
          ...p,
          totalEntries: entriesToMigrate.length,
          totalWishes: wishesToMigrate.length,
          totalMessages: messagesToMigrate.length,
        }));

        if (
          entriesToMigrate.length === 0 &&
          wishesToMigrate.length === 0 &&
          messagesToMigrate.length === 0
        ) {
          setProgress((p) => ({
            ...p,
            isRunning: false,
            isComplete: true,
          }));
          onComplete?.({
            attemptedCount: 0,
            successCount: 0,
            failedCount: 0,
          });
          return;
        }

        // 3. Encrypt entries one at a time
        const failedEntries: string[] = [];
        for (const entry of entriesToMigrate) {
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
        for (const wish of wishesToMigrate) {
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

        // 5. Encrypt messages one at a time
        const failedMessages: string[] = [];
        for (const message of messagesToMigrate) {
          if (abortRef.current) break;

          try {
            const encrypted = await encryptForUpdate(
              {
                title: message.title ?? undefined,
                notes: message.notes,
                metadata: message.metadata,
              },
              message.metadata,
              dekCryptoKey,
            );

            await messages.update(planId, message.id, {
              title: encrypted.title,
              notes: encrypted.notes,
              metadata: encrypted.metadata,
            });

            setProgress((p) => ({
              ...p,
              migratedMessages: p.migratedMessages + 1,
            }));
          } catch (err) {
            logger.error("Migration: Failed to encrypt message", {
              messageId: message.id,
              error: err,
            });
            failedMessages.push(message.id);
          }
        }

        const wasAborted = abortRef.current;

        setProgress((p) => ({
          ...p,
          failedEntries,
          failedWishes,
          failedMessages,
          isRunning: false,
          isComplete: !wasAborted,
        }));

        if (wasAborted) {
          logger.info("Migration aborted");
          onAbort?.();
        } else {
          const successfulEntries =
            entriesToMigrate.length - failedEntries.length;
          const successfulWishes = wishesToMigrate.length - failedWishes.length;
          const successfulMessages =
            messagesToMigrate.length - failedMessages.length;

          logger.info("Migration complete", {
            entries: successfulEntries,
            wishes: successfulWishes,
            messages: successfulMessages,
            failed:
              failedEntries.length +
              failedWishes.length +
              failedMessages.length,
          });

          // Invalidate caches so UI shows freshly encrypted data
          queryClient.invalidateQueries({
            queryKey: queryKeys.entries.all(planId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.wishes.all(planId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.messages.all(planId),
          });

          onComplete?.({
            attemptedCount:
              entriesToMigrate.length +
              wishesToMigrate.length +
              messagesToMigrate.length,
            successCount:
              successfulEntries + successfulWishes + successfulMessages,
            failedCount:
              failedEntries.length +
              failedWishes.length +
              failedMessages.length,
          });
        }
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Migration failed unexpectedly";
        setProgress((p) => ({
          ...p,
          isRunning: false,
          error,
        }));
        logger.error("Migration: Fatal error", err);
        onError?.(error);
      }
    },
    [planId, dekCryptoKey, entries, wishes, messages, queryClient],
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    progress,
    startMigration,
    abort,
  };
}
