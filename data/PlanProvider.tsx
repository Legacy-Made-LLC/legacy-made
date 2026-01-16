/**
 * PlanProvider - Manages the user's plan and provides planId to the app
 *
 * This context fetches the user's plan when they're authenticated
 * and provides the planId for use in API calls throughout the app.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useApi } from '@/api';
import type { Plan } from '@/api';

interface PlanContextType {
  /** The user's plan (null if not loaded yet) */
  plan: Plan | null;
  /** The plan ID for convenience (null if not loaded) */
  planId: string | null;
  /** Whether the plan is currently being fetched */
  isLoading: boolean;
  /** Error message if plan fetch failed */
  error: string | null;
  /** Retry fetching the plan */
  refetch: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const { plans, isSignedIn, isLoaded } = useApi();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!isSignedIn) {
      setPlan(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userPlan = await plans.getMyPlan();
      setPlan(userPlan);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plan';
      setError(message);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, plans]);

  // Fetch plan when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPlan();
    } else if (isLoaded && !isSignedIn) {
      // Clear plan when signed out
      setPlan(null);
      setError(null);
    }
  }, [isLoaded, isSignedIn, fetchPlan]);

  const value: PlanContextType = {
    plan,
    planId: plan?.id ?? null,
    isLoading,
    error,
    refetch: fetchPlan,
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
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
