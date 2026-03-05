import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors, spacing, typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================================================
// Pill labels
// ============================================================================
const PILL_LABELS = [
  "Bank accounts",
  "Social media",
  "Insurance",
  "Passwords",
  "Healthcare wishes",
  "401k",
  "Funeral plans",
  "Beliefs",
  "Traditions",
];

// ============================================================================
// Pill sizing constants
// ============================================================================
const PILL_FONT_SIZE = typography.sizes.bodySmall; // 14
const PILL_H_PADDING = 14;
const PILL_V_PADDING = 8;
const PILL_BORDER = 1;
const AVG_CHAR_WIDTH = PILL_FONT_SIZE * 0.55; // Rough estimate for DM Sans 14px
const PILL_HEIGHT = PILL_FONT_SIZE + PILL_V_PADDING * 2 + PILL_BORDER * 2;

function estimatePillWidth(label: string): number {
  return label.length * AVG_CHAR_WIDTH + PILL_H_PADDING * 2 + PILL_BORDER * 2;
}

// ============================================================================
// Layout tuning — adjust these to change the scattered look
// ============================================================================
const SCATTER = {
  // How far pills can extend past the container edges (px)
  EDGE_BLEED: 15,
  // Max allowed overlap between two pills (0 = none, 0.5 = half covered)
  MAX_OVERLAP: 0.1,
  // Max rotation in degrees (pills rotate randomly between -MAX and +MAX)
  MAX_ROTATION: 3.5,
  // How spread out pills are from center (0 = tight cluster, 1 = fill container)
  RADIAL_SPREAD: 0.85,
  // How many times to retry placing a pill that overlaps too much
  MAX_NUDGE_ATTEMPTS: 8,
  // How far a nudge moves the pill horizontally (px)
  NUDGE_X: 40,
  // How far a nudge moves the pill vertically (px)
  NUDGE_Y: 20,
  // Minimum distance from center as fraction of radius (0 = center allowed, 1 = only edges)
  MIN_RADIAL_DIST: 0.6,
  // Container height as fraction of screen height
  CONTAINER_HEIGHT_RATIO: 0.26,
};

// ============================================================================
// Placement algorithm
// ============================================================================
interface PlacedPill {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: string;
  // Entry animation: direction the pill slides in from
  entryX: number;
  entryY: number;
}

function placePills(containerW: number, containerH: number): PlacedPill[] {
  const pills: PlacedPill[] = [];

  // Center of the container (pills radiate outward from here)
  const cx = containerW / 2;
  const cy = containerH / 2;
  const radiusX = (containerW / 2) * SCATTER.RADIAL_SPREAD;
  const radiusY = (containerH / 2) * SCATTER.RADIAL_SPREAD;

  // Distribute pills at evenly-spaced angles with random jitter
  const angleStep = (2 * Math.PI) / PILL_LABELS.length;

  for (let i = 0; i < PILL_LABELS.length; i++) {
    const label = PILL_LABELS[i];
    const w = estimatePillWidth(label);
    const h = PILL_HEIGHT;
    const rotation =
      (Math.random() * SCATTER.MAX_ROTATION * 2 - SCATTER.MAX_ROTATION).toFixed(
        1,
      ) + "deg";

    // Angle: evenly spaced with random jitter so it's not a perfect circle
    const angle = angleStep * i + (Math.random() - 0.5) * angleStep * 0.6;
    // Distance: random between MIN_RADIAL_DIST and 100% of radius
    const dist =
      SCATTER.MIN_RADIAL_DIST + Math.random() * (1 - SCATTER.MIN_RADIAL_DIST);

    // Place pill center at radial position, then offset to top-left corner
    let x = cx + Math.cos(angle) * radiusX * dist - w / 2;
    let y = cy + Math.sin(angle) * radiusY * dist - h / 2;

    // Clamp to keep pill mostly visible (allow bleed past edges)
    x = Math.max(
      -SCATTER.EDGE_BLEED,
      Math.min(x, containerW - w + SCATTER.EDGE_BLEED),
    );
    y = Math.max(0, Math.min(y, containerH - h));

    // Push away from pills that overlap too much
    for (let attempt = 0; attempt < SCATTER.MAX_NUDGE_ATTEMPTS; attempt++) {
      // Find the worst overlapping pill
      let worstOverlapRatio = 0;
      let worstPill: PlacedPill | null = null;
      for (const placed of pills) {
        const overlapX = Math.max(
          0,
          Math.min(x + w, placed.x + placed.w) - Math.max(x, placed.x),
        );
        const overlapY = Math.max(
          0,
          Math.min(y + h, placed.y + placed.h) - Math.max(y, placed.y),
        );
        const ratio = (overlapX * overlapY) / (w * h);
        if (ratio > worstOverlapRatio) {
          worstOverlapRatio = ratio;
          worstPill = placed;
        }
      }
      if (worstOverlapRatio <= SCATTER.MAX_OVERLAP) break;

      // Push directly away from the worst overlapper
      const myCx = x + w / 2;
      const myCy = y + h / 2;
      const otherCx = worstPill!.x + worstPill!.w / 2;
      const otherCy = worstPill!.y + worstPill!.h / 2;
      let dx = myCx - otherCx;
      let dy = myCy - otherCy;
      // If pills are exactly stacked, pick a random direction
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;
      // Push with decreasing force + small randomness
      const force =
        SCATTER.NUDGE_X * (1 - attempt / SCATTER.MAX_NUDGE_ATTEMPTS);
      x += dx * force + (Math.random() - 0.5) * 10;
      y += dy * force * 0.5 + (Math.random() - 0.5) * 6;
      x = Math.max(
        -SCATTER.EDGE_BLEED,
        Math.min(x, containerW - w + SCATTER.EDGE_BLEED),
      );
      y = Math.max(0, Math.min(y, containerH - h));
    }

    // Random entry direction (slide in from a random angle, 15-25px away)
    const entryAngle = Math.random() * Math.PI * 2;
    const entryDist = 15 + Math.random() * 10;
    const entryX = Math.cos(entryAngle) * entryDist;
    const entryY = Math.sin(entryAngle) * entryDist;

    pills.push({ label, x, y, w, h, rotate: rotation, entryX, entryY });
  }

  return pills;
}

// ============================================================================
// Animation config
// ============================================================================
const ANIMATION = {
  STAGGER_DELAY: 150,
  INITIAL_DELAY: 400,
  FADE_DURATION: 550,
  CONTENT_DELAY: 300,
  CONTENT_FADE: 500,
};

// Shuffled animation order — each pill gets a random position in the sequence
function shuffledOrder(count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Invert: animOrder[pillIndex] = which position in the sequence it appears
  const order = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    order[indices[i]] = i;
  }
  return order;
}

const ANIM_ORDER = shuffledOrder(PILL_LABELS.length);

// ============================================================================
// Component
// ============================================================================
export default function ScatteredScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const containerHeight = screenHeight * SCATTER.CONTAINER_HEIGHT_RATIO;
  const containerWidth = screenWidth - spacing.xl * 2;

  const pills = useMemo(
    () => placePills(containerWidth, containerHeight),
    [containerWidth, containerHeight],
  );

  const pillAnimations = useRef(
    PILL_LABELS.map(() => new Animated.Value(0)),
  ).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pillSequence = pillAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: ANIMATION.FADE_DURATION,
        delay:
          ANIMATION.INITIAL_DELAY + ANIM_ORDER[index] * ANIMATION.STAGGER_DELAY,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    );

    Animated.parallel(pillSequence).start(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: ANIMATION.CONTENT_FADE,
        delay: ANIMATION.CONTENT_DELAY,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, [pillAnimations, contentOpacity]);

  const handleContinue = () => {
    router.push("/(onboarding)/pillars");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={0} />

      {/* Full-width scattered pills */}
      <View style={[localStyles.pillsContainer, { height: containerHeight }]}>
        {pills.map((pill, index) => (
          <Animated.View
            key={pill.label}
            style={[
              localStyles.pill,
              {
                left: pill.x,
                top: pill.y,
                opacity: pillAnimations[index],
                transform: [
                  { rotate: pill.rotate },
                  {
                    translateX: pillAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [pill.entryX, 0],
                    }),
                  },
                  {
                    translateY: pillAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [pill.entryY, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={localStyles.pillText}>{pill.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Text + button */}
      <View style={localStyles.bottomSection}>
        <Animated.View style={{ opacity: contentOpacity }}>
          <Text style={styles.headingSerif}>
            Our information is scattered everywhere.
          </Text>
          <Text style={styles.bodyTextSecondary}>
            All in different places. When something happens, our loved ones are
            left searching.
          </Text>
        </Animated.View>

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
            <Text style={styles.primaryButtonText}>Let&apos;s fix this</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  pillsContainer: {
    overflow: "visible",
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
  },
  pill: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderWidth: PILL_BORDER,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: PILL_H_PADDING,
    paddingVertical: PILL_V_PADDING,
  },
  pillText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: PILL_FONT_SIZE,
    color: colors.textPrimary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
