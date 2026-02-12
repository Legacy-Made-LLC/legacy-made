/**
 * Select - Dropdown selector component for forms
 *
 * Displays a list of options that can be selected via a bottom sheet.
 * Follows the same styling pattern as Input and TextArea.
 */

import {
  borderRadius,
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Show a clear button when a value is selected */
  clearable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  clearable = false,
  containerStyle,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder;

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleOpen = useCallback(() => {
    borderColor.value = withTiming(colors.primary, { duration: 200 });
    setIsOpen(true);
  }, [borderColor]);

  const handleClose = useCallback(() => {
    borderColor.value = withTiming(colors.border, { duration: 200 });
    setIsOpen(false);
  }, [borderColor]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onValueChange(optionValue);
      handleClose();
    },
    [onValueChange, handleClose],
  );

  const handleClear = useCallback(() => {
    onValueChange("");
    handleClose();
  }, [onValueChange, handleClose]);

  const showClear = clearable && !!value;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable
        style={[styles.selectButton, animatedStyle]}
        onPress={handleOpen}
      >
        <Text
          style={[styles.selectText, !selectedOption && styles.placeholderText]}
        >
          {displayText}
        </Text>
        {showClear ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onValueChange("");
              borderColor.value = withTiming(colors.border, { duration: 200 });
            }}
            hitSlop={8}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        )}
      </AnimatedPressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            style={[styles.modalContent, { paddingBottom: spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={{ flexShrink: 0 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {showClear && (
                <Pressable style={styles.clearOption} onPress={handleClear}>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.clearOptionText}>Clear selection</Text>
                </Pressable>
              )}
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionItem,
                    option.value === value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  selectButton: {
    height: componentStyles.input.height,
    borderWidth: componentStyles.input.borderWidth,
    borderRadius: componentStyles.input.borderRadius,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.md,
    width: "100%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: typography.sizes.titleMedium,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionItemSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  optionText: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionTextSelected: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  clearButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  clearOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  clearOptionText: {
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
});
