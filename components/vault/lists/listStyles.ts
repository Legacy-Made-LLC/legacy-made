/**
 * Shared styles for list components
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
    paddingTop: spacing.md,
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
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
