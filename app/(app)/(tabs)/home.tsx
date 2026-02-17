import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TaskProgressData } from "@/api/types";
import { PressableCard } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import { useVaultSections } from "@/constants/vault";
import { useWishesSections } from "@/constants/wishes";
import { usePerspective } from "@/contexts/LocaleContext";
import { useAllProgressQuery } from "@/hooks/queries";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = spacing.md;
const HORIZONTAL_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const pillarText = {
  owner: {
    pageTitle: "Your Progress",
    greeting: "You\u2019ve started something meaningful.",
    information: "Accounts, documents, and key contacts — all in one place.",
    wishes: "Your healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people you love.",
    family: "Share access and keep loved ones in the loop.",
  },
  family: {
    pageTitle: "Their Progress",
    greeting: "You\u2019re helping preserve what matters.",
    information: "Their accounts, documents, and key contacts — all in one place.",
    wishes: "Their healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people they love.",
    family: "Shared access and keeping loved ones in the loop.",
  },
};

/** Build pillar definitions using current section data */
function usePillars() {
  const vaultSections = useVaultSections();
  const wishesSections = useWishesSections();
  const { perspective } = usePerspective();

  return useMemo(() => {
    const informationTaskKeys = vaultSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );
    const wishesTaskKeys = wishesSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );

    const t = pillarText[perspective];

    return [
      {
        id: "information",
        title: "Information",
        description: t.information,
        icon: "document-text-outline" as const,
        totalItems: informationTaskKeys.length,
        taskKeys: informationTaskKeys,
        route: "/(app)/(tabs)/information" as Href,
        color: colors.featureInformation,
        tint: colors.featureInformationTint,
      },
      {
        id: "wishes",
        title: "Wishes",
        description: t.wishes,
        icon: "heart-outline" as const,
        totalItems: wishesTaskKeys.length,
        taskKeys: wishesTaskKeys,
        route: "/(app)/(tabs)/wishes" as Href,
        color: colors.featureWishes,
        tint: colors.featureWishesTint,
      },
      {
        id: "legacy",
        title: "Legacy",
        description: t.legacy,
        icon: "videocam-outline" as const,
        totalItems: 0,
        taskKeys: [] as string[],
        route: "/(app)/(tabs)/legacy" as Href,
        color: colors.featureLegacy,
        tint: colors.featureLegacyTint,
      },
      {
        id: "family",
        title: "Family",
        description: t.family,
        icon: "people-outline" as const,
        totalItems: 0,
        taskKeys: [] as string[],
        route: "/(app)/(tabs)/family" as Href,
        color: colors.featureFamily,
        tint: colors.featureFamilyTint,
      },
    ];
  }, [vaultSections, wishesSections, perspective]);
}

// Circular progress configuration
const CIRCLE_SIZE = 64;
const CIRCLE_STROKE_WIDTH = 4;

interface PillarDef {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  totalItems: number;
  taskKeys: string[];
  route: Href;
  color: string;
  tint: string;
}

interface PillarCardProps {
  pillar: PillarDef;
  currentProgress: number;
  onPress: () => void;
}

function PillarCard({ pillar, currentProgress, onPress }: PillarCardProps) {
  const progressPercent = Math.min(currentProgress / pillar.totalItems, 1);

  return (
    <PressableCard
      onPress={onPress}
      style={[styles.pillarCard, { backgroundColor: pillar.tint }]}
    >
      <View style={styles.pillarContent}>
        {/* Icon with circular progress */}
        <View style={styles.pillarIconWrapper}>
          <CircularProgress
            progress={progressPercent}
            size={CIRCLE_SIZE}
            strokeWidth={CIRCLE_STROKE_WIDTH}
            progressColor={pillar.color}
            trackColor={colors.surface}
            backgroundColor={pillar.tint}
          >
            <View
              style={[
                styles.pillarIconContainer,
                { backgroundColor: pillar.tint },
              ]}
            >
              <Ionicons name={pillar.icon} size={24} color={pillar.color} />
            </View>
          </CircularProgress>
        </View>

        {/* Title and description at bottom */}
        <View style={styles.pillarTextContent}>
          <Text style={styles.pillarTitle}>{pillar.title}</Text>
          <Text style={styles.pillarDescription} numberOfLines={2}>
            {pillar.description}
          </Text>
          <Text style={styles.progressText}>
            {currentProgress} of {pillar.totalItems}
          </Text>
        </View>
      </View>
    </PressableCard>
  );
}

/** Count completed tasks for a pillar based on progress records */
function countCompleted(
  taskKeys: string[],
  progress: Record<string, TaskProgressData>,
): number {
  return taskKeys.filter((k) => progress[k]?.status === "complete").length;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pillars = usePillars();
  const { data: progress = {} } = useAllProgressQuery();
  const { perspective } = usePerspective();

  // Get completed task count for each pillar
  const getPillarProgress = (pillar: PillarDef) => {
    return countCompleted(pillar.taskKeys, progress);
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
        <Text style={styles.pageTitle}>{pillarText[perspective].pageTitle}</Text>
        <Text style={styles.greeting}>
          {pillarText[perspective].greeting}
        </Text>
      </View>

      {/* TODO: Add guidance card */}
      {/* Guidance Card */}
      {/* TODO: Implement after other app pillars are implemented. */}
      {/* <View style={styles.guidanceCard}>
        <Text style={styles.guidanceTitle}>Not sure where to begin?</Text>

        <Pressable style={styles.guidanceOption}>
          <Text style={styles.guidanceOptionText}>How prepared am I?</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>

        <Pressable style={styles.guidanceOption}>
          <Text style={styles.guidanceOptionText}>Where do I start?</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>

        <Pressable style={styles.exploreLink}>
          <Text style={styles.exploreLinkText}>
            I&apos;ll explore on my own
          </Text>
        </Pressable>
      </View> */}

      {/* Pillar Cards */}
      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            currentProgress={getPillarProgress(pillar)}
            onPress={() => router.push(pillar.route)}
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
  // Pillar Cards - Two column grid
  pillars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  pillarCard: {
    width: CARD_WIDTH,
    marginBottom: 0,
  },
  pillarContent: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  pillarIconWrapper: {
    marginBottom: spacing.md,
  },
  pillarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  pillarTextContent: {
    alignItems: "center",
  },
  pillarTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  pillarDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  progressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
});
