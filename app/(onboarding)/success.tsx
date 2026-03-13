import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors, spacing, typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      <OnboardingHeader showBackButton currentStep={5} />

      <View style={styles.screenContainer}>
        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.successCheckmark,
              { transform: [{ scale: checkmarkScale }] },
            ]}
          >
            <Text style={styles.successCheckmarkText}>&#x2713;</Text>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.headingSerif}>
              You&apos;ve taken the first step.
            </Text>

            {/* Quote block */}
            <View style={localStyles.quoteBlock}>
              <View style={localStyles.quoteBorder} />
              <View style={localStyles.quoteContent}>
                <Text style={localStyles.quoteText}>
                  The secret of getting ahead is getting started.
                </Text>
                <Text style={localStyles.quoteAttribution}>- Mark Twain</Text>
              </View>
            </View>
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

const localStyles = StyleSheet.create({
  quoteBlock: {
    flexDirection: "row",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  quoteBorder: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontFamily: typography.fontFamily.serif,
    fontStyle: "italic",
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    lineHeight: typography.sizes.titleLarge * typography.lineHeights.relaxed,
  },
  quoteAttribution: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
