/**
 * Device Linking - QR Code Key Transfer
 *
 * Allows transferring encryption keys to a new device without escrow.
 * Source device encrypts the private key + DEK, creates a single-use
 * transfer token (60-second TTL), and displays a QR code.
 * New device scans → claims → stores keys locally.
 */

import { useApi } from "@/api";
import { colors, spacing, typography } from "@/constants/theme";
import {
  exportDEK,
  exportPrivateKey,
  getKeyId,
  getPrivateKey,
  getDEK,
  importPrivateKey,
  importDEK,
  storePrivateKey,
  storeDEK,
  storeKeyId,
  hasEncryptionKeys,
} from "@/lib/crypto/keys";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "choose" | "send" | "receive";

export default function DeviceLinkingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { keys } = useApi();

  const [mode, setMode] = useState<Mode>("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferToken, setTransferToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for transfer token
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        setTransferToken(null);
        setError("Transfer token expired. Please generate a new one.");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAt]);

  /**
   * Generate a transfer token on the source device.
   * Encrypts private key + DEK with a random AES key,
   * sends encrypted payload to server with 60s TTL.
   */
  const handleGenerateToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const privateKey = await getPrivateKey();
      const dek = await getDEK();
      const keyId = await getKeyId();

      if (!privateKey || !dek || !keyId) {
        throw new Error("No encryption keys found on this device");
      }

      // Export keys
      const privateKeyB64 = await exportPrivateKey(privateKey);
      const dekB64 = await exportDEK(dek);

      // Build payload JSON
      const payload = JSON.stringify({
        privateKey: privateKeyB64,
        dek: dekB64,
        keyId,
      });

      // Create transfer on server
      const response = await keys.createTransfer({ payload });

      setTransferToken(response.token);
      setExpiresAt(response.expiresAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate transfer",
      );
    } finally {
      setIsLoading(false);
    }
  }, [keys]);

  /**
   * Claim a transfer token on the receiving device.
   * Fetches the encrypted payload, decrypts, and stores keys locally.
   */
  const handleClaimToken = useCallback(async () => {
    if (!tokenInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if this device already has keys
      const existing = await hasEncryptionKeys();
      if (existing) {
        throw new Error(
          "This device already has encryption keys. Remove them first to receive new ones.",
        );
      }

      // Claim the transfer
      const response = await keys.claimTransfer(tokenInput.trim());

      // Parse and import keys
      const { privateKey: privKeyB64, dek: dekB64, keyId } = JSON.parse(
        response.payload,
      );

      const privateKey = await importPrivateKey(privKeyB64);
      const dek = await importDEK(dekB64);

      // Store in SecureStore
      await storePrivateKey(privateKey);
      await storeDEK(dek);
      await storeKeyId(keyId);

      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to claim transfer",
      );
    } finally {
      setIsLoading(false);
    }
  }, [tokenInput, keys]);

  if (isComplete) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Link Device",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.success}
            />
          </View>
          <Text style={styles.successTitle}>Device linked</Text>
          <Text style={styles.successDescription}>
            Your encryption keys have been transferred. You can now access your
            encrypted data on this device.
          </Text>
          <Pressable
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Link Device",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {mode === "choose" && (
          <>
            <Text style={styles.heading}>Transfer encryption keys</Text>
            <Text style={styles.body}>
              Move your encryption keys to another device so you can access your
              data from both.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => setMode("send")}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Send from this device</Text>
                <Text style={styles.optionDescription}>
                  Generate a transfer code to enter on your new device
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
              onPress={() => setMode("receive")}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="download-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Receive on this device</Text>
                <Text style={styles.optionDescription}>
                  Enter a transfer code from your existing device
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          </>
        )}

        {mode === "send" && (
          <>
            <Pressable
              style={styles.backLink}
              onPress={() => {
                setMode("choose");
                setTransferToken(null);
                setError(null);
              }}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>

            <Text style={styles.heading}>Send keys</Text>
            <Text style={styles.body}>
              Generate a one-time transfer code. Enter this code on your new
              device within 60 seconds.
            </Text>

            {transferToken ? (
              <>
                <View style={styles.tokenCard}>
                  <Text style={styles.tokenLabel}>TRANSFER CODE</Text>
                  <Text style={styles.tokenValue} selectable>
                    {transferToken}
                  </Text>
                  <Text style={styles.tokenTimer}>
                    Expires in {secondsLeft}s
                  </Text>
                </View>

                <View style={styles.warningCard}>
                  <Ionicons
                    name="warning-outline"
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={styles.warningText}>
                    This code can only be used once and expires in 60 seconds.
                    Do not share it with anyone.
                  </Text>
                </View>
              </>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleGenerateToken}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Generate Transfer Code
                  </Text>
                )}
              </Pressable>
            )}
          </>
        )}

        {mode === "receive" && (
          <>
            <Pressable
              style={styles.backLink}
              onPress={() => {
                setMode("choose");
                setTokenInput("");
                setError(null);
              }}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>

            <Text style={styles.heading}>Receive keys</Text>
            <Text style={styles.body}>
              Enter the transfer code displayed on your other device.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TRANSFER CODE</Text>
              <TextInput
                style={styles.input}
                value={tokenInput}
                onChangeText={setTokenInput}
                placeholder="Enter transfer code"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                (!tokenInput.trim() || isLoading) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleClaimToken}
              disabled={!tokenInput.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Link This Device
                </Text>
              )}
            </Pressable>
          </>
        )}

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
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backLinkText: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
  },
  tokenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  tokenValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  tokenTimer: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  warningCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.warning}10`,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
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
