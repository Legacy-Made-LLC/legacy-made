/**
 * Entry Screen - Create/Edit Form
 *
 * Displays the form for creating or editing an entry using the registered
 * form component for that task type.
 *
 * entryId = "new" for creating a new entry
 * entryId = <uuid> for editing an existing entry
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTask } from '@/constants/vault';
import { getFormComponent } from '@/components/vault/registry';
import { colors, typography, spacing } from '@/constants/theme';
import { useEntryQuery, useCreateEntry, useUpdateEntry, useDeleteEntry } from '@/hooks/queries';

export default function EntryScreen() {
  const { sectionId, taskId, entryId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
    entryId: string;
  }>();
  const router = useRouter();

  const task = getTask(sectionId, taskId);
  const isNew = entryId === 'new';

  // Get the form component for this task
  const FormComponent = task ? getFormComponent(task.taskKey) : undefined;

  // Fetch entry data if editing
  const { data: entry, isLoading } = useEntryQuery(isNew ? undefined : entryId);

  // Mutations
  const createMutation = useCreateEntry(task?.taskKey);
  const updateMutation = useUpdateEntry(task?.taskKey);
  const deleteMutation = useDeleteEntry(task?.taskKey);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Handle save
  const handleSave = useCallback(
    async (data: { title: string; notes?: string; metadata: Record<string, unknown> }) => {
      if (!task) return;

      if (isNew) {
        await createMutation.mutateAsync(data);
      } else {
        await updateMutation.mutateAsync({ entryId, data });
      }
      router.back();
    },
    [task, isNew, entryId, createMutation, updateMutation, router]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!entryId || isNew) return;

    await deleteMutation.mutateAsync(entryId);
    router.back();
  }, [entryId, isNew, deleteMutation, router]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Task not found
  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  // No form component registered for this task
  if (!FormComponent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No form component registered for task: {task.taskKey}
        </Text>
      </View>
    );
  }

  // Loading existing entry
  if (!isNew && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <FormComponent
      taskKey={task.taskKey}
      entryId={isNew ? undefined : entryId}
      initialData={entry}
      onSave={handleSave}
      onDelete={isNew ? undefined : handleDelete}
      onCancel={handleCancel}
      isSaving={isSaving}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
