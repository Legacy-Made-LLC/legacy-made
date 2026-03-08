/**
 * SortControl - Pill toggle for sorting entries (A-Z / Recent) with expandable search
 *
 * Only rendered when there are 2+ entries.
 * Includes a search pill on the left that expands into a full-width search input,
 * fading out the sort pills during expansion.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { TouchableOpacity as GHTouchable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing, typography } from "@/constants/theme";
import type { SortMode } from "@/hooks/useSortedEntries";

const ANIM_DURATION = 280;
const PILL_HEIGHT = 30;
const EXPANDED_HEIGHT = 40;

interface SortControlProps {
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  /** Active pill background color. Defaults to colors.primary (sage green). */
  tint?: string;
  /** Current search query string. */
  searchQuery?: string;
  /** Called when the search query changes. Required to enable search. */
  onSearchQueryChange?: (query: string) => void;
}

export function SortControl({
  sortMode,
  onSortModeChange,
  tint,
  searchQuery = "",
  onSearchQueryChange,
}: SortControlProps) {
  const activeBg = tint ?? colors.primary;
  const isExpanded = useSharedValue(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const hasSearch = !!onSearchQueryChange;

  const handleSearchOpen = useCallback(() => {
    setSearchVisible(true);
    isExpanded.value = true;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isExpanded]);

  const handleSearchClose = useCallback(() => {
    inputRef.current?.blur();
    isExpanded.value = false;
    onSearchQueryChange?.("");
    // Wait for animation to finish before unmounting the input
    setTimeout(() => setSearchVisible(false), ANIM_DURATION + 50);
  }, [isExpanded, onSearchQueryChange]);

  const sortPillsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded.value ? 0 : 1, { duration: ANIM_DURATION * 0.6 }),
    pointerEvents: isExpanded.value ? ("none" as const) : ("auto" as const),
  }));

  const searchPillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded.value ? 0 : 1, { duration: ANIM_DURATION * 0.6 }),
    pointerEvents: isExpanded.value ? ("none" as const) : ("auto" as const),
  }));

  const searchBarStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isExpanded.value ? 1 : 0, { duration: ANIM_DURATION }),
    transform: [
      {
        scaleX: withTiming(isExpanded.value ? 1 : 0.3, { duration: ANIM_DURATION }),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Normal row: search pill + sort pills */}
      <View style={styles.row}>
        {hasSearch && (
          <Animated.View style={searchPillStyle}>
            <Pressable
              onPress={handleSearchOpen}
              style={({ pressed }) => [
                styles.searchPill,
                pressed && styles.pillPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search entries"
            >
              <Ionicons
                name="search"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.searchPillText}>Search</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View style={[styles.pillRow, sortPillsStyle]}>
          <Pressable
            onPress={() => onSortModeChange("alphabetical")}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor:
                  sortMode === "alphabetical"
                    ? activeBg
                    : colors.surfaceSecondary,
              },
              pressed && styles.pillPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sort alphabetically"
            accessibilityState={{ selected: sortMode === "alphabetical" }}
          >
            <Text
              style={[
                styles.pillText,
                sortMode === "alphabetical"
                  ? styles.pillTextActive
                  : styles.pillTextInactive,
              ]}
            >
              A-Z
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSortModeChange("recent")}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor:
                  sortMode === "recent" ? activeBg : colors.surfaceSecondary,
              },
              pressed && styles.pillPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sort by most recent"
            accessibilityState={{ selected: sortMode === "recent" }}
          >
            <Text
              style={[
                styles.pillText,
                sortMode === "recent"
                  ? styles.pillTextActive
                  : styles.pillTextInactive,
              ]}
            >
              Recent
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Expanded search bar — overlays the row */}
      {hasSearch && searchVisible && (
        <Animated.View style={[styles.searchBarOverlay, searchBarStyle]}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={15}
              color={colors.textTertiary}
              style={styles.searchBarIcon}
            />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              placeholder="Search..."
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <GHTouchable
              onPress={handleSearchClose}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </GHTouchable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: PILL_HEIGHT,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: PILL_HEIGHT,
    paddingHorizontal: spacing.md,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
  },
  searchPillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 15,
    height: PILL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  searchBarOverlay: {
    position: "absolute",
    top: -(EXPANDED_HEIGHT - PILL_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: EXPANDED_HEIGHT,
    transformOrigin: "left center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    height: EXPANDED_HEIGHT,
    paddingHorizontal: spacing.sm + 4,
  },
  searchBarIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
});
