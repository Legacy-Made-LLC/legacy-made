import { FileAttachment } from "@/api/types";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import { useEncryptedFileView } from "@/hooks/useEncryptedFileView";
import { toast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { Galeria } from "@nandorojo/galeria";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface FilePreviewProps {
  file: FileAttachment;
  /** Callback to share this file */
  onShare?: () => void;
  /** Whether sharing is in progress */
  isSharing?: boolean;
  /** Callback to delete this file */
  onDelete?: () => void;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Callback when the preview is pressed (for opening full-screen viewer) */
  onPress?: () => void;
  /** Whether the file is currently being deleted */
  isDeleting?: boolean;
  /** Whether selection mode is active */
  selectMode?: boolean;
  /** Whether this file is selected (only relevant when selectMode is true) */
  isSelected?: boolean;
  /** Callback when selection state changes */
  onSelectToggle?: () => void;
  /** Accent color for selection indicator (defaults to primary) */
  accentColor?: string;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formats duration in mm:ss format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Gets an appropriate icon name for document types
 */
function getDocumentIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (mimeType.includes("pdf")) return "document-text";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "grid";
  return "document-outline";
}

/**
 * Preview component for displaying selected files
 */
export function FilePreview({
  file,
  onShare,
  isSharing = false,
  onDelete,
  compact = false,
  onPress,
  isDeleting = false,
  selectMode = false,
  isSelected = false,
  onSelectToggle,
  accentColor = colors.primary,
}: FilePreviewProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuButtonRef = useRef<View>(null);

  const isImage = file.type === "image";
  const isVideo = file.type === "video";
  const isDocument = file.type === "document";
  const isUploading = file.uploadStatus === "uploading";
  const hasError = file.uploadStatus === "error";
  const isProcessing = false;

  // Decrypt encrypted remote files (images + documents)
  const needsDecryption =
    (isImage || isDocument) &&
    file.isEncrypted === true &&
    file.isRemote === true;
  const { localUri: decryptedUri, isLoading: isDecrypting } =
    useEncryptedFileView(
      needsDecryption ? file.id : undefined,
      file.mimeType,
      file.uri,
      file.isEncrypted,
    );

  // Decrypt encrypted video thumbnails
  const needsThumbnailDecryption =
    isVideo &&
    file.isThumbnailEncrypted === true &&
    file.isRemote === true &&
    !!file.thumbnailFileId;
  const { localUri: decryptedThumbnailUri, isLoading: isThumbnailDecrypting } =
    useEncryptedFileView(
      needsThumbnailDecryption ? file.thumbnailFileId : undefined,
      "image/jpeg",
      file.thumbnailUri,
      file.isThumbnailEncrypted,
    );

  const isBusy =
    isUploading || isDeleting || isSharing || isThumbnailDecrypting;

  // Videos can now be shared since they're stored as regular files in R2
  const canShare = onShare;

  // Whether to show the menu button (has at least one action available)
  const hasMenuActions = (canShare || onDelete) && !selectMode;

  // Thumbnail URI for display:
  // - Images: use decrypted local URI for encrypted files, original URI otherwise
  // - Videos: use decrypted thumbnail URI for encrypted thumbnails, original URI otherwise
  const thumbnailUri = isVideo
    ? needsThumbnailDecryption
      ? decryptedThumbnailUri
      : file.thumbnailUri
    : isImage
      ? needsDecryption
        ? decryptedUri
        : file.uri
      : null;

  // Whether this file type can be previewed in-app
  // Images use Galeria (handles tap internally), videos use our custom modal
  const canPreviewImage = isImage && !isUploading && !isDecrypting;
  const canPreviewVideo = isVideo && onPress && !isUploading && !isProcessing;

  // Whether this document can be downloaded/opened externally
  const canDownload =
    isDocument && file.isRemote && file.uri && !isBusy && !isDecrypting;

  // Handle opening a document externally
  // For encrypted documents: decrypt locally then use share sheet (Quick Look preview)
  // For unencrypted documents: open the remote URL in an in-app browser
  const documentUri = needsDecryption ? decryptedUri : file.uri;
  const handleOpenDocument = useCallback(async () => {
    if (!documentUri) {
      toast.error({ message: "No download URL available for this file." });
      return;
    }

    try {
      if (needsDecryption) {
        // Encrypted files are decrypted to a local file:// URI.
        // Use the share sheet which shows a Quick Look preview on iOS
        // and lets the user open in any compatible app.
        await Sharing.shareAsync(documentUri, {
          mimeType: file.mimeType,
          UTI:
            file.mimeType === "application/pdf" ? "com.adobe.pdf" : undefined,
        });
      } else {
        // Unencrypted remote files can be opened directly in the browser
        await WebBrowser.openBrowserAsync(documentUri, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }
    } catch {
      toast.error({ message: "Failed to open the file. Please try again." });
    }
  }, [documentUri, needsDecryption, file.mimeType]);

  // Combined press handler - preview for videos, download for documents
  // Images use Galeria which handles tap internally
  const handlePress = useCallback(() => {
    if (canPreviewVideo && onPress) {
      onPress();
    } else if (canDownload) {
      handleOpenDocument();
    }
  }, [canPreviewVideo, canDownload, onPress, handleOpenDocument]);

  // Whether this file is tappable via Pressable (excludes images which use Galeria)
  const isTappable = canPreviewVideo || canDownload;

  // Handle opening the menu - measure button position first
  const handleOpenMenu = useCallback(() => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      // Position menu to the left of the button, aligned with its top
      setMenuPosition({
        x: x - 160 + width, // Menu width is ~160, align right edge with button
        y: y + height + 4, // Below the button with small gap
      });
      setShowMenu(true);
    });
  }, []);

  if (compact) {
    // Badge to show on the thumbnail (only for videos)
    const thumbnailBadge =
      isVideo && !isProcessing ? (
        <View style={styles.compactPlayBadge}>
          <Ionicons name="play" size={12} color="#FFFFFF" />
        </View>
      ) : null;

    // Render thumbnail based on file type
    const renderThumbnail = () => {
      // Image preview with Galeria
      if (canPreviewImage && thumbnailUri) {
        return (
          <View style={styles.compactThumbnailPressable}>
            <Galeria urls={[thumbnailUri]} theme="dark">
              <Galeria.Image>
                <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.compactThumbnail}
                />
              </Galeria.Image>
            </Galeria>
            {thumbnailBadge}
          </View>
        );
      }

      // Video or document with Pressable
      if (isTappable && thumbnailUri) {
        return (
          <Pressable
            onPress={handlePress}
            style={styles.compactThumbnailPressable}
          >
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.compactThumbnail}
            />
            {thumbnailBadge}
          </Pressable>
        );
      }

      // Non-tappable content (uploading, processing, or no thumbnail)
      const iconContent = (
        <View style={styles.compactIcon}>
          <Ionicons
            name={isVideo ? "videocam" : getDocumentIcon(file.mimeType)}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      );

      return (
        <View
          style={[
            styles.compactThumbnailPressable,
            isProcessing && styles.compactProcessingThumbnail,
          ]}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.compactThumbnail}
            />
          ) : (
            iconContent
          )}
        </View>
      );
    };

    return (
      <View
        style={[
          styles.compactContainer,
          hasError && styles.errorBorder,
          isDeleting && styles.deletingContainer,
        ]}
      >
        {renderThumbnail()}

        {/* File info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactFileName} numberOfLines={1}>
            {file.fileName}
          </Text>
          <Text
            style={[styles.compactMeta, isProcessing && styles.processingMeta]}
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                {formatFileSize(file.fileSize)}
                {isVideo && file.duration
                  ? ` \u00B7 ${formatDuration(file.duration)}`
                  : ""}
              </>
            )}
          </Text>
        </View>

        {/* Status indicator or menu button */}
        {isBusy ? (
          <ActivityIndicator
            size="small"
            color={
              isSharing
                ? colors.primary
                : isDeleting
                  ? colors.error
                  : colors.primary
            }
          />
        ) : hasMenuActions ? (
          <Pressable
            ref={menuButtonRef}
            onPress={handleOpenMenu}
            hitSlop={10}
            style={styles.compactMenuButton}
            accessibilityRole="button"
            accessibilityLabel="File options menu"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={16}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : null}

        {/* Dropdown menu modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setShowMenu(false)}
          >
            <View
              style={[
                styles.menuContainer,
                {
                  position: "absolute",
                  left: menuPosition.x,
                  top: menuPosition.y,
                },
              ]}
            >
              {canShare && (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onShare();
                  }}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.menuItemText}>Share</Text>
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text
                    style={[styles.menuItemText, styles.menuItemTextDelete]}
                  >
                    Delete
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Overlays that appear on top of the thumbnail (shared by all file types)
  const overlays = (
    <>
      {/* Video duration badge */}
      {isVideo && file.duration && (
        <View style={styles.durationBadge}>
          <Ionicons name="play" size={10} color="#FFFFFF" />
          <Text style={styles.durationText}>
            {formatDuration(file.duration)}
          </Text>
        </View>
      )}

      {/* Play icon overlay for videos (only when ready to play) */}
      {isVideo && !isUploading && !isProcessing && (
        <View style={styles.playOverlay}>
          <View style={styles.playIconCircle}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
        </View>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          {file.uploadProgress !== undefined && (
            <Text style={styles.progressText}>
              {Math.round(file.uploadProgress * 100)}%
            </Text>
          )}
        </View>
      )}

      {/* Processing overlay for videos still being transcoded */}
      {isProcessing && !isUploading && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}

      {/* Menu button or deleting/sharing indicator */}
      {isDeleting ? (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      ) : isSharing ? (
        <View style={styles.busyIndicator}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : hasMenuActions && !isUploading ? (
        <Pressable
          ref={menuButtonRef}
          onPress={handleOpenMenu}
          style={styles.menuButton}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={14} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </>
  );

  // Selection indicator overlay
  const selectionOverlay = selectMode && (
    <View style={styles.selectionOverlay}>
      <View
        style={[
          styles.selectionIndicator,
          isSelected
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : {
                backgroundColor: `${accentColor}30`,
                borderColor: `${accentColor}90`,
              },
        ]}
      >
        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
    </View>
  );

  // Render the preview area based on file type
  const renderPreviewArea = () => {
    // In selection mode, all items become tappable for selection
    if (selectMode) {
      return (
        <Pressable
          style={[styles.previewArea, isSelected && styles.previewAreaSelected]}
          onPress={onSelectToggle}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons
                name={getDocumentIcon(file.mimeType)}
                size={40}
                color={colors.textTertiary}
              />
            </View>
          )}
          {overlays}
          {selectionOverlay}
        </Pressable>
      );
    }

    // Image with Galeria - handles tap internally for fullscreen view
    if (canPreviewImage && thumbnailUri) {
      return (
        <View style={styles.previewArea}>
          <Galeria urls={[thumbnailUri]} theme="dark">
            <Galeria.Image>
              <Image
                source={{ uri: thumbnailUri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            </Galeria.Image>
          </Galeria>
          {overlays}
        </View>
      );
    }

    // Video or document - use Pressable for tap handling
    if (isTappable) {
      return (
        <Pressable style={styles.previewArea} onPress={handlePress}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons
                name={getDocumentIcon(file.mimeType)}
                size={40}
                color={colors.textTertiary}
              />
            </View>
          )}
          {overlays}
        </Pressable>
      );
    }

    // Non-interactive preview (uploading, processing, etc.)
    return (
      <View style={styles.previewArea}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={styles.documentPreview}>
            <Ionicons
              name={getDocumentIcon(file.mimeType)}
              size={40}
              color={colors.textTertiary}
            />
          </View>
        )}
        {overlays}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        hasError && styles.errorBorder,
        isDeleting && styles.deletingContainer,
      ]}
    >
      {renderPreviewArea()}

      {/* File info */}
      <View style={styles.infoArea}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.fileMeta}>
          {formatFileSize(file.fileSize)}
          {isVideo && file.duration
            ? ` \u00B7 ${formatDuration(file.duration)}`
            : ""}
          {file.width && file.height
            ? ` \u00B7 ${file.width}x${file.height}`
            : ""}
        </Text>
        {hasError && file.errorMessage && (
          <Text style={styles.errorText}>{file.errorMessage}</Text>
        )}
      </View>

      {/* Dropdown menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                position: "absolute",
                left: menuPosition.x,
                top: menuPosition.y,
              },
            ]}
          >
            {canShare && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onShare();
                }}
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.menuItemText}>Share</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>
                  Delete
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Component for displaying multiple file previews in a grid
 */
export function FilePreviewGrid({
  files,
  onShare,
  onDelete,
  onFilePress,
  deletingIds,
  sharingIds,
  selectMode = false,
  selectedIds,
  onSelectionChange,
  accentColor = colors.primary,
}: {
  files: FileAttachment[];
  /** Called with file identifier to share */
  onShare?: (identifier: string) => void;
  /** Called with file identifier to delete */
  onDelete?: (identifier: string) => void;
  onFilePress?: (file: FileAttachment) => void;
  /** Set of file IDs currently being deleted */
  deletingIds?: Set<string>;
  /** Set of file IDs currently being shared */
  sharingIds?: Set<string>;
  /** Whether selection mode is active */
  selectMode?: boolean;
  /** Set of selected file identifiers */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Accent color for selection indicator */
  accentColor?: string;
}) {
  const handleSelectToggle = useCallback(
    (identifier: string) => {
      if (!onSelectionChange) return;
      const newSelected = new Set(selectedIds);
      if (newSelected.has(identifier)) {
        newSelected.delete(identifier);
      } else {
        newSelected.add(identifier);
      }
      onSelectionChange(newSelected);
    },
    [selectedIds, onSelectionChange],
  );

  const renderItem = useCallback(
    ({ item: file }: { item: FileAttachment }) => {
      const identifier = file.id || file.uri;
      const isDeleting = deletingIds?.has(identifier) ?? false;
      const isSharing = sharingIds?.has(identifier) ?? false;
      const isSelected = selectedIds?.has(identifier) ?? false;
      return (
        <View style={styles.gridItem}>
          <FilePreview
            file={file}
            onShare={onShare ? () => onShare(identifier) : undefined}
            onDelete={onDelete ? () => onDelete(identifier) : undefined}
            isSharing={isSharing}
            onPress={onFilePress ? () => onFilePress(file) : undefined}
            isDeleting={isDeleting}
            selectMode={selectMode}
            isSelected={isSelected}
            onSelectToggle={() => handleSelectToggle(identifier)}
            accentColor={accentColor}
          />
        </View>
      );
    },
    [
      deletingIds,
      sharingIds,
      selectedIds,
      onShare,
      onDelete,
      selectMode,
      onFilePress,
      handleSelectToggle,
      accentColor,
    ],
  );

  const keyExtractor = useCallback(
    (file: FileAttachment) => file.id || file.uri,
    [],
  );

  if (files.length === 0) return null;

  return (
    <FlatList
      data={files}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      scrollEnabled={false}
    />
  );
}

/**
 * Component for displaying multiple files in a compact list
 */
export function FilePreviewList({
  files,
  onShare,
  onFilePress,
  deletingIds,
  sharingIds,
}: {
  files: FileAttachment[];
  /** Called with file identifier to share */
  onShare?: (identifier: string) => void;
  onFilePress?: (file: FileAttachment) => void;
  /** Set of file IDs currently being deleted */
  deletingIds?: Set<string>;
  /** Set of file IDs currently being shared */
  sharingIds?: Set<string>;
}) {
  if (files.length === 0) return null;

  return (
    <View style={styles.list}>
      {files.map((file) => {
        const identifier = file.id || file.uri;
        const isDeleting = deletingIds?.has(identifier) ?? false;
        const isSharing = sharingIds?.has(identifier) ?? false;
        return (
          <FilePreview
            key={identifier}
            file={file}
            onShare={onShare ? () => onShare(identifier) : undefined}
            isSharing={isSharing}
            onPress={onFilePress ? () => onFilePress(file) : undefined}
            isDeleting={isDeleting}
            compact
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Full preview styles
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  deletingContainer: {
    opacity: 0.5,
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletingText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing.sm,
  },
  previewArea: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceSecondary,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  documentPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.medium,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
    marginTop: spacing.sm,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing.sm,
  },
  menuButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  busyIndicator: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    minWidth: 160,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  menuItemText: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  menuItemTextDelete: {
    color: colors.error,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Selection mode styles
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: spacing.sm,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAreaSelected: {
    opacity: 0.8,
  },

  infoArea: {
    padding: spacing.md,
  },
  fileName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  fileMeta: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },

  gridItem: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },

  // List styles
  list: {
    gap: spacing.sm,
  },

  // Compact preview styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...shadows.card,
  },
  compactThumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  compactThumbnailPressable: {
    position: "relative",
  },
  compactPlayBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compactFileName: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  compactMeta: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  processingMeta: {
    color: colors.primary,
    fontStyle: "italic",
  },
  compactProcessingThumbnail: {
    opacity: 0.5,
  },
  compactMenuButton: {
    padding: 6,
  },
});
