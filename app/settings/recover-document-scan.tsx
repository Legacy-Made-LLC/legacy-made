/**
 * Recovery Document — QR Scan
 *
 * Camera-based scanning of the QR code from the recovery document.
 * On successful scan, immediately begins recovery.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useDocumentRecovery } from "@/hooks/useDocumentRecovery";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecoverDocumentScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recoverFromMnemonic, isRecovering, error, setError, isComplete } =
    useDocumentRecovery();

  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      const scannedWords = data.trim().split(/\s+/);
      if (scannedWords.length === 12) {
        recoverFromMnemonic(data.trim().toLowerCase());
      } else {
        setError("Invalid QR code. Expected 12 recovery words.");
        setScanned(false);
      }
    },
    [scanned, recoverFromMnemonic, setError],
  );

  return (
    <>
      <Stack.Screen options={{ title: "Scan Recovery QR Code" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {isComplete ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={colors.success}
              />
            </View>
            <Text style={styles.successTitle}>You&apos;re all set</Text>
            <Text style={styles.successDescription}>
              Your access has been restored. All of your information is unlocked
              and ready for you.
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.replace("/(app)")}
            >
              <Text style={styles.doneButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>Scan QR code</Text>
            <Text style={styles.body}>
              Point your camera at the QR code on your recovery document.
            </Text>

            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isRecovering && (
              <View style={styles.statusCard}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.statusText}>Restoring access...</Text>
              </View>
            )}
          </>
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
  cameraContainer: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  statusCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  statusText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
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
  successContainer: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  successIcon: {
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  successDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.lg,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  doneButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
});
