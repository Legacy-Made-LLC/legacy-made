/**
 * QuickActions - Horizontal row of dynamic shortcut pill buttons
 *
 * Shows 2-3 quick action shortcuts based on the user's current progress.
 * Suggests in-progress sections first, then not-started ones.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import type { QuickAction } from "@/hooks/useQuickActions";

interface QuickActionsProps {
  actions: QuickAction[];
  isLoading: boolean;
}

export function QuickActions({ actions, isLoading }: QuickActionsProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isLoading) {
      // Reset so the fade-in replays once loading finishes (e.g. after plan switch)
      hasAnimated.current = false;
    } else if (actions.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, actions.length, fadeAnim]);

  if (isLoading || actions.length === 0) return null;

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={{ opacity: fadeAnim }}
    >
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => [
            styles.pill,
            pressed && styles.pillPressed,
          ]}
        >
          <Ionicons
            name={action.icon}
            size={16}
            color={action.color}
          />
          <Text style={styles.pillText}>{action.label}</Text>
        </Pressable>
      ))}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  pillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
  },
});
