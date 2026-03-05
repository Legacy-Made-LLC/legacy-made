/**
 * Shared styles for legacy list components
 * Reuses the same pattern as vault/lists/listStyles.ts
 */

import { colors, spacing, typography } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const listStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.titleMedium,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  addCard: {
    marginBottom: spacing.md,
    alignItems: "center",
  },
  addText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.featureLegacy,
  },
  sortRow: {
    marginTop: spacing.xs,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.featureLegacyTint,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
});
