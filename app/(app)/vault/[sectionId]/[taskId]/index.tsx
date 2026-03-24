/**
 * Task Screen - Entry List
 *
 * Displays the list of entries for a specific task using the registered
 * list component for that task type.
 */

import { SectionSkippedState } from "@/components/ui/SectionSkippedState";
import { TaskCompletionFooter } from "@/components/ui/TaskCompletionFooter";
import { getListComponent } from "@/components/vault/registry";
import { colors, spacing, typography } from "@/constants/theme";
import { useVaultSection, useVaultTask } from "@/constants/vault";
import { isSectionSkippable } from "@/constants/vault-structure";
import { useTranslations } from "@/contexts/LocaleContext";
import { usePlan } from "@/data/PlanProvider";
import {
  useDeleteTaskProgress,
  useEntriesQuery,
  useMarkTaskNotApplicable,
  useTaskProgressQuery,
} from "@/hooks/queries";
import { useSetProgressIfNew } from "@/hooks/queries/useProgressMutations";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TaskScreen() {
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const t = useTranslations();

  const { isReadOnly } = usePlan();
  const section = useVaultSection(sectionId);
  const task = useVaultTask(sectionId, taskId);
  const markNotApplicable = useMarkTaskNotApplicable(task?.taskKey);
  const deleteProgress = useDeleteTaskProgress(task?.taskKey);

  // Set the header title before first render
  useLayoutEffect(() => {
    if (task) {
      navigation.setOptions({
        title: task.title,
        headerDescription: task.description,
      });
    }
  }, [task, navigation]);

  // Get the list component for this task
  const ListComponent = task ? getListComponent(task.taskKey) : undefined;

  // Fetch entries for this task
  const { data: entries = [], isLoading } = useEntriesQuery(task?.taskKey);

  // Check if task is already marked complete (for footer visibility)
  const { data: progressData } = useTaskProgressQuery(task?.taskKey);
  const isTaskComplete = progressData?.status === "complete";
  const isNotApplicable = progressData?.status === "not_applicable";

  // Section skip logic
  const skippable = isSectionSkippable(sectionId);

  const handleSkipTask = useCallback(() => {
    markNotApplicable.mutate();
  }, [markNotApplicable]);

  const handleUndoSkip = useCallback(() => {
    deleteProgress.mutate();
  }, [deleteProgress]);

  // Backwards compatibility: auto-set progress to "in_progress" when entries
  // exist but no progress record has been created yet (pre-progress-feature data)
  const { setIfNew } = useSetProgressIfNew();
  useEffect(() => {
    if (!isLoading && entries.length > 0 && task?.taskKey) {
      setIfNew(task.taskKey);
    }
  }, [isLoading, entries.length, task?.taskKey, setIfNew]);

  // Handle navigation
  const handleEntryPress = (entryId: string) => {
    router.push(`/vault/${sectionId}/${taskId}/${entryId}`);
  };

  const handleAddPress = () => {
    const id = randomUUID();
    router.push(`/vault/${sectionId}/${taskId}/${id}?isNew=1`);
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

  // Show skipped state when task is marked not applicable
  if (isNotApplicable) {
    return (
      <View style={styles.wrapper}>
        <SectionSkippedState
          onChangeMyMind={handleUndoSkip}
          readOnly={isReadOnly}
        />
      </View>
    );
  }

  // Show "Doesn't apply to me" in empty state when section is skippable
  const showSkipInEmptyState = skippable && !isReadOnly && !isTaskComplete;

  return (
    <View style={styles.wrapper}>
      <View style={styles.listContainer}>
        <ListComponent
          taskKey={task.taskKey}
          entries={entries}
          isLoading={isLoading}
          onEntryPress={handleEntryPress}
          onAddPress={handleAddPress}
          readOnly={isReadOnly}
          emptySecondaryLabel={
            showSkipInEmptyState
              ? t.common.notApplicable.button
              : undefined
          }
          onEmptySecondaryAction={
            showSkipInEmptyState ? handleSkipTask : undefined
          }
        />
      </View>
      {(entries.length > 0 || isTaskComplete) && !isReadOnly && (
        <TaskCompletionFooter
          taskKey={task.taskKey}
          pillarColor={colors.featureInformation}
          pillarTint={colors.featureInformationTint}
          onComeBackLater={() => router.back()}
          entries={entries}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
