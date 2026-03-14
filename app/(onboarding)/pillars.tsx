import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILLARS = [
  {
    title: "Information",
    description: "Organize accounts and contacts",
    icon: "document-text-outline" as const,
    color: colors.featureInformation,
    tint: colors.featureInformationTint,
  },
  {
    title: "Wishes",
    description: "Record your wishes and values",
    icon: "heart-outline" as const,
    color: colors.featureWishes,
    tint: colors.featureWishesTint,
  },
  {
    title: "Legacy",
    description: "Leave messages for loved ones",
    icon: "videocam-outline" as const,
    color: colors.featureLegacy,
    tint: colors.featureLegacyTint,
  },
  {
    title: "Family",
    description: "Share access with loved ones",
    icon: "people-outline" as const,
    color: colors.featureFamily,
    tint: colors.featureFamilyTint,
  },
];

export default function PillarsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    router.push("/(onboarding)/security");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={1} />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <Text style={styles.headingSerif}>
            We organize everything in four simple parts.
          </Text>

          {/* 2x2 Pillar Grid */}
          <View style={localStyles.grid}>
            {PILLARS.map((pillar) => (
              <View
                key={pillar.title}
                style={[localStyles.card, { backgroundColor: pillar.tint }]}
              >
                <Ionicons
                  name={pillar.icon}
                  size={28}
                  color={pillar.color}
                  style={localStyles.cardIcon}
                />
                <Text style={localStyles.cardTitle}>{pillar.title}</Text>
                <Text style={localStyles.cardDescription}>
                  {pillar.description}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.bodyTextSecondary}>
            We&apos;ll guide you through, one step at a time.
          </Text>
        </View>

        <View style={styles.bottomButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Start with step one</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: "center",
  },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 130,
    justifyContent: "center",
  },
  cardIcon: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  cardDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
});
