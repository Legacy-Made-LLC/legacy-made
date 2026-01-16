import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableCard } from '@/components/ui/Card';
import { colors, typography, spacing } from '@/constants/theme';
import type { Category } from '@/data/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(category.route as any);
  };

  return (
    <PressableCard onPress={handlePress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.icon}>{category.icon}</Text>
          <View style={styles.textContent}>
            <Text style={styles.title}>{category.title}</Text>
            <Text style={styles.description}>{category.description}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.titleMedium,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});
