/**
 * TaskPicker - Displays tasks within a section for user selection
 *
 * Used when a section has multiple tasks (e.g., Contacts section with
 * Primary Contacts and Backup Contacts)
 */

import type { TaskProgressData } from "@/api/types";
import { PressableCard } from "@/components/ui/Card";
import { TaskStatusIndicator } from "@/components/ui/TaskStatusIndicator";
import { colors, spacing, typography } from "@/constants/theme";
import type { VaultSection } from "@/constants/vault";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TaskPickerProps {
  section: VaultSection;
  /** Progress by taskKey for showing completion status */
  progress?: Record<string, TaskProgressData>;
}

export function TaskPicker({ section, progress = {} }: TaskPickerProps) {
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
      {section.tasks.map((task) => {
        return (
          <PressableCard
            key={task.id}
            onPress={() => handleTaskPress(task.id)}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <TaskStatusIndicator
                progress={progress[task.taskKey]}
                pillarColor={colors.featureInformation}
              />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <Text style={styles.cardDescription}>{task.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </View>
          </PressableCard>
        );
      })}
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
    alignSelf: "center",
  },
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
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
