/**
 * useGuidanceDismissals - Persisted dismissal state for guidance cards
 *
 * Wraps AsyncStorage to track which guidance nudges have been dismissed.
 * Follows the same fire-and-forget pattern as useSortedEntries.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export const GUIDANCE_DISMISSED_KEY_PREFIX =
  "legacy_made_guidance_contact_dismissed_";

/**
 * Track whether the "add trusted contact" guidance card has been dismissed
 * for a specific plan. Dismissal is per-plan so switching plans doesn't
 * carry over the state.
 */
export function useContactGuidanceDismissed(planId: string | undefined) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!planId) {
      setIsLoading(false);
      return;
    }
    let ignore = false;
    setIsDismissed(false);
    setIsLoading(true);
    AsyncStorage.getItem(`${GUIDANCE_DISMISSED_KEY_PREFIX}${planId}`)
      .then((value) => {
        if (!ignore && value === "true") {
          setIsDismissed(true);
        }
      })
      .catch(() => {
        // Default to not-dismissed on storage error so guidance still shows
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [planId]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    if (planId) {
      AsyncStorage.setItem(
        `${GUIDANCE_DISMISSED_KEY_PREFIX}${planId}`,
        "true",
      );
    }
  }, [planId]);

  return { isDismissed, dismiss, isLoading };
}
