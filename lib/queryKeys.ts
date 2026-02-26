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
  files: {
    // Files for a specific entry
    byEntry: (entryId: string) => ['files', 'entry', entryId] as const,
    // Files for a specific wish
    byWish: (wishId: string) => ['files', 'wish', wishId] as const,
    // Single file detail
    single: (fileId: string) => ['files', 'detail', fileId] as const,
  },
  entitlements: {
    // Current user's entitlements
    current: () => ['entitlements', 'current'] as const,
    // Entitlements for a specific plan (plan owner's entitlements)
    forPlan: (planId: string) => ['entitlements', 'plan', planId] as const,
  },
  wishes: {
    // All wishes for a plan
    all: (planId: string) => ['wishes', planId] as const,
    // Wishes filtered by taskKey
    byTaskKey: (planId: string, taskKey: string) => ['wishes', planId, taskKey] as const,
    // Single wish detail
    single: (planId: string, wishId: string) => ['wishes', planId, 'detail', wishId] as const,
    // Wish counts for dashboard
    counts: (planId: string) => ['wishes', planId, 'counts'] as const,
  },
  progress: {
    // All progress records for a plan
    all: (planId: string) => ['progress', planId] as const,
    // Single progress record by taskKey
    byKey: (planId: string, key: string) => ['progress', planId, key] as const,
  },
  trustedContacts: {
    // All trusted contacts for a plan
    all: (planId: string) => ['trustedContacts', planId] as const,
    // Single trusted contact detail
    single: (planId: string, contactId: string) =>
      ['trustedContacts', planId, 'detail', contactId] as const,
  },
  sharedPlans: {
    // All plans shared with the current user
    all: () => ['sharedPlans'] as const,
  },
} as const;
