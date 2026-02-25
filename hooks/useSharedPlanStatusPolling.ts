/**
 * useSharedPlanStatusPolling - Proactive status polling for shared plan revocation
 *
 * Polls the /shared-plans endpoint every 30 seconds while viewing a shared plan.
 * If the current plan is missing from the list or has a revoked status, triggers
 * recovery before any 403 errors fire.
 *
 * Also updates the shared plans cache with fresh data so the family tab stays current.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useApi } from "@/api";
import type { TrustedContactStatus } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

import { useRevocationHandler } from "./useRevocationHandler";

const POLL_INTERVAL_MS = 30_000;

const REVOKED_STATUSES: TrustedContactStatus[] = [
  "revoked_by_owner",
  "revoked_by_contact",
];

export function useSharedPlanStatusPolling() {
  const { isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const { handleRevocation } = useRevocationHandler();
  const { sharedPlans } = useApi();
  const queryClient = useQueryClient();

  // Store callbacks in refs so the interval closure always uses the latest
  // version without causing the effect to tear down and rebuild.
  const handleRevocationRef = useRef(handleRevocation);
  handleRevocationRef.current = handleRevocation;

  const sharedPlansRef = useRef(sharedPlans);
  sharedPlansRef.current = sharedPlans;

  const planId = sharedPlanInfo?.planId;

  useEffect(() => {
    if (!isViewingSharedPlan || !planId) return;

    const intervalId = setInterval(async () => {
      try {
        const plans = await sharedPlansRef.current.list();

        // Update the cache so the family tab has fresh data
        queryClient.setQueryData(queryKeys.sharedPlans.all(), plans);

        const currentPlan = plans.find((p) => p.planId === planId);

        if (
          !currentPlan ||
          REVOKED_STATUSES.includes(currentPlan.accessStatus)
        ) {
          handleRevocationRef.current();
        }
      } catch {
        // Network errors are silently ignored — the 403 guard is the fallback
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isViewingSharedPlan, planId, queryClient]);
}
