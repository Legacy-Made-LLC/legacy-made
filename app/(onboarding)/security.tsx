import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECURITY_POINTS = [
  {
    icon: "lock-closed-outline" as const,
    title: "Private by design",
    description:
      "Your information is encrypted on your device before it ever leaves your phone. Not even we can read it.",
  },
  {
    icon: "eye-off-outline" as const,
    title: "Only you hold the key",
    description:
      "Your encryption key stays with you. No one at Legacy Made can access your data — ever.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Safe to share, when you\u2019re ready",
    description:
      "When you share with family, everything stays encrypted. Only the people you choose can see it.",
  },
];

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    router.push("/(onboarding)/contact-intro");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={2} />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <Text style={styles.headingSerif}>
            Your privacy is built in, not bolted on.
          </Text>

          <View style={localStyles.points}>
            {SECURITY_POINTS.map((point) => (
              <View key={point.title} style={localStyles.pointRow}>
                <View style={localStyles.pointIcon}>
                  <Ionicons
                    name={point.icon}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={localStyles.pointText}>
                  <Text style={localStyles.pointTitle}>{point.title}</Text>
                  <Text style={localStyles.pointDescription}>
                    {point.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <EncryptionBadge />
        </View>

        <View style={styles.bottomButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  points: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  pointRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pointIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  pointText: {
    flex: 1,
  },
  pointTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pointDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
});
