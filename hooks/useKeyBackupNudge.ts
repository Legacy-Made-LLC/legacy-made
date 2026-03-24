/**
 * useKeyBackupNudge Hook
 *
 * Three-state nudge system for key backup:
 * - not_dismissed: modal shows when threshold met
 * - modal_shown: guidance card shows on home screen
 * - silenced: nothing shows (re-nudge after RE_NUDGE_DELTA more entries)
 */

import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { useAuth } from "@clerk/expo";
import { useCallback, useSyncExternalStore } from "react";

import { useKeyValue } from "@/contexts/KeyValueContext";
import { usePlan } from "@/data/PlanProvider";
import { useQuery } from "@tanstack/react-query";
import { getHasEncryptionKeysQueryOptions } from "./queries/useCryptoQueries";
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
  const { userStorage } = useKeyValue();
  const { planId, isViewingSharedPlan } = usePlan();
  const { data: entryCounts } = useEntryCountsQuery();

  const hasEncryptionKeysQueryOptions =
    getHasEncryptionKeysQueryOptions(userId);
  const { data: hasEncryptionKeys, isLoading: hasEncryptionKeysLoading } =
    useQuery({
      ...hasEncryptionKeysQueryOptions,
      enabled: hasEncryptionKeysQueryOptions.enabled && crypto?.isReady,
    });

  const resolvedNudgeStateKey = nudgeStateKey(planId ?? "unknown_plan_id");
  const resolveSilencedAtCountKey = silencedAtCountKey(
    planId ?? "unknown_plan_id",
  );

  const nudgeState = useSyncExternalStore(
    (cb) => {
      const listener = userStorage.addOnValueChangedListener(
        (key) => key === resolvedNudgeStateKey && cb(),
      );
      return () => listener.remove();
    },
    () =>
      (userStorage.getString(resolvedNudgeStateKey) as
        | NudgeState
        | undefined) ?? "not_dismissed",
  );
  const setNudgeState = useCallback(
    (state: NudgeState) => {
      userStorage.set(resolvedNudgeStateKey, state);
    },
    [resolvedNudgeStateKey, userStorage],
  );

  const silencedAtCount = (() => {
    if (!planId) return null;
    const silencedAtStr = userStorage.getString(resolveSilencedAtCountKey);
    return silencedAtStr ? parseInt(silencedAtStr) : null;
  })();

  // Calculate total entry count
  const totalEntries = entryCounts
    ? Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  // Check if backup is already configured.
  // If backup status hasn't loaded yet (e.g. network error), treat as unknown
  // so we don't falsely nudge the user.
  const backupStatusLoaded = crypto?.backupStatusLoaded ?? false;
  const hasBackup: boolean =
    !!crypto?.isReady &&
    backupStatusLoaded &&
    (crypto.backupStatus.escrow.configured ||
      crypto.backupStatus.recoveryPhrase.configured);

  const nudgeThresholdMet = totalEntries >= NUDGE_THRESHOLD;

  const showNudge = (() => {
    if (isViewingSharedPlan || !hasEncryptionKeys || hasBackup) return false;

    if (nudgeState !== "silenced" && nudgeThresholdMet) return true;

    if (
      nudgeState === "silenced" &&
      silencedAtCount &&
      totalEntries > silencedAtCount + RE_NUDGE_DELTA
    )
      return true;

    return false;
  })();

  const onModalDismissed = useCallback(() => {
    setNudgeState("modal_shown");
  }, [setNudgeState]);

  const onSilence = useCallback(() => {
    setNudgeState("silenced");
    userStorage.set(resolveSilencedAtCountKey, String(totalEntries));
  }, [userStorage, setNudgeState, resolveSilencedAtCountKey, totalEntries]);

  // Never show on shared plans — backup keys are only relevant to the plan owner
  const showModal = showNudge && nudgeState === "not_dismissed";
  const showGuidanceCard = showNudge && nudgeState === "modal_shown";

  return {
    showModal,
    showGuidanceCard,
    onModalDismissed,
    onSilence,
    isLoading: hasEncryptionKeysLoading,
  };
}
