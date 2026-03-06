/**
 * Subscription Mutation Hooks
 *
 * Provides useOpenPortal() to fetch a Stripe Customer Portal URL
 * and open it in the system browser.
 */

import { useMutation } from '@tanstack/react-query';
import { Linking } from 'react-native';

import { useApi } from '@/api';
import { logger } from '@/lib/logger';

/**
 * Mutation to open the Stripe Customer Portal.
 *
 * Calls the backend to create a portal session, then opens the
 * returned URL in the system browser via Linking.openURL().
 */
export function useOpenPortal() {
  const { subscriptions } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { url } = await subscriptions.getPortalUrl();
      return url;
    },
    onSuccess: (url) => {
      Linking.openURL(url);
    },
    onError: (error) => {
      logger.error('Failed to open subscription portal', error);
    },
  });
}
