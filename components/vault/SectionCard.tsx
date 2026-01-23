/**
 * SectionCard - Dashboard card for a vault section
 *
 * Displays section information with entry count and progress.
 * Handles navigation based on whether the section has one or multiple tasks.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressableCard } from '@/components/ui/Card';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { VaultSection } from '@/constants/vault';

interface SectionCardProps {
  section: VaultSection;
  /** Entry counts by taskKey */
  counts: Record<string, number>;
}

export function SectionCard({ section, counts }: SectionCardProps) {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to the section (it will redirect to single task if applicable)
    router.push(`/vault/${section.id}`);
  };

  // Calculate total entries for this section
  const totalEntries = section.tasks.reduce((sum, task) => {
    return sum + (counts[task.taskKey] || 0);
  }, 0);

  // Calculate completion for this section
  // Goal: at least 1 entry per task
  const completedTasks = section.tasks.filter(
    (task) => (counts[task.taskKey] || 0) > 0
  ).length;
  const goalCount = section.tasks.length;
  const progress = goalCount > 0 ? completedTasks / goalCount : 0;

  return (
    <PressableCard onPress={handlePress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={section.ionIcon as any}
            size={22}
            color={colors.textTertiary}
          />
        </View>
        <View style={styles.textContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{section.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
            <Text style={styles.description}>{section.description}</Text>
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
              {completedTasks}/{goalCount}
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
