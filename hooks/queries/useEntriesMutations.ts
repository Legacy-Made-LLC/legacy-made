/**
 * Entries Mutation Hooks
 *
 * TanStack Query hooks for creating, updating, and deleting entries.
 * Includes optimistic updates for a responsive UI.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/api';
import type { CreateEntryRequest, Entry, UpdateEntryRequest } from '@/api/types';
import { usePlan } from '@/data/PlanProvider';
import { queryKeys } from '@/lib/queryKeys';

interface CreateEntryData<T = Record<string, unknown>> {
  title?: string;
  notes?: string;
  metadata: T;
}

interface UpdateEntryData<T = Record<string, unknown>> {
  title?: string;
  notes?: string;
  metadata?: Partial<T>;
}

/**
 * Hook for creating a new entry with optimistic updates
 */
export function useCreateEntry<T = Record<string, unknown>>(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { entries } = useApi();

  return useMutation({
    mutationFn: (data: CreateEntryData<T>) => {
      if (!planId || !taskKey) {
        throw new Error('Plan ID and task key are required');
      }

      const request: CreateEntryRequest<T> = {
        planId,
        taskKey,
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
      };

      return entries.create<T>(request);
    },
    onMutate: async (data) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });

      // Snapshot the previous value
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey)
      );

      // Create optimistic entry with temporary ID
      const optimisticEntry: Entry<T> = {
        id: `temp-${Date.now()}`,
        planId,
        taskKey,
        title: data.title ?? null,
        notes: data.notes ?? null,
        sortOrder: (previousEntries?.length ?? 0) + 1,
        metadata: data.metadata as T,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to cache
      queryClient.setQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey),
        [...(previousEntries ?? []), optimisticEntry]
      );

      return { previousEntries };
    },
    onError: (_err, _data, context) => {
      if (!planId || !taskKey || !context?.previousEntries) return;

      // Rollback on error
      queryClient.setQueryData(
        queryKeys.entries.byTaskKey(planId, taskKey),
        context.previousEntries
      );
    },
    onSettled: () => {
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
    },
  });
}

/**
 * Hook for updating an existing entry with optimistic updates
 */
export function useUpdateEntry<T = Record<string, unknown>>(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { entries } = useApi();

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateEntryData<T> }) => {
      if (!planId) {
        throw new Error('Plan ID is required');
      }

      const request: UpdateEntryRequest<T> = {
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
      };

      return entries.update<T>(planId, entryId, request);
    },
    onMutate: async ({ entryId, data }) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });

      // Snapshot the previous value
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey)
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
                  ...(data.metadata && { metadata: { ...entry.metadata, ...data.metadata } }),
                }
              : entry
          )
        );
      }

      return { previousEntries };
    },
    onError: (_err, _variables, context) => {
      if (!planId || !taskKey || !context?.previousEntries) return;

      // Rollback on error
      queryClient.setQueryData(
        queryKeys.entries.byTaskKey(planId, taskKey),
        context.previousEntries
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
export function useDeleteEntry<T = Record<string, unknown>>(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { entries } = useApi();

  return useMutation({
    mutationFn: (entryId: string) => {
      if (!planId) {
        throw new Error('Plan ID is required');
      }

      return entries.delete(planId, entryId);
    },
    onMutate: async (entryId) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
      });

      // Snapshot the previous value
      const previousEntries = queryClient.getQueryData<Entry<T>[]>(
        queryKeys.entries.byTaskKey(planId, taskKey)
      );

      // Optimistically remove from cache
      if (previousEntries) {
        queryClient.setQueryData<Entry<T>[]>(
          queryKeys.entries.byTaskKey(planId, taskKey),
          previousEntries.filter((entry) => entry.id !== entryId)
        );
      }

      return { previousEntries };
    },
    onError: (_err, _entryId, context) => {
      if (!planId || !taskKey || !context?.previousEntries) return;

      // Rollback on error
      queryClient.setQueryData(
        queryKeys.entries.byTaskKey(planId, taskKey),
        context.previousEntries
      );
    },
    onSettled: () => {
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
    },
  });
}
