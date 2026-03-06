/**
 * Key Backup - Recovery Phrase
 *
 * Exports the private key as a 24-word BIP-39 mnemonic for offline backup.
 * User must confirm they've written the words down.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { entropyToMnemonic } from "@/lib/crypto/bip39";
import { exportPrivateKey, getPrivateKey } from "@/lib/crypto/keys";
import { base64ToUint8 } from "@/lib/crypto/aes";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QuickCrypto from "react-native-quick-crypto";

export default function KeyBackupPhraseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [words, setWords] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Generate the mnemonic on mount
  useEffect(() => {
    async function generatePhrase() {
      try {
        const privateKey = await getPrivateKey();
        if (!privateKey) {
          throw new Error("No encryption key found");
        }

        // Export private key and hash to 32 bytes for BIP-39
        const privateKeyB64 = await exportPrivateKey(privateKey);
        const privateKeyBytes = base64ToUint8(privateKeyB64);

        // SHA-256 the private key to get exactly 32 bytes of entropy
        const entropy = await QuickCrypto.subtle.digest(
          "SHA-256",
          privateKeyBytes,
        );

        const mnemonic = await entropyToMnemonic(new Uint8Array(entropy));
        setWords(mnemonic);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate recovery phrase",
        );
      } finally {
        setIsLoading(false);
      }
    }

    generatePhrase();
  }, []);

  const handleConfirm = useCallback(() => {
    setIsComplete(true);
  }, []);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Recovery Phrase",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Recovery Phrase",
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
            <Text style={styles.successTitle}>Phrase saved</Text>
            <Text style={styles.successDescription}>
              Keep your recovery phrase in a safe, private place. You&apos;ll
              need all 24 words in the correct order to restore your key.
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
            <Text style={styles.heading}>Your recovery phrase</Text>
            <Text style={styles.body}>
              Write down these 24 words in order. Store them somewhere safe and
              private — anyone with these words can access your data.
            </Text>

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {words?.map((word, index) => (
                    <View key={index} style={styles.wordItem}>
                      <Text style={styles.wordNumber}>{index + 1}.</Text>
                      <Text style={styles.wordText}>{word}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.warningCard}>
                  <Ionicons
                    name="warning-outline"
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={styles.warningText}>
                    Never share your recovery phrase. Legacy Made will never ask
                    you for it.
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.confirmCheckbox,
                    isConfirmed && styles.confirmCheckboxActive,
                  ]}
                  onPress={() => setIsConfirmed(!isConfirmed)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isConfirmed }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isConfirmed && styles.checkboxChecked,
                    ]}
                  >
                    {isConfirmed && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                  <Text style={styles.confirmText}>
                    I&apos;ve written down my recovery phrase and stored it
                    safely
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.continueButton,
                    !isConfirmed && styles.continueButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!isConfirmed}
                >
                  <Text style={styles.continueButtonText}>
                    I&apos;ve saved my phrase
                  </Text>
                </Pressable>
              </>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
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
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: "45%",
    paddingVertical: spacing.xs,
  },
  wordNumber: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    width: 24,
    textAlign: "right",
  },
  wordText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
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
  confirmCheckbox: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 12,
  },
  confirmCheckboxActive: {
    backgroundColor: `${colors.primary}08`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confirmText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
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
