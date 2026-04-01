/**
 * NotificationPromptContext
 *
 * Controls visibility of the notification permission prompt.
 * The prompt appears once — after the user creates their first trusted contact —
 * because that's when push notifications become valuable.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useKeyValue, useUserStorageValue } from "./KeyValueContext";

const PROMPTED_STORAGE_KEY = "legacy_made_push_permission_prompted";

interface NotificationPromptContextValue {
  /** Whether the prompt bottom sheet should be visible */
  shouldShowPrompt: boolean;
  /** First name of the newly added contact (for personalized copy) */
  contactFirstName: string | null;
  /** Call after creating the first trusted contact */
  triggerPrompt: (firstName: string) => void;
  /** Dismiss the prompt (and persist so it never shows again) */
  dismissPrompt: () => void;
}

const NotificationPromptContext =
  createContext<NotificationPromptContextValue | null>(null);

export function NotificationPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [contactFirstName, setContactFirstName] = useState<string | null>(null);
  const { userStorage } = useKeyValue();

  const hasBeenPrompted = useUserStorageValue({
    key: PROMPTED_STORAGE_KEY,
    get: (s) => s.getBoolean(PROMPTED_STORAGE_KEY),
  });

  const triggerPrompt = useCallback(
    (firstName: string) => {
      // Don't re-prompt if already prompted or still loading
      if (hasBeenPrompted || hasBeenPrompted === undefined) return;
      setContactFirstName(firstName);
      setShouldShowPrompt(true);
    },
    [hasBeenPrompted],
  );

  const dismissPrompt = useCallback(() => {
    setShouldShowPrompt(false);
    userStorage.set(PROMPTED_STORAGE_KEY, true);
  }, [userStorage]);

  const value = useMemo(
    () => ({
      shouldShowPrompt,
      contactFirstName,
      triggerPrompt,
      dismissPrompt,
    }),
    [shouldShowPrompt, contactFirstName, triggerPrompt, dismissPrompt],
  );

  return (
    <NotificationPromptContext.Provider value={value}>
      {children}
    </NotificationPromptContext.Provider>
  );
}

export function useNotificationPrompt() {
  const ctx = useContext(NotificationPromptContext);
  if (!ctx) {
    throw new Error(
      "useNotificationPrompt must be used within NotificationPromptProvider",
    );
  }
  return ctx;
}
