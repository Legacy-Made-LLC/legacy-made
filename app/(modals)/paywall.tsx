/**
 * Paywall — Legacy Made Individual
 *
 * Route shell that fetches the offering for a placement (via RC Targeting),
 * reads `offering.metadata.variant`, and delegates to the matching custom
 * paywall component. All variants live in `components/paywall/` and share
 * the chrome + footer primitives. We chose custom components over RC's
 * hosted paywall for pixel-perfect design fidelity; the Customer Center
 * surface still uses RC's hosted UI.
 */

import { useUser } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

import { useApi } from "@/api";
import {
  PaywallComparison,
  PaywallEditorial,
  PaywallPillars,
  type PaywallVariant,
  type PaywallVariantProps,
} from "@/components/paywall";
import { EXTERNAL_LINKS } from "@/constants/links";
import {
  shouldHidePaywall,
  useEntitlementSource,
} from "@/hooks/useEntitlementSource";
import { logger } from "@/lib/logger";
import { DEFAULT_PAYWALL_VARIANT, parseVariant } from "@/lib/paywall";
import { queryKeys } from "@/lib/queryKeys";
import { RC_ENTITLEMENT_INDIVIDUAL } from "@/providers/RevenueCatProvider";

const VARIANTS: Record<
  PaywallVariant,
  React.ComponentType<PaywallVariantProps>
> = {
  editorial: PaywallEditorial,
  comparison: PaywallComparison,
  pillars: PaywallPillars,
};

const MANAGE_INSTRUCTION =
  Platform.OS === "ios"
    ? "Manage anytime in your Apple ID settings."
    : "Manage anytime in your Google Play account settings.";

export default function PaywallScreen() {
  const { placement } = useLocalSearchParams<{ placement?: string }>();
  const { entitlements } = useApi();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { source } = useEntitlementSource();

  // Defense in depth: even if a caller bypasses the UpgradePrompt gate
  // and pushes /paywall directly, B2B and lifetime users should never
  // see it — their tier doesn't have an upgrade path through RC.
  useEffect(() => {
    if (shouldHidePaywall(source) && router.canGoBack()) {
      router.back();
    } else if (shouldHidePaywall(source)) {
      router.replace("/");
    }
  }, [source]);

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [variant, setVariant] = useState<PaywallVariant>(
    DEFAULT_PAYWALL_VARIANT,
  );
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Placement-aware fetch with fallback to the current default offering.
        // Targeting rules in the RC dashboard map placement IDs to offerings;
        // each offering's metadata.variant tells us which UI to render.
        let offering = placement
          ? await Purchases.getCurrentOfferingForPlacement(placement)
          : null;
        if (!offering) {
          const offerings = await Purchases.getOfferings();
          offering = offerings.current;
        }

        if (cancelled) return;

        const monthly = offering?.monthly ?? null;
        if (!monthly) {
          setError(
            "Subscriptions aren't available right now. Please try again later.",
          );
        } else {
          setPkg(monthly);
          setVariant(parseVariant(offering?.metadata?.variant));
        }
      } catch (err) {
        logger.error("Paywall: getOffering failed", { err, placement });
        if (!cancelled) {
          setError("Couldn't load subscription details. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingOfferings(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)");
  };

  // RC confirms the purchase synchronously, but the tier the app reads
  // comes from the backend (driven by the RC webhook). Hand off to the
  // Activating screen, which polls entitlements until the tier flips
  // and then routes home. Replace (not push) so Back can't return to
  // the paywall after the purchase is live.
  const handleActivating = () => {
    router.replace("/paywall-activating");
  };

  const handlePurchase = async () => {
    if (!pkg || purchasing) return;
    setError(null);
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (
        !customerInfo.entitlements.active[RC_ENTITLEMENT_INDIVIDUAL]?.isActive
      ) {
        // RC said the purchase succeeded but the entitlement isn't visible
        // yet — can happen if the store receipt lands before RC's backend
        // fully processes it, or if entitlement attachment is misconfigured.
        // Never bail silently: the user was charged. Route to the activating
        // screen which polls the backend (fed by the webhook) and surfaces
        // a "contact support" escape hatch if the tier never flips.
        logger.error(
          "Paywall: purchase returned without active entitlement — routing to activating",
          { appUserId: customerInfo.originalAppUserId },
        );
        handleActivating();
        return;
      }

      // Force a server-side reconcile against RC's REST view rather than
      // waiting for the webhook. The webhook usually lands in ~1-2s but
      // can lag, and the read-only path was racing it. Sync makes the
      // backend authoritative immediately, so when we invalidate, the
      // plan-entitlements query (which gates feature access) refetches
      // fresh data — no jarring activating-screen swap on the happy path.
      try {
        const fresh = await entitlements.syncEntitlements();
        queryClient.setQueryData(queryKeys.entitlements.current(), fresh);
        queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
        dismiss();
      } catch (syncErr) {
        logger.error("Paywall: entitlements.syncEntitlements failed", {
          err: syncErr,
        });
        handleActivating();
      }
    } catch (err) {
      // RC throws { userCancelled: true } when the user dismisses the
      // native purchase sheet — silence those, surface everything else.
      if ((err as { userCancelled?: boolean })?.userCancelled) return;
      logger.error("Paywall: purchase failed", { err });
      setError("Purchase couldn't be completed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setError(null);
    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (
        !customerInfo.entitlements.active[RC_ENTITLEMENT_INDIVIDUAL]?.isActive
      ) {
        setError("No active subscription found to restore.");
        return;
      }

      // Guard against restoring a subscription tied to a different Legacy
      // Made account. `originalAppUserId` is the first app user ID ever
      // associated with the receipt — if it's a real Clerk user ID that
      // doesn't match the signed-in user, the store account (Apple ID /
      // Google account) belongs to someone else's LM account. Anonymous
      // IDs ($RCAnonymousID:…) are safe: they get aliased into the
      // current user on next logIn.
      const originalId = customerInfo.originalAppUserId;
      const isAnonymous = originalId?.startsWith("$RCAnonymousID:");
      if (user?.id && originalId && !isAnonymous && originalId !== user.id) {
        logger.warn("Paywall: restore blocked — cross-user receipt", {
          originalAppUserId: originalId,
          currentUserId: user.id,
        });
        setError(
          "This subscription belongs to a different Legacy Made account. Sign in with that account to restore it.",
        );
        return;
      }

      // RC says the entitlement is active, but our backend might not
      // know yet — restore doesn't always trigger a webhook (e.g. when
      // RC was already in sync with the store). Reconcile against RC's
      // REST view directly so the backend tier reflects reality before
      // we navigate away.
      try {
        const fresh = await entitlements.syncEntitlements();
        queryClient.setQueryData(queryKeys.entitlements.current(), fresh);
        queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
        dismiss();
      } catch (syncErr) {
        // Reconcile failed; fall back to the activating screen which
        // will keep polling and offers a manual retry.
        logger.error("Paywall: entitlements.syncEntitlements failed", {
          err: syncErr,
        });
        handleActivating();
      }
    } catch (err) {
      logger.error("Paywall: restore failed", { err });
      setError("Restore couldn't be completed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  // Price comes from RC's package (store-driven). While offerings are still
  // loading, show a price-free CTA so we never render the wrong currency
  // or an outdated anchor price before the store responds.
  const priceString = pkg?.product?.priceString ?? null;
  const ctaCopy = priceString
    ? `Subscribe for ${priceString} / month`
    : "Subscribe";
  const disclosure = priceString
    ? `Your subscription renews automatically at ${priceString} / month unless cancelled at least 24 hours before the period ends. ${MANAGE_INSTRUCTION}`
    : `Your subscription renews automatically each month unless cancelled at least 24 hours before the period ends. ${MANAGE_INSTRUCTION}`;

  const VariantComponent = VARIANTS[variant];

  // Wrapping in a View with flex:1 so the variant's sheet fills the screen
  // even when presented outside a modal (e.g. first-open).
  return (
    <View style={{ flex: 1 }}>
      <VariantComponent
        ctaCopy={ctaCopy}
        disclosure={disclosure}
        loading={loadingOfferings}
        purchasing={purchasing}
        restoring={restoring}
        error={error}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
        onDismiss={dismiss}
        onOpenTerms={() =>
          WebBrowser.openBrowserAsync(EXTERNAL_LINKS.termsOfService)
        }
        onOpenPrivacy={() =>
          WebBrowser.openBrowserAsync(EXTERNAL_LINKS.privacyPolicy)
        }
      />
    </View>
  );
}
