import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/constants/theme";

export default function WishesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="heart" size={40} color={colors.textTertiary} />
        </View>
        <Text style={styles.title}>Wishes & Guidance</Text>
        <Text style={styles.subtitle}>
          Share your personal wishes, values, and guidance for your loved ones.
        </Text>
        <Text style={styles.comingSoon}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  comingSoon: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
