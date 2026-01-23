/**
 * Task Screen - Entry List
 *
 * Displays the list of entries for a specific task using the registered
 * list component for that task type.
 */

import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { getSection, getTask } from '@/constants/vault';
import { getListComponent, type VaultEntry } from '@/components/vault/registry';
import { colors, typography, spacing } from '@/constants/theme';
import { useVaultEntries } from '@/hooks/useVaultEntries';

export default function TaskScreen() {
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();

  const section = getSection(sectionId);
  const task = getTask(sectionId, taskId);

  // Set the header title before first render
  useLayoutEffect(() => {
    if (task) {
      navigation.setOptions({
        title: task.title,
      });
    }
  }, [task, navigation]);

  // Get the list component for this task
  const ListComponent = task ? getListComponent(task.taskKey) : undefined;

  // Fetch entries for this task
  const { entries, isLoading, error, refresh } = useVaultEntries(task?.taskKey);

  // Handle navigation
  const handleEntryPress = (entryId: string) => {
    router.push(`/vault/${sectionId}/${taskId}/${entryId}`);
  };

  const handleAddPress = () => {
    router.push(`/vault/${sectionId}/${taskId}/new`);
  };

  // Section or task not found
  if (!section || !task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  // No list component registered for this task
  if (!ListComponent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No list component registered for task: {task.taskKey}
        </Text>
      </View>
    );
  }

  return (
    <ListComponent
      taskKey={task.taskKey}
      entries={entries}
      isLoading={isLoading}
      onEntryPress={handleEntryPress}
      onAddPress={handleAddPress}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
