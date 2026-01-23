import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contactFirstName, contactLastName } = useOnboardingContext();
  const contactName = `${contactFirstName} ${contactLastName}`.trim();

  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate checkmark appearing
    Animated.sequence([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [checkmarkScale, contentOpacity]);

  const handleContinue = () => {
    router.push("/(onboarding)/account-creation");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.successCheckmark,
              { transform: [{ scale: checkmarkScale }] },
            ]}
          >
            <Text style={styles.successCheckmarkText}>✓</Text>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.headingSerif}>
              You&apos;ve taken the first step.
            </Text>
            <Text style={styles.bodyText}>
              {contactName} is now saved as your primary contact.
            </Text>
            <Text style={styles.bodyTextSecondary}>
              Next, we&apos;ll create your account so your information stays
              safe and accessible.
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.bottomButtonContainer, { opacity: contentOpacity }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
