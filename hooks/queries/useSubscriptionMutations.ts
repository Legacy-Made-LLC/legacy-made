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
 *
 * Errors from the backend request or the Linking call are logged for
 * Sentry and re-thrown so callers can render a user-visible error
 * state (toast, inline message, etc.). The mutation intentionally does
 * not swallow failures — a silent "nothing happened" is worse UX than
 * an explicit, actionable message.
 */
export function useOpenPortal() {
  const { subscriptions } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { url } = await subscriptions.getPortalUrl();
      // Await openURL so a rejected promise surfaces as a mutation error
      // rather than a silent no-op (Linking returns a Promise<boolean>).
      await Linking.openURL(url);
      return url;
    },
    onError: (error) => {
      logger.error('Failed to open subscription portal', error);
    },
  });
}
