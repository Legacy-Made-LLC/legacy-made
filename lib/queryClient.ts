/**
 * TanStack Query Client Configuration
 *
 * Configures the QueryClient with appropriate defaults for a mobile app.
 */

import { MutationCache, QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

import { ApiClientError } from '@/api/errors';

/**
 * Skip retries for server-confirmed 401/403 errors — these indicate real auth
 * or permission issues that will never succeed on retry.
 *
 * Client-side 401s (e.g. Clerk couldn't refresh a token while offline) have no
 * `originalError` because they never reached the server. These ARE retryable —
 * with `offlineFirst`, TanStack Query will pause retries until network returns,
 * then Clerk can refresh the token and the request succeeds.
 */
function shouldRetry(failureCount: number, error: Error, maxRetries: number): boolean {
  if (error instanceof ApiClientError && (error.statusCode === 401 || error.statusCode === 403)) {
    // originalError is set only when the server responded with 401/403.
    // No originalError means the client threw before the request was sent
    // (e.g. Clerk token refresh failed due to no network).
    if (error.originalError) {
      return false;
    }
  }
  return failureCount < maxRetries;
}

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onMutate(_variables, mutation) {
        const key = mutation.options.mutationKey;
        Sentry.addBreadcrumb({
          category: "mutation",
          message: `Mutation started${key ? `: ${JSON.stringify(key)}` : ""}`,
          level: "info",
        });
      },
      onError(error, _variables, _context, mutation) {
        const key = mutation.options.mutationKey;
        Sentry.addBreadcrumb({
          category: "mutation",
          message: `Mutation failed${key ? `: ${JSON.stringify(key)}` : ""}`,
          level: "error",
          data: {
            error: error.message,
          },
        });
        Sentry.captureException(error);
      },
    }),
    defaultOptions: {
      queries: {
        // Data considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Keep unused data in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests twice, but skip 401/403
        retry: (failureCount, error) => shouldRetry(failureCount, error, 2),
        // Refetch on app focus (configured via focusManager in QueryProvider)
        refetchOnWindowFocus: true,
        // Refetch on network reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Fire mutations immediately regardless of detected network state.
        // If the request fails and the device is offline, retries pause until reconnect.
        // If the device actually has internet (false negative), the request just succeeds.
        networkMode: 'offlineFirst',
        // Retry mutations once, but skip 401/403
        retry: (failureCount, error) => shouldRetry(failureCount, error, 1),
      },
    },
  });
}
