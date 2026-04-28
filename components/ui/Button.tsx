import {
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "subtle" | "destructive";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const getButtonStyle = () => {
    if (disabled) return styles.disabled;
    switch (variant) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "subtle":
        return styles.subtle;
      case "destructive":
        return styles.destructive;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    switch (variant) {
      case "primary":
        return styles.primaryText;
      case "secondary":
        return styles.secondaryText;
      case "subtle":
        return styles.subtleText;
      case "destructive":
        return styles.destructiveText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.button, getButtonStyle(), animatedStyle, style]}
    >
      <Text style={[styles.text, getTextStyle()]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: componentStyles.button.height,
    borderRadius: componentStyles.button.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  subtle: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: "transparent",
  },
  disabled: {
    backgroundColor: colors.border,
  },
  text: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.primary,
  },
  subtleText: {
    color: colors.primary,
  },
  destructiveText: {
    color: colors.error,
  },
  disabledText: {
    color: colors.textTertiary,
  },
});
