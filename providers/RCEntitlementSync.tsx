/**
 * RCEntitlementSync
 *
 * Bridges RevenueCatProvider (which lives above QueryProvider in the tree)
 * and the TanStack Query cache (which lives inside). Whenever RC delivers a
 * new CustomerInfo — e.g. from `addCustomerInfoUpdateListener` fired by a
 * Customer Center restore, a subscription renewal, or a cancellation —
 * invalidate the plan + entitlements queries so the UI's tier and quota
 * state picks up the backend's new truth on the next fetch.
 *
 * Rendered once inside QueryProvider. No UI.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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

  return null;
}
