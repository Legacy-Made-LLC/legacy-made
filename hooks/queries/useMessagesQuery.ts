/**
 * Messages Query Hooks
 *
 * TanStack Query hooks for fetching legacy messages data.
 * Messages are automatically decrypted if they have encrypted metadata.
 * Follows same pattern as useEntriesQuery.ts for consistency.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApi } from "@/api";
import type { Message } from "@/api/types";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { decryptEntry, isEncryptedEntry } from "@/lib/crypto/entryEncryption";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to fetch messages by taskKey
 *
 * @param taskKey - The task key to filter messages (e.g., "messages.people")
 * @returns Query result with messages array
 */
export function useMessagesQuery<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const { planId } = usePlan();
  const { messages } = useApi();
  const crypto = useOptionalCrypto();
  const cryptoReady = !crypto || (crypto.isReady && !crypto.isActiveDEKLoading);

  return useQuery({
    queryKey: queryKeys.messages.byTaskKey(planId!, taskKey!),
    queryFn: async () => {
      const raw = await messages.listByTaskKey<T>(planId!, taskKey!);
      if (!crypto?.activeDEK) return raw;
      return Promise.all(
        raw.map(async (m) => {
          if (!isEncryptedEntry(m)) return m;
          const decrypted = await decryptEntry<T>(
            m as unknown as Parameters<typeof decryptEntry>[0],
            crypto.activeDEK!,
          );
          return decrypted as unknown as Message<T>;
        }),
      );
    },
    enabled: !!planId && !!taskKey && cryptoReady,
  });
}

/**
 * Hook to fetch a single message by ID
 *
 * Uses initialData from cached list queries for instant display,
 * then refetches if data is stale.
 */
export function useMessageQuery<T = Record<string, unknown>>(
  messageId: string | undefined,
  taskKey?: string,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { messages } = useApi();
  const crypto = useOptionalCrypto();
  const cryptoReady = !crypto || (crypto.isReady && !crypto.isActiveDEKLoading);

  return useQuery({
    queryKey: queryKeys.messages.single(planId!, messageId!),
    queryFn: async () => {
      const raw = await messages.get<T>(planId!, messageId!);
      if (!crypto?.activeDEK || !isEncryptedEntry(raw)) return raw;
      const decrypted = await decryptEntry<T>(
        raw as unknown as Parameters<typeof decryptEntry>[0],
        crypto.activeDEK,
      );
      return decrypted as unknown as Message<T>;
    },
    enabled: !!planId && !!messageId && cryptoReady,
    initialData: () => {
      if (!planId || !messageId) return undefined;

      // Try to find in taskKey-specific list first
      if (taskKey) {
        const listData = queryClient.getQueryData<Message<T>[]>(
          queryKeys.messages.byTaskKey(planId, taskKey),
        );
        const found = listData?.find((msg) => msg.id === messageId);
        if (found) return found;
      }

      // Fall back to all messages cache
      const allData = queryClient.getQueryData<Message[]>(
        queryKeys.messages.all(planId),
      );
      return allData?.find((msg) => msg.id === messageId) as Message<T> | undefined;
    },
    initialDataUpdatedAt: () => {
      if (!planId) return undefined;

      if (taskKey) {
        const state = queryClient.getQueryState(
          queryKeys.messages.byTaskKey(planId, taskKey),
        );
        if (state?.dataUpdatedAt) return state.dataUpdatedAt;
      }

      return queryClient.getQueryState(queryKeys.messages.all(planId))
        ?.dataUpdatedAt;
    },
  });
}

/**
 * Hook to fetch all messages for a plan (for counting)
 */
export function useAllMessagesQuery() {
  const { planId } = usePlan();
  const { messages } = useApi();

  return useQuery({
    queryKey: queryKeys.messages.all(planId!),
    queryFn: () => messages.listAll(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook to get message counts by taskKey for dashboard display
 */
export function useMessageCountsQuery() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { messages } = useApi();
  const crypto = useOptionalCrypto();

  return useQuery({
    queryKey: queryKeys.messages.counts(planId!),
    queryFn: async () => {
      const allMessages = await messages.listAll(planId!);
      const countMap: Record<string, number> = {};
      const groupedByTaskKey: Record<string, Message[]> = {};

      for (const msg of allMessages) {
        const key = msg.taskKey;
        if (key) {
          countMap[key] = (countMap[key] || 0) + 1;
          if (!groupedByTaskKey[key]) {
            groupedByTaskKey[key] = [];
          }
          groupedByTaskKey[key].push(msg);
        }
      }

      // Seed individual task caches for instant navigation —
      // but NOT when crypto is active, since this raw data is encrypted.
      if (!crypto) {
        for (const [taskKey, taskMessages] of Object.entries(groupedByTaskKey)) {
          queryClient.setQueryData(
            queryKeys.messages.byTaskKey(planId!, taskKey),
            taskMessages,
          );
        }

        // Also seed the all messages cache
        queryClient.setQueryData(queryKeys.messages.all(planId!), allMessages);
      }

      return countMap;
    },
    enabled: !!planId,
  });
}

/**
 * Hook to prefetch messages for multiple task keys
 */
export function usePrefetchMessagesByTaskKeys(taskKeys: string[]) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { messages } = useApi();
  const crypto = useOptionalCrypto();

  useEffect(() => {
    if (!planId || taskKeys.length === 0) return;

    // Skip prefetch when crypto is active — would cache encrypted data
    if (crypto) return;

    taskKeys.forEach((taskKey) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
        queryFn: () => messages.listByTaskKey(planId, taskKey),
      });
    });
  }, [planId, taskKeys, queryClient, messages, crypto]);
}
