/**
 * AccessTimingSelector - Radio card selector for access timing
 */

import type { TrustedContactAccessTiming } from "@/api/types";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AccessTimingOption {
  value: TrustedContactAccessTiming;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACCESS_TIMINGS: AccessTimingOption[] = [
  {
    value: "immediate",
    label: "Immediately",
    description:
      "They\u2019ll receive an invitation and can access your plan right away.",
    icon: "flash-outline",
  },
  {
    value: "upon_passing",
    label: "Upon my passing",
    description:
      "They\u2019ll be notified now, but access will only be granted when the time comes.",
    icon: "time-outline",
  },
];

interface AccessTimingSelectorProps {
  value: TrustedContactAccessTiming | undefined;
  onChange: (value: TrustedContactAccessTiming) => void;
}

export function AccessTimingSelector({
  value,
  onChange,
}: AccessTimingSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>WHEN SHOULD THEY HAVE ACCESS?</Text>
      <View style={styles.options}>
        {ACCESS_TIMINGS.map((option) => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      isSelected
                        ? colors.featureFamily
                        : colors.textTertiary
                    }
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.featureFamily,
    backgroundColor: colors.featureFamilyTint,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  optionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.featureFamilyDark,
  },
  optionDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    paddingLeft: 28,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: colors.featureFamily,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.featureFamily,
  },
});
