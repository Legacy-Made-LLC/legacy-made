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
  /** Counts by taskKey for progress calculation */
  counts: Record<string, number>;
  /** Which pillar this card belongs to (determines colors and route) */
  pillar: PillarType;
}

// Animation configuration
const PROGRESS_ANIMATION_DURATION = 400;

// Color mappings for each pillar
const pillarColors: Record<
  PillarType,
  { accent: string; tint: string; icon: string }
> = {
  information: {
    accent: colors.featureInformation,
    tint: colors.featureInformationTint,
    icon: colors.textTertiary,
  },
  wishes: {
    accent: colors.featureWishes,
    tint: colors.featureWishesTint,
    icon: colors.featureWishes,
  },
  legacy: {
    accent: colors.featureLegacy,
    tint: colors.featureLegacyTint,
    icon: colors.featureLegacy,
  },
  family: {
    accent: colors.featureFamily,
    tint: colors.featureFamilyTint,
    icon: colors.featureFamily,
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
  counts,
  pillar,
}: PillarSectionCardProps) {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const pillarColor = pillarColors[pillar];
  const routePrefix = pillarRoutes[pillar];

  const handlePress = () => {
    router.push(`/${routePrefix}/${section.id}` as never);
  };

  // Calculate completion for this section
  // Goal: at least 1 entry per task
  const completedTasks = section.tasks.filter(
    (task) => (counts[task.taskKey] || 0) > 0
  ).length;
  const goalCount = section.tasks.length;
  const progress = goalCount > 0 ? completedTasks / goalCount : 0;

  // Animate progress bar when progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: PROGRESS_ANIMATION_DURATION,
      useNativeDriver: false, // width animation can't use native driver
    }).start();
  }, [progress, progressAnim]);

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
