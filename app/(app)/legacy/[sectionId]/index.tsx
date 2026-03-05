/**
 * Legacy Section Screen
 *
 * For sections with multiple tasks: shows task picker
 * For sections with single task: redirects to that task
 *
 * Since all legacy sections currently have exactly one task,
 * this will always redirect to the single task screen.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useLegacySection } from "@/constants/legacy";
import { useAllProgressQuery, usePrefetchMessagesByTaskKeys } from "@/hooks/queries";
import { usePillarGuard } from "@/hooks/usePillarGuard";
import { Redirect, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LegacySectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const navigation = useNavigation();
  useAllProgressQuery();
  const { guardOverlay } = usePillarGuard({
    pillar: "messages",
    featureName: "Legacy Messages",
    lockedDescription: "Record video messages and memories to share with your loved ones when the time is right.",
    restrictedDescription: "Your access level doesn't include Legacy Messages for this plan.",
  });

  const section = useLegacySection(sectionId);

  // Prefetch messages for all tasks in this section
  const taskKeys = useMemo(
    () => section?.tasks.map((t) => t.taskKey) ?? [],
    [section],
  );
  usePrefetchMessagesByTaskKeys(taskKeys);

  // Set the header title before first render
  useLayoutEffect(() => {
    if (section) {
      navigation.setOptions({
        title: section.title,
        headerDescription: section.description,
      });
    }
  }, [section, navigation]);

  // Show guard overlay if pillar is locked or access is restricted
  if (guardOverlay) {
    return guardOverlay;
  }

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
    return <Redirect href={`/legacy/${sectionId}/${section.tasks[0].id}`} />;
  }

  // Multiple tasks would show a task picker here
  // (Currently all legacy sections have exactly one task)
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Section: {section.title}</Text>
    </View>
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
