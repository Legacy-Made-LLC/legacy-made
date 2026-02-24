/**
 * PlanProvider - Manages the user's plan and provides planId to the app
 *
 * This context wraps the usePlanQuery hook and provides
 * the planId for use in API calls throughout the app.
 */

import type { Plan } from "@/api";
import { usePlanQuery } from "@/hooks/queries/usePlanQuery";
import React, { createContext, useContext, type ReactNode } from "react";

interface PlanContextType {
  /** The user's plan (null if not loaded yet) */
  plan: Plan | null;
  /** The plan ID for convenience (null if not loaded) */
  planId: string | null;
  /** Whether the plan is currently being fetched */
  isLoading: boolean;
  /** Error if plan fetch failed */
  error: Error | null;
  /** Retry fetching the plan */
  refetch: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const { data: plan, isLoading, error, refetch } = usePlanQuery();

  const value: PlanContextType = {
    plan: plan ?? null,
    planId: plan?.id ?? null,
    isLoading,
    error,
    refetch: async () => {
      await refetch();
    },
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

/**
 * Hook to access the current user's plan
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { planId, isLoading, error } = usePlan();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   if (!planId) return <SignInPrompt />;
 *
 *   // Use planId for API calls
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
