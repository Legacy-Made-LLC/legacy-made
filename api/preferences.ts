/**
 * Preferences API Service — User notification preferences and timezone
 */

import type { ApiClient } from "./client";

// ── Types ───────────────────────────────────────────────────────────────────

export type ReminderFrequency = "weekly" | "biweekly" | "monthly";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "custom";

export interface ReminderPreferences {
  enabled: boolean;
  frequency: ReminderFrequency;
  time_of_day: TimeOfDay;
  custom_time: string | null;
  enabled_at: string | null;
}

export interface UserPreferences {
  userId: string;
  timezone: string;
  notifications: {
    reminders: ReminderPreferences;
  };
  updatedAt: string | null;
}

/** Deep-partial shape accepted by PATCH /preferences */
export interface UpdatePreferencesPayload {
  notifications?: {
    reminders?: Partial<Omit<ReminderPreferences, "enabled_at">>;
  };
}

// ── Service ─────────────────────────────────────────────────────────────────

const PREFERENCES_PATH = "/preferences";

/**
 * Create preferences service bound to an API client
 */
export function createPreferencesService(client: ApiClient) {
  return {
    /**
     * Fetch the current user's full preferences.
     * Returns defaults for new users (no row yet).
     */
    get: async (): Promise<UserPreferences> => {
      return client.get<UserPreferences>(PREFERENCES_PATH);
    },

    /**
     * Deep-merge update notification preferences.
     * Only send the fields you want to change.
     */
    update: async (
      data: UpdatePreferencesPayload,
    ): Promise<UserPreferences> => {
      return client.patch<UserPreferences>(PREFERENCES_PATH, data);
    },

    /**
     * Upsert the user's timezone. Fire-and-forget on every app launch.
     */
    updateTimezone: async (timezone: string): Promise<void> => {
      await client.put<void>(`${PREFERENCES_PATH}/timezone`, { timezone });
    },
  };
}

/**
 * Type for the preferences service
 */
export type PreferencesService = ReturnType<typeof createPreferencesService>;
