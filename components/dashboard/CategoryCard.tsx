import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressableCard } from '@/components/ui/Card';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { useAppContext } from '@/data/store';
import type { Category } from '@/data/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const { state } = useAppContext();

  const handlePress = () => {
    router.push(category.route as any);
  };

  // Calculate item count based on category's stateKey and filterType
  const getItemCount = (): number => {
    if (!category.stateKey) return 0;

    const items = state[category.stateKey];
    if (!items) return 0;

    // For contacts, filter by primary/secondary
    if (category.stateKey === 'contacts' && category.filterType) {
      if (category.filterType === 'primary') {
        return state.contacts.filter((c) => c.isPrimary).length;
      } else {
        return state.contacts.filter((c) => !c.isPrimary).length;
      }
    }

    return items.length;
  };

  const itemCount = getItemCount();
  // For now, use 1 as the "goal" for each category (can be made configurable later)
  const goalCount = category.filterType === 'primary' ? 2 : 1;
  const progress = Math.min(itemCount / goalCount, 1);

  return (
    <PressableCard onPress={handlePress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={category.ionIcon as any}
            size={22}
            color={colors.textTertiary}
          />
        </View>
        <View style={styles.textContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{category.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
            <Text style={styles.description}>{category.description}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {itemCount}/{goalCount}
            </Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    minWidth: 28,
    textAlign: 'right',
  },
});
