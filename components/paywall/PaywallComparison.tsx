import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/theme";

import { PaywallChrome } from "./shared/PaywallChrome";
import { PaywallFooter } from "./shared/PaywallFooter";
import { PAYWALL_COLORS } from "./shared/tokens";
import type { PaywallVariantProps } from "./shared/types";

const ROWS: { label: string; free: string; individual: string }[] = [
  { label: "Important information items", free: "5", individual: "Unlimited" },
  { label: "Wishes & Guidance", free: "—", individual: "Unlimited" },
  { label: "Legacy Messages", free: "—", individual: "Unlimited" },
  { label: "Trusted contacts", free: "—", individual: "1" },
  { label: "Document & media storage", free: "—", individual: "500 MB" },
];

export function PaywallComparison(props: PaywallVariantProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <PaywallChrome onDismiss={props.onDismiss} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>You&rsquo;ve hit your free limit</Text>
        <Text style={styles.headline}>
          Room for everything{" "}
          <Text style={styles.headlineItalic}>that matters.</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Feature</Text>
          <Text style={styles.headerFree}>Free</Text>
          <View style={styles.headerIndividual}>
            <Text style={styles.headerIndividualLabel}>Individual</Text>
          </View>
        </View>

        {ROWS.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.row,
              index > 0 && styles.rowWithTopBorder,
            ]}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowFree}>{row.free}</Text>
            <View style={styles.rowIndividual}>
              <Text style={styles.rowIndividualText}>{row.individual}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.tagline}>
        Keep your free plan · Upgrade any time
      </Text>

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
    backgroundColor: PAYWALL_COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  hero: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 22,
    gap: 14,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: PAYWALL_COLORS.sagePressed,
  },
  headline: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 30,
    lineHeight: 36,
    color: PAYWALL_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headlineItalic: {
    fontFamily: typography.fontFamily.serifItalic,
    color: PAYWALL_COLORS.sageInk,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: PAYWALL_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PAYWALL_COLORS.line,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PAYWALL_COLORS.line,
    gap: 8,
  },
  headerLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: PAYWALL_COLORS.textTertiary,
  },
  headerFree: {
    width: 64,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: PAYWALL_COLORS.textTertiary,
    textAlign: "center",
  },
  headerIndividual: {
    width: 96,
    backgroundColor: PAYWALL_COLORS.sageTint,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  headerIndividualLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    color: PAYWALL_COLORS.sageInk,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  rowWithTopBorder: {
    borderTopWidth: 1,
    borderTopColor: PAYWALL_COLORS.line,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13.5,
    lineHeight: 18,
    color: PAYWALL_COLORS.textPrimary,
    paddingRight: 8,
  },
  rowFree: {
    width: 64,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: PAYWALL_COLORS.textTertiary,
    textAlign: "center",
  },
  rowIndividual: {
    width: 96,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: PAYWALL_COLORS.sageWash,
    alignItems: "center",
  },
  rowIndividualText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    color: PAYWALL_COLORS.sageInk,
  },
  tagline: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: PAYWALL_COLORS.textTertiary,
  },
  spacer: {
    flex: 1,
  },
});
