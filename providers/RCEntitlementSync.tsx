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
import { useEffect, useRef } from "react";

import { queryKeys } from "@/lib/queryKeys";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export function RCEntitlementSync() {
  const { customerInfo } = useRevenueCat();
  const queryClient = useQueryClient();
  // Skip the very first CustomerInfo emission — that's the initial load, not
  // a state change, and the queries already fetch themselves on mount.
  const seenFirstRef = useRef(false);

  useEffect(() => {
    if (!customerInfo) return;
    if (!seenFirstRef.current) {
      seenFirstRef.current = true;
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all() });
  }, [customerInfo, queryClient]);

  return null;
}
