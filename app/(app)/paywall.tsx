/**
 * Paywall — Legacy Made Individual
 *
 * Custom RN paywall built to spec from `_docs/paywall-design-handoff.md`.
 * Renders the `default` offering's `$rc_monthly` package and drives the
 * purchase via Purchases.purchasePackage(). We chose a custom component
 * over RC's hosted paywall to get pixel-perfect design fidelity; the
 * Customer Center surface still uses RC's hosted UI.
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

import { EXTERNAL_LINKS } from "@/constants/links";
import { typography } from "@/constants/theme";
import { logger } from "@/lib/logger";
import { RC_ENTITLEMENT_INDIVIDUAL } from "@/providers/RevenueCatProvider";

const PAYWALL_COLORS = {
  bg: "#FAF9F7",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textTertiary: "#9B9B9B",
  sage: "#8A9785",
  sagePressed: "#7D8A79",
  surfaceQuiet: "#F0EEEB",
  grabber: "#D8D3CC",
  hairline: "#C9C5BF",
  white: "#FFFFFF",
  error: "#A63D40",
};

const VALUE_PROPS = [
  "Unlimited contacts, accounts, and documents",
  "1 GiB file uploads — for deeds, scans, and photos",
  "All four pillars, fully unlocked",
  "Human support, within a day",
];

// Apple requires the management instruction; Google requires the parallel
// Play wording. Swap based on platform.
const MANAGE_INSTRUCTION =
  Platform.OS === "ios"
    ? "Manage anytime in your Apple ID settings."
    : "Manage anytime in your Google Play account settings.";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const monthly = offerings.current?.monthly ?? null;
        if (cancelled) return;
        if (!monthly) {
          setError(
            "Subscriptions aren't available right now. Please try again later.",
          );
        } else {
          setPkg(monthly);
        }
      } catch (err) {
        logger.error("Paywall: getOfferings failed", { err });
        if (!cancelled) {
          setError(
            "Couldn't load subscription details. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoadingOfferings(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Price comes from RC's package (store-driven); fall back to the spec's
  // anchor price if loading hasn't finished yet so the CTA isn't blank.
  const priceString = pkg?.product?.priceString ?? "$4.99";
  const ctaCopy = `Subscribe for ${priceString} / month`;
  const disclosure = `Your subscription renews automatically at ${priceString} / month unless cancelled at least 24 hours before the period ends. ${MANAGE_INSTRUCTION}`;

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <View style={styles.chrome}>
        <View style={styles.grabber} />
        <Pressable
          onPress={dismiss}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && { opacity: 0.6 },
          ]}
          hitSlop={8}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons
            name="close"
            size={16}
            color={PAYWALL_COLORS.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.headline}>Clarity for the people you love.</Text>
        <Text style={styles.subhead}>
          Unlock everything, so nothing&rsquo;s left to guess.
        </Text>
      </View>

      <View style={styles.valueProps}>
        {VALUE_PROPS.map((label) => (
          <View key={label} style={styles.valuePropRow}>
            <View style={styles.valuePropDot} />
            <Text style={styles.valuePropLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.subscriptionLabel}>
          Legacy Made Individual · monthly
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handlePurchase}
          disabled={loadingOfferings || !pkg || purchasing}
          style={({ pressed }) => [
            styles.cta,
            (loadingOfferings || !pkg) && styles.ctaDisabled,
            pressed && pkg && !purchasing && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaCopy}
        >
          {purchasing ? (
            <ActivityIndicator color={PAYWALL_COLORS.white} />
          ) : (
            <Text style={styles.ctaLabel}>
              {loadingOfferings ? "Loading…" : ctaCopy}
            </Text>
          )}
        </Pressable>

        <Text style={styles.disclosure}>{disclosure}</Text>

        <View style={styles.footerLinks}>
          <Pressable
            onPress={() =>
              WebBrowser.openBrowserAsync(EXTERNAL_LINKS.termsOfService)
            }
            hitSlop={6}
          >
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <View style={styles.footerDot} />
          <Pressable
            onPress={() =>
              WebBrowser.openBrowserAsync(EXTERNAL_LINKS.privacyPolicy)
            }
            hitSlop={6}
          >
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <View style={styles.footerDot} />
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.footerLink,
                restoring && styles.footerLinkDisabled,
              ]}
            >
              {restoring ? "Restoring…" : "Restore Purchases"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: PAYWALL_COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  chrome: {
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: "center",
    position: "relative",
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PAYWALL_COLORS.grabber,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PAYWALL_COLORS.surfaceQuiet,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    paddingHorizontal: 28,
    paddingTop: 44,
    gap: 16,
  },
  headline: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 32,
    lineHeight: 40,
    color: PAYWALL_COLORS.textPrimary,
    letterSpacing: -0.32,
    maxWidth: 320,
  },
  subhead: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: PAYWALL_COLORS.textSecondary,
    maxWidth: 320,
  },
  valueProps: {
    paddingHorizontal: 28,
    paddingTop: 36,
    gap: 18,
  },
  valuePropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  valuePropDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PAYWALL_COLORS.sage,
  },
  valuePropLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    color: PAYWALL_COLORS.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 14,
  },
  subscriptionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: PAYWALL_COLORS.textPrimary,
    textAlign: "center",
    paddingBottom: 2,
  },
  cta: {
    height: 54,
    borderRadius: 27,
    backgroundColor: PAYWALL_COLORS.sage,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ctaPressed: {
    backgroundColor: PAYWALL_COLORS.sagePressed,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: PAYWALL_COLORS.white,
    letterSpacing: -0.08,
  },
  disclosure: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: PAYWALL_COLORS.textTertiary,
    textAlign: "center",
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: 6,
  },
  footerLink: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: PAYWALL_COLORS.textSecondary,
  },
  footerLinkDisabled: {
    opacity: 0.5,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: PAYWALL_COLORS.hairline,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: PAYWALL_COLORS.error,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
