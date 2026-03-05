import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import {
  INTRO_ANIMATION,
  INTRO_MESSAGES,
  onboardingStyles as styles,
} from "@/components/onboarding/onboardingStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const messageCount = INTRO_MESSAGES.length;
  const totalItems = messageCount + 1; // stanzas + button

  // Create animation values dynamically based on number of messages
  const itemAnimations = useRef(
    [...Array(totalItems)].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(INTRO_ANIMATION.INITIAL_OFFSET),
    }))
  ).current;

  // Container starts offset and moves up as items appear
  const initialContainerOffset =
    INTRO_ANIMATION.CONTAINER_OFFSET_PER_ITEM * messageCount;
  const containerTranslateY = useRef(
    new Animated.Value(initialContainerOffset)
  ).current;

  useEffect(() => {
    const {
      STANZA_DELAY_INITIAL,
      STANZA_DELAY,
      FADE_DURATION,
      MOVE_DURATION,
      CONTAINER_OFFSET_PER_ITEM,
    } = INTRO_ANIMATION;

    // Animate each item in sequence
    itemAnimations.forEach((anim, index) => {
      const delay = index * STANZA_DELAY + STANZA_DELAY_INITIAL;

      setTimeout(() => {
        // Calculate container position (moves up as each item appears)
        const remainingItems = messageCount - index;
        const containerTarget = Math.max(
          0,
          remainingItems * CONTAINER_OFFSET_PER_ITEM
        );

        Animated.parallel([
          // Move container up
          Animated.timing(containerTranslateY, {
            toValue: containerTarget,
            duration: MOVE_DURATION,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          // Fade in the item
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: FADE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          // Slide up the item
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: FADE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start();
      }, delay);
    });
  }, [itemAnimations, containerTranslateY, messageCount]);

  const handleGetStarted = () => {
    router.push("/(onboarding)/scattered");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton={false} />

      <View style={styles.introContainer}>
        <Animated.View
          style={[
            styles.introContent,
            { transform: [{ translateY: containerTranslateY }] },
          ]}
        >
          {INTRO_MESSAGES.map((message, index) => (
            <Animated.View
              key={index}
              style={[
                styles.stanzaContainer,
                {
                  opacity: itemAnimations[index].opacity,
                  transform: [{ translateY: itemAnimations[index].translateY }],
                },
              ]}
            >
              <Text style={styles.stanzaText}>{message}</Text>
            </Animated.View>
          ))}

          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                opacity: itemAnimations[messageCount].opacity,
                transform: [
                  { translateY: itemAnimations[messageCount].translateY },
                ],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
            <Text style={styles.buttonHelperText}>
              This part only takes one minute
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
