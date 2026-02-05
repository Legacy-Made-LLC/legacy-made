/**
 * WishesTaskPicker - Displays tasks within a wishes section for user selection
 *
 * Used when a section has multiple tasks (e.g., Care Preferences with
 * What Matters Most, Quality of Life, Comfort vs Treatment, etc.)
 *
 * Uses lavender color theme (featureWishes) instead of sage green.
 */

import { PressableCard } from "@/components/ui/Card";
import { colors, spacing, typography } from "@/constants/theme";
import type { WishesSection } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WishesTaskPickerProps {
  section: WishesSection;
  /** Wish counts by taskKey for showing completion status */
  counts?: Record<string, number>;
}

export function WishesTaskPicker({ section, counts = {} }: WishesTaskPickerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTaskPress = (taskId: string) => {
    router.push(`/wishes/${section.id}/${taskId}`);
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
      {section.tasks.map((task, index) => {
        const hasWish = (counts[task.taskKey] || 0) > 0;

        return (
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
                {hasWish && (
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
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
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.featureWishes, // Lavender instead of sage
    justifyContent: "center",
    alignItems: "center",
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
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  completedText: {
    fontSize: typography.sizes.caption,
    color: colors.success,
    fontFamily: typography.fontFamily.medium,
  },
});
