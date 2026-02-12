/**
 * Section Screen
 *
 * For sections with multiple tasks: shows task picker
 * For sections with single task: redirects to that task
 */

import { TaskPicker } from '@/components/vault/TaskPicker';
import { colors, spacing, typography } from '@/constants/theme';
import { getSection } from '@/constants/vault';
import { useAllProgressQuery, usePrefetchEntriesByTaskKeys } from '@/hooks/queries';
import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const navigation = useNavigation();
  const { data: progress = {} } = useAllProgressQuery();

  const section = getSection(sectionId);

  // Prefetch entries for all tasks in this section
  const taskKeys = useMemo(
    () => section?.tasks.map((t) => t.taskKey) ?? [],
    [section],
  );
  usePrefetchEntriesByTaskKeys(taskKeys);

  // Set the header title before first render
  useLayoutEffect(() => {
    if (section) {
      navigation.setOptions({
        title: section.title,
        headerDescription: section.description,
      });
    }
  }, [section, navigation]);

  // Section not found
  if (!section) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Section not found</Text>
      </View>
    );
  }

  // Single task - redirect directly to task screen
  if (section.tasks.length === 1) {
    return <Redirect href={`/vault/${sectionId}/${section.tasks[0].id}`} />;
  }

  // Multiple tasks - show task picker
  return <TaskPicker section={section} progress={progress} />;
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
