/**
 * Recovery Document — Manual Word Entry
 *
 * 12 text inputs for manually entering recovery words.
 * Supports pasting all 12 words at once.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useDocumentRecovery } from "@/hooks/useDocumentRecovery";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

export default function RecoverDocumentWordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recoverFromMnemonic, isRecovering, error, isComplete } =
    useDocumentRecovery();

  const [wordInputs, setWordInputs] = useState<string[]>(Array(12).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const updateWord = useCallback((index: number, value: string) => {
    setWordInputs((prev) => {
      const next = [...prev];
      next[index] = value.toLowerCase().trim();
      return next;
    });
  }, []);

  const handlePaste = useCallback((text: string) => {
    const pastedWords = text
      .trim()
      .split(/[\s,]+/)
      .map((w) => w.toLowerCase().trim())
      .filter(Boolean);

    if (pastedWords.length === 12) {
      setWordInputs(pastedWords);
    }
  }, []);

  const handleManualSubmit = useCallback(() => {
    const mnemonicString = wordInputs.join(" ");
    recoverFromMnemonic(mnemonicString);
  }, [wordInputs, recoverFromMnemonic]);

  const allWordsFilled = wordInputs.every((w) => w.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: "Enter Recovery Words" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.heading}>Enter recovery words</Text>
            <Text style={styles.body}>
              Enter the 12 words from your recovery document in order. You can
              also paste all 12 words at once.
            </Text>

            <View style={styles.wordsInputGrid}>
              {wordInputs.map((word, index) => (
                <View key={index} style={styles.wordInputRow}>
                  <Text style={styles.wordInputNumber}>{index + 1}.</Text>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.wordInput}
                    value={word}
                    onChangeText={(text) => {
                      if (text.includes(" ") && index === 0) {
                        handlePaste(text);
                      } else {
                        updateWord(index, text);
                      }
                    }}
                    placeholder={`Word ${index + 1}`}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={index < 11 ? "next" : "done"}
                    onSubmitEditing={() => {
                      if (index < 11) {
                        inputRefs.current[index + 1]?.focus();
                      }
                    }}
                    blurOnSubmit={index === 11}
                  />
                </View>
              ))}
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.recoverButton,
                (!allWordsFilled || isRecovering) &&
                  styles.recoverButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!allWordsFilled || isRecovering}
            >
              {isRecovering ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.recoverButtonText}>Restore Access</Text>
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
  wordsInputGrid: {
    gap: spacing.sm,
  },
  wordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  wordInputNumber: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    width: 24,
    textAlign: "right",
  },
  wordInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
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
  recoverButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  recoverButtonDisabled: {
    opacity: 0.5,
  },
  recoverButtonText: {
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
