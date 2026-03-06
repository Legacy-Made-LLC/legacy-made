/**
 * Subscriptions API Service - Manages Stripe Customer Portal sessions
 */

import type { ApiClient } from './client';
import type { PortalSessionResponse } from './types';

/**
 * Create subscriptions service bound to an API client
 */
export function createSubscriptionsService(client: ApiClient) {
  return {
    /**
     * Get a Stripe Customer Portal URL.
     * The backend creates a portal session (and a Stripe customer if needed)
     * and returns the hosted URL.
     */
    getPortalUrl: async (): Promise<PortalSessionResponse> => {
      return client.post<PortalSessionResponse>('/subscriptions/portal', {});
    },
  };
}

/**
 * Type for the subscriptions service
 */
export type SubscriptionsService = ReturnType<typeof createSubscriptionsService>;
