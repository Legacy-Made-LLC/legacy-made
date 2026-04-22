/**
 * RCEntitlementSync
 *
 * Bridges RevenueCatProvider (which lives above QueryProvider in the tree)
 * and the TanStack Query cache (which lives inside). Invalidates the plan
 * + entitlements queries on two triggers:
 *
 *   1. RC's `addCustomerInfoUpdateListener` fired via RevenueCatProvider —
 *      a Customer Center restore, a renewal, or a cancellation.
 *   2. The app transitioning to the foreground — catches tier changes that
 *      our webhook processed while the app was backgrounded (e.g. a slow
 *      webhook delivery after a purchase the user then left the app during).
 *
 * Rendered once inside QueryProvider. No UI.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { queryKeys } from "@/lib/queryKeys";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export function RCEntitlementSync() {
  const { customerInfo } = useRevenueCat();
  const queryClient = useQueryClient();

  // Invalidate on every CustomerInfo, including the first. The initial
  // emission is one extra invalidation on mount — TanStack dedupes
  // in-flight refetches, so the cost is negligible — and it removes the
  // race where a Customer Center restore that lands before our initial
  // getCustomerInfo() would otherwise be swallowed by a skip-first guard.
  useEffect(() => {
    if (!customerInfo) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all() });
  }, [customerInfo, queryClient]);

  // Foreground-transition refetch. AppState fires on every change, so we
  // track the previous value and only invalidate on background → active.
  const prevAppStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = prevAppStateRef.current;
      prevAppStateRef.current = next;
      if (next === "active" && prev !== "active") {
        queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
      }
    });
    return () => sub.remove();
  }, [queryClient]);

  return null;
}
