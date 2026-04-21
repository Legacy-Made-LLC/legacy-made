import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/theme";

import { PaywallChrome } from "./shared/PaywallChrome";
import { PaywallFooter } from "./shared/PaywallFooter";
import { PAYWALL_COLORS } from "./shared/tokens";
import type { PaywallVariantProps } from "./shared/types";

interface Pillar {
  title: string;
  note: string;
  locked: boolean;
}

const PILLARS: Pillar[] = [
  {
    title: "Important Information",
    note: "accounts, documents, contacts",
    locked: false,
  },
  {
    title: "Wishes & Guidance",
    note: "preferences, directives",
    locked: true,
  },
  {
    title: "Legacy Messages",
    note: "letters, recordings, moments",
    locked: true,
  },
  {
    title: "Trusted Contacts",
    note: "who can view your plan",
    locked: true,
  },
];

const STATS: { value: string; label: string }[] = [
  { value: "∞", label: "info, wishes, messages" },
  { value: "500 MB", label: "secure storage" },
  { value: "1", label: "trusted contact" },
];

function LockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Rect
        x={2.5}
        y={6}
        width={9}
        height={7}
        rx={1.3}
        stroke={PAYWALL_COLORS.textSecondary}
        strokeWidth={1.3}
        fill="none"
      />
      <Path
        d="M4.5 6V4a2.5 2.5 0 115 0v2"
        stroke={PAYWALL_COLORS.textSecondary}
        strokeWidth={1.3}
        fill="none"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path
        d="M3 7.5l3 3 5-6"
        stroke={PAYWALL_COLORS.white}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PaywallPillars(props: PaywallVariantProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingTop: insets.top }]}>
      <PaywallChrome onDismiss={props.onDismiss} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>3 of 4 pillars are locked</Text>
        <Text style={styles.headline}>
          Open every{" "}
          <Text style={styles.headlineItalic}>door</Text> you&rsquo;ve started.
        </Text>
      </View>

      <View style={styles.pillars}>
        {PILLARS.map((pillar) => (
          <View
            key={pillar.title}
            style={[
              styles.pillarRow,
              pillar.locked ? styles.pillarRowLocked : styles.pillarRowOpen,
            ]}
          >
            <View
              style={[
                styles.pillarIcon,
                pillar.locked
                  ? styles.pillarIconLocked
                  : styles.pillarIconOpen,
              ]}
            >
              {pillar.locked ? <LockIcon /> : <CheckIcon />}
            </View>
            <View style={styles.pillarText}>
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Text style={styles.pillarNote}>{pillar.note}</Text>
            </View>
            {!pillar.locked ? (
              <Text style={styles.pillarFreeTag}>Free</Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.statStrip}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statCell}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
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
    paddingBottom: 28,
    backgroundColor: PAYWALL_COLORS.sageTint,
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
  pillars: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillarRowLocked: {
    backgroundColor: PAYWALL_COLORS.surface,
    borderColor: PAYWALL_COLORS.line,
  },
  pillarRowOpen: {
    backgroundColor: PAYWALL_COLORS.sageTint,
    borderColor: "rgba(138,151,133,0.3)",
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pillarIconLocked: {
    backgroundColor: PAYWALL_COLORS.cream,
    borderColor: PAYWALL_COLORS.line,
  },
  pillarIconOpen: {
    backgroundColor: PAYWALL_COLORS.sage,
    borderColor: "rgba(125,138,121,0.4)",
  },
  pillarText: {
    flex: 1,
    minWidth: 0,
  },
  pillarTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: PAYWALL_COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  pillarNote: {
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: PAYWALL_COLORS.textTertiary,
  },
  pillarFreeTag: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: PAYWALL_COLORS.sageInk,
  },
  statStrip: {
    marginHorizontal: 20,
    marginTop: 18,
    flexDirection: "row",
    backgroundColor: PAYWALL_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PAYWALL_COLORS.line,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 22,
    lineHeight: 24,
    color: PAYWALL_COLORS.sageInk,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    lineHeight: 14,
    color: PAYWALL_COLORS.textTertiary,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  spacer: {
    flex: 1,
  },
});
