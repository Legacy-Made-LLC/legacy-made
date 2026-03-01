/**
 * EmptyState - Reusable empty state component for list views
 */

import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  /** Override the default icon (defaults to "add-circle-outline") */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override the icon color */
  iconColor?: string;
  /** Optional secondary text link displayed below the primary button */
  secondaryActionLabel?: string;
  /** Callback when secondary action is tapped */
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  buttonTitle,
  onButtonPress,
  icon = "add-circle-outline",
  iconColor = colors.textTertiary,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const hasButton = buttonTitle && onButtonPress;
  const hasSecondary = secondaryActionLabel && onSecondaryAction;

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={icon}
        size={40}
        color={iconColor}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.description, !hasButton && !hasSecondary && styles.descriptionNoButton]}>{description}</Text>
      {hasButton && (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.button}
        />
      )}
      {hasSecondary && (
        <Pressable onPress={onSecondaryAction} hitSlop={8} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  descriptionNoButton: {
    marginBottom: 0,
  },
  button: {
    minWidth: 200,
  },
  secondaryAction: {
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: "center" as const,
  },
  secondaryActionText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
  },
});
