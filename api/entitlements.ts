/**
 * Entitlements API Service - Fetches user entitlement information
 */

import type { ApiClient } from './client';
import type { EntitlementInfo } from './types';

/**
 * Create entitlements service bound to an API client
 */
export function createEntitlementsService(client: ApiClient) {
  return {
    /**
     * Get the current user's entitlements
     */
    getEntitlements: async (): Promise<EntitlementInfo> => {
      return client.get<EntitlementInfo>('/entitlements');
    },

    /**
     * Get entitlements for a specific plan (plan owner's entitlements).
     * Used when viewing a shared plan so the frontend can gate features
     * based on what the plan owner's subscription supports.
     */
    getPlanEntitlements: async (planId: string): Promise<EntitlementInfo> => {
      return client.get<EntitlementInfo>(`/plans/${planId}/entitlements`);
    },
  };
}

/**
 * Type for the entitlements service
 */
export type EntitlementsService = ReturnType<typeof createEntitlementsService>;
