/**
 * Recover from Recovery Document
 *
 * Two input modes:
 * - QR scan: camera scan of QR code from the recovery document
 * - Manual entry: 12 text inputs for word entry
 *
 * Recovery flow:
 * 1. Parse 12 words → entropy via @scure/bip39
 * 2. Derive wrapping key from entropy
 * 3. Fetch encrypted DEK blob from server
 * 4. Decrypt DEK with wrapping key
 * 5. Generate new device key pair, register, store everything
 * 6. Call completeRecovery()
 */

import { useApi } from "@/api";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import { base64ToUint8, uint8ToBase64 } from "@/lib/crypto/aes";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { getDeviceLabel } from "@/lib/crypto/deviceLabel";
import {
  exportPublicKey,
  generateKeyPair,
  importDEK,
  storeDEK,
  storeKeyVersion,
  storePrivateKey,
  storePublicKey,
  wrapDEK,
} from "@/lib/crypto/keys";
import {
  RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
  RECOVERY_DOCUMENT_PBKDF2_SALT,
} from "@/lib/crypto/types";
import { logger } from "@/lib/logger";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { CameraView, useCameraPermissions } from "expo-camera";
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
import QuickCrypto from "react-native-quick-crypto";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InputMode = "choose" | "qr" | "manual";

export default function RecoverDocumentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { keys } = useApi();
  const { planId } = usePlan();
  const { userId } = useAuth();
  const { completeRecovery } = useCrypto();
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<InputMode>("choose");
  const [wordInputs, setWordInputs] = useState<string[]>(Array(12).fill(""));
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [scanned, setScanned] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const updateWord = useCallback((index: number, value: string) => {
    setWordInputs((prev) => {
      const next = [...prev];
      next[index] = value.toLowerCase().trim();
      return next;
    });
  }, []);

  const handlePaste = useCallback((text: string) => {
    // Support pasting all 12 words at once
    const pastedWords = text
      .trim()
      .split(/[\s,]+/)
      .map((w) => w.toLowerCase().trim())
      .filter(Boolean);

    if (pastedWords.length === 12) {
      setWordInputs(pastedWords);
    }
  }, []);

  const recoverFromMnemonic = useCallback(
    async (mnemonicString: string) => {
      if (!planId || !userId) return;

      setIsRecovering(true);
      setError(null);

      try {
        // 1. Validate mnemonic
        if (!validateMnemonic(mnemonicString, wordlist)) {
          throw new Error(
            "Invalid recovery words. Please check that all 12 words are correct.",
          );
        }

        // 2. Get entropy from mnemonic
        const entropy = mnemonicToEntropy(mnemonicString, wordlist);

        // 3. Derive wrapping key from entropy
        const salt = new TextEncoder().encode(RECOVERY_DOCUMENT_PBKDF2_SALT);
        const derivedKey = QuickCrypto.pbkdf2Sync(
          entropy,
          salt,
          RECOVERY_DOCUMENT_PBKDF2_ITERATIONS,
          32,
          "sha256",
        );

        const wrappingKey = await QuickCrypto.subtle.importKey(
          "raw",
          derivedKey,
          { name: "AES-GCM" },
          false,
          ["decrypt"],
        );

        // 4. Fetch encrypted DEK blobs from server
        const dekRecords = await keys.listDeks(planId);

        logger.debug("dekRecords", {
          dekRecords,
        });

        // Find the recovery document DEK
        const mnemonicDek = dekRecords.find((d) => d.dekType === "recovery");
        if (!mnemonicDek) {
          throw new Error(
            "We couldn\u2019t find a matching backup for this recovery document. It may be from a different account, or the backup may no longer be available.",
          );
        }

        // 5. Parse and decrypt the DEK blob
        const blob = JSON.parse(mnemonicDek.encryptedDek) as {
          v: number;
          iv: string;
          data: string;
        };
        const iv = base64ToUint8(blob.iv);
        const encryptedData = base64ToUint8(blob.data);

        let decryptedDEKBytes: ArrayBuffer;
        try {
          decryptedDEKBytes = await QuickCrypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            wrappingKey,
            encryptedData,
          );
        } catch {
          throw new Error(
            "These words don\u2019t seem to match. Please double-check that you\u2019ve entered them exactly as they appear on your recovery document.",
          );
        }

        // 6. Import DEK
        const dekB64 = uint8ToBase64(new Uint8Array(decryptedDEKBytes));
        const dek = await importDEK(dekB64);

        // 7. Generate fresh key pair for this device
        const newKeyPair = await generateKeyPair();
        await storePrivateKey(newKeyPair.privateKey, userId);
        await storePublicKey(newKeyPair.publicKey, userId);
        await storeDEK(dek, userId);

        // 8. Register new public key on server
        const publicKeyB64 = await exportPublicKey(newKeyPair.publicKey);
        const keyRecord = await keys.registerKey({
          publicKey: publicKeyB64,
          deviceLabel: getDeviceLabel("recovered"),
          keyType: "device",
        });
        await storeKeyVersion(keyRecord.keyVersion, userId);

        // 9. Store wrapped DEK for new key
        const wrappedDEK = await wrapDEK(dek, newKeyPair.publicKey);
        await keys.storeDek({
          planId,
          recipientId: keyRecord.userId,
          dekType: "device",
          encryptedDek: wrappedDEK,
          keyVersion: keyRecord.keyVersion,
        });

        // 10. Complete recovery
        await completeRecovery();
        setIsComplete(true);
        logger.info("E2EE: Keys recovered from recovery document");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Recovery failed");
      } finally {
        setIsRecovering(false);
      }
    },
    [planId, userId, keys, completeRecovery],
  );

  const handleManualSubmit = useCallback(() => {
    const mnemonicString = wordInputs.join(" ");
    recoverFromMnemonic(mnemonicString);
  }, [wordInputs, recoverFromMnemonic]);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      // QR code encodes the mnemonic string (space-separated words)
      const scannedWords = data.trim().split(/\s+/);
      if (scannedWords.length === 12) {
        setWordInputs(scannedWords.map((w) => w.toLowerCase()));
        setMode("manual"); // Show the words for confirmation
        recoverFromMnemonic(data.trim().toLowerCase());
      } else {
        setError("Invalid QR code. Expected 12 recovery words.");
        setScanned(false);
      }
    },
    [scanned, recoverFromMnemonic],
  );

  const allWordsFilled = wordInputs.every((w) => w.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: "Recovery Document" }} />
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
              Your key has been restored. All of your information is unlocked
              and ready for you.
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.replace("/(app)")}
            >
              <Text style={styles.doneButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : mode === "choose" ? (
          <>
            <Text style={styles.heading}>Use your recovery document</Text>
            <Text style={styles.body}>
              Find the recovery document you saved when you first set up your
              account. You can scan it or type in the words.
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
                setMode("qr");
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
                <Text style={styles.optionTitle}>Scan QR Code</Text>
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
              onPress={() => setMode("manual")}
            >
              <View style={styles.optionIcon}>
                <Ionicons
                  name="text-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Enter Words Manually</Text>
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
          </>
        ) : mode === "qr" ? (
          <>
            <Pressable
              style={styles.backLink}
              onPress={() => {
                setMode("choose");
                setScanned(false);
                setError(null);
              }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>

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
                <Text style={styles.statusText}>Restoring your key...</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Pressable
              style={styles.backLink}
              onPress={() => {
                setMode("choose");
                setError(null);
              }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>

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
                      // Check for paste (multiple words)
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
                <Text style={styles.recoverButtonText}>Restore My Key</Text>
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
  cameraContainer: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
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
