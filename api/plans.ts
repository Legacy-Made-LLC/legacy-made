/**
 * Plans API Service - Get/manage user's plan
 */

import type { ApiClient } from './client';
import type { Plan } from './types';

const PLANS_PATH = '/plans';

/**
 * Create plans service bound to an API client
 */
export function createPlansService(client: ApiClient) {
  return {
    /**
     * Get the current user's plan (creates one if it doesn't exist)
     */
    getMyPlan: async (): Promise<Plan> => {
      return client.get<Plan>(`${PLANS_PATH}/me`);
    },
  };
}

/**
 * Type for the plans service
 */
export type PlansService = ReturnType<typeof createPlansService>;
