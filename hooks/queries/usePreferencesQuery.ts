/**
 * Preferences Query & Mutation Hooks
 *
 * TanStack Query hooks for fetching and updating user notification preferences.
 * Includes optimistic updates for instant UI feedback.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type {
  UpdatePreferencesPayload,
  UserPreferences,
} from "@/api/preferences";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fetch the current user's notification preferences.
 */
export function usePreferences() {
  const { preferences } = useApi();

  return useQuery({
    queryKey: queryKeys.preferences.current(),
    queryFn: () => preferences.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

const UPDATE_PREFERENCES_KEY = ["preferences", "update"] as const;

/**
 * Update notification preferences with optimistic UI.
 * Send only the fields you want to change — the API deep-merges.
 *
 * - Saves run one at a time, in order (shared mutation scope), so quick
 *   successive changes reach the server in the order they were made, also
 *   when paused offline and resumed together.
 * - Each change applies to the cache at once. After a failure or once the
 *   last pending save settles, preferences are refetched from the server;
 *   no snapshot is restored, so a failed earlier save can't erase a later
 *   optimistic change.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { preferences } = useApi();

  return useMutation({
    mutationKey: UPDATE_PREFERENCES_KEY,
    scope: { id: "preferences" },
    mutationFn: (data: UpdatePreferencesPayload) => preferences.update(data),

    onMutate: async (data: UpdatePreferencesPayload) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.preferences.current(),
      });

      const previous = queryClient.getQueryData<UserPreferences>(
        queryKeys.preferences.current(),
      );

      // Optimistically deep-merge the update into cached preferences
      if (previous && data.notifications?.reminders) {
        queryClient.setQueryData<UserPreferences>(
          queryKeys.preferences.current(),
          {
            ...previous,
            notifications: {
              ...previous.notifications,
              reminders: {
                ...previous.notifications.reminders,
                ...data.notifications.reminders,
              },
            },
          },
        );
      }
    },

    onError: (err) => {
      logger.error("Failed to update preferences", err);
    },

    onSettled: () => {
      // Refetch only after the last pending save (this one still counts),
      // so a refetch can't show a state from before a save still queued.
      if (queryClient.isMutating({ mutationKey: UPDATE_PREFERENCES_KEY }) > 1) {
        return;
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.preferences.current(),
      });
    },
  });
}
