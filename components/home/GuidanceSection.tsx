/**
 * GuidanceSection - Adaptive guidance card for the home screen
 *
 * Always-present section that shows contextual guidance based on the user's
 * progress. Naturally evolves as the user acts — not dismissable.
 */

import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import type { GuidanceState } from "@/hooks/useHomeGuidance";

interface GuidanceSectionProps {
  guidance: GuidanceState;
  isLoading: boolean;
}

export function GuidanceSection({ guidance, isLoading }: GuidanceSectionProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, scaleAnim]);

  if (isLoading) {
    return null;
  }

  const handleCTA = () => {
    if (guidance.ctaRoute) {
      router.push(guidance.ctaRoute as Href);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: guidance.tintColor },
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Icon column */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${guidance.accentColor}20` },
        ]}
      >
        <Ionicons
          name={guidance.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={guidance.accentColor}
        />
      </View>

      {/* Text + CTA column */}
      <View style={styles.textColumn}>
        <Text style={styles.title}>{guidance.title}</Text>
        <Text style={styles.body}>{guidance.body}</Text>

        {guidance.cta && (
          <Pressable
            onPress={handleCTA}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: guidance.accentColor },
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaText}>{guidance.cta}</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.surface} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.tight,
    marginBottom: spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.surface,
  },
});
