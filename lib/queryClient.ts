/**
 * TanStack Query Client Configuration
 *
 * Configures the QueryClient with appropriate defaults for a mobile app.
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Keep unused data in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests twice
        retry: 2,
        // Refetch on app focus (configured via focusManager in QueryProvider)
        refetchOnWindowFocus: true,
        // Refetch on network reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });
}
