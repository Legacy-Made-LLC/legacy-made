import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import React, { useMemo, useRef } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TaskProgressData } from "@/api/types";
import { GuidanceSection } from "@/components/home/GuidanceSection";
import { QuickActions } from "@/components/home/QuickActions";
import { PressableCard } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useLegacySections } from "@/constants/legacy";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useVaultSections } from "@/constants/vault";
import { useWishesSections } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { usePlan } from "@/data/PlanProvider";
import { useAllProgressQuery } from "@/hooks/queries";
import { useHomeGuidance } from "@/hooks/useHomeGuidance";
import { useQuickActions } from "@/hooks/useQuickActions";

/** Build pillar definitions using current section data */
function usePillars() {
  const vaultSections = useVaultSections();
  const wishesSections = useWishesSections();
  const legacySections = useLegacySections();
  const translations = useTranslations();

  return useMemo(() => {
    const informationTaskKeys = vaultSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );
    const wishesTaskKeys = wishesSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );
    const legacyTaskKeys = legacySections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );

    const t = translations.pages.home;

    return [
      {
        id: "information",
        title: "Information",
        description: t.pillarActions.information,
        icon: "document-text-outline" as const,
        totalItems: informationTaskKeys.length,
        taskKeys: informationTaskKeys,
        route: "/(app)/(tabs)/information" as Href,
        color: colors.featureInformation,
        tint: colors.featureInformationTint,
        comingSoon: false,
      },
      {
        id: "wishes",
        title: "Wishes",
        description: t.pillarActions.wishes,
        icon: "heart-outline" as const,
        totalItems: wishesTaskKeys.length,
        taskKeys: wishesTaskKeys,
        route: "/(app)/(tabs)/wishes" as Href,
        color: colors.featureWishes,
        tint: colors.featureWishesTint,
        comingSoon: false,
      },
      {
        id: "legacy",
        title: "Legacy",
        description: t.pillarActions.legacy,
        icon: "videocam-outline" as const,
        totalItems: legacyTaskKeys.length,
        taskKeys: legacyTaskKeys,
        route: "/(app)/(tabs)/legacy" as Href,
        color: colors.featureLegacy,
        tint: colors.featureLegacyTint,
        comingSoon: false,
      },
      {
        id: "family",
        title: "Family",
        description: t.pillarActions.family,
        icon: "people-outline" as const,
        totalItems: 0,
        taskKeys: [] as string[],
        route: "/(app)/(tabs)/family" as Href,
        color: colors.featureFamily,
        tint: colors.featureFamilyTint,
        comingSoon: false,
      },
    ];
  }, [vaultSections, wishesSections, legacySections, translations]);
}

// Circular progress configuration
const CIRCLE_SIZE = 40;
const CIRCLE_STROKE_WIDTH = 3;

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
  comingSoon: boolean;
}

interface PillarCardProps {
  pillar: PillarDef;
  currentProgress: number;
  onPress: () => void;
  comingSoonLabel: string;
}

function PillarCard({
  pillar,
  currentProgress,
  onPress,
  comingSoonLabel,
}: PillarCardProps) {
  const progressPercent =
    pillar.totalItems > 0
      ? Math.min(currentProgress / pillar.totalItems, 1)
      : 0;

  return (
    <PressableCard
      onPress={onPress}
      style={[
        styles.pillarCard,
        pillar.comingSoon && styles.pillarCardUnavailable,
      ]}
    >
      <View style={styles.pillarContent}>
        {/* Icon with circular progress */}
        <CircularProgress
          progress={progressPercent}
          size={CIRCLE_SIZE}
          strokeWidth={CIRCLE_STROKE_WIDTH}
          progressColor={pillar.color}
          trackColor={pillar.tint}
          backgroundColor={colors.surface}
        >
          <View
            style={[
              styles.pillarIconContainer,
              { backgroundColor: pillar.tint },
            ]}
          >
            <Ionicons name={pillar.icon} size={18} color={pillar.color} />
          </View>
        </CircularProgress>

        {/* Title and description */}
        <View style={styles.pillarTextContent}>
          <View style={styles.pillarTitleRow}>
            <Text style={styles.pillarTitle}>{pillar.title}</Text>
            {currentProgress > 0 && (
              <Text style={styles.progressText}>
                {currentProgress}/{pillar.totalItems}
              </Text>
            )}
          </View>
          {!pillar.comingSoon && (
            <Text style={styles.pillarDescription}>{pillar.description}</Text>
          )}
        </View>

        {/* Coming soon badge or chevron */}
        {pillar.comingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{comingSoonLabel}</Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        )}
      </View>
    </PressableCard>
  );
}

/** Count completed tasks for a pillar based on progress records */
function countCompleted(
  taskKeys: string[],
  progress: Record<string, TaskProgressData>,
): number {
  return taskKeys.filter(
    (k) =>
      progress[k]?.status === "complete" ||
      progress[k]?.status === "not_applicable",
  ).length;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const pillars = usePillars();
  const { data: progress = {} } = useAllProgressQuery();
  const { isViewingSharedPlan } = usePlan();
  const t = useTranslations();
  const {
    guidance,
    isLoading: guidanceLoading,
    onDismissContactGuidance,
  } = useHomeGuidance();
  const quickActions = useQuickActions();

  const firstName = user?.firstName;

  const greetingIdxRef = useRef<number | null>(null);
  const greeting = useMemo(() => {
    const g = t.pages.home.greeting;
    if (Array.isArray(g)) {
      if (
        greetingIdxRef.current === null ||
        greetingIdxRef.current >= g.length
      ) {
        greetingIdxRef.current = Math.floor(Math.random() * g.length);
      }
      return g[greetingIdxRef.current];
    }
    return g;
  }, [t.pages.home.greeting]);
  const showQuickActions = quickActions.length > 0 && !isViewingSharedPlan;

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
        <Text style={styles.pageTitle}>
          {firstName ? `Hi, ${firstName}` : t.pages.home.pageTitle}
        </Text>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>

      {/* Adaptive Guidance Section */}
      <GuidanceSection
        guidance={guidance}
        isLoading={guidanceLoading}
        onSecondaryCta={
          guidance.type === "add_trusted_contact"
            ? onDismissContactGuidance
            : undefined
        }
      />

      {/* Quick Actions */}
      {showQuickActions && (
        <QuickActions actions={quickActions} isLoading={guidanceLoading} />
      )}

      {/* Pillar Cards */}
      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            currentProgress={getPillarProgress(pillar)}
            onPress={() => router.push(pillar.route)}
            comingSoonLabel={t.pages.home.pillarActions.comingSoon}
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
    marginTop: spacing.md,
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
    marginTop: spacing.xs,
    textAlign: "center",
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  // Pillar Cards - Vertical stack
  pillars: {
    gap: spacing.sm,
  },
  pillarCard: {
    marginBottom: 0,
  },
  pillarCardUnavailable: {
    opacity: 0.6,
  },
  pillarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pillarIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  pillarTextContent: {
    flex: 1,
  },
  pillarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pillarTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  progressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  pillarDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
});
