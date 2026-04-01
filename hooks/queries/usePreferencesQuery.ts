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

/**
 * Update notification preferences with optimistic UI.
 * Send only the fields you want to change — the API deep-merges.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { preferences } = useApi();

  return useMutation({
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

      return { previous };
    },

    onError: (err, _vars, context) => {
      logger.error("Failed to update preferences", err);
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.preferences.current(),
          context.previous,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.preferences.current(),
      });
    },
  });
}
