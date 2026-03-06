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

// Messages
export {
  useMessagesQuery,
  useMessageQuery,
  useAllMessagesQuery,
  useMessageCountsQuery,
  usePrefetchMessagesByTaskKeys,
} from './useMessagesQuery';

export {
  useCreateMessage,
  useUpdateMessage,
  useDeleteMessage,
  MessageQuotaExceededError,
} from './useMessagesMutations';

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
  useMarkTaskNotApplicable,
  useDeleteTaskProgress,
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

// Subscriptions
export { useOpenPortal } from './useSubscriptionMutations';

// Trusted Contacts
export {
  useTrustedContactsQuery,
  useTrustedContactQuery,
} from './useTrustedContactsQuery';

export {
  useCreateTrustedContact,
  useUpdateTrustedContact,
  useRevokeTrustedContact,
  useDeleteTrustedContact,
  useResendInvitation,
} from './useTrustedContactsMutations';

// Preferences
export {
  usePreferences,
  useUpdatePreferences,
} from './usePreferencesQuery';

// Key Backup
export {
  useGenerateRecoveryDocumentMutation,
  useDisableRecoveryDocumentMutation,
  useEnableEscrowMutation,
  useRevokeEscrowMutation,
} from './useKeyBackupMutations';

// Crypto
export {
  useHasEncryptionKeysQuery,
  useDEKQuery,
  useKeyVersionQuery,
  usePlanE2EEStatusQuery,
  useBackupStatusQuery,
  useSharedPlanDEKQuery,
  useSetupKeysMutation,
  useRetrySetupMutation,
  useEscrowRecoveryMutation,
} from './useCryptoQueries';
