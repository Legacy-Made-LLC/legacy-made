/**
 * Key Backup - Downloadable Key File
 *
 * User enters a 6-digit PIN, which is used to derive a wrapping key via PBKDF2.
 * The private key is encrypted with this wrapping key and saved as a JSON file.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { getPrivateKey, exportPrivateKey } from "@/lib/crypto/keys";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { Stack, useRouter } from "expo-router";
import QuickCrypto from "react-native-quick-crypto";
import React, { useCallback, useState } from "react";
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

import { base64ToUint8, uint8ToBase64 } from "@/lib/crypto/aes";

export default function KeyBackupFileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const isValid = pin.length === 6 && pin === confirmPin;

  const handleGenerate = useCallback(async () => {
    if (!isValid) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Get private key from SecureStore
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error("No encryption key found");
      }

      const privateKeyB64 = await exportPrivateKey(privateKey);
      const privateKeyBytes = base64ToUint8(privateKeyB64);

      // 2. Derive wrapping key from PIN via PBKDF2
      const salt = QuickCrypto.getRandomValues(new Uint8Array(16));
      const derivedKey = QuickCrypto.pbkdf2Sync(
        pin,
        salt,
        100000,
        32,
        "sha256",
      );

      // 3. Import derived key for AES-GCM
      const wrappingKey = await QuickCrypto.subtle.importKey(
        "raw",
        derivedKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );

      // 4. Encrypt private key with wrapping key
      const iv = QuickCrypto.getRandomValues(new Uint8Array(12));
      const encrypted = await QuickCrypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        privateKeyBytes,
      );

      // 5. Build key file JSON
      const keyFile = {
        version: 1,
        algorithm: "aes-256-gcm",
        kdf: "pbkdf2",
        kdfParams: {
          iterations: 100000,
          hash: "sha256",
          salt: uint8ToBase64(salt),
        },
        iv: uint8ToBase64(iv),
        encryptedKey: uint8ToBase64(new Uint8Array(encrypted)),
        createdAt: new Date().toISOString(),
      };

      // 6. Write to temp file and share
      const fileName = `legacy-made-key-backup-${Date.now()}.json`;
      const file = new File(Paths.cache, fileName);
      await file.write(JSON.stringify(keyFile, null, 2));

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Save your encryption key backup",
      });

      // Clean up temp file
      await file.delete();

      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate key file",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [pin, isValid]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Key File Backup",
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
        {isComplete ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={colors.success}
              />
            </View>
            <Text style={styles.successTitle}>Key file saved</Text>
            <Text style={styles.successDescription}>
              Keep this file in a safe place. You&apos;ll need it and your PIN
              to recover your data on a new device.
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>Create a key file</Text>
            <Text style={styles.body}>
              Choose a 6-digit PIN to protect your key file. You&apos;ll need
              this PIN to restore your key on a new device.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 6-digit PIN"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PIN</Text>
              <TextInput
                style={styles.input}
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Confirm your PIN"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              {confirmPin.length > 0 && pin !== confirmPin && (
                <Text style={styles.mismatch}>PINs don&apos;t match</Text>
              )}
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.generateButton,
                (!isValid || isGenerating) && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={!isValid || isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate & Save Key File
                </Text>
              )}
            </Pressable>
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
    letterSpacing: 8,
    textAlign: "center",
  },
  mismatch: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.caption,
    color: colors.error,
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
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
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
