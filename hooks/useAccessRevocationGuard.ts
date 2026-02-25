/**
 * useAccessRevocationGuard - Reactive 403 detection for revoked shared plan access
 *
 * Subscribes to TanStack Query's cache events (both queries and mutations).
 * When any request returns a 403 while viewing a shared plan, triggers the
 * recovery flow via useRevocationHandler.
 *
 * Only active when `isViewingSharedPlan` is true — 403s on the user's own plan
 * (e.g., from entitlement checks) are not affected.
 *
 * Includes a grace period after the plan switch to avoid false positives from
 * initial data loading queries that may transiently return 403.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { ApiClientError } from "@/api/client";
import { usePlan } from "@/data/PlanProvider";

import { useRevocationHandler } from "./useRevocationHandler";

/** Delay before arming the guard after a plan switch (ms) */
const ARM_DELAY_MS = 2000;

export function useAccessRevocationGuard() {
  const { isViewingSharedPlan } = usePlan();
  const { handleRevocation } = useRevocationHandler();
  const queryClient = useQueryClient();
  const handleRevocationRef = useRef(handleRevocation);
  handleRevocationRef.current = handleRevocation;

  useEffect(() => {
    if (!isViewingSharedPlan) return;

    let queryUnsubscribe: (() => void) | null = null;
    let mutationUnsubscribe: (() => void) | null = null;

    // Delay subscription to avoid catching 403s from the initial data load
    // after a plan switch (e.g., permission checks that resolve momentarily).
    const armTimer = setTimeout(() => {
      queryUnsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          event.action.type === "error" &&
          event.action.error instanceof ApiClientError &&
          event.action.error.statusCode === 403
        ) {
          handleRevocationRef.current();
        }
      });

      mutationUnsubscribe = queryClient
        .getMutationCache()
        .subscribe((event) => {
          if (
            event.type === "updated" &&
            event.action.type === "error" &&
            event.action.error instanceof ApiClientError &&
            event.action.error.statusCode === 403
          ) {
            handleRevocationRef.current();
          }
        });
    }, ARM_DELAY_MS);

    return () => {
      clearTimeout(armTimer);
      queryUnsubscribe?.();
      mutationUnsubscribe?.();
    };
  }, [isViewingSharedPlan, queryClient]);
}
