/**
 * Query Hooks
 *
 * Re-exports all TanStack Query hooks for entries and wishes.
 */

// Entries
export {
  useEntriesQuery,
  useEntryQuery,
  useAllEntriesQuery,
  useEntryCountsQuery,
  usePrefetchEntriesByTaskKeys,
} from './useEntriesQuery';

export {
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  QuotaExceededError,
} from './useEntriesMutations';

// Wishes
export {
  useWishesQuery,
  useWishQuery,
  useAllWishesQuery,
  useWishCountsQuery,
  usePrefetchWishesByTaskKeys,
} from './useWishesQuery';

export {
  useCreateWish,
  useUpdateWish,
  useDeleteWish,
  WishQuotaExceededError,
} from './useWishesMutations';

// Plan
export { usePlanQuery } from './usePlanQuery';

// Entitlements
export { useEntitlementsQuery, usePlanEntitlementsQuery } from './useEntitlementsQuery';

// Progress
export {
  useAllProgressQuery,
  useTaskProgressQuery,
} from './useProgressQuery';

export {
  useMarkTaskComplete,
  useMarkTaskInProgress,
  useSetProgressIfNew,
} from './useProgressMutations';

// Shared Plans
export { useSharedPlansQuery } from './useSharedPlansQuery';

export {
  useAcceptSharedPlan,
  useDeclineSharedPlan,
} from './useSharedPlansMutations';

// Access Invitations
export {
  useAcceptAccessInvitation,
  useDeclineAccessInvitation,
} from './useAccessInvitationMutations';

// Trusted Contacts
export {
  useTrustedContactsQuery,
  useTrustedContactQuery,
} from './useTrustedContactsQuery';

export {
  useCreateTrustedContact,
  useUpdateTrustedContact,
  useDeleteTrustedContact,
  useResendInvitation,
} from './useTrustedContactsMutations';
