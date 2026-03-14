/**
 * Device Linking - Zero-Plaintext Key Transfer
 *
 * Links a new device without transferring plaintext keys.
 * New device generates its own key pair and registers it.
 * Source device wraps DEK with new device's public key and stores it.
 *
 * Flow:
 * Device B (new): generate keys → register → create session → deposit identity → show code → wait → fetch DEK
 * Device A (source): enter code → claim → fetch B's public key → wrap DEK → store
 */

import { useApi } from "@/api";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { getDeviceLabel } from "@/lib/crypto/deviceLabel";
import {
  exportPublicKey,
  generateKeyPair,
  getKeyVersion,
  getPrivateKey,
  hasEncryptionKeys,
  importPublicKey,
  storeDEK,
  storeKeyVersion,
  storePrivateKey,
  unwrapDEK,
  wrapDEK,
} from "@/lib/crypto/keys";
import { logger } from "@/lib/logger";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "qrcode";
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
import { SvgXml } from "react-native-svg";

type Mode = "send" | "receive";

export default function DeviceLinkingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { keys } = useApi();
  const { myPlanId: planId } = usePlan();
  const { userId } = useAuth();
  const { dekCryptoKey, completeRecovery, needsRecovery } = useCrypto();

  // If navigated with ?mode=receive (from recovery prompt), show receive UI.
  // Otherwise go straight to send — this screen is only reachable from the menu
  // when the device already has encryption keys, so "receive" doesn't apply.
  const mode: Mode = params.mode === "receive" ? "receive" : "send";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const codeInputRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Countdown timer for session code
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
        setSessionCode(null);
        setQrSvg(null);
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Session expired. Please generate a new one.");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAt]);

  /**
   * RECEIVE MODE (Device B — new device):
   * 1. Generate a new key pair
   * 2. Register the public key on the server
   * 3. Create a device link session
   * 4. Deposit our identity (userId + keyVersion) into the session
   * 5. Show the session code
   * 6. Poll for DEK availability
   */
  const handleStartReceive = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("Generating encryption keys...");

    try {
      if (!planId || !userId) {
        throw new Error("No plan or user available");
      }

      // Check if this device already has keys
      const existing = await hasEncryptionKeys(userId);
      if (existing) {
        throw new Error(
          "This device already has encryption keys. Remove them first to link a new device.",
        );
      }

      // 1. Generate new key pair for this device
      const keyPair = await generateKeyPair();
      await storePrivateKey(keyPair.privateKey, userId);

      const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

      // 2. Register the public key on the server
      setStatusMessage("Registering device...");
      const keyRecord = await keys.registerKey({
        publicKey: publicKeyB64,
        deviceLabel: getDeviceLabel("linked"),
        keyType: "device",
      });
      await storeKeyVersion(keyRecord.keyVersion, userId);

      // 3. Create a device link session
      setStatusMessage("Creating link session...");
      const session = await keys.createDeviceLinkSession();

      // 4. Deposit our identity into the session
      const depositPayload = JSON.stringify({
        userId: keyRecord.userId,
        keyVersion: keyRecord.keyVersion,
      });
      // "encryptedPayload" is a legacy field name from the backend API — it
      // accepts arbitrary data. What we pass here is intentionally plaintext
      // (userId + keyVersion are not secrets).
      await keys.depositDeviceLink({
        sessionCode: session.sessionCode,
        encryptedPayload: depositPayload,
      });

      setSessionCode(session.sessionCode);
      setExpiresAt(session.expiresAt);
      setStatusMessage("Waiting for source device...");

      // Generate QR code SVG for the session code
      const svg = await new Promise<string>((resolve, reject) => {
        QRCode.toString(
          session.sessionCode,
          { type: "svg", width: 200, errorCorrectionLevel: "H" },
          (err: Error | null | undefined, svgStr: string) => {
            if (err) reject(err);
            else resolve(svgStr);
          },
        );
      });
      setQrSvg(svg);

      // 5. Poll for DEK availability
      pollRef.current = setInterval(async () => {
        try {
          const dekRecords = await keys.getMyDeks(planId, keyRecord.userId);
          const myDek = dekRecords.find(
            (d) => d.keyVersion === keyRecord.keyVersion,
          );
          if (myDek) {
            // DEK available — unwrap and store
            if (pollRef.current) clearInterval(pollRef.current);

            const privateKey = keyPair.privateKey;
            const dek = await unwrapDEK(myDek.encryptedDek, privateKey);
            await storeDEK(dek, userId);

            // If this is a recovery flow, complete recovery
            if (needsRecovery) {
              await completeRecovery();
            }

            setIsComplete(true);
            setStatusMessage(null);
            logger.info("E2EE: Device linked successfully via DEK transfer");
          }
        } catch {
          // Keep polling — DEK not yet available
        }
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start receiving",
      );
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [keys, planId, userId, needsRecovery, completeRecovery]);

  // Auto-start receive when navigated from recovery context
  const autoStarted = useRef(false);
  useEffect(() => {
    if (
      params.mode === "receive" &&
      !sessionCode &&
      !isComplete &&
      !isLoading &&
      !autoStarted.current
    ) {
      autoStarted.current = true;
      handleStartReceive();
    }
  }, [params.mode, sessionCode, isComplete, isLoading, handleStartReceive]);

  /**
   * SEND MODE (Device A — source):
   * 1. Claim the session to get Device B's identity
   * 2. Fetch Device B's public key
   * 3. Wrap our DEK with Device B's public key
   * 4. Store the wrapped DEK on the server
   */
  const handleSendToDevice = useCallback(
    async (scannedCode?: string) => {
      const code = scannedCode ?? codeInputRef.current;
      if (!code.trim()) return;

      setIsLoading(true);
      setError(null);
      setStatusMessage("Claiming session...");

      try {
        if (!dekCryptoKey) {
          throw new Error("Encryption keys not ready");
        }
        if (!planId || !userId) {
          throw new Error("No plan or user available");
        }

        // 1. Claim the session
        const claimResponse = await keys.claimDeviceLink(code.trim());
        const { userId: newDeviceUserId, keyVersion: newDeviceKeyVersion } =
          JSON.parse(claimResponse.payload) as {
            userId: string;
            keyVersion: number;
          };

        // 2. Fetch the new device's public key
        setStatusMessage("Fetching device key...");
        const publicKeys = await keys.getPublicKeys(newDeviceUserId);
        const targetKey = publicKeys.find(
          (k) => k.keyVersion === newDeviceKeyVersion,
        );

        if (!targetKey) {
          throw new Error("Could not find the new device's public key");
        }

        // 3. Wrap our own plan DEK with the new device's public key
        setStatusMessage("Encrypting keys for new device...");
        const recipientPubKey = await importPublicKey(targetKey.publicKey);
        const wrappedDEK = await wrapDEK(dekCryptoKey, recipientPubKey);

        // 4. Store the wrapped DEK for own plan
        const myKeyVersion = await getKeyVersion(userId);
        await keys.storeDek({
          planId,
          recipientId: newDeviceUserId,
          dekType: "device",
          encryptedDek: wrappedDEK,
          keyVersion: newDeviceKeyVersion,
        });

        // 5. Transfer shared plan DEKs (plans shared with us by others)
        try {
          const sharedPlans = await keys.listDeks(); // All DEK records we have
          const myPrivateKey = await getPrivateKey(userId);
          if (myPrivateKey && myKeyVersion) {
            // For shared plans where WE are the recipient, unwrap with our key
            // and re-wrap for the new device
            const seenPlans = new Set<string>();
            for (const dek of sharedPlans) {
              if (
                dek.dekType === "contact" &&
                dek.keyVersion === myKeyVersion &&
                !seenPlans.has(dek.planId)
              ) {
                seenPlans.add(dek.planId);
                try {
                  const sharedDEK = await unwrapDEK(
                    dek.encryptedDek,
                    myPrivateKey,
                  );
                  const reWrapped = await wrapDEK(sharedDEK, recipientPubKey);
                  await keys.storeDek({
                    planId: dek.planId,
                    recipientId: newDeviceUserId,
                    dekType: "contact",
                    encryptedDek: reWrapped,
                    keyVersion: newDeviceKeyVersion,
                  });
                  logger.info(
                    "E2EE: Shared plan DEK transferred to new device",
                    { planId: dek.planId },
                  );
                } catch (dekErr) {
                  // Non-fatal: new device won't have this shared plan's DEK
                  logger.warn("E2EE: Failed to transfer shared plan DEK", {
                    planId: dek.planId,
                    error: dekErr,
                  });
                }
              }
            }
          }
        } catch (sharedErr) {
          // Non-fatal: own plan DEK was already transferred
          logger.warn("E2EE: Failed to transfer shared plan DEKs", {
            error: sharedErr,
          });
        }

        setIsComplete(true);
        setStatusMessage(null);
        logger.info("E2EE: DEK sent to new device", {
          newDeviceUserId,
          newDeviceKeyVersion,
          senderKeyVersion: myKeyVersion,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link device");
        setStatusMessage(null);
      } finally {
        setIsLoading(false);
      }
    },
    [keys, dekCryptoKey, planId, userId],
  );

  if (isComplete) {
    return (
      <>
        <Stack.Screen
          options={{
            title: mode === "receive" ? "Link This Device" : "Add a New Device",
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
          <Text style={styles.successTitle}>This Device Is Ready</Text>
          <Text style={styles.successDescription}>
            {mode === "receive"
              ? "Your device now has access to your encrypted information."
              : "The new device now has access to your encrypted information."}
          </Text>
          <Pressable
            style={styles.doneButton}
            onPress={() =>
              params.mode === "receive"
                ? router.replace("/(app)")
                : router.back()
            }
            accessibilityRole="button"
            accessibilityLabel="Done"
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
          title: mode === "receive" ? "Link This Device" : "Add a New Device",
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
        {mode === "send" && (
          <>
            <Text style={styles.heading}>Scan Your New Device</Text>
            <Text style={styles.body}>
              Scan the code shown on your new device to give it access to your
              encrypted information.
            </Text>

            {showManualInput ? (
              <>
                <Pressable
                  style={styles.backLink}
                  onPress={() => setShowManualInput(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to scanner"
                  hitSlop={8}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.backLinkText}>Back to scanner</Text>
                </Pressable>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SESSION CODE</Text>
                  <TextInput
                    style={styles.input}
                    value={codeInput}
                    onChangeText={(text) => {
                      setCodeInput(text);
                      codeInputRef.current = text;
                    }}
                    placeholder="Enter code from new device"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>

                <Pressable
                  style={[
                    styles.primaryButton,
                    (!codeInput.trim() || isLoading) &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={() => handleSendToDevice()}
                  disabled={!codeInput.trim() || isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Authorize device"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Authorize Device
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.cameraContainer}>
                  {permission?.granted ? (
                    <CameraView
                      style={styles.camera}
                      barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                      }}
                      onBarcodeScanned={
                        scanned
                          ? undefined
                          : (result) => {
                              setScanned(true);
                              setCodeInput(result.data);
                              codeInputRef.current = result.data;
                              handleSendToDevice(result.data);
                            }
                      }
                    />
                  ) : (
                    <View style={styles.cameraPermission}>
                      <Ionicons
                        name="camera-outline"
                        size={40}
                        color={colors.textTertiary}
                      />
                      <Text style={styles.cameraPermissionText}>
                        Camera access is needed to scan the QR code
                      </Text>
                      <Pressable
                        style={styles.secondaryButton}
                        accessibilityRole="button"
                        accessibilityLabel="Allow camera access"
                        onPress={async () => {
                          const result = await requestPermission();
                          if (!result.granted) {
                            setError(
                              "Camera permission is required to scan the QR code.",
                            );
                          }
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>
                          Allow Camera
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.manualEntryLink}
                  onPress={() => setShowManualInput(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Type code manually"
                  hitSlop={8}
                >
                  <Text style={styles.manualEntryText}>Type code manually</Text>
                </Pressable>
              </>
            )}

            {statusMessage && (
              <View style={styles.statusCard}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}
          </>
        )}

        {mode === "receive" && (
          <>
            <Text style={styles.heading}>Show Code to Other Device</Text>
            <Text style={styles.body}>
              Scan this code with a device that already has access to your
              account. This securely allows the new device to access your
              information.
            </Text>

            {sessionCode ? (
              <>
                <View style={styles.tokenCard}>
                  {qrSvg && (
                    <View style={styles.qrContainer}>
                      <SvgXml xml={qrSvg} />
                    </View>
                  )}
                  <Text style={styles.tokenLabel}>SESSION CODE</Text>
                  <Text style={styles.tokenFallback} selectable>
                    {sessionCode}
                  </Text>
                  <Text style={styles.tokenTimer}>
                    {secondsLeft <= 0
                      ? "Expired"
                      : `Expires in ${secondsLeft}s`}
                  </Text>
                </View>

                {statusMessage && (
                  <View style={styles.statusCard}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.statusText}>{statusMessage}</Text>
                  </View>
                )}

                <View style={styles.warningCard}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.warningText}>
                    Your private access stays on your devices.
                  </Text>
                </View>
              </>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleStartReceive}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Generate session code"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Generate Session Code
                  </Text>
                )}
              </Pressable>
            )}
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
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.medium,
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
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  qrContainer: {
    paddingVertical: spacing.sm,
  },
  tokenFallback: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  tokenTimer: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
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
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  warningCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
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
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
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
  cameraPermission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  cameraPermissionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 25,
    height: 44,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
  },
  manualEntryLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  manualEntryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
    textDecorationLine: "underline",
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
    fontFamily: typography.fontFamily.semibold,
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
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  successDescription: {
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
});
