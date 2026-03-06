/**
 * useAppStateEntitlementRefresh
 *
 * Safety net: when the app transitions from background/inactive to active,
 * invalidates entitlements queries so fresh data is fetched. This catches
 * subscription changes made in the Stripe portal even if the deep link
 * return doesn't fire.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { queryKeys } from '@/lib/queryKeys';

export function useAppStateEntitlementRefresh() {
  const queryClient = useQueryClient();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [queryClient]);
}
