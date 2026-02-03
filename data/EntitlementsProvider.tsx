/**
 * EntitlementsProvider - Manages user entitlements and provides access checks
 *
 * This context fetches the user's entitlements when they're authenticated
 * and provides helper methods for checking feature access and quotas.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type {
  EntitlementInfo,
  Pillar,
  QuotaFeature,
  QuotaInfo,
  SubscriptionTier,
} from "@/api/types";
import { useEntitlementsQuery } from "@/hooks/queries/useEntitlementsQuery";

/**
 * Default entitlements for unauthenticated or loading states
 */
const DEFAULT_ENTITLEMENTS: EntitlementInfo = {
  tier: "free",
  tierName: "Free",
  tierDescription: "Get Oriented",
  pillars: ["important_info"],
  viewOnlyPillars: [],
  quotas: [
    {
      feature: "entries",
      displayName: "important information items",
      limit: 5,
      current: 0,
      unlimited: false,
    },
    {
      feature: "trusted_contacts",
      displayName: "trusted contacts",
      limit: 0,
      current: 0,
      unlimited: false,
    },
    {
      feature: "family_profiles",
      displayName: "family profiles",
      limit: 0,
      current: 0,
      unlimited: false,
    },
    {
      feature: "legacy_messages",
      displayName: "legacy messages",
      limit: 0,
      current: 0,
      unlimited: false,
    },
    {
      feature: "storage_mb",
      displayName: "MB storage",
      limit: 50,
      current: 0,
      unlimited: false,
    },
  ],
};

interface EntitlementsContextType {
  /** Raw entitlements data */
  entitlements: EntitlementInfo;
  /** Whether entitlements are currently loading */
  isLoading: boolean;
  /** Error if entitlements failed to load */
  error: Error | null;
  /** Refetch entitlements */
  refetch: () => void;

  // Computed values
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Human-readable tier name */
  tierName: string;
  /** Marketing tagline for the tier */
  tierDescription: string;
  /** Whether user is on free tier */
  isFree: boolean;

  // Access check methods
  /** Check if a pillar can be edited (full access) */
  canEditPillar: (pillar: Pillar) => boolean;
  /** Check if a pillar can be viewed (either editable or view-only) */
  canViewPillar: (pillar: Pillar) => boolean;
  /** Check if a pillar is view-only */
  isViewOnlyPillar: (pillar: Pillar) => boolean;
  /** Check if a pillar is locked (not in pillars or viewOnlyPillars) */
  isLockedPillar: (pillar: Pillar) => boolean;

  // Quota check methods
  /** Check if user can create a new item (within quota) */
  canCreate: (feature: QuotaFeature) => boolean;
  /** Get remaining quota for a feature */
  getRemainingQuota: (feature: QuotaFeature) => number;
  /** Get quota info for a feature */
  getQuotaInfo: (feature: QuotaFeature) => QuotaInfo | undefined;
  /** Get display string for quota usage */
  getQuotaDisplay: (feature: QuotaFeature) => string;
  /** Check if approaching limit (80%+ used) */
  isApproachingLimit: (feature: QuotaFeature) => boolean;
}

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(
  undefined
);

interface EntitlementsProviderProps {
  children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const { data, isLoading, error, refetch } = useEntitlementsQuery();

  // Use fetched entitlements or defaults
  const entitlements = data ?? DEFAULT_ENTITLEMENTS;

  const value = useMemo<EntitlementsContextType>(() => {
    const tier = entitlements.tier;
    const tierName = entitlements.tierName;
    const tierDescription = entitlements.tierDescription;
    const isFree = tier === "free";

    // Access check methods
    const canEditPillar = (pillar: Pillar): boolean => {
      return entitlements.pillars.includes(pillar);
    };

    const isViewOnlyPillar = (pillar: Pillar): boolean => {
      return entitlements.viewOnlyPillars.includes(pillar);
    };

    const canViewPillar = (pillar: Pillar): boolean => {
      return canEditPillar(pillar) || isViewOnlyPillar(pillar);
    };

    const isLockedPillar = (pillar: Pillar): boolean => {
      return !canViewPillar(pillar);
    };

    // Quota check methods
    const getQuotaInfo = (feature: QuotaFeature): QuotaInfo | undefined => {
      return entitlements.quotas.find((q) => q.feature === feature);
    };

    const canCreate = (feature: QuotaFeature): boolean => {
      const quota = getQuotaInfo(feature);
      if (!quota) return false;
      if (quota.unlimited) return true;
      return quota.current < quota.limit;
    };

    const getRemainingQuota = (feature: QuotaFeature): number => {
      const quota = getQuotaInfo(feature);
      if (!quota) return 0;
      if (quota.unlimited) return Infinity;
      return Math.max(0, quota.limit - quota.current);
    };

    const getQuotaDisplay = (feature: QuotaFeature): string => {
      const quota = getQuotaInfo(feature);
      if (!quota) return "";
      if (quota.unlimited) return "Unlimited";
      return `${quota.current} of ${quota.limit} ${quota.displayName}`;
    };

    const isApproachingLimit = (feature: QuotaFeature): boolean => {
      const quota = getQuotaInfo(feature);
      if (!quota) return false;
      // Unlimited has no limit to approach
      if (quota.unlimited) return false;
      // No limit set (0) is always at limit
      if (quota.limit === 0) return true;
      // Check if at 80% or more
      return quota.current / quota.limit >= 0.8;
    };

    return {
      entitlements,
      isLoading,
      error: error ?? null,
      refetch,
      tier,
      tierName,
      tierDescription,
      isFree,
      canEditPillar,
      canViewPillar,
      isViewOnlyPillar,
      isLockedPillar,
      canCreate,
      getRemainingQuota,
      getQuotaInfo,
      getQuotaDisplay,
      isApproachingLimit,
    };
  }, [entitlements, isLoading, error, refetch]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

/**
 * Hook to access entitlements context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { canEditPillar, isApproachingLimit, tier } = useEntitlements();
 *
 *   if (!canEditPillar('wishes')) {
 *     return <LockedFeatureOverlay />;
 *   }
 *
 *   return <WishesForm showQuotaWarning={isApproachingLimit('entries')} />;
 * }
 * ```
 */
export function useEntitlements() {
  const context = useContext(EntitlementsContext);
  if (context === undefined) {
    throw new Error(
      "useEntitlements must be used within an EntitlementsProvider"
    );
  }
  return context;
}
