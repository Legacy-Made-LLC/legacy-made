/**
 * EmptyState - Reusable empty state component for list views
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button } from './Button';
import { colors, typography, spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle: string;
  onButtonPress: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  buttonTitle,
  onButtonPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="add-circle-outline"
        size={40}
        color={colors.textTertiary}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Button title={buttonTitle} onPress={onButtonPress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
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
    textAlign: 'center',
  },
  description: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});
