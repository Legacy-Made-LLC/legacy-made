import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/theme";

import { PaywallChrome } from "./shared/PaywallChrome";
import { PaywallFooter } from "./shared/PaywallFooter";
import { PAYWALL_COLORS } from "./shared/tokens";
import type { PaywallVariantProps } from "./shared/types";

interface Feature {
  title: string;
  note: string;
}

const FEATURES: Feature[] = [
  {
    title: "Unlimited important information items",
    note: "Accounts, documents, contacts — no cap.",
  },
  {
    title: "Wishes & Guidance, unlocked",
    note: "Preferences, directives, and decisions — previously locked.",
  },
  {
    title: "Unlimited legacy messages",
    note: "Letters, audio, and video for the people who matter.",
  },
  {
    title: "500 MB of secure storage",
    note: "For deeds, scans, and family photos. 1 trusted contact included.",
  },
];

export function PaywallEditorial(props: PaywallVariantProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <PaywallChrome onDismiss={props.onDismiss} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Legacy Made · Individual</Text>
        <Text style={styles.headline}>
          A quiet gift for
          {"\n"}
          <Text style={styles.headlineItalic}>the people you love.</Text>
        </Text>
        <Text style={styles.subhead}>
          You&rsquo;ve been organizing what matters. This removes the limits —
          so your people find everything exactly where you left it.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureNote}>{feature.note}</Text>
            </View>
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
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: PAYWALL_COLORS.sagePressed,
    marginBottom: 18,
  },
  headline: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: PAYWALL_COLORS.textPrimary,
  },
  headlineItalic: {
    fontFamily: typography.fontFamily.serifItalic,
    color: PAYWALL_COLORS.sageInk,
  },
  subhead: {
    marginTop: 18,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: PAYWALL_COLORS.textSecondary,
    maxWidth: 320,
  },
  features: {
    paddingHorizontal: 32,
    paddingTop: 28,
    gap: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PAYWALL_COLORS.sagePressed,
    marginTop: 8,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.1,
    color: PAYWALL_COLORS.textPrimary,
  },
  featureNote: {
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: PAYWALL_COLORS.textTertiary,
  },
  spacer: {
    flex: 1,
  },
});
