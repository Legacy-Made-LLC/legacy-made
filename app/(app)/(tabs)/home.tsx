import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableCard } from "@/components/ui/Card";
import { borderRadius, colors, shadows, spacing, typography } from "@/constants/theme";
import { useEntryCountsQuery } from "@/hooks/queries";

// Pillar definitions for the home screen
const pillars = [
  {
    id: "information",
    title: "Information",
    description: "Accounts, documents, and key contacts — all in one place.",
    icon: "document-text-outline" as const,
    totalItems: 9, // Placeholder - would be calculated from schema
    route: "/(app)/(tabs)/information",
  },
  {
    id: "wishes",
    title: "Wishes",
    description: "Your healthcare values and end-of-life preferences.",
    icon: "heart-outline" as const,
    totalItems: 11, // Placeholder
    route: "/(app)/(tabs)/wishes",
  },
  {
    id: "legacy",
    title: "Legacy",
    description: "Letters, videos, and memories for the people you love.",
    icon: "videocam-outline" as const,
    totalItems: 8, // Placeholder
    route: "/(app)/(tabs)/legacy",
  },
  {
    id: "family",
    title: "Family",
    description: "Share access and keep loved ones in the loop.",
    icon: "people-outline" as const,
    totalItems: 5, // Placeholder
    route: "/(app)/(tabs)/family",
  },
];

// Animation configuration
const PROGRESS_ANIMATION_DURATION = 400;

interface PillarCardProps {
  pillar: (typeof pillars)[number];
  currentProgress: number;
  onPress: () => void;
}

function PillarCard({ pillar, currentProgress, onPress }: PillarCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressPercent = Math.min(currentProgress / pillar.totalItems, 1);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: PROGRESS_ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  return (
    <PressableCard onPress={onPress} style={styles.pillarCard}>
      <View style={styles.pillarContent}>
        <View style={styles.pillarIconContainer}>
          <Ionicons
            name={pillar.icon}
            size={22}
            color={colors.textTertiary}
          />
        </View>
        <View style={styles.pillarTextContent}>
          <View style={styles.pillarHeader}>
            <View style={styles.pillarTitleRow}>
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.pillarDescription}>
              {pillar.description}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentProgress}/{pillar.totalItems}
            </Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: counts = {} } = useEntryCountsQuery();

  // Calculate Information pillar progress (sum of all categories)
  const informationCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  // Get progress for each pillar
  const getPillarProgress = (pillarId: string) => {
    switch (pillarId) {
      case "information":
        return informationCount;
      case "wishes":
        return 0; // TODO: Connect to wishes data
      case "legacy":
        return 0; // TODO: Connect to legacy data
      case "family":
        return 0; // TODO: Connect to family data
      default:
        return 0;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <View style={styles.welcome}>
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.pageTitle}>Your Progress</Text>
        <Text style={styles.greeting}>
          You&apos;ve started something meaningful.
        </Text>
      </View>

      {/* Guidance Card */}
      <View style={styles.guidanceCard}>
        <Text style={styles.guidanceTitle}>Not sure where to begin?</Text>

        <Pressable style={styles.guidanceOption}>
          <Text style={styles.guidanceOptionText}>How prepared am I?</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        <Pressable style={styles.guidanceOption}>
          <Text style={styles.guidanceOptionText}>Where do I start?</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        <Pressable style={styles.exploreLink}>
          <Text style={styles.exploreLinkText}>I&apos;ll explore on my own</Text>
        </Pressable>
      </View>

      {/* Pillar Cards */}
      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            currentProgress={getPillarProgress(pillar.id)}
            onPress={() => router.push(pillar.route as any)}
          />
        ))}
      </View>
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
    paddingTop: spacing.sm,
  },
  // Welcome Section
  welcome: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  logo: {
    width: 42,
    height: 42,
  },
  greeting: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: "center",
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  // Guidance Card
  guidanceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  guidanceTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  guidanceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  guidanceOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  exploreLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  exploreLinkText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
  },
  // Pillar Cards
  pillars: {
    gap: spacing.sm,
  },
  pillarCard: {
    marginBottom: 0,
  },
  pillarContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pillarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  pillarTextContent: {
    flex: 1,
  },
  pillarHeader: {
    marginBottom: spacing.sm,
  },
  pillarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillarTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pillarDescription: {
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
    backgroundColor: colors.primary,
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
