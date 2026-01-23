/**
 * Shared styles for list components
 */

import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
  },
  addText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
