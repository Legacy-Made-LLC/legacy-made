/**
 * Shared styles for wishes form components
 *
 * Uses lavender color theme (featureWishes) instead of sage green.
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const wishesFormStyles = StyleSheet.create({
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
  // Field containers
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldRowItem: {
    flex: 1,
  },
  // Labels
  label: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // Section headers within forms
  sectionHeader: {
    fontSize: typography.sizes.titleMedium,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionDescription: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  // Selection buttons (for type pickers, options)
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
    backgroundColor: colors.featureWishes, // Lavender
    borderColor: colors.featureWishes,
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
  // Dropdown/select styles
  selectContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  selectPlaceholder: {
    color: colors.textTertiary,
  },
  // Checkbox group styles
  checkboxGroup: {
    gap: spacing.sm,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  checkboxItemSelected: {
    borderColor: colors.featureWishes,
    backgroundColor: colors.featureWishesTint,
  },
  checkboxText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxSelected: {
    backgroundColor: colors.featureWishes,
    borderColor: colors.featureWishes,
  },
  // Button containers
  buttonContainer: {
    marginTop: spacing.xl,
  },
  // Primary button (lavender themed)
  primaryButton: {
    backgroundColor: colors.featureWishes,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  primaryButtonTextDisabled: {
    color: colors.textTertiary,
  },
  // Delete button
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  deleteButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
  // Helper text
  helperText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  // Intro text for forms
  intro: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * 1.5,
    marginBottom: spacing.xl,
  },
  // Info cards (for contextual information)
  infoCard: {
    backgroundColor: colors.featureWishesTint,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * 1.5,
  },
  // Notes section spacing
  notesSection: {
    marginTop: spacing.lg,
  },
  // Reflection prompt styles (for "What Matters Most" type questions)
  reflectionPrompt: {
    marginBottom: spacing.lg,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  reflectionQuestion: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  reflectionContext: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
  },
});
