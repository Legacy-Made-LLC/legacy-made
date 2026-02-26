/**
 * PlanProvider - Manages the active plan context for the entire app
 *
 * Supports viewing the user's own plan or switching to view a shared plan.
 * All downstream query hooks use `planId` from this context, so switching
 * the active plan automatically cascades to all data queries.
 */

import type {
  Pillar,
  Plan,
  PlanResource,
  SharedPlan,
  TrustedContactAccessLevel,
} from "@/api";
import { usePlanQuery } from "@/hooks/queries/usePlanQuery";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Maps frontend pillars to backend permission resources.
 * `null` means there's no direct backend resource — access is derived from
 * whether the user can read entries (the most privileged resource).
 */
const PILLAR_TO_RESOURCE: Record<Pillar, PlanResource | null> = {
  important_info: "entries",
  wishes: "wishes",
  messages: "messages",
  family_access: null,
};

interface PlanContextType {
  /** The currently active plan (own or shared) */
  plan: Plan | null;
  /** The active plan ID for API calls */
  planId: string | null;
  /** Whether the plan is currently being fetched */
  isLoading: boolean;
  /** Error if plan fetch failed */
  error: Error | null;
  /** Retry fetching the plan */
  refetch: () => Promise<void>;

  /** The user's own plan (always available when loaded) */
  myPlan: Plan | null;
  /** The user's own plan ID */
  myPlanId: string | null;
  /** Whether the user is currently viewing a shared plan */
  isViewingSharedPlan: boolean;
  /** Info about the shared plan being viewed (null if viewing own plan) */
  sharedPlanInfo: SharedPlan | null;
  /** Switch to viewing a shared plan */
  viewSharedPlan: (sharedPlan: SharedPlan) => void;
  /** Switch back to viewing own plan */
  returnToMyPlan: () => void;
  /** The access level for the active plan (null = own plan = full access) */
  activeAccessLevel: TrustedContactAccessLevel | null;
  /** Whether the active plan is read-only */
  isReadOnly: boolean;
  /** Check if the current access level allows viewing a given pillar */
  canAccessPillar: (pillar: Pillar) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const { data: myPlan, isLoading, error, refetch } = usePlanQuery();
  const [activeSharedPlan, setActiveSharedPlan] = useState<SharedPlan | null>(
    null,
  );

  const viewSharedPlan = useCallback((sharedPlan: SharedPlan) => {
    setActiveSharedPlan(sharedPlan);
  }, []);

  const returnToMyPlan = useCallback(() => {
    setActiveSharedPlan(null);
  }, []);

  const value: PlanContextType = useMemo(() => {
    const activeAccessLevel = activeSharedPlan?.accessLevel ?? null;
    // When viewing a shared plan, derive a Plan object from the flat SharedPlan data.
    // When viewing own plan, use myPlan directly.
    const activePlan = activeSharedPlan
      ? ({
          id: activeSharedPlan.planId,
          userId: "",
          name: activeSharedPlan.planName,
          createdAt: "",
          updatedAt: "",
        } as Plan)
      : (myPlan ?? null);

    return {
      plan: activePlan,
      planId: activePlan?.id ?? null,
      isLoading,
      error,
      refetch: async () => {
        await refetch();
      },

      myPlan: myPlan ?? null,
      myPlanId: myPlan?.id ?? null,
      isViewingSharedPlan: activeSharedPlan !== null,
      sharedPlanInfo: activeSharedPlan,
      viewSharedPlan,
      returnToMyPlan,
      activeAccessLevel,
      isReadOnly:
        activeAccessLevel !== null &&
        (!activeSharedPlan?.permissions ||
          !Object.values(activeSharedPlan.permissions).some((p) => p.write)),
      canAccessPillar: (pillar: Pillar) => {
        // Own plan — full access to everything
        if (!activeAccessLevel) return true;
        // Use backend-provided permissions
        const permissions = activeSharedPlan?.permissions;
        if (!permissions) return false;
        const resource = PILLAR_TO_RESOURCE[pillar];
        if (resource === null) {
          // family_access: accessible when entries are readable
          return permissions.entries.read;
        }
        return permissions[resource].read;
      },
    };
  }, [myPlan, activeSharedPlan, isLoading, error, refetch, viewSharedPlan, returnToMyPlan]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

/**
 * Hook to access the active plan context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { planId, isLoading, isViewingSharedPlan } = usePlan();
 *
 *   if (isLoading) return <Loading />;
 *   if (!planId) return <SignInPrompt />;
 *
 *   // planId automatically points to either own or shared plan
 * }
 * ```
 */
export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
