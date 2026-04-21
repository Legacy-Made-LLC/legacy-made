import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { typography } from "@/constants/theme";

import { PAYWALL_COLORS } from "./tokens";

interface PaywallFooterProps {
  subscriptionLabel?: string;
  ctaCopy: string;
  disclosure: string;
  loading: boolean;
  purchasing: boolean;
  restoring: boolean;
  error: string | null;
  bottomInset: number;
  variant?: "standard" | "compact";
  onPurchase: () => void;
  onRestore: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export function PaywallFooter({
  subscriptionLabel = "Legacy Made Individual · monthly",
  ctaCopy,
  disclosure,
  loading,
  purchasing,
  restoring,
  error,
  bottomInset,
  variant = "standard",
  onPurchase,
  onRestore,
  onOpenTerms,
  onOpenPrivacy,
}: PaywallFooterProps) {
  const disabled = loading || purchasing;

  return (
    <View
      style={[
        styles.footer,
        variant === "compact" && styles.footerCompact,
        { paddingBottom: bottomInset + 28 },
      ]}
    >
      {variant === "standard" ? (
        <Text style={styles.subscriptionLabel}>{subscriptionLabel}</Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        onPress={onPurchase}
        disabled={disabled}
        style={({ pressed }) => [
          styles.cta,
          disabled && styles.ctaDisabled,
          pressed && !disabled && styles.ctaPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={ctaCopy}
      >
        {purchasing ? (
          <ActivityIndicator color={PAYWALL_COLORS.white} />
        ) : (
          <Text style={styles.ctaLabel}>
            {loading ? "Loading…" : ctaCopy}
          </Text>
        )}
      </Pressable>

      <Text style={styles.disclosure}>{disclosure}</Text>

      <View style={styles.footerLinks}>
        <Pressable onPress={onOpenTerms} hitSlop={6}>
          <Text style={styles.footerLink}>Terms</Text>
        </Pressable>
        <View style={styles.footerDot} />
        <Pressable onPress={onOpenPrivacy} hitSlop={6}>
          <Text style={styles.footerLink}>Privacy</Text>
        </Pressable>
        <View style={styles.footerDot} />
        <Pressable
          onPress={onRestore}
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
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 14,
  },
  footerCompact: {
    paddingTop: 16,
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
