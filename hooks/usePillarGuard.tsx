/**
 * usePillarGuard - Reusable hook for sub-route paywall/access guards
 *
 * Encapsulates both restriction layers:
 * 1. Entitlements paywall (isLockedPillar) — subscription-based lock
 * 2. Shared plan access (canAccessPillar) — restricts which pillars a user can see on a shared plan
 *
 * Returns a `guardOverlay` React element if access is blocked, or null if access is allowed.
 * Sub-routes should early-return the overlay when non-null.
 */

import React from "react";

import type { Pillar } from "@/api/types";
import {
  LockedFeatureOverlay,
  RestrictedAccessOverlay,
} from "@/components/entitlements";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";

interface UsePillarGuardOptions {
  pillar: Pillar;
  featureName: string;
  lockedDescription?: string;
  restrictedDescription?: string;
}

interface UsePillarGuardResult {
  /** Render this overlay if non-null (access is blocked) */
  guardOverlay: React.ReactElement | null;
  /** Whether the user has view-only access (entitlements level) */
  isViewOnly: boolean;
  /** Whether the user is viewing someone else's shared plan */
  isViewingSharedPlan: boolean;
  /** Whether the user has read-only access (shared plan level) */
  isReadOnly: boolean;
}

export function usePillarGuard({
  pillar,
  featureName,
  lockedDescription,
  restrictedDescription,
}: UsePillarGuardOptions): UsePillarGuardResult {
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { isViewingSharedPlan, canAccessPillar, isReadOnly } = usePlan();

  const isLocked = isLockedPillar(pillar);
  const isViewOnly = isViewOnlyPillar(pillar);

  let guardOverlay: React.ReactElement | null = null;

  // Show paywall if pillar is locked, or if view-only on the user's own plan
  // (view-only on own plan means the tier doesn't grant full access)
  if (isLocked || (!isViewingSharedPlan && isViewOnly)) {
    guardOverlay = (
      <LockedFeatureOverlay
        featureName={featureName}
        description={lockedDescription}
      />
    );
  } else if (isViewingSharedPlan && !canAccessPillar(pillar)) {
    guardOverlay = (
      <RestrictedAccessOverlay
        featureName={featureName}
        description={restrictedDescription}
      />
    );
  }

  return {
    guardOverlay,
    isViewOnly,
    isViewingSharedPlan,
    isReadOnly,
  };
}
