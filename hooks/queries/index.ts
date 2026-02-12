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

// Entitlements
export { useEntitlementsQuery } from './useEntitlementsQuery';

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
