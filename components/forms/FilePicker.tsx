import { FileAttachment } from "@/api/types";
import { StorageIndicator } from "@/components/entitlements/StorageIndicator";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { PickerMode, useFilePicker } from "@/hooks/useFilePicker";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FilePreviewList } from "./FilePreview";
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
}: FilePickerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const { isLoading, pickFromLibrary, pickFromCamera, pickDocument } =
    useFilePicker({ mode });

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
      const file = await pickerFn();
      if (file) {
        onChange([...value, file]);
      }
    },
    [value, onChange],
  );

  /**
   * Remove a file from selection
   * @param identifier - file.id for remote files, file.uri for local files
   */
  const handleRemoveFile = useCallback(
    (identifier: string) => {
      onChange(value.filter((f) => (f.id || f.uri) !== identifier));
    },
    [value, onChange],
  );

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

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Selected files preview */}
      {value.length > 0 && (
        <View style={styles.previewContainer}>
          <FilePreviewList
            files={value}
            onRemove={handleRemoveFile}
            removable={!disabled}
            onFilePress={setPreviewFile}
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
            <ActivityIndicator size="small" color={colors.primary} />
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
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.addButtonText,
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
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
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
