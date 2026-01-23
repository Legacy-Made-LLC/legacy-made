/**
 * Query Hooks
 *
 * Re-exports all TanStack Query hooks for entries.
 */

export {
  useEntriesQuery,
  useEntryQuery,
  useAllEntriesQuery,
  useEntryCountsQuery,
} from './useEntriesQuery';

export {
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
} from './useEntriesMutations';
