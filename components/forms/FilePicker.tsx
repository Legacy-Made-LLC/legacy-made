import { FileAttachment } from "@/api/types";
import { StorageIndicator } from "@/components/entitlements/StorageIndicator";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { PickerMode, useFilePicker } from "@/hooks/useFilePicker";
import { toast } from "@/hooks/useToast";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { decryptDownloadedFile } from "@/lib/crypto/fileEncryption";
import { logger } from "@/lib/logger";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FilePreviewGrid } from "./FilePreview";
import { FilePreviewModal } from "./FilePreviewModal";

interface FilePickerProps {
  /** Label displayed above the picker */
  label?: string;
  /** Currently selected files */
  value: FileAttachment[];
  /** Callback when files change */
  onChange: (files: FileAttachment[]) => void;
  /** What types of files can be selected */
  mode?: PickerMode;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Whether to allow camera capture */
  allowCamera?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Placeholder text when no files selected */
  placeholder?: string;
  /** Help text displayed below the picker */
  helpText?: string;
  /** Whether to show storage indicator */
  showStorageIndicator?: boolean;
  /** Callback when user tries to add files but is blocked due to quota */
  onUpgradeRequired?: () => void;
  /** Set of file IDs currently being deleted */
  deletingIds?: Set<string>;
  /** Accent color for selection indicators (defaults to primary) */
  accentColor?: string;
}

interface PickerOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => Promise<FileAttachment | null>;
}

/**
 * File picker component for forms
 * Supports images, videos, and documents with preview
 */
export function FilePicker({
  label,
  value,
  onChange,
  mode = "all",
  maxFiles = 10,
  allowCamera = true,
  disabled = false,
  placeholder = "Tap to add files",
  helpText,
  showStorageIndicator = false,
  onUpgradeRequired,
  deletingIds,
  accentColor = colors.primary,
}: FilePickerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sharingIds, setSharingIds] = useState<Set<string>>(new Set());
  const { isLoading, pickFromLibrary, pickFromCamera, pickDocument } =
    useFilePicker({ mode });
  const crypto = useOptionalCrypto();

  // Check entitlements for upload permissions
  const { canUpload, isStorageFull } = useEntitlements();
  const canUploadFiles = canUpload();
  const storageFull = isStorageFull();

  /**
   * Handle file selection from any source
   */
  const handleFilePicked = useCallback(
    async (pickerFn: () => Promise<FileAttachment | null>) => {
      setShowOptions(false);
      // Wait for the options modal dismiss animation to complete before
      // presenting the native picker. On iOS, presenting a system picker
      // while a React Native Modal is still animating out can cause the
      // picker to never appear, leaving isLoading stuck forever.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const file = await pickerFn();
      if (file) {
        onChange([...value, file]);
      }
    },
    [value, onChange],
  );

  /**
   * Share a single file
   * @param identifier - file.id for remote files, file.uri for local files
   */
  const handleShareFile = useCallback(
    async (identifier: string) => {
      const file = value.find((f) => (f.id || f.uri) === identifier);
      if (!file || !file.uri) return;

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        toast.info({
          title: "Sharing not available",
          message: "Sharing is not available on this device.",
        });
        return;
      }

      setSharingIds((prev) => new Set(prev).add(identifier));

      try {
        let fileUri = file.uri;

        // If it's a remote URL, download and (if encrypted) decrypt first
        if (!file.uri.startsWith("file://")) {
          const response = await fetch(file.uri);
          if (!response.ok) {
            throw new Error(`Failed to download ${file.fileName}`);
          }

          let fileData = await response.arrayBuffer();

          // Decrypt if the file is encrypted
          if (file.isEncrypted && crypto?.dekCryptoKey) {
            try {
              fileData = await decryptDownloadedFile(
                fileData,
                crypto.dekCryptoKey,
              );
            } catch {
              logger.warn(
                "E2EE: Share decryption failed, using raw data (may be pre-migration file)",
              );
            }
          }

          // Write to cache for sharing (ensure filename has extension for share sheet)
          const ext = file.mimeType.split("/").pop() || "bin";
          const baseName = file.fileName || `file.${ext}`;
          const uniqueFileName = `share_${Date.now()}_${baseName}`;
          const cacheFile = new File(Paths.cache, uniqueFileName);
          await cacheFile.write(new Uint8Array(fileData));
          fileUri = cacheFile.uri;
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: file.mimeType,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast.error({ title: "Share failed", message: `Could not share file: ${message}` });
      } finally {
        setSharingIds((prev) => {
          const next = new Set(prev);
          next.delete(identifier);
          return next;
        });
      }
    },
    [value, crypto],
  );

  /**
   * Delete a single file with confirmation
   * @param identifier - file.id for remote files, file.uri for local files
   */
  const handleDeleteFile = useCallback(
    (identifier: string) => {
      const file = value.find((f) => (f.id || f.uri) === identifier);
      if (!file) return;

      Alert.alert(
        "Delete File?",
        `Are you sure you want to delete "${file.fileName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              onChange(value.filter((f) => (f.id || f.uri) !== identifier));
            },
          },
        ],
      );
    },
    [value, onChange],
  );

  /**
   * Toggle selection mode
   */
  const toggleSelectMode = useCallback(() => {
    if (selectMode) {
      // Exiting select mode - clear selection
      setSelectedIds(new Set());
    }
    setSelectMode(!selectMode);
  }, [selectMode]);

  /**
   * Get the selected files
   */
  const getSelectedFiles = useCallback(() => {
    return value.filter((f) => selectedIds.has(f.id || f.uri));
  }, [value, selectedIds]);

  /**
   * Delete selected files
   */
  const handleDeleteSelected = useCallback(() => {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) return;

    const fileNames = selectedFiles.map((f) => f.fileName).join(", ");
    const count = selectedFiles.length;

    Alert.alert(
      `Delete ${count} ${count === 1 ? "File" : "Files"}?`,
      `Are you sure you want to delete ${count === 1 ? fileNames : `these ${count} files`}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Remove selected files from the list
            const selectedIdSet = selectedIds;
            onChange(value.filter((f) => !selectedIdSet.has(f.id || f.uri)));
            // Exit select mode
            setSelectMode(false);
            setSelectedIds(new Set());
          },
        },
      ],
    );
  }, [getSelectedFiles, selectedIds, onChange, value]);

  /**
   * Get available picker options based on mode
   */
  const getPickerOptions = useCallback((): PickerOption[] => {
    const options: PickerOption[] = [];

    // Photo library option (for images, videos, or media modes)
    if (mode !== "document") {
      options.push({
        id: "library",
        label:
          mode === "video"
            ? "Choose Video"
            : mode === "image"
              ? "Choose Photo"
              : "Choose from Library",
        icon: "images-outline",
        action: pickFromLibrary,
      });
    }

    // Camera option (for images or media modes, when allowed)
    if (allowCamera && mode !== "document" && mode !== "video") {
      options.push({
        id: "camera",
        label: "Take Photo",
        icon: "camera-outline",
        action: pickFromCamera,
      });
    }

    // Document option (for document or all modes)
    if (mode === "document" || mode === "all") {
      options.push({
        id: "document",
        label: "Choose Document",
        icon: "document-outline",
        action: pickDocument,
      });
    }

    return options;
  }, [mode, allowCamera, pickFromLibrary, pickFromCamera, pickDocument]);

  const pickerOptions = getPickerOptions();

  /**
   * Handle add button press - show options if multiple, otherwise pick directly
   */
  const handleAddPress = useCallback(() => {
    if (disabled) return;

    // Check if user is blocked from uploading due to quota
    if (!canUploadFiles || storageFull) {
      onUpgradeRequired?.();
      return;
    }

    if (value.length >= maxFiles) return;

    if (pickerOptions.length === 1) {
      // Single option - pick directly
      handleFilePicked(pickerOptions[0].action);
    } else {
      // Multiple options - show menu
      setShowOptions(true);
    }
  }, [
    disabled,
    canUploadFiles,
    storageFull,
    value.length,
    maxFiles,
    pickerOptions,
    handleFilePicked,
    onUpgradeRequired,
  ]);

  const selectedCount = selectedIds.size;

  // Animation for bulk action bar
  const bulkActionAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bulkActionAnimation, {
      toValue: selectMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Can't use native driver for height animations
    }).start();
  }, [selectMode, bulkActionAnimation]);

  return (
    <View style={styles.container}>
      {/* Header with label and Select button */}
      <View style={styles.headerRow}>
        {label && <Text style={styles.label}>{label}</Text>}
        {value.length > 1 && !disabled && (
          <Pressable onPress={toggleSelectMode} hitSlop={8}>
            <Text style={[styles.selectButton, { color: accentColor }]}>
              {selectMode ? "Cancel" : "Select"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Bulk action bar when items are selected */}
      {selectMode && (
        <Animated.View
          style={[
            styles.bulkActionBar,
            {
              opacity: bulkActionAnimation,
              transform: [
                {
                  scale: bulkActionAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
              maxHeight: bulkActionAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
              marginBottom: bulkActionAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, spacing.sm],
              }),
            },
          ]}
        >
          <Text style={styles.selectionCount}>
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </Text>
          <View style={styles.bulkActions}>
            <Pressable
              onPress={handleDeleteSelected}
              style={[
                styles.bulkActionButton,
                selectedCount === 0 && styles.bulkActionButtonDisabled,
              ]}
              disabled={selectedCount === 0}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={selectedCount === 0 ? colors.textTertiary : colors.error}
              />
              <Text
                style={[
                  styles.bulkActionText,
                  selectedCount === 0
                    ? styles.bulkActionTextDisabled
                    : styles.deleteActionText,
                ]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Selected files preview */}
      {value.length > 0 && (
        <View style={styles.previewContainer}>
          <FilePreviewGrid
            files={value}
            onShare={!disabled && !selectMode ? handleShareFile : undefined}
            onDelete={!disabled && !selectMode ? handleDeleteFile : undefined}
            sharingIds={sharingIds}
            onFilePress={setPreviewFile}
            deletingIds={deletingIds}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            accentColor={accentColor}
          />
        </View>
      )}

      {/* Add button - show if under max files, even if blocked (to allow upgrade prompt) */}
      {value.length < maxFiles && (
        <Pressable
          onPress={handleAddPress}
          disabled={disabled || isLoading}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            (disabled || !canUploadFiles) && styles.addButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <>
              <Ionicons
                name={
                  !canUploadFiles ? "lock-closed-outline" : "add-circle-outline"
                }
                size={24}
                color={
                  disabled || !canUploadFiles
                    ? colors.textTertiary
                    : accentColor
                }
              />
              <Text
                style={[
                  styles.addButtonText,
                  { color: accentColor },
                  (disabled || !canUploadFiles) && styles.addButtonTextDisabled,
                ]}
              >
                {!canUploadFiles
                  ? "Upgrade to Add Files"
                  : storageFull
                    ? "Storage Full"
                    : value.length === 0
                      ? placeholder
                      : "Add Another"}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {/* File count / limit indicator */}
      {maxFiles < 10 && (
        <Text style={styles.countText}>
          {value.length} of {maxFiles} files
        </Text>
      )}

      {/* Help text */}
      {helpText && <Text style={styles.helpText}>{helpText}</Text>}

      {/* Storage indicator */}
      {showStorageIndicator && (
        <View style={styles.storageContainer}>
          <StorageIndicator compact />
        </View>
      )}

      {/* Options modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Add File</Text>
            {pickerOptions.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleFilePicked(option.action)}
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={colors.textPrimary}
                />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowOptions(false)}
              style={[styles.optionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* File preview modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectButton: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  bulkActionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
  selectionCount: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  bulkActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  bulkActionText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  bulkActionTextDisabled: {
    color: colors.textTertiary,
  },
  bulkActionButtonDisabled: {
    opacity: 0.5,
  },
  deleteActionText: {
    color: colors.error,
  },
  previewContainer: {
    marginBottom: spacing.sm,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  addButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: typography.sizes.body,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  addButtonTextDisabled: {
    color: colors.textTertiary,
  },
  countText: {
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  helpText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  storageContainer: {
    marginTop: spacing.sm,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  optionsContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  optionsTitle: {
    fontSize: typography.sizes.titleMedium,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  optionButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  optionLabel: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  cancelButton: {
    marginTop: spacing.sm,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cancelLabel: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
