import { Ionicons } from "@expo/vector-icons";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHasCompletedInitialOnboarding } = useOnboardingContext();

  const handleContinue = () => {
    router.push("/(onboarding)/contact-form");
  };

  const handleSignIn = () => {
    setHasCompletedInitialOnboarding(true);
    router.push("/(auth)/sign-in");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="call-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.headingSerif}>
            Let&apos;s take the first step together.
          </Text>
          <Text style={styles.bodyText}>
            If something happened to you tomorrow, who would your family call
            first?
          </Text>
          <Text style={styles.bodyTextSecondary}>
            This is where most people begin — and it only takes a minute.
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
            <Text style={styles.primaryButtonText}>Add my primary contact</Text>
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
