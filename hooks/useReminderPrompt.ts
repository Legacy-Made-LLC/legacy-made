/**
 * useReminderPrompt — Manages the "Want a gentle reminder?" soft prompt.
 *
 * Trigger conditions (all must be true):
 * 1. User has started a section (opened an entry/wish/message form)
 * 2. User left mid-progress (app backgrounded while in a section)
 * 3. This is a subsequent app open (not the same session)
 * 4. Reminders are not already enabled
 * 5. The prompt hasn't been dismissed with "Not now"
 *
 * MMKV keys:
 * - legacy_made_section_started: boolean — set when user opens any entry form
 * - legacy_made_left_mid_progress: boolean — set when app backgrounds from a section
 * - legacy_made_reminder_prompt_dismissed: boolean — set on "Not now"
 * - legacy_made_reminder_prompt_session: string — current session ID to detect new opens
 */

import { useKeyValue, useUserStorageValue } from "@/contexts/KeyValueContext";
import { logger } from "@/lib/logger";
import { useCallback, useEffect } from "react";
import { AppState, Linking } from "react-native";

import type { UpdatePreferencesPayload } from "@/api/preferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUpdatePreferences } from "./queries";
import { useAppState } from "./useAppState";

// ── Storage Keys ────────────────────────────────────────────────────────────

const SECTION_STARTED_KEY = "legacy_made_section_started";
const LEFT_MID_PROGRESS_KEY = "legacy_made_left_mid_progress";
const PROMPT_DISMISSED_KEY = "legacy_made_reminder_prompt_dismissed4";

// ── Hook: Track section activity ────────────────────────────────────────────

/**
 * Call this in section screens (vault/wishes/legacy entry forms)
 * to track that the user has started working in a section.
 *
 * Also sets the "left mid-progress" flag when the app backgrounds
 * while this hook is mounted (i.e. user is in a section).
 */
export function useTrackSectionActivity() {
  const { userStorage } = useKeyValue();

  // Mark that the user has started a section
  useEffect(() => {
    userStorage.set(SECTION_STARTED_KEY, true);
  }, [userStorage]);

  // Track app backgrounding while in a section
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        userStorage.set(LEFT_MID_PROGRESS_KEY, true);
      }
    });

    return () => subscription.remove();
  }, [userStorage]);
}

// ── Hook: Reminder prompt state ─────────────────────────────────────────────

/**
 * Manages the soft reminder prompt visibility and actions.
 *
 * @param remindersEnabled - Whether reminders are currently enabled (from preferences query).
 *                           Pass `undefined` while loading — prompt won't show until known.
 */
export function useReminderPrompt(remindersEnabled: boolean | undefined) {
  const { userStorage } = useKeyValue();
  const { requestPermission, permissionStatus } = usePushNotifications();
  const updatePreferences = useUpdatePreferences();
  const updatePreferencesMutateAsync = updatePreferences.mutateAsync;
  const appStateStatus = useAppState();

  const sectionStarted = useUserStorageValue({
    key: SECTION_STARTED_KEY,
    get: (s) => s.getBoolean(SECTION_STARTED_KEY),
  });
  const leftMidProgress = useUserStorageValue({
    key: LEFT_MID_PROGRESS_KEY,
    get: (s) => s.getBoolean(LEFT_MID_PROGRESS_KEY),
  });
  const promptDismissed = useUserStorageValue({
    key: PROMPT_DISMISSED_KEY,
    get: (s) => s.getBoolean(PROMPT_DISMISSED_KEY),
  });

  const shouldShowPrompt =
    appStateStatus === "active" &&
    (permissionStatus !== "granted" || remindersEnabled === false) &&
    sectionStarted === true &&
    leftMidProgress === true &&
    !promptDismissed;

  const dismissPrompt = useCallback(() => {
    userStorage.set(PROMPT_DISMISSED_KEY, true);
    // Clear the mid-progress flag so it can re-trigger in the future
    // (if user later removes dismissal, e.g. via a re-prompt strategy)
    userStorage.remove(LEFT_MID_PROGRESS_KEY);
  }, [userStorage]);

  const acceptPrompt = useCallback(async () => {
    userStorage.set(PROMPT_DISMISSED_KEY, true);
    userStorage.remove(LEFT_MID_PROGRESS_KEY);

    // Enable reminders via API
    const payload: UpdatePreferencesPayload = {
      notifications: { reminders: { enabled: true } },
    };
    try {
      await updatePreferencesMutateAsync(payload);
    } catch (err) {
      logger.error("Failed to enable reminders from soft prompt", err);
    }

    if (permissionStatus === "denied") {
      await Linking.openSettings();
    } else {
      // Request OS permission if needed
      await requestPermission();
    }
  }, [
    permissionStatus,
    userStorage,
    requestPermission,
    updatePreferencesMutateAsync,
  ]);

  return {
    shouldShowPrompt,
    dismissPrompt,
    acceptPrompt,
  };
}
