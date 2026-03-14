/**
 * useRevocationHandler - Shared recovery logic for revoked shared plan access
 *
 * Used by both useAccessRevocationGuard (reactive 403 detection) and
 * useSharedPlanStatusPolling (proactive status polling) to ensure a single,
 * consistent recovery flow when a shared plan's access is revoked.
 *
 * Recovery flow:
 * 1. Transition overlay fades in ("Returning to Your Plan")
 * 2. While opaque: switch back to own plan, restore "owner" perspective, navigate home
 * 3. Clean up cached data keyed to the revoked plan
 * 4. Invalidate the shared plans list
 * 5. Overlay fades out
 * 6. Show toast explaining what happened
 */

import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";

import { usePerspective } from "@/contexts/LocaleContext";
import { usePlanTransition } from "@/contexts/PlanTransitionContext";
import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { queryKeys } from "@/lib/queryKeys";

import { toast } from "./useToast";

/**
 * Module-level lock shared across all hook instances.
 * Prevents concurrent recovery when both the 403 guard and polling hook
 * detect revocation simultaneously (e.g., multiple 403s fire at once).
 */
let isHandlingRevocation = false;

export function useRevocationHandler() {
  const { returnToMyPlan, sharedPlanInfo, isViewingSharedPlan } = usePlan();
  const { setPerspective } = usePerspective();
  const { transition } = usePlanTransition();
  const queryClient = useQueryClient();
  const { clearSharedDEKCache } = useCrypto();

  const handleRevocation = useCallback(() => {
    // Prevent concurrent calls — shared across all hook instances
    if (isHandlingRevocation || !isViewingSharedPlan) return;
    isHandlingRevocation = true;

    const ownerName = sharedPlanInfo?.ownerFirstName ?? "The owner";
    const revokedPlanId = sharedPlanInfo?.planId;

    transition("Returning to Your Plan", () => {
      returnToMyPlan();
      setPerspective("owner");
      router.push("/(app)/(tabs)/home");

      // Clear the shared plan's decryption key from memory
      if (revokedPlanId) {
        clearSharedDEKCache(revokedPlanId);
      }

      // Clean up cached data for the revoked plan
      if (revokedPlanId) {
        queryClient.removeQueries({
          queryKey: queryKeys.entries.all(revokedPlanId),
        });
        queryClient.removeQueries({
          queryKey: queryKeys.wishes.all(revokedPlanId),
        });
        queryClient.removeQueries({
          queryKey: queryKeys.progress.all(revokedPlanId),
        });
        queryClient.removeQueries({
          queryKey: queryKeys.trustedContacts.all(revokedPlanId),
        });
      }

      // Refresh the shared plans list so revoked plan disappears
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });

      // Show toast after a brief delay so it appears after the overlay fades
      setTimeout(() => {
        toast.info({
          title: "Access changed",
          message: `${ownerName} has updated your access to their plan.`,
        });
        isHandlingRevocation = false;
      }, 1200);
    });
  }, [
    isViewingSharedPlan,
    sharedPlanInfo,
    transition,
    returnToMyPlan,
    setPerspective,
    queryClient,
    clearSharedDEKCache,
  ]);

  return { handleRevocation };
}
