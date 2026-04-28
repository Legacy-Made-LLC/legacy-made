import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { AnyFieldApi } from "@tanstack/react-form";
import { colors, typography, spacing, borderRadius } from "@/constants/theme";

interface FormTypeSelectorProps<T extends string> {
  field: AnyFieldApi;
  label: string;
  options: readonly T[];
}

export function FormTypeSelector<T extends string>({
  field,
  label,
  options,
}: FormTypeSelectorProps<T>) {
  const hasError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;
  const errorMessage = hasError ? field.state.meta.errors[0] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.typeGrid}>
        {options.map((type) => (
          <Pressable
            key={type}
            style={[
              styles.typeButton,
              field.state.value === type && styles.typeButtonSelected,
            ]}
            onPress={() => field.handleChange(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                field.state.value === type && styles.typeButtonTextSelected,
              ]}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
      {errorMessage && (
        <Text style={styles.errorText}>{String(errorMessage)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
    fontFamily: typography.fontFamily.medium,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
