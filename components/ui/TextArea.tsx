import {
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import React from "react";
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

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface TextAreaProps extends Omit<TextInputProps, "style" | "multiline"> {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextArea({ label, containerStyle, ...props }: TextAreaProps) {
  const borderColor = useSharedValue(colors.border);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    borderColor.value = withTiming(colors.primary, { duration: 200 });
  };

  const handleBlur = () => {
    borderColor.value = withTiming(colors.border, { duration: 200 });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedTextInput
        {...props}
        multiline
        textAlignVertical="top"
        style={[styles.textArea, animatedStyle]}
        placeholderTextColor={colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
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
  textArea: {
    minHeight: componentStyles.textArea.minHeight,
    borderWidth: componentStyles.textArea.borderWidth,
    borderRadius: componentStyles.textArea.borderRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
