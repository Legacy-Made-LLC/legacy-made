/**
 * Offline Recovery — Recovery Document Generation
 *
 * Generates a 12-word BIP-39 mnemonic, derives a wrapping key from the entropy,
 * encrypts the DEK, stores the encrypted blob on the server, and generates a
 * branded PDF recovery document with QR code and word grid.
 *
 * Per docs/e2ee-recovery-document-plan.md:
 * - 12 words (not 24) — simpler, sufficient security
 * - No PIN — Clerk auth is the gate
 * - PDF generated entirely client-side via expo-print
 * - QR code encodes the mnemonic string
 *
 * Uses PUT /encryption/recovery-document for atomic create/replace
 * to ensure old recovery documents are properly invalidated.
 */

import { keyBackupStyles as shared } from "@/components/settings/keyBackupStyles";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import {
  useDisableRecoveryDocumentMutation,
  useGenerateRecoveryDocumentMutation,
} from "@/hooks/queries/useKeyBackupMutations";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { logger } from "@/lib/logger";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { Stack } from "expo-router";
import * as Sharing from "expo-sharing";
import QRCode from "qrcode";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Generate the HTML template for the recovery document PDF.
 */
function generatePDFHtml(words: string[], qrSvg: string, date: string): string {
  const wordRows = [];
  for (let i = 0; i < 6; i++) {
    wordRows.push(`
      <tr>
        <td class="word-num">${i + 1}.</td>
        <td class="word">${words[i]}</td>
        <td class="word-num">${i + 7}.</td>
        <td class="word">${words[i + 6]}</td>
      </tr>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 40px 50px; }
        body {
          font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
          color: #1A1A1A;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E8E6E3;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 600;
          color: #8a9785;
          letter-spacing: 1px;
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          margin: 24px 0 8px;
          color: #1A1A1A;
        }
        .date {
          font-size: 13px;
          color: #9B9B9B;
        }
        .content {
          display: flex;
          flex-direction: row;
          gap: 32px;
          margin: 32px 0;
          align-items: flex-start;
        }
        .qr-container {
          flex-shrink: 0;
          padding: 12px;
          border: 1px solid #E8E6E3;
          border-radius: 12px;
          background: #fff;
        }
        .qr-container svg {
          display: block;
        }
        .words-table {
          flex: 1;
          border-collapse: collapse;
        }
        .words-table td {
          padding: 8px 12px;
          font-size: 16px;
        }
        .word-num {
          color: #9B9B9B;
          font-size: 13px;
          text-align: right;
          width: 30px;
          padding-right: 4px;
        }
        .word {
          font-weight: 600;
          font-size: 17px;
          letter-spacing: 0.5px;
        }
        .instructions {
          margin-top: 40px;
          padding: 20px;
          background: #F5F4F2;
          border-radius: 12px;
          font-size: 14px;
          color: #6B6B6B;
          line-height: 1.7;
        }
        .instructions strong {
          color: #1A1A1A;
          display: block;
          margin-bottom: 8px;
          font-size: 15px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #E8E6E3;
          font-size: 12px;
          color: #9B9B9B;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-text">Legacy Made</div>
      </div>

      <div class="title">Recovery Document</div>
      <div class="date">Generated: ${date}</div>

      <div class="content">
        <div class="qr-container">
          ${qrSvg}
        </div>
        <table class="words-table">
          ${wordRows.join("")}
        </table>
      </div>

      <div class="instructions">
        <strong>To recover your plan:</strong>
        Open the Legacy Made app on a new device, sign in to your account, and
        choose "Recovery Document" from the recovery options. Scan the QR code above
        or enter your 12 words manually.
        <br><br>
        You will also need access to your Legacy Made account (email sign-in).
        <br><br>
        Store this document somewhere safe — with your important papers, in a safe,
        or with a trusted person.
      </div>

      <div class="footer">
        This document was generated on your device. Legacy Made does not have a copy.
      </div>
    </body>
    </html>
  `;
}

export default function KeyBackupPhraseScreen() {
  const insets = useSafeAreaInsets();
  const { myPlanId: planId } = usePlan();
  const { userId } = useAuth();
  const { backupStatus } = useCrypto();

  const generateMutation = useGenerateRecoveryDocumentMutation();
  const disableMutation = useDisableRecoveryDocumentMutation();

  const isAlreadyConfigured = backupStatus.recoveryPhrase.configured;

  const [words, setWords] = useState<string[] | null>(null);
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [step, setStep] = useState<"intro" | "words">("intro");

  const error =
    generateMutation.error?.message ??
    disableMutation.error?.message ??
    pdfError;

  const handleDismissModal = useCallback(() => {
    if (isSavingPDF) return;

    Alert.alert(
      "Leave without saving?",
      "Your recovery words have been generated but you haven\u2019t saved your recovery document yet. If you leave now, you\u2019ll need to generate a new one.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            setStep("intro");
            setWords(null);
            setPdfError(null);
          },
        },
      ],
    );
  }, [isSavingPDF]);

  const handleGenerate = useCallback(async () => {
    if (!planId || !userId) return;

    generateMutation.reset();
    try {
      const result = await generateMutation.mutateAsync({ planId, userId });
      setWords(result.words);
      setStep("words");
    } catch {
      // Error is captured by the mutation's onError + derived `error` state
    }
  }, [planId, userId, generateMutation]);

  const handleGenerateWithConfirmation = useCallback(() => {
    if (isAlreadyConfigured) {
      Alert.alert(
        "Replace your recovery document?",
        "Your current document will no longer work to recover your data. You\u2019ll create a new one to take its place.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace",
            style: "destructive",
            onPress: handleGenerate,
          },
        ],
      );
    } else {
      handleGenerate();
    }
  }, [isAlreadyConfigured, handleGenerate]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      "Permanently disable your recovery document?",
      "Your current document will permanently stop working and can never be used to recover your account. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable Permanently",
          style: "destructive",
          onPress: async () => {
            if (!planId) return;

            disableMutation.reset();
            try {
              await disableMutation.mutateAsync({ planId });
              setIsRemoved(true);
            } catch {
              // Error is captured by the mutation's onError + derived `error` state
            }
          },
        },
      ],
    );
  }, [planId, disableMutation]);

  const handleGeneratePDF = useCallback(async () => {
    if (!words) return;

    setIsSavingPDF(true);
    setPdfError(null);

    try {
      // Generate QR code SVG
      const mnemonicString = words.join(" ");
      const qrSvg = await new Promise<string>((resolve, reject) => {
        QRCode.toString(
          mnemonicString,
          { type: "svg", width: 160, errorCorrectionLevel: "H" },
          (err: Error | null | undefined, svg: string) => {
            if (err) reject(err);
            else resolve(svg);
          },
        );
      });

      // Generate PDF
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const html = generatePDFHtml(words, qrSvg, date);

      const { uri } = await Print.printToFileAsync({ html });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save your Recovery Document",
      });

      // Close modal and show configured state
      setStep("intro");
      setWords(null);
      setPdfError(null);
      setIsComplete(true);
    } catch (err) {
      logger.error("E2EE: Failed to generate recovery PDF", err);
      setPdfError(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setIsSavingPDF(false);
    }
  }, [words]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isOn = isAlreadyConfigured || isComplete;

  const bannerIcon = isOn
    ? ("checkmark-circle" as const)
    : ("close-circle" as const);
  const bannerIconColor = isOn ? colors.success : colors.textTertiary;
  const bannerTitle = isOn
    ? "Recovery document is set up"
    : isRemoved
      ? "Recovery document is disabled"
      : "Recovery document is not set up";
  const bannerDate = isOn
    ? backupStatus.recoveryPhrase.createdAt
      ? `Created ${formatDate(backupStatus.recoveryPhrase.createdAt)}`
      : null
    : backupStatus.recoveryPhrase.removedAt
      ? `Disabled ${formatDate(backupStatus.recoveryPhrase.removedAt)}`
      : null;

  const prompt = isComplete
    ? "Keep your recovery document in a safe, private place \u2014 with your important papers, in a safe, or with a trusted person."
    : isOn
      ? "Lost your recovery document, or worried it\u2019s in the wrong hands?"
      : isRemoved
        ? "If you lose this document, Legacy Made cannot restore your account."
        : "Your recovery document allows you to restore access to your account if you lose your device.";

  const modalError = generateMutation.error?.message ?? pdfError;

  return (
    <>
      <Stack.Screen options={{ title: "Create Recovery Document" }} />
      <ScrollView
        style={shared.container}
        contentContainerStyle={[
          shared.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={shared.statusBanner}>
          <Ionicons name={bannerIcon} size={22} color={bannerIconColor} />
          <View style={shared.statusBannerContent}>
            <Text style={shared.statusBannerTitle}>{bannerTitle}</Text>
            {bannerDate && (
              <Text style={shared.statusBannerDate}>{bannerDate}</Text>
            )}
          </View>
        </View>

        <Text style={shared.guidedPrompt}>{prompt}</Text>

        {error && (
          <View style={shared.errorCard}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={shared.errorText}>{error}</Text>
          </View>
        )}

        {isOn ? (
          <>
            <Pressable
              style={({ pressed }) => [
                shared.optionCard,
                pressed && shared.optionCardPressed,
              ]}
              onPress={handleGenerateWithConfirmation}
              disabled={generateMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Create a new recovery document"
            >
              <View style={shared.optionIcon}>
                {generateMutation.isPending ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color={colors.primary}
                  />
                )}
              </View>
              <View style={shared.optionContent}>
                <Text style={shared.optionTitle}>Create a new one</Text>
                <Text style={shared.optionDescription}>
                  Your current document will stop working and you&apos;ll get a
                  new one to save in its place.
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
                style={shared.chevron}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                shared.optionCard,
                pressed && shared.optionCardPressed,
              ]}
              onPress={handleRemove}
              disabled={disableMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Disable recovery document permanently"
            >
              <View style={shared.optionIcon}>
                {disableMutation.isPending ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color={colors.error}
                  />
                )}
              </View>
              <View style={shared.optionContent}>
                <Text style={shared.optionTitle}>Disable it permanently</Text>
                <Text style={shared.optionDescription}>
                  Your current document will permanently stop working. No new
                  document will be created.
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
                style={shared.chevron}
              />
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              shared.optionCard,
              pressed && shared.optionCardPressed,
            ]}
            onPress={
              isRemoved
                ? () => {
                    setIsRemoved(false);
                    handleGenerate();
                  }
                : handleGenerate
            }
            disabled={generateMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Create recovery document"
          >
            <View style={shared.optionIcon}>
              {generateMutation.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              )}
            </View>
            <View style={shared.optionContent}>
              <Text style={shared.optionTitle}>Create Recovery Document</Text>
              <Text style={shared.optionDescription}>
                This document includes a QR code and recovery words you can
                print or store somewhere safe.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
              style={shared.chevron}
            />
          </Pressable>
        )}
      </ScrollView>

      {/* Recovery words modal */}
      <Modal
        visible={step === "words" && words !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleDismissModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={handleDismissModal}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close recovery document modal"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.modalTitle}>Recovery Document</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
          >
            {/* Hero: save action */}
            <View style={styles.heroSection}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="document-text"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.modalHeading}>
                Save your recovery document
              </Text>
              <Text style={styles.heroBody}>
                This is the only way to recover your encrypted data if you lose
                access to your devices. Save or print this document and keep it
                somewhere safe.
              </Text>
            </View>

            {modalError && (
              <View style={shared.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={shared.errorText}>{modalError}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.generateButton,
                isSavingPDF && styles.generateButtonDisabled,
              ]}
              onPress={handleGeneratePDF}
              disabled={isSavingPDF}
              accessibilityRole="button"
              accessibilityLabel="Save recovery document as PDF"
            >
              {isSavingPDF ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Save Recovery Document
                </Text>
              )}
            </Pressable>

            {/* Secondary: recovery words reference */}
            <View style={styles.wordsSectionDivider} />

            <Text style={styles.wordsSectionLabel}>YOUR RECOVERY WORDS</Text>
            <Text style={styles.wordsSectionDescription}>
              These 12 words are encoded in your recovery document. They&apos;re
              shown here for your reference.
            </Text>

            <View style={styles.wordsGrid}>
              {words?.map((word, index) => (
                <View key={index} style={styles.wordItem}>
                  <Text style={styles.wordNumber}>{index + 1}.</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: "30%",
    paddingVertical: spacing.xs,
  },
  wordNumber: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    width: 24,
    textAlign: "right",
  },
  wordText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    gap: spacing.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  modalHeading: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
  },
  heroBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    textAlign: "center",
  },
  wordsSectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  wordsSectionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  wordsSectionDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
});
