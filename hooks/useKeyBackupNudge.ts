/**
 * useKeyBackupNudge Hook
 *
 * Three-state nudge system for key backup:
 * - not_dismissed: modal shows when threshold met
 * - modal_shown: guidance card shows on home screen
 * - silenced: nothing shows (re-nudge after RE_NUDGE_DELTA more entries)
 */

import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { hasEncryptionKeys } from "@/lib/crypto/keys";
import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { usePlan } from "@/data/PlanProvider";
import { useEntryCountsQuery } from "./queries/useEntriesQuery";

/** Number of entries required before showing the backup nudge */
const NUDGE_THRESHOLD = 3;

/** Re-nudge threshold: show again after this many additional entries */
const RE_NUDGE_DELTA = 5;

type NudgeState = "not_dismissed" | "modal_shown" | "silenced";

/** Per-plan AsyncStorage key for nudge state */
export function nudgeStateKey(planId: string) {
  return `e2ee_backup_nudge_state_${planId}`;
}

/** Per-plan AsyncStorage key for the entry count when silenced */
function silencedAtCountKey(planId: string) {
  return `e2ee_backup_nudge_silenced_at_count_${planId}`;
}

export interface UseKeyBackupNudgeReturn {
  /** Whether to present the bottom sheet modal */
  showModal: boolean;
  /** Whether to show the guidance card on the home screen */
  showGuidanceCard: boolean;
  /** Called when the modal is dismissed (swipe away or action button tap) */
  onModalDismissed: () => void;
  /** Called when user taps "Maybe later" (modal) or "Not now" (guidance card) */
  onSilence: () => void;
  /** Whether the check is still loading */
  isLoading: boolean;
}

export function useKeyBackupNudge(): UseKeyBackupNudgeReturn {
  const crypto = useOptionalCrypto();
  const { userId } = useAuth();
  const { planId, isViewingSharedPlan } = usePlan();
  const { data: entryCounts } = useEntryCountsQuery();

  const [nudgeState, setNudgeState] = useState<NudgeState>("not_dismissed");
  const [preconditionsMet, setPreconditionsMet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total entry count
  const totalEntries = entryCounts
    ? Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  // Check if backup is already configured.
  // If backup status hasn't loaded yet (e.g. network error), treat as unknown
  // so we don't falsely nudge the user.
  const backupStatusLoaded = crypto?.backupStatusLoaded ?? false;
  const hasBackup =
    crypto?.isReady &&
    backupStatusLoaded &&
    (crypto.backupStatus.escrow.configured ||
      crypto.backupStatus.recoveryPhrase.configured);

  useEffect(() => {
    let mounted = true;

    async function checkNudge() {
      try {
        // Don't show if crypto isn't available
        if (!crypto?.isReady || !userId || !planId) {
          if (mounted) {
            setPreconditionsMet(false);
            setIsLoading(false);
          }
          return;
        }

        // Don't show if no encryption keys
        const keysExist = await hasEncryptionKeys(userId);
        if (!keysExist) {
          if (mounted) {
            setPreconditionsMet(false);
            setIsLoading(false);
          }
          return;
        }

        // Don't show if backup status hasn't loaded yet (network error, etc.)
        // — we can't know whether a backup exists, so don't nudge.
        if (!backupStatusLoaded) {
          if (mounted) {
            setPreconditionsMet(false);
            setIsLoading(false);
          }
          return;
        }

        // Don't show if user already has a backup
        if (hasBackup) {
          if (mounted) {
            setPreconditionsMet(false);
            setIsLoading(false);
          }
          return;
        }

        // Check entry threshold
        if (totalEntries < NUDGE_THRESHOLD) {
          if (mounted) {
            setPreconditionsMet(false);
            setIsLoading(false);
          }
          return;
        }

        // Preconditions met — now load persisted state
        const [savedState, silencedAtStr] = await Promise.all([
          AsyncStorage.getItem(nudgeStateKey(planId)),
          AsyncStorage.getItem(silencedAtCountKey(planId)),
        ]);

        if (mounted) {
          if (savedState === "silenced" && silencedAtStr) {
            const silencedAt = parseInt(silencedAtStr, 10);
            // Re-nudge if user has added RE_NUDGE_DELTA more entries since silence
            if (totalEntries >= silencedAt + RE_NUDGE_DELTA) {
              // Reset to not_dismissed for re-nudge
              setNudgeState("not_dismissed");
              await AsyncStorage.removeItem(nudgeStateKey(planId));
              await AsyncStorage.removeItem(silencedAtCountKey(planId));
            } else {
              setNudgeState("silenced");
            }
          } else if (savedState === "modal_shown") {
            setNudgeState("modal_shown");
          } else {
            setNudgeState("not_dismissed");
          }

          setPreconditionsMet(true);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setPreconditionsMet(false);
          setIsLoading(false);
        }
      }
    }

    checkNudge();

    return () => {
      mounted = false;
    };
  }, [crypto, userId, planId, totalEntries, hasBackup, backupStatusLoaded]);

  const onModalDismissed = useCallback(() => {
    setNudgeState("modal_shown");
    if (planId) {
      AsyncStorage.setItem(nudgeStateKey(planId), "modal_shown");
    }
  }, [planId]);

  const onSilence = useCallback(() => {
    setNudgeState("silenced");
    if (planId) {
      AsyncStorage.setItem(nudgeStateKey(planId), "silenced");
      AsyncStorage.setItem(silencedAtCountKey(planId), String(totalEntries));
    }
  }, [planId, totalEntries]);

  // Never show on shared plans — backup keys are only relevant to the plan owner
  const showModal =
    !isViewingSharedPlan &&
    !hasBackup &&
    preconditionsMet &&
    nudgeState === "not_dismissed";
  const showGuidanceCard =
    !isViewingSharedPlan &&
    !hasBackup &&
    preconditionsMet &&
    nudgeState === "modal_shown";

  return { showModal, showGuidanceCard, onModalDismissed, onSilence, isLoading };
}
