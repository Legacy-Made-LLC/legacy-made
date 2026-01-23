/**
 * Query Key Factory
 *
 * Centralized query key definitions for type-safe, consistent cache management.
 * Using a factory pattern makes it easy to invalidate related queries.
 */

export const queryKeys = {
  entries: {
    // All entries for a plan
    all: (planId: string) => ['entries', planId] as const,
    // Entries filtered by taskKey
    byTaskKey: (planId: string, taskKey: string) => ['entries', planId, taskKey] as const,
    // Single entry detail
    single: (planId: string, entryId: string) => ['entries', planId, 'detail', entryId] as const,
    // Entry counts for dashboard
    counts: (planId: string) => ['entries', planId, 'counts'] as const,
  },
  plan: {
    // Current user's plan
    current: () => ['plan', 'current'] as const,
  },
} as const;
