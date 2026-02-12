/**
 * Wishes API Service - CRUD operations for wishes
 *
 * Follows same pattern as entries.ts for consistency.
 */

import type { ApiClient } from "./client";
import type {
  CreateWishRequest,
  DeleteResponse,
  Wish,
  WishesListResponse,
  UpdateWishRequest,
} from "./types";

/**
 * Helper to build wishes path for a plan
 */
const wishesPath = (planId: string) => `/plans/${planId}/wishes`;

/**
 * Create wishes service bound to an API client
 */
export function createWishesService(client: ApiClient) {
  return {
    /**
     * List all wishes for a plan, optionally filtered by taskKey
     */
    list: async <T = Record<string, unknown>>(
      planId: string,
      taskKey?: string
    ): Promise<Wish<T>[]> => {
      const response = await client.get<WishesListResponse<T>>(wishesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List wishes by taskKey
     */
    listByTaskKey: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<Wish<T>[]> => {
      const response = await client.get<WishesListResponse<T>>(wishesPath(planId), {
        taskKey,
      });
      return response.data;
    },

    /**
     * List all wishes for a plan (for counting)
     */
    listAll: async (planId: string): Promise<Wish[]> => {
      const response = await client.get<WishesListResponse>(wishesPath(planId));
      return response.data;
    },

    /**
     * List wishes by taskKey with quota information
     */
    listByTaskKeyWithQuota: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<WishesListResponse<T>> => {
      return client.get<WishesListResponse<T>>(wishesPath(planId), {
        taskKey,
      });
    },

    /**
     * List all wishes for a plan with quota information
     */
    listAllWithQuota: async (planId: string): Promise<WishesListResponse> => {
      return client.get<WishesListResponse>(wishesPath(planId));
    },

    /**
     * Get a single wish by ID
     */
    get: async <T = Record<string, unknown>>(
      planId: string,
      id: string
    ): Promise<Wish<T>> => {
      return client.get<Wish<T>>(`${wishesPath(planId)}/${id}`);
    },

    /**
     * Create a new wish
     */
    create: async <T = Record<string, unknown>>(
      data: CreateWishRequest<T>
    ): Promise<Wish<T>> => {
      return client.post<Wish<T>>(wishesPath(data.planId), data);
    },

    /**
     * Update an existing wish
     */
    update: async <T = Record<string, unknown>>(
      planId: string,
      id: string,
      data: UpdateWishRequest<T>
    ): Promise<Wish<T>> => {
      return client.patch<Wish<T>>(`${wishesPath(planId)}/${id}`, data);
    },

    /**
     * Delete a wish
     */
    delete: async (planId: string, id: string): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(`${wishesPath(planId)}/${id}`);
    },
  };
}

/**
 * Type for the wishes service
 */
export type WishesService = ReturnType<typeof createWishesService>;
