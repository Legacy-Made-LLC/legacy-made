/**
 * usePlanSwitching - Combines plan switching with perspective switching
 *
 * When switching to a shared plan, automatically sets perspective to "family".
 * When returning to own plan, restores perspective to "owner".
 *
 * Uses PlanTransitionContext for a smooth cross-fade overlay during the switch.
 */

import { useCallback } from "react";

import type { SharedPlan } from "@/api/types";
import { usePerspective } from "@/contexts/LocaleContext";
import { usePlanTransition } from "@/contexts/PlanTransitionContext";
import { usePlan } from "@/data/PlanProvider";
import { router } from "expo-router";

import { toast } from "./useToast";

export function usePlanSwitching() {
  const {
    viewSharedPlan,
    returnToMyPlan,
    isViewingSharedPlan,
    sharedPlanInfo,
    myPlan,
  } = usePlan();
  const { setPerspective } = usePerspective();
  const { transition } = usePlanTransition();

  const switchToSharedPlan = useCallback(
    (sharedPlan: SharedPlan) => {
      // Prevent navigating to an already-revoked plan
      if (
        sharedPlan.accessStatus === "revoked_by_owner" ||
        sharedPlan.accessStatus === "revoked_by_contact"
      ) {
        toast.info({
          title: "Access no longer available",
          message: `${sharedPlan.ownerFirstName} has updated your access to their plan.`,
        });
        return;
      }

      const label = `Viewing ${sharedPlan.ownerFirstName}\u2019s Plan`;
      transition(label, () => {
        viewSharedPlan(sharedPlan);
        setPerspective("family");
        router.push("/(app)/(tabs)/home");
      });
    },
    [viewSharedPlan, setPerspective, transition],
  );

  const switchToMyPlan = useCallback(() => {
    transition("Returning to Your Plan", () => {
      returnToMyPlan();
      setPerspective("owner");
      router.push("/(app)/(tabs)/home");
    });
  }, [returnToMyPlan, setPerspective, transition]);

  return {
    switchToSharedPlan,
    switchToMyPlan,
    isViewingSharedPlan,
    sharedPlanInfo,
    myPlan,
  };
}
