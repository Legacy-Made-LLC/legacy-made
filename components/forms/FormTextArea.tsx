import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AnyFieldApi } from '@tanstack/react-form';
import { colors, typography, spacing, componentStyles } from '@/constants/theme';
import { getErrorMessage } from './form-utils';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface FormTextAreaProps
  extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'onBlur' | 'multiline'> {
  field: AnyFieldApi;
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** When true, the text area is non-interactive (view-only) */
  disabled?: boolean;
}

export function FormTextArea({ field, label, containerStyle, disabled, ...props }: FormTextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
  const errorMessage = hasError ? getErrorMessage(field.state.meta.errors[0]) : null;

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
        multiline
        textAlignVertical="top"
        value={field.state.value ?? ''}
        onChangeText={(text) => field.handleChange(text)}
        editable={!disabled}
        style={[styles.textArea, disabled && styles.disabled, animatedStyle]}
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
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: componentStyles.textArea.minHeight,
    borderWidth: componentStyles.textArea.borderWidth,
    borderRadius: componentStyles.textArea.borderRadius,
    borderColor: colors.border, // Default border color (animated style will override)
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
