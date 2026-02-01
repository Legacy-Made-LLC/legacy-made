/**
 * Entries API Service - CRUD operations for entries
 */

import type { ApiClient } from "./client";
import type {
  CreateEntryRequest,
  DeleteResponse,
  EntriesListResponse,
  Entry,
  UpdateEntryRequest,
} from "./types";

/**
 * Helper to build entries path for a plan
 */
const entriesPath = (planId: string) => `/plans/${planId}/entries`;

/**
 * Create entries service bound to an API client
 */
export function createEntriesService(client: ApiClient) {
  return {
    /**
     * List all entries for a plan, optionally filtered by taskKey
     */
    list: async <T = Record<string, unknown>>(
      planId: string,
      taskKey?: string
    ): Promise<Entry<T>[]> => {
      const response = await client.get<EntriesListResponse<T>>(entriesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List entries by taskKey
     */
    listByTaskKey: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<Entry<T>[]> => {
      const response = await client.get<EntriesListResponse<T>>(entriesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List all entries for a plan (for counting)
     */
    listAll: async (planId: string): Promise<Entry[]> => {
      const response = await client.get<EntriesListResponse>(entriesPath(planId));
      return response.data;
    },

    /**
     * List entries by taskKey with quota information
     */
    listByTaskKeyWithQuota: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<EntriesListResponse<T>> => {
      return client.get<EntriesListResponse<T>>(entriesPath(planId), {
        taskKey,
      });
    },

    /**
     * List all entries for a plan with quota information
     */
    listAllWithQuota: async (planId: string): Promise<EntriesListResponse> => {
      return client.get<EntriesListResponse>(entriesPath(planId));
    },

    /**
     * Get a single entry by ID
     */
    get: async <T = Record<string, unknown>>(
      planId: string,
      id: string
    ): Promise<Entry<T>> => {
      return client.get<Entry<T>>(`${entriesPath(planId)}/${id}`);
    },

    /**
     * Create a new entry
     */
    create: async <T = Record<string, unknown>>(
      data: CreateEntryRequest<T>
    ): Promise<Entry<T>> => {
      return client.post<Entry<T>>(entriesPath(data.planId), data);
    },

    /**
     * Update an existing entry
     */
    update: async <T = Record<string, unknown>>(
      planId: string,
      id: string,
      data: UpdateEntryRequest<T>
    ): Promise<Entry<T>> => {
      return client.patch<Entry<T>>(`${entriesPath(planId)}/${id}`, data);
    },

    /**
     * Delete an entry
     */
    delete: async (planId: string, id: string): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(`${entriesPath(planId)}/${id}`);
    },
  };
}

/**
 * Type for the entries service
 */
export type EntriesService = ReturnType<typeof createEntriesService>;
