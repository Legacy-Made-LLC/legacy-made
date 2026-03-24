/**
 * Messages Mutation Hooks
 *
 * TanStack Query hooks for creating, updating, and deleting legacy messages.
 * Includes optimistic updates for a responsive UI.
 * Sensitive fields (title, notes, metadata) are encrypted before sending to server.
 *
 * Follows same pattern as useEntriesMutations.ts for consistency.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type {
  CreateMessageRequest,
  EntitlementInfo,
  EntryCompletionStatus,
  Message,
  MetadataSchema,
  UpdateMessageRequest,
} from "@/api/types";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { useSetProgressIfNew } from "@/hooks/queries/useProgressMutations";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import {
  encryptForCreate,
  encryptForUpdate,
} from "@/lib/crypto/entryEncryption";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom error for quota exceeded (client-side check)
 */
export class MessageQuotaExceededError extends Error {
  code = "QUOTA_EXCEEDED" as const;
  limit: number;
  current: number;

  constructor(limit: number, current: number) {
    super(
      `You've reached your limit of ${limit} messages. Upgrade your plan to add more.`,
    );
    this.name = "MessageQuotaExceededError";
    this.limit = limit;
    this.current = current;
  }
}

interface CreateMessageData<T = Record<string, unknown>> {
  /** Optional client-generated UUID */
  id?: string;
  title?: string;
  notes?: string | null;
  metadata: T;
  metadataSchema: MetadataSchema;
  completionStatus?: EntryCompletionStatus;
}

interface UpdateMessageData<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata?: Partial<T>;
  metadataSchema?: MetadataSchema;
  completionStatus?: EntryCompletionStatus;
}

/**
 * Helper to optimistically update the messages quota count
 */
function updateMessagesQuota(
  entitlements: EntitlementInfo | undefined,
  delta: number,
): EntitlementInfo | undefined {
  if (!entitlements) return undefined;

  return {
    ...entitlements,
    quotas: entitlements.quotas.map((quota) =>
      quota.feature === "legacy_messages"
        ? { ...quota, current: Math.max(0, quota.current + delta) }
        : quota,
    ),
  };
}

/**
 * Hook for creating a new message with optimistic updates
 */
export function useCreateMessage<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { messages } = useApi();
  const { canCreate, getQuotaInfo } = useEntitlements();
  const { setIfNew } = useSetProgressIfNew();
  const crypto = useOptionalCrypto();

  return useMutation({
    mutationFn: async (data: CreateMessageData<T>) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }

      // Client-side quota check
      if (!canCreate("legacy_messages")) {
        const quota = getQuotaInfo("legacy_messages");
        throw new MessageQuotaExceededError(
          quota?.limit ?? 0,
          quota?.current ?? 0,
        );
      }

      const baseRequest: CreateMessageRequest<T> = {
        ...(data.id ? { id: data.id } : {}),
        planId,
        taskKey,
        title: data.title,
        notes: data.notes,
        completionStatus: data.completionStatus,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
      };

      // Encrypt sensitive fields if crypto is available
      if (crypto?.activeDEK) {
        const encrypted = await encryptForCreate(
          { title: data.title, notes: data.notes, metadata: data.metadata },
          crypto.activeDEK,
        );
        return messages.create({
          ...baseRequest,
          ...encrypted,
        } as unknown as CreateMessageRequest);
      }

      return messages.create<T>(baseRequest);
    },
    onMutate: async (data) => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      const previousMessages = queryClient.getQueryData<Message<T>[]>(
        queryKeys.messages.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      // Use client-generated ID if provided
      const optimisticMessage: Message<T> = {
        id: data.id ?? `temp-${Date.now()}`,
        planId,
        taskKey,
        title: data.title ?? null,
        notes: data.notes ?? null,
        sortOrder: (previousMessages?.length ?? 0) + 1,
        completionStatus: data.completionStatus,
        metadata: data.metadata as T,
        metadataSchema: data.metadataSchema,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message<T>[]>(
        queryKeys.messages.byTaskKey(planId, taskKey),
        [...(previousMessages ?? []), optimisticMessage],
      );

      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateMessagesQuota(previousEntitlements, 1),
      );

      return { previousMessages, previousEntitlements };
    },
    onError: (_err, _data, context) => {
      if (!planId || !taskKey) return;

      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.byTaskKey(planId, taskKey),
          context.previousMessages,
        );
      }

      if (context?.previousEntitlements) {
        queryClient.setQueryData(
          queryKeys.entitlements.current(),
          context.previousEntitlements,
        );
      }
    },
    onSuccess: (newMessage) => {
      if (!planId || !taskKey) return;

      // Replace temp-ID optimistic entry with the real entry.
      // Preserve decrypted metadata from the optimistic entry since the
      // server response contains encrypted fields.
      const typedMessage = newMessage as Message<T>;
      const isOptimistic = (m: Message<T>) =>
        m.id.startsWith("temp-") || m.id === typedMessage.id;
      queryClient.setQueryData<Message<T>[]>(
        queryKeys.messages.byTaskKey(planId, taskKey),
        (old) => {
          if (!old) return [typedMessage];
          const optimistic = old.find(isOptimistic);
          const merged = optimistic
            ? {
                ...optimistic,
                id: typedMessage.id,
                createdAt: typedMessage.createdAt,
                updatedAt: typedMessage.updatedAt,
              }
            : typedMessage;
          return [...old.filter((m) => !isOptimistic(m)), merged];
        },
      );

      queryClient.setQueryData<Record<string, number>>(
        queryKeys.messages.counts(planId),
        (old) => {
          if (!old) return { [taskKey]: 1 };
          return { ...old, [taskKey]: (old[taskKey] || 0) + 1 };
        },
      );

      const isOptimisticAll = (m: Message) =>
        m.id.startsWith("temp-") || m.id === typedMessage.id;
      queryClient.setQueryData<Message[]>(
        queryKeys.messages.all(planId),
        (old) => {
          if (!old) return [typedMessage as unknown as Message];
          const optimistic = old.find(isOptimisticAll);
          const merged = optimistic
            ? {
                ...optimistic,
                id: typedMessage.id,
                createdAt: typedMessage.createdAt,
                updatedAt: typedMessage.updatedAt,
              }
            : (typedMessage as unknown as Message);
          return [...old.filter((m) => !isOptimisticAll(m)), merged];
        },
      );
    },
    onSettled: (_data, error) => {
      if (!planId || !taskKey) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });

      // Refetch to ensure cache has decrypted data (server returns encrypted)
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
      });

      if (!error) {
        setIfNew(taskKey);
      }
    },
  });
}

/**
 * Hook for updating an existing message with optimistic updates
 */
export function useUpdateMessage<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { messages } = useApi();
  const crypto = useOptionalCrypto();

  return useMutation({
    mutationFn: async ({
      messageId,
      data,
    }: {
      messageId: string;
      data: UpdateMessageData<T>;
    }) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      // Encrypt sensitive fields if crypto is available
      if (crypto?.activeDEK) {
        // Get current message to merge metadata for encryption
        const currentMessages = queryClient.getQueryData<Message<T>[]>(
          taskKey
            ? queryKeys.messages.byTaskKey(planId, taskKey)
            : queryKeys.messages.all(planId),
        );
        const currentMessage = currentMessages?.find((m) => m.id === messageId);
        if (!currentMessage) {
          throw new Error(
            `Cannot encrypt update: message ${messageId} not found in cache. The message must be loaded before updating.`,
          );
        }
        const currentMetadata = currentMessage.metadata;

        const encrypted = await encryptForUpdate(
          { title: data.title, notes: data.notes, metadata: data.metadata },
          currentMetadata,
          crypto.activeDEK,
        );

        return messages.update(planId, messageId, {
          completionStatus: data.completionStatus,
          metadataSchema: data.metadataSchema,
          ...encrypted,
        } as unknown as UpdateMessageRequest);
      }

      const request: UpdateMessageRequest<T> = {
        title: data.title,
        notes: data.notes,
        completionStatus: data.completionStatus,
        metadata: data.metadata,
        metadataSchema: data.metadataSchema,
      };

      return messages.update<T>(planId, messageId, request);
    },
    onMutate: async ({ messageId, data }) => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
      });

      const previousMessages = queryClient.getQueryData<Message<T>[]>(
        queryKeys.messages.byTaskKey(planId, taskKey),
      );

      if (previousMessages) {
        queryClient.setQueryData<Message<T>[]>(
          queryKeys.messages.byTaskKey(planId, taskKey),
          previousMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  ...(data.title !== undefined && { title: data.title }),
                  ...(data.notes !== undefined && { notes: data.notes }),
                  ...(data.metadata && {
                    metadata: { ...msg.metadata, ...data.metadata },
                  }),
                  ...(data.metadataSchema && {
                    metadataSchema: data.metadataSchema,
                  }),
                  ...(data.completionStatus !== undefined && {
                    completionStatus: data.completionStatus,
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : msg,
          ),
        );
      }

      return { previousMessages };
    },
    onError: (_err, _variables, context) => {
      if (!planId || !taskKey || !context?.previousMessages) return;

      queryClient.setQueryData(
        queryKeys.messages.byTaskKey(planId, taskKey),
        context.previousMessages,
      );
    },
    onSettled: (_data, _error, variables) => {
      if (!planId || !taskKey) return;

      // Refetch to ensure cache has decrypted data.
      // Unlike vault entries, we intentionally skip onSuccess cache writes
      // because the server returns encrypted fields that would overwrite
      // the decrypted optimistic data from onMutate, causing a visible flash.
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.single(planId, variables.messageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.all(planId),
      });
    },
  });
}

/**
 * Hook for deleting a message with optimistic updates
 */
export function useDeleteMessage<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const queryClient = useQueryClient();
  const { planId, isReadOnly } = usePlan();
  const { messages } = useApi();

  return useMutation({
    mutationFn: (messageId: string) => {
      if (isReadOnly) {
        throw new Error("This plan is read-only");
      }
      if (!planId) {
        throw new Error("Plan ID is required");
      }

      return messages.delete(planId, messageId);
    },
    onMutate: async (messageId) => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.byTaskKey(planId, taskKey),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.entitlements.current(),
      });

      const previousMessages = queryClient.getQueryData<Message<T>[]>(
        queryKeys.messages.byTaskKey(planId, taskKey),
      );
      const previousEntitlements = queryClient.getQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
      );

      if (previousMessages) {
        queryClient.setQueryData<Message<T>[]>(
          queryKeys.messages.byTaskKey(planId, taskKey),
          previousMessages.filter((msg) => msg.id !== messageId),
        );
      }

      queryClient.setQueryData<EntitlementInfo>(
        queryKeys.entitlements.current(),
        updateMessagesQuota(previousEntitlements, -1),
      );

      return { previousMessages, previousEntitlements };
    },
    onError: (_err, _messageId, context) => {
      if (!planId || !taskKey) return;

      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.byTaskKey(planId, taskKey),
          context.previousMessages,
        );
      }

      if (context?.previousEntitlements) {
        queryClient.setQueryData(
          queryKeys.entitlements.current(),
          context.previousEntitlements,
        );
      }
    },
    onSuccess: (_data, messageId) => {
      if (!planId || !taskKey) return;

      queryClient.setQueryData<Record<string, number>>(
        queryKeys.messages.counts(planId),
        (old) => {
          if (!old) return {};
          const newCount = Math.max(0, (old[taskKey] || 0) - 1);
          return { ...old, [taskKey]: newCount };
        },
      );

      queryClient.setQueryData<Message[]>(
        queryKeys.messages.all(planId),
        (old) => {
          if (!old) return [];
          return old.filter((m) => m.id !== messageId);
        },
      );

      queryClient.removeQueries({
        queryKey: queryKeys.messages.single(planId, messageId),
      });
    },
    onSettled: () => {
      if (!planId || !taskKey) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });
    },
  });
}
