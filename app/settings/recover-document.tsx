/**
 * Recover from Recovery Document — Method Chooser
 *
 * Presents two options: scan the QR code or enter words manually.
 * Each option navigates to its own screen.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecoverDocumentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: "Recovery Document" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text style={styles.heading}>Use Recovery Document</Text>
        <Text style={styles.body}>
          Use the recovery document you saved to restore access to your account.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.optionCardPressed,
          ]}
          onPress={async () => {
            if (!permission?.granted) {
              const result = await requestPermission();
              if (!result.granted) {
                setError(
                  "Camera permission is required to scan the QR code.",
                );
                return;
              }
            }
            router.push("/settings/recover-document-scan");
          }}
        >
          <View style={styles.optionIcon}>
            <Ionicons
              name="qr-code-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Scan Recovery QR Code</Text>
            <Text style={styles.optionDescription}>
              Point your camera at the QR code on your recovery document
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.optionCardPressed,
          ]}
          onPress={() => router.push("/settings/recover-document-words")}
        >
          <View style={styles.optionIcon}>
            <Ionicons
              name="text-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Enter Recovery Words</Text>
            <Text style={styles.optionDescription}>
              Type in the 12 recovery words from your document
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heading: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  errorCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.error}10`,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },
});
