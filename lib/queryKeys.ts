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
    // Files for a specific message
    byMessage: (messageId: string) => ['files', 'message', messageId] as const,
    // Single file detail
    single: (fileId: string) => ['files', 'detail', fileId] as const,
  },
  entitlements: {
    // All entitlements queries (use for invalidation to refresh both current + plan)
    all: () => ['entitlements'] as const,
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
  messages: {
    // All messages for a plan
    all: (planId: string) => ['messages', planId] as const,
    // Messages filtered by taskKey
    byTaskKey: (planId: string, taskKey: string) => ['messages', planId, taskKey] as const,
    // Single message detail
    single: (planId: string, messageId: string) => ['messages', planId, 'detail', messageId] as const,
    // Message counts for dashboard
    counts: (planId: string) => ['messages', planId, 'counts'] as const,
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
  crypto: {
    all: () => ['crypto'] as const,
    hasKeys: (userId: string) => ['crypto', 'hasKeys', userId] as const,
    dek: (userId: string) => ['crypto', 'dek', userId] as const,
    keyVersion: (userId: string) => ['crypto', 'keyVersion', userId] as const,
    e2eeStatus: (planId: string) => ['crypto', 'e2eeStatus', planId] as const,
    backupStatus: (planId: string) => ['crypto', 'backupStatus', planId] as const,
    sharedDEK: (planId: string, ownerId: string) =>
      ['crypto', 'sharedDEK', planId, ownerId] as const,
    recoveryEvents: () => ['crypto', 'recoveryEvents'] as const,
  },
} as const;
