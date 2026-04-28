/**
 * Shared styles for form components
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fieldRowItem: {
    flex: 1,
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
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
});
