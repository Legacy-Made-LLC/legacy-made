import {
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import type { AnyFieldApi } from "@tanstack/react-form";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getErrorMessage } from "./form-utils";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface FormInputProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "onBlur" | "onChange"
> {
  field: AnyFieldApi;
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional callback to transform/handle the value - will be called with the raw text */
  onValueChange?: (value: string) => void;
  /** When true, the input is non-interactive (view-only) */
  disabled?: boolean;
}

export function FormInput({
  field,
  label,
  containerStyle,
  onValueChange,
  disabled,
  ...props
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const hasError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;
  const errorMessage = hasError
    ? getErrorMessage(field.state.meta.errors[0])
    : null;

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  // Single source of truth for border color - updates whenever focus or error state changes
  React.useEffect(() => {
    let targetColor: string;
    if (isFocused) {
      targetColor = hasError ? colors.error : colors.primary;
    } else {
      targetColor = hasError ? colors.error : colors.border;
    }
    borderColor.value = withTiming(targetColor, { duration: 200 });
  }, [hasError, isFocused, borderColor]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    field.handleBlur();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedTextInput
        {...props}
        value={field.state.value ?? ""}
        onChangeText={(text) => {
          if (onValueChange) {
            onValueChange(text);
          } else {
            field.handleChange(text);
          }
        }}
        editable={!disabled}
        style={[styles.input, disabled && styles.disabled, animatedStyle]}
        placeholderTextColor={colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  input: {
    height: componentStyles.input.height,
    borderWidth: componentStyles.input.borderWidth,
    borderRadius: componentStyles.input.borderRadius,
    borderColor: colors.border, // Default border color (animated style will override)
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  disabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
