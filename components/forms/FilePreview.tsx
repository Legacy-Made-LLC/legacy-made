import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { FileAttachment } from '@/api/types';

interface FilePreviewProps {
  file: FileAttachment;
  onRemove?: () => void;
  /** Whether the file can be removed */
  removable?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Callback when the preview is pressed (for opening full-screen viewer) */
  onPress?: () => void;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formats duration in mm:ss format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Gets an appropriate icon name for document types
 */
function getDocumentIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (mimeType.includes('pdf')) return 'document-text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid';
  return 'document-outline';
}

/**
 * Preview component for displaying selected files
 */
export function FilePreview({
  file,
  onRemove,
  removable = true,
  compact = false,
  onPress,
}: FilePreviewProps) {
  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';
  const isUploading = file.uploadStatus === 'uploading';
  const hasError = file.uploadStatus === 'error';
  const isProcessing = file.isProcessing === true;

  // Thumbnail URI for display (use generated thumbnail for videos, or file URI for images)
  const thumbnailUri = isVideo ? file.thumbnailUri : isImage ? file.uri : null;

  // Whether this file type can be previewed (images and videos only)
  // Disable preview for videos that are still processing
  const canPreview = (isImage || isVideo) && onPress && !isUploading && !isProcessing;

  if (compact) {
    const thumbnailContent = thumbnailUri ? (
      <Image source={{ uri: thumbnailUri }} style={styles.compactThumbnail} />
    ) : (
      <View style={styles.compactIcon}>
        <Ionicons
          name={isVideo ? 'videocam' : getDocumentIcon(file.mimeType)}
          size={20}
          color={colors.textSecondary}
        />
      </View>
    );

    return (
      <View style={[styles.compactContainer, hasError && styles.errorBorder]}>
        {/* Thumbnail or icon - tappable if previewable */}
        {canPreview ? (
          <Pressable onPress={onPress} style={styles.compactThumbnailPressable}>
            {thumbnailContent}
            {isVideo && !isProcessing && <View style={styles.compactPlayBadge}><Ionicons name="play" size={12} color="#FFFFFF" /></View>}
            {isImage && <View style={styles.compactZoomBadge}><Ionicons name="expand-outline" size={10} color="#FFFFFF" /></View>}
          </Pressable>
        ) : (
          <View style={[styles.compactThumbnailPressable, isProcessing && styles.compactProcessingThumbnail]}>
            {thumbnailContent}
          </View>
        )}

        {/* File info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactFileName} numberOfLines={1}>
            {file.fileName}
          </Text>
          <Text style={[styles.compactMeta, isProcessing && styles.processingMeta]}>
            {isProcessing ? 'Processing...' : (
              <>
                {formatFileSize(file.fileSize)}
                {isVideo && file.duration ? ` \u00B7 ${formatDuration(file.duration)}` : ''}
              </>
            )}
          </Text>
        </View>

        {/* Status indicator or remove button */}
        {isUploading || isProcessing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : removable && onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={styles.compactRemoveButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  const previewContent = (
    <>
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

      {/* Video duration badge */}
      {isVideo && file.duration && (
        <View style={styles.durationBadge}>
          <Ionicons name="play" size={10} color="#FFFFFF" />
          <Text style={styles.durationText}>{formatDuration(file.duration)}</Text>
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

      {/* Zoom icon overlay for images */}
      {isImage && !isUploading && (
        <View style={styles.zoomOverlay}>
          <View style={styles.zoomIconCircle}>
            <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
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

      {/* Remove button */}
      {removable && onRemove && !isUploading && (
        <Pressable
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={24} color="#FFFFFF" />
        </Pressable>
      )}
    </>
  );

  return (
    <View style={[styles.container, hasError && styles.errorBorder]}>
      {/* Preview area - tappable if previewable */}
      {canPreview ? (
        <Pressable style={styles.previewArea} onPress={onPress}>
          {previewContent}
        </Pressable>
      ) : (
        <View style={styles.previewArea}>
          {previewContent}
        </View>
      )}

      {/* File info */}
      <View style={styles.infoArea}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.fileMeta}>
          {formatFileSize(file.fileSize)}
          {isVideo && file.duration ? ` \u00B7 ${formatDuration(file.duration)}` : ''}
          {file.width && file.height ? ` \u00B7 ${file.width}x${file.height}` : ''}
        </Text>
        {hasError && file.errorMessage && (
          <Text style={styles.errorText}>{file.errorMessage}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Component for displaying multiple file previews in a grid
 */
export function FilePreviewGrid({
  files,
  onRemove,
  removable = true,
  onFilePress,
}: {
  files: FileAttachment[];
  /** Called with file.id (for remote files) or file.uri (for local files) */
  onRemove?: (identifier: string) => void;
  removable?: boolean;
  onFilePress?: (file: FileAttachment) => void;
}) {
  if (files.length === 0) return null;

  return (
    <View style={styles.grid}>
      {files.map((file) => (
        <FilePreview
          key={file.id || file.uri}
          file={file}
          onRemove={onRemove ? () => onRemove(file.id || file.uri) : undefined}
          removable={removable}
          onPress={onFilePress ? () => onFilePress(file) : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Component for displaying multiple files in a compact list
 */
export function FilePreviewList({
  files,
  onRemove,
  removable = true,
  onFilePress,
}: {
  files: FileAttachment[];
  /** Called with file.id (for remote files) or file.uri (for local files) */
  onRemove?: (identifier: string) => void;
  removable?: boolean;
  onFilePress?: (file: FileAttachment) => void;
}) {
  if (files.length === 0) return null;

  return (
    <View style={styles.list}>
      {files.map((file) => (
        <FilePreview
          key={file.id || file.uri}
          file={file}
          onRemove={onRemove ? () => onRemove(file.id || file.uri) : undefined}
          removable={removable}
          onPress={onFilePress ? () => onFilePress(file) : undefined}
          compact
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Full preview styles
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
    marginBottom: spacing.sm,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  previewArea: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  documentPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    marginTop: spacing.sm,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  zoomIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArea: {
    padding: spacing.md,
  },
  fileName: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
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

  // Grid styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // List styles
  list: {
    gap: spacing.sm,
  },

  // Compact preview styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    position: 'relative',
  },
  compactPlayBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactZoomBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compactFileName: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  compactMeta: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  processingMeta: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  compactProcessingThumbnail: {
    opacity: 0.5,
  },
  compactRemoveButton: {
    padding: spacing.xs,
  },
});
