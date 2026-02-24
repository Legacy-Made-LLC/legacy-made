/**
 * Wishes Section Screen
 *
 * For sections with multiple tasks: shows task picker
 * For sections with single task: redirects to that task
 */

import { WishesTaskPicker } from "@/components/wishes/WishesTaskPicker";
import { colors, spacing, typography } from "@/constants/theme";
import { useWishesSection } from "@/constants/wishes";
import { useAllProgressQuery, usePrefetchWishesByTaskKeys } from "@/hooks/queries";
import { Redirect, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function WishesSectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const navigation = useNavigation();
  const { data: progress = {} } = useAllProgressQuery();

  const section = useWishesSection(sectionId);

  // Prefetch wishes for all tasks in this section
  const taskKeys = useMemo(
    () => section?.tasks.map((t) => t.taskKey) ?? [],
    [section],
  );
  usePrefetchWishesByTaskKeys(taskKeys);

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
    return <Redirect href={`/wishes/${sectionId}/${section.tasks[0].id}`} />;
  }

  // Multiple tasks - show task picker
  return <WishesTaskPicker section={section} progress={progress} />;
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
