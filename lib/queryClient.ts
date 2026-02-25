/**
 * TanStack Query Client Configuration
 *
 * Configures the QueryClient with appropriate defaults for a mobile app.
 */

import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

import { ApiClientError } from '@/api/errors';

/**
 * Skip retries for 401/403 errors — they indicate auth or permission issues
 * that will never succeed on retry.
 */
function shouldRetry(failureCount: number, error: Error, maxRetries: number): boolean {
  if (error instanceof ApiClientError && (error.statusCode === 401 || error.statusCode === 403)) {
    return false;
  }
  return failureCount < maxRetries;
}

export function createQueryClient() {
  return new QueryClient({
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
        // Retry mutations once, but skip 401/403
        retry: (failureCount, error) => shouldRetry(failureCount, error, 1),
        // Report all mutation errors to Sentry
        onError: (error) => {
          Sentry.captureException(error);
        },
      },
    },
  });
}
