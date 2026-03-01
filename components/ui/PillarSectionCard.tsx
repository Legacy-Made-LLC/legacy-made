/**
 * PillarSectionCard - Shared dashboard card for pillar sections
 *
 * A reusable card component for displaying section information with
 * completion count and progress. Used by both Information Vault and
 * Wishes & Guidance (and future pillars).
 *
 * Each pillar has its own color theme:
 * - information: Sage green
 * - wishes: Soft lavender
 * - legacy: Soft blue
 * - family: Warm blush/peach
 */

import type { TaskProgressData } from "@/api/types";
import { PressableCard } from "@/components/ui/Card";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

/** Pillar types for color theming */
export type PillarType = "information" | "wishes" | "legacy" | "family";

/** Common section interface that all pillar sections share */
export interface PillarSection {
  id: string;
  title: string;
  description: string;
  ionIcon: string;
  tasks: { taskKey: string }[];
}

interface PillarSectionCardProps {
  /** The section to display */
  section: PillarSection;
  /** Progress by taskKey for completion calculation */
  progress: Record<string, TaskProgressData>;
  /** Which pillar this card belongs to (determines colors and route) */
  pillar: PillarType;
}

// Animation configuration
const PROGRESS_ANIMATION_DURATION = 400;

// Color mappings for each pillar
const pillarColors: Record<
  PillarType,
  { accent: string; tint: string; icon: string; progress: string }
> = {
  information: {
    accent: colors.featureInformation,
    tint: colors.featureInformationTint,
    icon: colors.textTertiary,
    progress: colors.featureInformationProgress,
  },
  wishes: {
    accent: colors.featureWishes,
    tint: colors.featureWishesTint,
    icon: colors.featureWishes,
    progress: colors.featureWishesProgress,
  },
  legacy: {
    accent: colors.featureLegacy,
    tint: colors.featureLegacyTint,
    icon: colors.featureLegacy,
    progress: colors.featureLegacyProgress,
  },
  family: {
    accent: colors.featureFamily,
    tint: colors.featureFamilyTint,
    icon: colors.featureFamily,
    progress: colors.featureFamilyProgress,
  },
};

// Route prefixes for each pillar
const pillarRoutes: Record<PillarType, string> = {
  information: "vault",
  wishes: "wishes",
  legacy: "legacy",
  family: "family",
};

export function PillarSectionCard({
  section,
  progress,
  pillar,
}: PillarSectionCardProps) {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inProgressAnim = useRef(new Animated.Value(0)).current;

  const pillarColor = pillarColors[pillar];
  const routePrefix = pillarRoutes[pillar];

  const handlePress = () => {
    router.push(`/${routePrefix}/${section.id}` as never);
  };

  // Calculate completion and in-progress for this section
  const completedTasks = section.tasks.filter(
    (task) =>
      progress[task.taskKey]?.status === "complete" ||
      progress[task.taskKey]?.status === "not_applicable",
  ).length;
  
  const inProgressTasks = section.tasks.filter(
    (task) => progress[task.taskKey]?.status === "in_progress",
  ).length;
  
  const goalCount = section.tasks.length;
  const completedRatio = goalCount > 0 ? completedTasks / goalCount : 0;
  const inProgressRatio = goalCount > 0 ? inProgressTasks / goalCount : 0;
  const totalProgressRatio = completedRatio + inProgressRatio;

  // Animate progress bars when progress changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: completedRatio,
        duration: PROGRESS_ANIMATION_DURATION,
        useNativeDriver: false, // width animation can't use native driver
      }),
      Animated.timing(inProgressAnim, {
        toValue: totalProgressRatio,
        duration: PROGRESS_ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  }, [completedRatio, totalProgressRatio, progressAnim, inProgressAnim]);

  return (
    <PressableCard onPress={handlePress} style={styles.card}>
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: pillarColor.tint }]}
        >
          <Ionicons
            name={section.ionIcon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={pillarColor.icon}
          />
        </View>
        <View style={styles.textContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{section.title}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.description}>{section.description}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              {/* In-progress tasks shown in progress color (behind) */}
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: pillarColor.progress,
                    width: inProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                  },
                ]}
              />
              {/* Completed tasks shown in accent color (on top) */}
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: pillarColor.accent,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedTasks}/{goalCount}
            </Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
    flexShrink: 1,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    minWidth: 28,
    textAlign: "right",
  },
});
