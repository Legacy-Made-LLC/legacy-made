/**
 * Task Screen - Entry List
 *
 * Displays the list of entries for a specific task using the registered
 * list component for that task type.
 */

import { getListComponent } from "@/components/vault/registry";
import { colors, spacing, typography } from "@/constants/theme";
import { getSection, getTask } from "@/constants/vault";
import { useEntriesQuery } from "@/hooks/queries";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

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
        headerDescription: task.description,
      });
    }
  }, [task, navigation]);

  // Get the list component for this task
  const ListComponent = task ? getListComponent(task.taskKey) : undefined;

  // Fetch entries for this task
  const { data: entries = [], isLoading } = useEntriesQuery(task?.taskKey);

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
