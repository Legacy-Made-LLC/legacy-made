/**
 * useGuidanceDismissals - Persisted dismissal state for guidance cards
 *
 * Wraps AsyncStorage to track which guidance nudges have been dismissed.
 * Follows the same fire-and-forget pattern as useSortedEntries.
 */

import { useKeyValue, useUserStorageValue } from "@/contexts/KeyValueContext";
import { useCallback } from "react";

export const GUIDANCE_DISMISSED_KEY_PREFIX =
  "legacy_made_guidance_contact_dismissed_";

/**
 * Track whether the "add trusted contact" guidance card has been dismissed
 * for a specific plan. Dismissal is per-plan so switching plans doesn't
 * carry over the state.
 */
export function useContactGuidanceDismissed(planId: string | undefined) {
  const { userStorage } = useKeyValue();

  const resolvedGuidanceDismissedKey = `${GUIDANCE_DISMISSED_KEY_PREFIX}${planId}`;
  const isDismissed = useUserStorageValue({
    key: resolvedGuidanceDismissedKey,
    get: (s) => s.getBoolean(resolvedGuidanceDismissedKey),
  });
  const setIsDismissed = useCallback(
    (value: boolean) => {
      userStorage.set(resolvedGuidanceDismissedKey, value ? "true" : "false");
    },
    [resolvedGuidanceDismissedKey, userStorage],
  );

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, [setIsDismissed]);

  return { isDismissed, dismiss, isLoading: false };
}
