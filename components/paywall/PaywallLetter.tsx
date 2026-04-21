import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/theme";

import { PaywallChrome } from "./shared/PaywallChrome";
import { PaywallFooter } from "./shared/PaywallFooter";
import { PAYWALL_COLORS } from "./shared/tokens";
import type { PaywallVariantProps } from "./shared/types";

const BULLETS = [
  "Unlimited entries",
  "500 MB storage",
  "Wishes & Messages",
  "1 trusted contact",
];

export function PaywallLetter(props: PaywallVariantProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <PaywallChrome onDismiss={props.onDismiss} />

      <View style={styles.card}>
        <Text style={styles.mark}>No. 01 / Individual</Text>

        <Text style={styles.openingLine}>A small note before you continue,</Text>

        <Text style={styles.headline}>
          You&rsquo;ve done the hardest part —{" "}
          <Text style={styles.headlineItalic}>showing up.</Text>
        </Text>

        <Text style={styles.body}>
          Individual removes every limit so there&rsquo;s nothing between you
          and the people who will one day open this.
        </Text>

        <View style={styles.divider} />

        <View style={styles.bullets}>
          {BULLETS.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.priceLine}>
          — {props.priceString} / month, cancel any time
        </Text>
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
        variant="compact"
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
    backgroundColor: PAYWALL_COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  card: {
    marginHorizontal: 22,
    marginTop: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 26,
    backgroundColor: PAYWALL_COLORS.surface,
    borderRadius: 16,
    shadowColor: PAYWALL_COLORS.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
    position: "relative",
  },
  mark: {
    position: "absolute",
    top: 14,
    right: 16,
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: PAYWALL_COLORS.sagePressed,
  },
  openingLine: {
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: 13,
    lineHeight: 18,
    color: PAYWALL_COLORS.textTertiary,
    marginBottom: 16,
  },
  headline: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 26,
    lineHeight: 32,
    color: PAYWALL_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headlineItalic: {
    fontFamily: typography.fontFamily.serifItalic,
    color: PAYWALL_COLORS.sageInk,
  },
  body: {
    marginTop: 14,
    fontFamily: typography.fontFamily.serif,
    fontSize: 16,
    lineHeight: 24,
    color: PAYWALL_COLORS.textPrimary,
  },
  divider: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: PAYWALL_COLORS.textQuaternary,
    borderStyle: "dashed",
  },
  bullets: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 10,
  },
  bulletRow: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PAYWALL_COLORS.sagePressed,
  },
  bulletText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: PAYWALL_COLORS.textPrimary,
  },
  priceLine: {
    marginTop: 20,
    textAlign: "right",
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: 14,
    color: PAYWALL_COLORS.textTertiary,
  },
  spacer: {
    flex: 1,
  },
});
