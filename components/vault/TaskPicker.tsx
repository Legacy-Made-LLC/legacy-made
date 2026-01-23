/**
 * TaskPicker - Displays tasks within a section for user selection
 *
 * Used when a section has multiple tasks (e.g., Contacts section with
 * Primary Contacts and Backup Contacts)
 */

import { PressableCard } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/constants/theme';
import type { VaultSection } from '@/constants/vault';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TaskPickerProps {
  section: VaultSection;
}

export function TaskPicker({ section }: TaskPickerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTaskPress = (taskId: string) => {
    router.push(`/vault/${section.id}/${taskId}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* TODO: This doesn't look quite right yet and maybe isn't necessary. */}
      {/* <View style={styles.header}>
        <Text style={styles.description}>{section.description}</Text>
      </View> */}

      {section.tasks.map((task, index) => (
        <PressableCard
          key={task.id}
          onPress={() => handleTaskPress(task.id)}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <Text style={styles.taskNumber}>{index + 1}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{task.title}</Text>
              <Text style={styles.cardDescription}>{task.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </PressableCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    alignSelf: 'center',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  taskNumber: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.surface,
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
  cardDescription: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
});
