/**
 * Messages API Service - CRUD operations for legacy messages
 *
 * Follows same pattern as wishes.ts for consistency.
 */

import type { ApiClient } from "./client";
import type {
  CreateMessageRequest,
  DeleteResponse,
  Message,
  MessagesListResponse,
  UpdateMessageRequest,
} from "./types";

/**
 * Helper to build messages path for a plan
 */
const messagesPath = (planId: string) => `/plans/${planId}/messages`;

/**
 * Create messages service bound to an API client
 */
export function createMessagesService(client: ApiClient) {
  return {
    /**
     * List all messages for a plan, optionally filtered by taskKey
     */
    list: async <T = Record<string, unknown>>(
      planId: string,
      taskKey?: string
    ): Promise<Message<T>[]> => {
      const response = await client.get<MessagesListResponse<T>>(messagesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List messages by taskKey
     */
    listByTaskKey: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<Message<T>[]> => {
      const response = await client.get<MessagesListResponse<T>>(messagesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List all messages for a plan (for counting)
     */
    listAll: async (planId: string): Promise<Message[]> => {
      const response = await client.get<MessagesListResponse>(messagesPath(planId));
      return response.data;
    },

    /**
     * List messages by taskKey with quota information
     */
    listByTaskKeyWithQuota: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<MessagesListResponse<T>> => {
      return client.get<MessagesListResponse<T>>(messagesPath(planId), {
        taskKey,
      });
    },

    /**
     * List all messages for a plan with quota information
     */
    listAllWithQuota: async (planId: string): Promise<MessagesListResponse> => {
      return client.get<MessagesListResponse>(messagesPath(planId));
    },

    /**
     * Get a single message by ID
     */
    get: async <T = Record<string, unknown>>(
      planId: string,
      id: string
    ): Promise<Message<T>> => {
      return client.get<Message<T>>(`${messagesPath(planId)}/${id}`);
    },

    /**
     * Create a new message
     */
    create: async <T = Record<string, unknown>>(
      data: CreateMessageRequest<T>
    ): Promise<Message<T>> => {
      return client.post<Message<T>>(messagesPath(data.planId), data);
    },

    /**
     * Update an existing message
     */
    update: async <T = Record<string, unknown>>(
      planId: string,
      id: string,
      data: UpdateMessageRequest<T>
    ): Promise<Message<T>> => {
      return client.patch<Message<T>>(`${messagesPath(planId)}/${id}`, data);
    },

    /**
     * Delete a message
     */
    delete: async (planId: string, id: string): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(`${messagesPath(planId)}/${id}`);
    },
  };
}

/**
 * Type for the messages service
 */
export type MessagesService = ReturnType<typeof createMessagesService>;
