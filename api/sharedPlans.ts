/**
 * Shared Plans API Service - Fetch plans shared with the current user
 */

import type { ApiClient } from "./client";
import type { SharedPlan, TrustedContact } from "./types";

const SHARED_PLANS_PATH = "/shared-plans";

/**
 * Create shared plans service bound to an API client
 */
export function createSharedPlansService(client: ApiClient) {
  return {
    /**
     * List all plans shared with the current user
     */
    list: async (): Promise<SharedPlan[]> => {
      return client.get<SharedPlan[]>(`${SHARED_PLANS_PATH}`);
    },

    /**
     * Accept a pending shared plan invitation
     */
    accept: async (planId: string): Promise<TrustedContact> => {
      return client.post<TrustedContact>(
        `${SHARED_PLANS_PATH}/${encodeURIComponent(planId)}/accept`,
        {},
      );
    },

    /**
     * Decline a pending shared plan invitation
     */
    decline: async (planId: string): Promise<void> => {
      await client.post<void>(
        `${SHARED_PLANS_PATH}/${encodeURIComponent(planId)}/decline`,
        {},
      );
    },
  };
}

/**
 * Type for the shared plans service
 */
export type SharedPlansService = ReturnType<typeof createSharedPlansService>;
