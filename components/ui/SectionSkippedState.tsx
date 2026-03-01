/**
 * SectionSkippedState - Calm centered view for sections marked "not applicable"
 *
 * Displayed when a user navigates to a section they've previously skipped.
 * Shows a gentle message with a "Change my mind" button to undo.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  borderRadius,
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import { useTranslations } from "@/contexts/LocaleContext";

interface SectionSkippedStateProps {
  onChangeMyMind: () => void;
  /** When true, hides the "Change my mind" button (for family viewers) */
  readOnly?: boolean;
}

export function SectionSkippedState({
  onChangeMyMind,
  readOnly,
}: SectionSkippedStateProps) {
  const t = useTranslations();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="remove" size={28} color={colors.textTertiary} />
      </View>
      <Text style={styles.title}>{t.common.notApplicable.title}</Text>
      <Text style={styles.description}>
        {t.common.notApplicable.description}
      </Text>
      {!readOnly && (
        <Pressable onPress={onChangeMyMind} style={styles.button}>
          <Text style={styles.buttonText}>
            {t.common.notApplicable.changeMyMind}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  button: {
    height: componentStyles.button.height,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
