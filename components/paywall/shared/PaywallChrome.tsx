import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { PAYWALL_COLORS } from "./tokens";

interface PaywallChromeProps {
  onDismiss: () => void;
}

export function PaywallChrome({ onDismiss }: PaywallChromeProps) {
  return (
    <View style={styles.chrome}>
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={8}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={16} color={PAYWALL_COLORS.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    paddingHorizontal: 24,
    minHeight: 48,
    position: "relative",
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PAYWALL_COLORS.surfaceQuiet,
    alignItems: "center",
    justifyContent: "center",
  },
});
