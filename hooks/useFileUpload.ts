/**
 * useFileUpload Hook
 *
 * Orchestrates file uploads for entries, wishes, and messages.
 * All files (images, documents, audio, video) are encrypted with AES-256-GCM
 * before upload to R2.
 */

import { useApi } from "@/api";
import type { FileUploadTarget } from "@/api/files";
import type { FileAttachment, FileUploadStatus } from "@/api/types";
import {
  formatStorageMB,
  isStorageQuotaError,
  parseStorageQuotaError,
} from "@/lib/entitlementHelpers";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { encryptFileForUpload } from "@/lib/crypto/fileEncryption";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

interface UploadResult {
  /** URI of the file that was uploaded (for matching) */
  uri: string;
  /** Whether upload succeeded */
  success: boolean;
  /** Backend file ID on success */
  fileId?: string;
  /** Error message on failure */
  error?: string;
  /** Whether the error was a storage quota exceeded error */
  isStorageQuotaError?: boolean;
}

interface FileUploadState {
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

interface UseFileUploadOptions {
  /** Callback when a single file upload completes */
  onFileUploaded?: (
    file: FileAttachment,
    fileId: string,
    downloadUrl: string | null,
    isEncrypted: boolean,
  ) => void;
  /** Callback when a file upload fails */
  onFileError?: (file: FileAttachment, error: string) => void;
  /** Callback when all uploads complete */
  onAllComplete?: (results: UploadResult[]) => void;
}

interface UseFileUploadReturn {
  /** Upload all pending files to an entry or wish */
  uploadFiles: (
    target: FileUploadTarget,
    files: FileAttachment[],
  ) => Promise<UploadResult[]>;
  /** Current upload state for each file (keyed by uri) */
  uploadStates: Record<string, FileUploadState>;
  /** Whether any uploads are in progress */
  isUploading: boolean;
  /** Cancel all ongoing uploads */
  cancelUploads: () => void;
  /** Whether a storage quota error was encountered */
  hasStorageQuotaError: boolean;
  /** Clear the storage quota error state */
  clearStorageQuotaError: () => void;
}

/**
 * Reads a file URI and returns the blob data
 */
async function readFileAsBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Convert a Blob to ArrayBuffer using FileReader.
 * Blob.arrayBuffer() is not available in React Native (Hermes).
 */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read blob as ArrayBuffer"));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Uploads data to a presigned URL with progress tracking
 * Uses XMLHttpRequest to track upload progress
 */
function uploadToPresignedUrl(
  url: string,
  data: Blob | ArrayBuffer,
  contentType: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed - network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(data);
  });
}



export function useFileUpload(
  options: UseFileUploadOptions = {},
): UseFileUploadReturn {
  const { onFileUploaded, onFileError, onAllComplete } = options;
  const { files: filesService } = useApi();
  const queryClient = useQueryClient();
  const crypto = useOptionalCrypto();

  const [uploadStates, setUploadStates] = useState<
    Record<string, FileUploadState>
  >({});
  const [isUploading, setIsUploading] = useState(false);
  const [hasStorageQuotaError, setHasStorageQuotaError] = useState(false);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clear the storage quota error state
   */
  const clearStorageQuotaError = useCallback(() => {
    setHasStorageQuotaError(false);
  }, []);

  /**
   * Update state for a single file
   */
  const updateFileState = useCallback(
    (uri: string, state: Partial<FileUploadState>) => {
      setUploadStates((prev) => ({
        ...prev,
        [uri]: {
          status: prev[uri]?.status ?? "pending",
          progress: prev[uri]?.progress ?? 0,
          ...state,
        },
      }));
    },
    [],
  );

  /**
   * Upload a file to R2 with optional E2EE encryption.
   * All file types (images, documents, audio, video) use the same path.
   */
  const uploadFile = useCallback(
    async (
      target: FileUploadTarget,
      file: FileAttachment,
      signal: AbortSignal,
    ): Promise<UploadResult> => {
      const uri = file.uri;

      try {
        // 1. Read file data
        const blob = await readFileAsBlob(file.uri);

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 2. Determine upload size and content type
        // If encryption is available, encrypt the file data before upload
        let uploadData: Blob | ArrayBuffer = blob;
        let uploadContentType = file.mimeType;
        let uploadSize = file.fileSize;

        if (crypto?.activeDEK) {
          const arrayBuffer = await blobToArrayBuffer(blob);
          const encrypted = await encryptFileForUpload(
            arrayBuffer,
            crypto.activeDEK,
          );
          uploadData = encrypted;
          // Encrypted files are opaque binary data
          uploadContentType = "application/octet-stream";
          uploadSize = encrypted.byteLength;
        }

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 3. Initialize upload - get presigned URL
        const isEncrypted = !!crypto?.activeDEK;
        const initResponse = await filesService.initUpload(target, {
          filename: file.fileName,
          mimeType: file.mimeType,
          sizeBytes: uploadSize,
          isEncrypted,
          ...(file.role && { role: file.role }),
        });

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 4. Upload to presigned URL
        await uploadToPresignedUrl(
          initResponse.uploadUrl,
          uploadData,
          uploadContentType,
          (progress) => updateFileState(uri, { progress }),
          signal,
        );

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 3. Complete upload - response includes the download URL
        const completedFile = await filesService.completeUpload(
          initResponse.fileId,
        );

        // 4. Upload thumbnail as a separate file for videos (non-fatal)
        if (file.type === "video") {
          if (file.thumbnailUri && file.thumbnailUri.startsWith("file://")) {
            try {
              logger.info("Uploading video thumbnail", {
                videoFileId: initResponse.fileId,
                thumbnailUri: file.thumbnailUri,
              });
              const thumbBlob = await readFileAsBlob(file.thumbnailUri);

              // Encrypt thumbnail the same way as the main file
              let thumbUploadData: Blob | ArrayBuffer = thumbBlob;
              let thumbContentType = "image/jpeg";
              let thumbSize = thumbBlob.size;

              if (crypto?.activeDEK) {
                const thumbArrayBuffer = await blobToArrayBuffer(thumbBlob);
                const encryptedThumb = await encryptFileForUpload(
                  thumbArrayBuffer,
                  crypto.activeDEK,
                );
                thumbUploadData = encryptedThumb;
                thumbContentType = "application/octet-stream";
                thumbSize = encryptedThumb.byteLength;
              }

              const thumbInit = await filesService.initUpload(target, {
                filename: `thumb_${file.fileName.replace(/\.\w+$/, ".jpg")}`,
                mimeType: "image/jpeg",
                sizeBytes: thumbSize,
                role: "thumbnail",
                parentFileId: initResponse.fileId,
                isEncrypted,
              });
              await uploadToPresignedUrl(
                thumbInit.uploadUrl,
                thumbUploadData,
                thumbContentType,
                () => {},
                signal,
              );
              await filesService.completeUpload(thumbInit.fileId);
              logger.info("Video thumbnail uploaded successfully", {
                videoFileId: initResponse.fileId,
                thumbnailFileId: thumbInit.fileId,
              });
            } catch (thumbError) {
              logger.warn("Thumbnail upload failed (non-fatal)", {
                videoFileId: initResponse.fileId,
                "error.message":
                  thumbError instanceof Error
                    ? thumbError.message
                    : String(thumbError),
              });
            }
          } else {
            logger.info("Skipping thumbnail upload for video", {
              videoFileId: initResponse.fileId,
              hasThumbnailUri: !!file.thumbnailUri,
              thumbnailUri: file.thumbnailUri ?? "undefined",
            });
          }
        }

        updateFileState(uri, { status: "complete", progress: 1 });
        onFileUploaded?.(file, initResponse.fileId, completedFile.downloadUrl, isEncrypted);

        return { uri, success: true, fileId: initResponse.fileId };
      } catch (error) {
        // Check if this is a storage quota error
        if (isStorageQuotaError(error)) {
          const quotaDetails = parseStorageQuotaError(error);
          const message = quotaDetails
            ? `Storage limit exceeded. You have ${formatStorageMB(quotaDetails.limit - quotaDetails.current)} remaining.`
            : "Storage quota exceeded";
          updateFileState(uri, { status: "error", error: message });
          onFileError?.(file, message);
          setHasStorageQuotaError(true);
          return {
            uri,
            success: false,
            error: message,
            isStorageQuotaError: true,
          };
        }

        const message =
          error instanceof Error ? error.message : "Upload failed";
        updateFileState(uri, { status: "error", error: message });
        onFileError?.(file, message);
        return { uri, success: false, error: message };
      }
    },
    [filesService, updateFileState, onFileUploaded, onFileError, crypto],
  );

  /**
   * Upload all pending files to an entry or wish
   */
  const uploadFiles = useCallback(
    async (
      target: FileUploadTarget,
      files: FileAttachment[],
    ): Promise<UploadResult[]> => {
      // Clear any previous storage quota error
      setHasStorageQuotaError(false);

      // Filter to only pending files (not already remote)
      const pendingFiles = files.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );

      if (pendingFiles.length === 0) {
        return [];
      }

      setIsUploading(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Initialize states for all pending files
      for (const file of pendingFiles) {
        updateFileState(file.uri, { status: "uploading", progress: 0 });
      }

      const results: UploadResult[] = [];

      // Upload files sequentially to avoid overwhelming the network
      for (const file of pendingFiles) {
        if (signal.aborted) {
          results.push({ uri: file.uri, success: false, error: "Cancelled" });
          continue;
        }

        // All files use the same encrypted R2 upload path
        const result = await uploadFile(target, file, signal);

        results.push(result);
      }

      setIsUploading(false);
      abortControllerRef.current = null;

      // Invalidate queries based on target type
      if (target.entryId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.files.byEntry(target.entryId),
        });
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              key[0] === "entries" &&
              (key.includes(target.entryId) || key.includes("detail"))
            );
          },
        });
      } else if (target.messageId) {
        // Invalidate message-related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.files.byMessage(target.messageId),
        });

        // Also invalidate message queries since files are included in message responses
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              key[0] === "messages" &&
              (key.includes(target.messageId) || key.includes("detail"))
            );
          },
        });
      } else if (target.wishId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.files.byWish(target.wishId),
        });
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              key[0] === "wishes" &&
              (key.includes(target.wishId) || key.includes("detail"))
            );
          },
        });
      }

      // Invalidate all entitlements to refresh storage quota after uploads
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });

      onAllComplete?.(results);

      return results;
    },
    [
      uploadFile,
      updateFileState,
      queryClient,
      onAllComplete,
    ],
  );

  /**
   * Cancel all ongoing uploads
   */
  const cancelUploads = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
  }, []);

  return {
    uploadFiles,
    uploadStates,
    isUploading,
    cancelUploads,
    hasStorageQuotaError,
    clearStorageQuotaError,
  };
}

// Re-export FileUploadTarget type for consumers
export type { FileUploadTarget };
