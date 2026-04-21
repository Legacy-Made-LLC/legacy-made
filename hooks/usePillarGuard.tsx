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
import { colors } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";

const PILLAR_COLORS: Record<Pillar, { accent: string; tint: string }> = {
  important_info: { accent: colors.featureInformation, tint: colors.featureInformationTint },
  wishes: { accent: colors.featureWishes, tint: colors.featureWishesTint },
  messages: { accent: colors.featureLegacy, tint: colors.featureLegacyTint },
  family_access: { accent: colors.featureFamily, tint: colors.featureFamilyTint },
};

const PILLAR_PLACEMENTS: Record<Pillar, string> = {
  important_info: "info_limit_reached",
  wishes: "pillar_locked_wishes",
  messages: "pillar_locked_messages",
  family_access: "pillar_locked_trusted",
};

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

  // Show locked overlay if pillar is locked or view-only (plan tier doesn't grant full access)
  if (isLocked || isViewOnly) {
    guardOverlay = (
      <LockedFeatureOverlay
        featureName={featureName}
        description={lockedDescription}
        isSharedPlan={isViewingSharedPlan}
        placement={PILLAR_PLACEMENTS[pillar]}
      />
    );
  } else if (isViewingSharedPlan && !canAccessPillar(pillar)) {
    const pillarColors = PILLAR_COLORS[pillar];
    guardOverlay = (
      <RestrictedAccessOverlay
        featureName={featureName}
        description={restrictedDescription}
        accentColor={pillarColors?.accent}
        tintColor={pillarColors?.tint}
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
