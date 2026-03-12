/**
 * Push Token API Service - Register/unregister Expo push tokens
 */

import type { ApiClient } from "./client";

const PUSH_TOKEN_PATH = "/push-notifications/token";

/**
 * Create push token service bound to an API client
 */
export function createPushTokensService(client: ApiClient) {
  return {
    /**
     * Register a push token for the authenticated user.
     * Backend upserts by token — safe to call on every app launch.
     */
    register: async (
      token: string,
      platform: "ios" | "android",
    ): Promise<void> => {
      await client.post<void>(PUSH_TOKEN_PATH, { token, platform });
    },

    /**
     * Unregister a push token (e.g. on sign-out).
     * Best-effort — callers should catch errors.
     */
    unregister: async (token: string): Promise<void> => {
      await client.post<void>(`${PUSH_TOKEN_PATH}/unregister`, { token });
    },
  };
}

/**
 * Type for the push tokens service
 */
export type PushTokensService = ReturnType<typeof createPushTokensService>;
