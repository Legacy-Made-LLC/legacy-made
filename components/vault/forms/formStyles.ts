/**
 * Shared styles for form components
 */

import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

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
    paddingTop: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
