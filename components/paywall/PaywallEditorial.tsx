import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/theme";

import { PaywallChrome } from "./shared/PaywallChrome";
import { PaywallFooter } from "./shared/PaywallFooter";
import { PAYWALL_COLORS } from "./shared/tokens";
import type { PaywallVariantProps } from "./shared/types";

const VALUE_PROPS = [
  "Unlimited contacts, accounts, and documents",
  "500 MB storage — for deeds, scans, and photos",
  "Wishes & Legacy Messages, fully unlocked",
  "1 trusted contact included",
];

export function PaywallEditorial(props: PaywallVariantProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <PaywallChrome onDismiss={props.onDismiss} />

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

      <PaywallFooter
        ctaCopy={props.ctaCopy}
        disclosure={props.disclosure}
        loading={props.loading}
        purchasing={props.purchasing}
        restoring={props.restoring}
        error={props.error}
        bottomInset={insets.bottom}
        onPurchase={props.onPurchase}
        onRestore={props.onRestore}
        onOpenTerms={props.onOpenTerms}
        onOpenPrivacy={props.onOpenPrivacy}
      />
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
});
