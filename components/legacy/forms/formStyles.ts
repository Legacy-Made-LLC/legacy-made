/**
 * Shared styles for legacy form components
 *
 * Uses blue color theme (featureLegacy) instead of sage green or lavender.
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const legacyFormStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  // Field containers
  fieldContainer: {
    marginBottom: spacing.md,
  },
  // Type selector buttons
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  typeButtonSelected: {
    backgroundColor: colors.featureLegacy,
    borderColor: colors.featureLegacy,
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
  // Labels
  label: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
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
  // Info cards
  infoCard: {
    backgroundColor: colors.featureLegacyTint,
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
  // Section description
  sectionDescription: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  // Record video button
  recordVideoButton: {
    backgroundColor: colors.featureLegacy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: 26,
  },
  recordVideoButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  recordVideoButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  recordVideoHint: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  // Recording dot indicator (red circle next to "Record Video" text)
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  // Encouraging text above record button
  encouragingText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    fontStyle: "italic",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  // Cancel / Save button row
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonPressed: {
    opacity: 0.8,
  },
  cancelButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  saveButtonInRow: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.featureLegacy,
  },
  saveButtonInRowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonInRowDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonInRowText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  saveButtonInRowTextDisabled: {
    color: colors.textTertiary,
  },
  // Inspiration collapsible section
  inspirationContainer: {
    marginBottom: spacing.md,
  },
  inspirationTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  inspirationTriggerText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.featureLegacyDark,
  },
  inspirationContent: {
    backgroundColor: colors.featureLegacyTint,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  inspirationItem: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  inspirationBullet: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  inspirationText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    flex: 1,
  },
});
