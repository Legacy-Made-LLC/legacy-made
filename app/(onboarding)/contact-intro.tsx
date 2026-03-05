import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleContinue = () => {
    router.push("/(onboarding)/contact-form");
  };

  const handleSkip = () => {
    router.push("/(onboarding)/account-creation");
  };

  const handleSignIn = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={2} />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="call-outline" size={26} color={colors.primary} />
          </View>
          <Text style={styles.headingSerif}>
            Let&apos;s start with an important first step.
          </Text>
          <Text style={styles.bodyTextSecondary}>
            If something unexpected happens, someone needs to take the lead.
            We&apos;ll help you name that person — your primary contact who can
            coordinate and guide others.
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
            <Text style={styles.primaryButtonText}>Let&apos;s do this</Text>
          </Pressable>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>I&apos;ll do this later</Text>
          </Pressable>
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text style={styles.signInLink} onPress={handleSignIn}>
              Sign In
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
