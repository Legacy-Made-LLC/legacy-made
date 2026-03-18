import { useSignInWithApple } from "@clerk/expo/apple";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { spacing, typography } from "@/constants/theme";
import { useSocialSignIn } from "@/hooks/useSocialSignIn";

export function AppleSignInButton() {
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { isLoading, handleSignIn, spinnerOpacity, spinnerWidth } =
    useSocialSignIn(startAppleAuthenticationFlow, {
      cancelCodes: ["ERR_REQUEST_CANCELED"],
      providerName: "Apple",
    });

  if (Platform.OS !== "ios") return null;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && !isLoading && styles.buttonPressed,
        ]}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Continue with Apple</Text>
        <Animated.View
          style={{
            opacity: spinnerOpacity,
            width: spinnerWidth,
            overflow: "hidden",
          }}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: "#000000",
    height: 52,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
  },
});
