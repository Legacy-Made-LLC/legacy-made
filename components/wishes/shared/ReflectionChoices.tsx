/**
 * ReflectionChoices - Values-based selection UI
 *
 * Cards with tap-to-select behavior for expressing values/preferences.
 * Selected cards show "This matters to me" with checkmark.
 * Unselected cards show "Tap if this resonates" with dashed circle.
 *
 * Unique to the Wishes pillar for reflective value selection.
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// ============================================================================
// Types
// ============================================================================

export interface ReflectionChoice {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface ReflectionChoicesProps {
  /** Array of choices to display */
  choices: ReflectionChoice[];
  /** Array of selected choice IDs */
  selected: string[];
  /** Callback when a choice is toggled */
  onToggle: (id: string) => void;
  /** Number of columns (1 or 2) */
  columns?: 1 | 2;
  /** Whether to show custom input field */
  allowCustom?: boolean;
  /** Current custom input value */
  customValue?: string;
  /** Callback when custom input changes */
  onCustomChange?: (value: string) => void;
  /** Placeholder for custom input */
  customPlaceholder?: string;
  /** Custom label for custom input section */
  customLabel?: string;
  /** Container style override */
  style?: ViewStyle;
}

// ============================================================================
// Main Component
// ============================================================================

export function ReflectionChoices({
  choices,
  selected,
  onToggle,
  columns = 1,
  allowCustom = false,
  customValue = "",
  onCustomChange,
  customPlaceholder = "Add your own...",
  customLabel = "Something else on your mind?",
  style,
}: ReflectionChoicesProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.grid, columns === 2 && styles.twoColumns]}>
        {choices.map((choice) => (
          <ReflectionCard
            key={choice.id}
            choice={choice}
            isSelected={selected.includes(choice.id)}
            onPress={() => onToggle(choice.id)}
          />
        ))}
      </View>

      {allowCustom && (
        <View style={styles.customInput}>
          <Text style={styles.customLabel}>{customLabel}</Text>
          <TextInput
            value={customValue}
            onChangeText={onCustomChange}
            placeholder={customPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            multiline
            numberOfLines={2}
          />
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Card Component
// ============================================================================

interface ReflectionCardProps {
  choice: ReflectionChoice;
  isSelected: boolean;
  onPress: () => void;
}

function ReflectionCard({ choice, isSelected, onPress }: ReflectionCardProps) {
  const { isFamily } = usePerspective();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[styles.card, isSelected && styles.cardSelected, animatedStyle]}
      >
        {/* Main content row */}
        <View style={styles.cardMain}>
          {choice.icon && (
            <Ionicons
              name={choice.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={isSelected ? colors.featureWishes : colors.textSecondary}
            />
          )}
          <Text
            style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
          >
            {choice.label}
          </Text>
        </View>

        {/* Description (if provided) */}
        {choice.description && (
          <Text
            style={[styles.cardDesc, isSelected && styles.cardDescSelected]}
          >
            {choice.description}
          </Text>
        )}

        {/* Selection indicator */}
        <View
          style={[styles.indicator, isSelected && styles.indicatorSelected]}
        >
          {isSelected ? (
            <>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <Text style={styles.selectedText}>
                {isFamily ? "This matters to them" : "This matters to me"}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.dashedCircle} />
              <Text style={styles.unselectedText}>Tap if this resonates</Text>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.featureWishes,
    backgroundColor: colors.featureWishesTint,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  cardLabelSelected: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semibold,
  },
  cardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    fontStyle: "italic",
    paddingLeft: 28, // Align with label (icon width + gap)
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
  cardDescSelected: {
    color: colors.textSecondary,
    fontStyle: "normal",
  },
  // Indicator styles
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  indicatorSelected: {
    borderTopColor: "rgba(184, 169, 201, 0.3)", // featureWishes with opacity
  },
  selectedMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.featureWishes,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.featureWishes,
  },
  unselectedMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dashedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
    borderStyle: "dashed",
  },
  unselectedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  // Custom input styles
  customInput: {
    marginTop: spacing.lg,
  },
  customLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.featureWishes,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: "top",
  },
});

// ============================================================================
// Reflection Prompt Component
// ============================================================================

interface ReflectionPromptProps {
  question: string;
  context?: string;
}

export function ReflectionPrompt({ question, context }: ReflectionPromptProps) {
  return (
    <View style={promptStyles.container}>
      <Text style={promptStyles.question}>{question}</Text>
      {context && <Text style={promptStyles.context}>{context}</Text>}
    </View>
  );
}

const promptStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  question: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  context: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
