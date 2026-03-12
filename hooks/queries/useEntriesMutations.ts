/**
 * Entries Mutation Hooks
 *
 * TanStack Query hooks for creating, updating, and deleting entries.
 * Includes optimistic updates for a responsive UI.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type {
  CreateEntryRequest,
  EntitlementInfo,
  Entry,
  EntryCompletionStatus,
  MetadataSchema,
  TaskProgressData,
  UpdateEntryRequest,
} from "@/api/types";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import {
  encryptForCreate,
  encryptForUpdate,
} from "@/lib/crypto/entryEncryption";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { useSetProgressIfNew } from "@/hooks/queries/useProgressMutations";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom error for quota exceeded (client-side check)
 */
export class QuotaExceededError extends Error {
  code = "QUOTA_EXCEEDED" as const;
  limit: number;
  current: number;

  constructor(limit: number, current: number) {
    super(
      `You've reached your limit of ${limit} entries. Upgrade your plan to add more.`,
    );
    this.name = "QuotaExceededError";
    this.limit = limit;
    this.current = current;
  }
}

interface CreateEntryData<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata: T;
  metadataSchema: MetadataSchema;
  completionStatus?: EntryCompletionStatus;
}

interface UpdateEntryData<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata?: Partial<T>;
  metadataSchema?: MetadataSchema;
  completionStatus?: EntryCompletionStatus;
}

/**
 * Helper to optimistically update the entries quota count
 */
function updateEntriesQuota(
  entitlements: EntitlementInfo | undefined,
  delta: number,
): EntitlementInfo | undefined {
  if (!entitlements) return undefined;

  return {
    ...entitlements,
    quotas: entitlements.quotas.map((quota) =>
      quota.feature === "entries"
        ? { ...quota, current: Math.max(0, quota.current + delta) }
        : quota,
    ),
  };
}

/**
 * Hook for creating a new entry with optimistic updates
 *
 * Includes client-side quota checking to prevent unnecessary API calls.
 */
export function useCreateEntry<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { entries } = useApi();
  const { canCreate, getQuotaInfo } = useEntitlements();
  const { setIfNew } = useSetProgressIfNew();
  const crypto = useOptionalCrypto();

  return useMutation({
    mutationFn: async (data: CreateEntryData<T>) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }

      // Client-side quota check to provide immediate feedback
      if (!canCreate("entries")) {
        const quota = getQuotaInfo("entries");
        throw new QuotaExceededError(quota?.limit ?? 0, quota?.current ?? 0);
      }

      const baseRequest: CreateEntryRequest<T> = {
        planId,
        taskKey,
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
        completionStatus: data.completionStatus,
      };

      // Encrypt sensitive fields if crypto is available
      if (crypto?.activeDEK) {
        const encrypted = await encryptForCreate(
          { title: data.title, notes: data.notes, metadata: data.metadata },
          crypto.activeDEK,
        );
        return entries.create({
          ...baseRequest,
          ...encrypted,
        } as unknown as CreateEntryRequest);
      }

      return entries.create<T>(baseRequest);
    },
    onMutate: async (data) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      // Snapshot the previous values
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      // Create optimistic entry with temporary ID
      const optimisticEntry: Entry<T> = {
        id: `temp-${Date.now()}`,
        planId,
        taskKey,
        title: data.title ?? null,
        notes: data.notes ?? null,
        sortOrder: (previousEntries?.length ?? 0) + 1,
        completionStatus: data.completionStatus,
        metadata: data.metadata as T,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add entry to cache
      queryClient.setQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey),
        [...(previousEntries ?? []), optimisticEntry],
      );

      // Optimistically increment entries quota
      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateEntriesQuota(previousEntitlements, 1),
      );

      return { previousEntries, previousEntitlements };
    },
    onError: (_err, _data, context) => {
      if (!planId || !taskKey) return;

      // Rollback entries on error
      if (context?.previousEntries) {
        queryClient.setQueryData(
          queryKeys.entries.byTaskKey(planId, taskKey),
          context.previousEntries,
        );
      }

      // Rollback entitlements on error
      if (context?.previousEntitlements) {
        queryClient.setQueryData(
          queryKeys.entitlements.current(),
          context.previousEntitlements,
        );
      }
    },
    onSettled: (_data, error) => {
      if (!planId || !taskKey) return;

      // Invalidate to get the real server data with correct ID
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.counts(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.all(planId),
      });
      // Refresh all entitlements to update quota counts (includes plan entitlements)
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });

      // Auto-set progress to "in_progress" on first entry creation (fire-and-forget)
      if (!error) {
        setIfNew(taskKey);
      }
    },
  });
}

/**
 * Hook for updating an existing entry with optimistic updates
 */
export function useUpdateEntry<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { entries } = useApi();
  const crypto = useOptionalCrypto();

  return useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: UpdateEntryData<T>;
    }) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      const baseRequest: UpdateEntryRequest<T> = {
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
        completionStatus: data.completionStatus,
      };

      // Encrypt sensitive fields if crypto is available
      if (crypto?.activeDEK) {
        // Get current entry to merge metadata for encryption
        const currentEntries = queryClient.getQueryData<Entry<T>[]>(
          queryKeys.entries.byTaskKey(planId, taskKey!),
        );
        const currentEntry = currentEntries?.find((e) => e.id === entryId);
        const currentMetadata = currentEntry?.metadata ?? ({} as T);

        const encrypted = await encryptForUpdate(
          { title: data.title, notes: data.notes, metadata: data.metadata },
          currentMetadata,
          crypto.activeDEK,
        );
        return entries.update(planId, entryId, {
          ...baseRequest,
          ...encrypted,
        } as unknown as UpdateEntryRequest);
      }

      return entries.update<T>(planId, entryId, baseRequest);
    },
    onMutate: async ({ entryId, data }) => {
      if (!planId || !taskKey) return {};

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });

      // Snapshot the previous value
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey),
      );

      // Optimistically update the cache
      if (previousEntries) {
        queryClient.setQueryData<Entry<T>[]>(
          queryKeys.entries.byTaskKey(planId, taskKey),
          previousEntries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  ...(data.title !== undefined && { title: data.title }),
                  ...(data.notes !== undefined && { notes: data.notes }),
                  ...(data.metadata && {
                    metadata: { ...entry.metadata, ...data.metadata },
                  }),
                  ...(data.completionStatus !== undefined && {
                    completionStatus: data.completionStatus,
                  }),
                }
              : entry,
          ),
        );
      }

      return { previousEntries };
    },
    onError: (_err, _variables, context) => {
      if (!planId || !taskKey || !context?.previousEntries) return;

      // Rollback on error
      queryClient.setQueryData(
        queryKeys.entries.byTaskKey(planId, taskKey),
        context.previousEntries,
      );
    },
    onSettled: (_data, _error, variables) => {
      if (!planId || !taskKey) return;

      // Refetch to ensure cache is in sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });
      // Also invalidate the single entry query so the form shows fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.single(planId, variables.entryId),
      });
    },
  });
}

/**
 * Hook for deleting an entry with optimistic updates
 */
export function useDeleteEntry<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { entries, progress } = useApi();

  return useMutation({
    mutationFn: (entryId: string) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      return entries.delete(planId, entryId);
    },
    onMutate: async (entryId) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      // Snapshot the previous values
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      // Track whether this deletion removes the last entry
      const remainingCount = previousEntries
        ? previousEntries.filter((entry) => entry.id !== entryId).length
        : 0;

      // Optimistically remove entry from cache
      if (previousEntries) {
        queryClient.setQueryData<Entry<T>[]>(
          queryKeys.entries.byTaskKey(planId, taskKey),
          previousEntries.filter((entry) => entry.id !== entryId),
        );
      }

      // Optimistically decrement entries quota
      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateEntriesQuota(previousEntitlements, -1),
      );

      // If this was the last entry, optimistically clear progress
      if (remainingCount === 0) {
        queryClient.setQueryData<Record<string, TaskProgressData>>(
          queryKeys.progress.all(planId),
          (old) => {
            if (!old) return old;
            const updated = { ...old };
            delete updated[taskKey];
            return updated;
          },
        );
        queryClient.setQueryData(
          queryKeys.progress.byKey(planId, taskKey),
          null,
        );
      }

      return { previousEntries, previousEntitlements, remainingCount };
    },
    onError: (_err, _entryId, context) => {
      if (!planId || !taskKey) return;

      // Rollback entries on error
      if (context?.previousEntries) {
        queryClient.setQueryData(
          queryKeys.entries.byTaskKey(planId, taskKey),
          context.previousEntries,
        );
      }

      // Rollback entitlements on error
      if (context?.previousEntitlements) {
        queryClient.setQueryData(
          queryKeys.entitlements.current(),
          context.previousEntitlements,
        );
      }

      // Rollback progress if we optimistically cleared it
      if (context?.remainingCount === 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.all(planId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.byKey(planId, taskKey),
        });
      }
    },
    onSettled: (_data, error, _entryId, context) => {
      if (!planId || !taskKey) return;

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.counts(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entries.all(planId),
      });
      // Refresh all entitlements to update quota counts (includes plan entitlements)
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });

      // If last entry was deleted successfully, delete the progress record
      if (!error && context?.remainingCount === 0) {
        progress
          .delete(planId, taskKey)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.progress.all(planId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.progress.byKey(planId, taskKey),
            });
          })
          .catch(() => {
            // Progress deletion failed — refresh to get actual state
            queryClient.invalidateQueries({
              queryKey: queryKeys.progress.all(planId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.progress.byKey(planId, taskKey),
            });
          });
      }
    },
  });
}
