/**
 * Wishes Mutation Hooks
 *
 * TanStack Query hooks for creating, updating, and deleting wishes.
 * Includes optimistic updates for a responsive UI.
 *
 * Follows same pattern as useEntriesMutations.ts for consistency.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type {
  CreateWishRequest,
  EntitlementInfo,
  MetadataSchema,
  UpdateWishRequest,
  Wish,
} from "@/api/types";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom error for quota exceeded (client-side check)
 */
export class WishQuotaExceededError extends Error {
  code = "QUOTA_EXCEEDED" as const;
  limit: number;
  current: number;

  constructor(limit: number, current: number) {
    super(
      `You've reached your limit of ${limit} wishes. Upgrade your plan to add more.`,
    );
    this.name = "WishQuotaExceededError";
    this.limit = limit;
    this.current = current;
  }
}

interface CreateWishData<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata: T;
  /** Display schema for rendering metadata */
  metadataSchema: MetadataSchema;
}

interface UpdateWishData<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata?: Partial<T>;
  /** Full replacement of display schema (if provided) */
  metadataSchema?: MetadataSchema;
}

/**
 * Helper to optimistically update the wishes quota count
 * Note: Currently wishes may share quota with entries or have separate quota.
 * This uses the "entries" quota for now until a separate wishes quota is defined.
 */
function updateWishesQuota(
  entitlements: EntitlementInfo | undefined,
  delta: number,
): EntitlementInfo | undefined {
  if (!entitlements) return undefined;

  // For now, wishes may share quota with entries
  // Update this if a separate "wishes" quota feature is added
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
 * Hook for creating a new wish with optimistic updates
 *
 * @param taskKey - The task key for the wish (e.g., "wishes.carePrefs.whatMatters")
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const createWish = useCreateWish('wishes.carePrefs.whatMatters');
 *
 * await createWish.mutateAsync({
 *   title: 'My Values',
 *   metadata: { values: ['comfort', 'connected'] }
 * });
 * ```
 */
export function useCreateWish<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();
  const { canCreate, getQuotaInfo } = useEntitlements();

  return useMutation({
    mutationFn: (data: CreateWishData<T>) => {
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }

      // Client-side quota check to provide immediate feedback
      // Note: This checks "entries" quota - adjust if wishes have separate quota
      if (!canCreate("entries")) {
        const quota = getQuotaInfo("entries");
        throw new WishQuotaExceededError(
          quota?.limit ?? 0,
          quota?.current ?? 0,
        );
      }

      const request: CreateWishRequest<T> = {
        planId,
        taskKey,
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
      };

      return wishes.create<T>(request);
    },
    onMutate: async (data) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.wishes.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      // Snapshot the previous values
      const previousWishes = queryClient.getQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      // Create optimistic wish with temporary ID
      const optimisticWish: Wish<T> = {
        id: `temp-${Date.now()}`,
        planId,
        taskKey,
        title: data.title ?? null,
        notes: data.notes ?? null,
        sortOrder: (previousWishes?.length ?? 0) + 1,
        metadata: data.metadata as T,
        metadataSchema: data.metadataSchema,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add wish to cache
      queryClient.setQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
        [...(previousWishes ?? []), optimisticWish],
      );

      // Optimistically increment quota
      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateWishesQuota(previousEntitlements, 1),
      );

      return { previousWishes, previousEntitlements };
    },
    onError: (_err, _data, context) => {
      if (!planId || !taskKey) return;

      // Rollback wishes on error
      if (context?.previousWishes) {
        queryClient.setQueryData(
          queryKeys.wishes.byTaskKey(planId, taskKey),
          context.previousWishes,
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
    onSuccess: (newWish) => {
      if (!planId || !taskKey) return;

      // Replace optimistic wish (with temp ID) with real server response
      queryClient.setQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
        (old) => {
          if (!old) return [newWish];
          // Remove temp wish and add real one
          return [...old.filter((w) => !w.id.startsWith("temp-")), newWish];
        },
      );

      // Update counts cache directly
      queryClient.setQueryData<Record<string, number>>(
        queryKeys.wishes.counts(planId),
        (old) => {
          if (!old) return { [taskKey]: 1 };
          return { ...old, [taskKey]: (old[taskKey] || 0) + 1 };
        },
      );

      // Update all wishes cache (cast to base Wish type)
      queryClient.setQueryData<Wish[]>(queryKeys.wishes.all(planId), (old) => {
        if (!old) return [newWish as Wish];
        return [
          ...old.filter((w) => !w.id.startsWith("temp-")),
          newWish as Wish,
        ];
      });
    },
    onSettled: () => {
      if (!planId || !taskKey) return;

      // Background refresh to ensure everything is in sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.current(),
      });
    },
  });
}

/**
 * Hook for updating an existing wish with optimistic updates
 *
 * @param taskKey - The task key for the wish
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const updateWish = useUpdateWish('wishes.carePrefs.whatMatters');
 *
 * await updateWish.mutateAsync({
 *   wishId: 'wish-123',
 *   data: { metadata: { values: ['comfort', 'dignity'] } }
 * });
 * ```
 */
export function useUpdateWish<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();

  return useMutation({
    mutationFn: ({
      wishId,
      data,
    }: {
      wishId: string;
      data: UpdateWishData<T>;
    }) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      const request: UpdateWishRequest<T> = {
        title: data.title,
        notes: data.notes,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
      };

      return wishes.update<T>(planId, wishId, request);
    },
    onMutate: async ({ wishId, data }) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.wishes.byTaskKey(planId, taskKey),
      });

      // Snapshot the previous value
      const previousWishes = queryClient.getQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
      );

      // Optimistically update the cache
      if (previousWishes) {
        queryClient.setQueryData<Wish<T>[]>(
          queryKeys.wishes.byTaskKey(planId, taskKey),
          previousWishes.map((wish) =>
            wish.id === wishId
              ? {
                  ...wish,
                  ...(data.title !== undefined && { title: data.title }),
                  ...(data.notes !== undefined && { notes: data.notes }),
                  ...(data.metadata && {
                    metadata: { ...wish.metadata, ...data.metadata },
                  }),
                  ...(data.metadataSchema && {
                    metadataSchema: data.metadataSchema,
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : wish,
          ),
        );
      }

      return { previousWishes };
    },
    onError: (_err, _variables, context) => {
      if (!planId || !taskKey || !context?.previousWishes) return;

      // Rollback on error
      queryClient.setQueryData(
        queryKeys.wishes.byTaskKey(planId, taskKey),
        context.previousWishes,
      );
    },
    onSuccess: (updatedWish, variables) => {
      if (!planId || !taskKey) return;

      // Update the cache with the real server response
      queryClient.setQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
        (old) => {
          if (!old) return [updatedWish];
          return old.map((w) => (w.id === variables.wishId ? updatedWish : w));
        },
      );

      // Update single wish cache
      queryClient.setQueryData(
        queryKeys.wishes.single(planId, variables.wishId),
        updatedWish,
      );

      // Update all wishes cache (cast to base Wish type)
      queryClient.setQueryData<Wish[]>(queryKeys.wishes.all(planId), (old) => {
        if (!old) return [updatedWish as Wish];
        return old.map((w) =>
          w.id === variables.wishId ? (updatedWish as Wish) : w,
        );
      });
    },
  });
}

/**
 * Hook for deleting a wish with optimistic updates
 *
 * @param taskKey - The task key for the wish
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const deleteWish = useDeleteWish('wishes.carePrefs.whatMatters');
 *
 * await deleteWish.mutateAsync('wish-123');
 * ```
 */
export function useDeleteWish<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();

  return useMutation({
    mutationFn: (wishId: string) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      return wishes.delete(planId, wishId);
    },
    onMutate: async (wishId) => {
      if (!planId || !taskKey) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.wishes.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      // Snapshot the previous values
      const previousWishes = queryClient.getQueryData<Wish<T>[]>(
        queryKeys.wishes.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      // Optimistically remove wish from cache
      if (previousWishes) {
        queryClient.setQueryData<Wish<T>[]>(
          queryKeys.wishes.byTaskKey(planId, taskKey),
          previousWishes.filter((wish) => wish.id !== wishId),
        );
      }

      // Optimistically decrement quota
      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateWishesQuota(previousEntitlements, -1),
      );

      return { previousWishes, previousEntitlements };
    },
    onError: (_err, _wishId, context) => {
      if (!planId || !taskKey) return;

      // Rollback wishes on error
      if (context?.previousWishes) {
        queryClient.setQueryData(
          queryKeys.wishes.byTaskKey(planId, taskKey),
          context.previousWishes,
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
    onSuccess: (_data, wishId) => {
      if (!planId || !taskKey) return;

      // Update counts cache directly (decrement)
      queryClient.setQueryData<Record<string, number>>(
        queryKeys.wishes.counts(planId),
        (old) => {
          if (!old) return {};
          const newCount = Math.max(0, (old[taskKey] || 0) - 1);
          return { ...old, [taskKey]: newCount };
        },
      );

      // Remove from all wishes cache
      queryClient.setQueryData<Wish[]>(queryKeys.wishes.all(planId), (old) => {
        if (!old) return [];
        return old.filter((w) => w.id !== wishId);
      });

      // Remove single wish from cache
      queryClient.removeQueries({
        queryKey: queryKeys.wishes.single(planId, wishId),
      });
    },
    onSettled: () => {
      if (!planId || !taskKey) return;

      // Background refresh entitlements to ensure quota is accurate
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.current(),
      });
    },
  });
}
