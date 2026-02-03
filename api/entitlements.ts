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
  };
}

/**
 * Type for the entitlements service
 */
export type EntitlementsService = ReturnType<typeof createEntitlementsService>;
