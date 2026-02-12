/**
 * Progress API Service - CRUD operations for task progress tracking
 */

import type { ApiClient } from "./client";
import type { ProgressRecord, TaskProgressData } from "./types";

/**
 * Helper to build progress path for a plan
 */
const progressPath = (planId: string) => `/plans/${planId}/progress`;

/**
 * Create progress service bound to an API client
 */
export function createProgressService(client: ApiClient) {
  return {
    /**
     * List all progress records for a plan
     */
    listAll: async (planId: string): Promise<ProgressRecord[]> => {
      return client.get<ProgressRecord[]>(progressPath(planId));
    },

    /**
     * Get a single progress record by key
     */
    get: async (planId: string, key: string): Promise<ProgressRecord> => {
      return client.get<ProgressRecord>(`${progressPath(planId)}/${key}`);
    },

    /**
     * Upsert a progress record (create or update)
     */
    upsert: async (
      planId: string,
      key: string,
      data: TaskProgressData,
    ): Promise<ProgressRecord> => {
      return client.put<ProgressRecord>(`${progressPath(planId)}/${key}`, {
        data,
      });
    },

    /**
     * Delete a progress record
     */
    delete: async (planId: string, key: string): Promise<void> => {
      await client.delete(`${progressPath(planId)}/${key}`);
    },
  };
}

/**
 * Type for the progress service
 */
export type ProgressService = ReturnType<typeof createProgressService>;
