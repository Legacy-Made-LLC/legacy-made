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

import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

import {
  PaywallComparison,
  PaywallEditorial,
  PaywallPillars,
  type PaywallVariant,
  type PaywallVariantProps,
} from "@/components/paywall";
import { EXTERNAL_LINKS } from "@/constants/links";
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
  const queryClient = useQueryClient();

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [variant, setVariant] = useState<PaywallVariant>(
    DEFAULT_PAYWALL_VARIANT,
  );
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Backend is the source of truth for tier (driven by RC webhooks). After a
  // successful purchase/restore, invalidate plan + entitlements so the app
  // reflects the new tier without requiring a manual refresh.
  //
  // Race: the RC webhook → DB write typically lands a beat after the RC
  // purchase callback resolves, and may take longer under load. A single
  // immediate refetch catches the pre-webhook state and leaves the UI
  // showing "Free". Invalidate on a bounded schedule covering ~10s; the
  // first hit that lands post-webhook sets the correct tier, and
  // subsequent invalidations against stale state are cheap no-ops.
  const refreshTier = () => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });
    };
    invalidate();
    const schedule = [1500, 3500, 6500, 10000];
    for (const delay of schedule) setTimeout(invalidate, delay);
  };

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

  const handlePurchase = async () => {
    if (!pkg || purchasing) return;
    setError(null);
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (
        customerInfo.entitlements.active[RC_ENTITLEMENT_INDIVIDUAL]?.isActive
      ) {
        refreshTier();
        dismiss();
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
        customerInfo.entitlements.active[RC_ENTITLEMENT_INDIVIDUAL]?.isActive
      ) {
        refreshTier();
        dismiss();
      } else {
        setError("No active subscription found to restore.");
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
