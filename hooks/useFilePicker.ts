import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { FileAttachment, FileType } from '@/api/types';

export type PickerMode = 'image' | 'video' | 'media' | 'document' | 'all';

interface UseFilePickerOptions {
  /** What types of files can be selected */
  mode?: PickerMode;
  /** Allow editing/cropping for images */
  allowsEditing?: boolean;
  /** Quality for images (0-1) */
  imageQuality?: number;
  /** Max video duration in seconds */
  videoMaxDuration?: number;
  /** Allow multiple file selection */
  allowMultiple?: boolean;
}

interface UseFilePickerReturn {
  /** Currently selected files */
  files: FileAttachment[];
  /** Whether picker is loading/processing */
  isLoading: boolean;
  /** Open the file picker */
  pickFile: () => Promise<FileAttachment | null>;
  /** Pick specifically from photo library */
  pickFromLibrary: () => Promise<FileAttachment | null>;
  /** Pick specifically from camera */
  pickFromCamera: () => Promise<FileAttachment | null>;
  /** Pick a document (PDF, etc.) */
  pickDocument: () => Promise<FileAttachment | null>;
  /** Add a file to the selection */
  addFile: (file: FileAttachment) => void;
  /** Remove a file from the selection */
  removeFile: (uri: string) => void;
  /** Clear all selected files */
  clearFiles: () => void;
  /** Set files directly (for restoring from saved state) */
  setFiles: (files: FileAttachment[]) => void;
}

/**
 * Determines the FileType category based on MIME type
 */
function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

/**
 * Generates a thumbnail for a video file
 */
async function generateVideoThumbnail(
  videoUri: string
): Promise<string | undefined> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // 1 second into the video
      quality: 0.7,
    });
    return uri;
  } catch (error) {
    console.warn('Failed to generate video thumbnail:', error);
    return undefined;
  }
}

/**
 * Requests permissions for media library access
 * Returns true if permission granted
 */
async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow access to your photo library to select files.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Requests permissions for camera access
 * Returns true if permission granted
 */
async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow camera access to take photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Hook for handling file picking with support for images, videos, and documents
 */
export function useFilePicker(
  options: UseFilePickerOptions = {}
): UseFilePickerReturn {
  const {
    mode = 'all',
    allowsEditing = false,
    imageQuality = 0.8,
    videoMaxDuration = 120,
  } = options;

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get media types for ImagePicker based on mode
   */
  const getMediaTypes = useCallback((): ImagePicker.MediaType[] => {
    switch (mode) {
      case 'image':
        return ['images'];
      case 'video':
        return ['videos'];
      case 'media':
      case 'all':
      default:
        return ['images', 'videos'];
    }
  }, [mode]);

  /**
   * Converts ImagePicker result to FileAttachment
   */
  const imagePickerResultToAttachment = useCallback(
    async (
      asset: ImagePicker.ImagePickerAsset
    ): Promise<FileAttachment | null> => {
      const isVideo = asset.type === 'video';
      const mimeType =
        asset.mimeType ||
        (isVideo ? 'video/mp4' : 'image/jpeg');
      const fileType = getFileType(mimeType);

      let thumbnailUri: string | undefined;
      if (isVideo) {
        thumbnailUri = await generateVideoThumbnail(asset.uri);
      }

      return {
        uri: asset.uri,
        fileName: asset.fileName || `file_${Date.now()}`,
        fileSize: asset.fileSize || 0,
        mimeType,
        type: fileType,
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
        thumbnailUri,
        uploadStatus: 'pending',
      };
    },
    []
  );

  /**
   * Pick from photo library
   */
  const pickFromLibrary = useCallback(async (): Promise<FileAttachment | null> => {
    // Request permission first (important for videos on iOS)
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: getMediaTypes(),
        allowsEditing,
        quality: imageQuality,
        videoMaxDuration,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const attachment = await imagePickerResultToAttachment(result.assets[0]);
      return attachment;
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getMediaTypes, allowsEditing, imageQuality, videoMaxDuration, imagePickerResultToAttachment]);

  /**
   * Pick from camera
   */
  const pickFromCamera = useCallback(async (): Promise<FileAttachment | null> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: getMediaTypes(),
        allowsEditing,
        quality: imageQuality,
        videoMaxDuration,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const attachment = await imagePickerResultToAttachment(result.assets[0]);
      return attachment;
    } catch (error) {
      console.error('Error capturing from camera:', error);
      Alert.alert('Error', 'Failed to capture. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getMediaTypes, allowsEditing, imageQuality, videoMaxDuration, imagePickerResultToAttachment]);

  /**
   * Pick a document (PDF, etc.)
   */
  const pickDocument = useCallback(async (): Promise<FileAttachment | null> => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileType = getFileType(asset.mimeType || 'application/octet-stream');

      const attachment: FileAttachment = {
        uri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
        type: fileType,
        uploadStatus: 'pending',
      };

      return attachment;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generic pick function - shows appropriate picker based on mode
   */
  const pickFile = useCallback(async (): Promise<FileAttachment | null> => {
    if (mode === 'document') {
      return pickDocument();
    }
    // For image, video, media, or all modes, use library picker
    return pickFromLibrary();
  }, [mode, pickDocument, pickFromLibrary]);

  /**
   * Add a file to the selection
   */
  const addFile = useCallback((file: FileAttachment) => {
    setFiles((prev) => [...prev, file]);
  }, []);

  /**
   * Remove a file by URI
   */
  const removeFile = useCallback((uri: string) => {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isLoading,
    pickFile,
    pickFromLibrary,
    pickFromCamera,
    pickDocument,
    addFile,
    removeFile,
    clearFiles,
    setFiles,
  };
}
