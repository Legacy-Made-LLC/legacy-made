/**
 * useKeyBackupNudge Hook
 *
 * Determines when to show a gentle, non-blocking nudge encouraging the user
 * to back up their encryption key. Triggered after a progress threshold.
 */

import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { hasEncryptionKeys } from "@/lib/crypto/keys";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { useEntryCountsQuery } from "./queries/useEntriesQuery";

/** Number of entries required before showing the backup nudge */
const NUDGE_THRESHOLD = 3;

/** AsyncStorage key for tracking nudge dismissal */
const NUDGE_DISMISSED_KEY = "e2ee_backup_nudge_dismissed";
const NUDGE_DISMISSED_AT_COUNT_KEY = "e2ee_backup_nudge_dismissed_at_count";

/** Re-nudge threshold: show again after this many additional entries */
const RE_NUDGE_DELTA = 5;

interface UseKeyBackupNudgeReturn {
  /** Whether to show the backup nudge */
  shouldShow: boolean;
  /** Dismiss the nudge (persists to AsyncStorage) */
  dismiss: () => void;
  /** Whether the check is still loading */
  isLoading: boolean;
}

export function useKeyBackupNudge(): UseKeyBackupNudgeReturn {
  const crypto = useOptionalCrypto();
  const { userId } = useAuth();
  const { data: entryCounts } = useEntryCountsQuery();

  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total entry count
  const totalEntries = entryCounts
    ? Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  useEffect(() => {
    let mounted = true;

    async function checkNudge() {
      try {
        // Don't show if crypto isn't available
        if (!crypto?.isReady) {
          if (mounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }

        // Don't show if no user or no encryption keys
        if (!userId) {
          if (mounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }
        const keysExist = await hasEncryptionKeys(userId);
        if (!keysExist) {
          if (mounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }

        // Don't show if user already has a backup
        const hasBackup =
          crypto.backupStatus.escrow.configured ||
          crypto.backupStatus.recoveryPhrase.configured;
        if (hasBackup) {
          if (mounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }

        // Check entry threshold
        if (totalEntries < NUDGE_THRESHOLD) {
          if (mounted) {
            setShouldShow(false);
            setIsLoading(false);
          }
          return;
        }

        // Check if previously dismissed
        const [dismissed, dismissedAtCountStr] = await Promise.all([
          AsyncStorage.getItem(NUDGE_DISMISSED_KEY),
          AsyncStorage.getItem(NUDGE_DISMISSED_AT_COUNT_KEY),
        ]);

        if (dismissed === "true" && dismissedAtCountStr) {
          const dismissedAtCount = parseInt(dismissedAtCountStr, 10);
          // Re-show if user has added RE_NUDGE_DELTA more entries since dismissal
          if (totalEntries < dismissedAtCount + RE_NUDGE_DELTA) {
            if (mounted) {
              setShouldShow(false);
              setIsLoading(false);
            }
            return;
          }
        }

        // All checks passed — show the nudge
        if (mounted) {
          setShouldShow(true);
          setIsLoading(false);
        }
      } catch {
        // On error, don't show the nudge
        if (mounted) {
          setShouldShow(false);
          setIsLoading(false);
        }
      }
    }

    checkNudge();

    return () => {
      mounted = false;
    };
  }, [crypto, userId, totalEntries]);

  const dismiss = useCallback(async () => {
    setShouldShow(false);
    await Promise.all([
      AsyncStorage.setItem(NUDGE_DISMISSED_KEY, "true"),
      AsyncStorage.setItem(
        NUDGE_DISMISSED_AT_COUNT_KEY,
        String(totalEntries),
      ),
    ]);
  }, [totalEntries]);

  return { shouldShow, dismiss, isLoading };
}
