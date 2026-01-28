/**
 * useFileUpload Hook
 *
 * Orchestrates file uploads for an entry. Handles both standard uploads (R2)
 * and video uploads (Mux) with progress tracking.
 */

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import type { FileAttachment, FileUploadStatus } from "@/api/types";

interface UploadResult {
  /** URI of the file that was uploaded (for matching) */
  uri: string;
  /** Whether upload succeeded */
  success: boolean;
  /** Backend file ID on success */
  fileId?: string;
  /** Error message on failure */
  error?: string;
}

interface FileUploadState {
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

interface UseFileUploadOptions {
  /** Callback when a single file upload completes */
  onFileUploaded?: (file: FileAttachment, fileId: string) => void;
  /** Callback when a file upload fails */
  onFileError?: (file: FileAttachment, error: string) => void;
  /** Callback when all uploads complete */
  onAllComplete?: (results: UploadResult[]) => void;
}

interface UseFileUploadReturn {
  /** Upload all pending files to an entry */
  uploadFiles: (
    entryId: string,
    files: FileAttachment[]
  ) => Promise<UploadResult[]>;
  /** Current upload state for each file (keyed by uri) */
  uploadStates: Record<string, FileUploadState>;
  /** Whether any uploads are in progress */
  isUploading: boolean;
  /** Cancel all ongoing uploads */
  cancelUploads: () => void;
}

/**
 * Reads a file URI and returns the blob data
 */
async function readFileAsBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Uploads a file to a presigned URL with progress tracking
 * Uses XMLHttpRequest to track upload progress
 */
function uploadToPresignedUrl(
  url: string,
  blob: Blob,
  mimeType: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
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
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(blob);
  });
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const { onFileUploaded, onFileError, onAllComplete } = options;
  const { files: filesService } = useApi();
  const queryClient = useQueryClient();

  const [uploadStates, setUploadStates] = useState<
    Record<string, FileUploadState>
  >({});
  const [isUploading, setIsUploading] = useState(false);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

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
    []
  );

  /**
   * Upload a standard file (image, document) to R2
   */
  const uploadStandardFile = useCallback(
    async (
      entryId: string,
      file: FileAttachment,
      signal: AbortSignal
    ): Promise<UploadResult> => {
      const uri = file.uri;

      try {
        // 1. Initialize upload - get presigned URL
        const initResponse = await filesService.initUpload(entryId, {
          filename: file.fileName,
          mimeType: file.mimeType,
          sizeBytes: file.fileSize,
        });

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 2. Read file and upload to presigned URL
        const blob = await readFileAsBlob(file.uri);

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        await uploadToPresignedUrl(
          initResponse.uploadUrl,
          blob,
          file.mimeType,
          (progress) => updateFileState(uri, { progress }),
          signal
        );

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 3. Complete upload
        await filesService.completeUpload(initResponse.fileId);

        updateFileState(uri, { status: "complete", progress: 1 });
        onFileUploaded?.(file, initResponse.fileId);

        return { uri, success: true, fileId: initResponse.fileId };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        updateFileState(uri, { status: "error", error: message });
        onFileError?.(file, message);
        return { uri, success: false, error: message };
      }
    },
    [filesService, updateFileState, onFileUploaded, onFileError]
  );

  /**
   * Upload a video file to Mux
   * Note: For better UX with large videos, consider using @mux/upchunk
   */
  const uploadVideoFile = useCallback(
    async (
      entryId: string,
      file: FileAttachment,
      signal: AbortSignal
    ): Promise<UploadResult> => {
      const uri = file.uri;

      try {
        // 1. Initialize video upload - get Mux direct upload URL
        const initResponse = await filesService.initVideoUpload(entryId, {
          filename: file.fileName,
          mimeType: file.mimeType,
          sizeBytes: file.fileSize,
        });

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        // 2. Read file and upload to Mux URL
        const blob = await readFileAsBlob(file.uri);

        if (signal.aborted) {
          return { uri, success: false, error: "Cancelled" };
        }

        await uploadToPresignedUrl(
          initResponse.uploadUrl,
          blob,
          file.mimeType,
          (progress) => updateFileState(uri, { progress }),
          signal
        );

        // No complete call needed for Mux - webhook handles it
        // Mark as complete locally (backend will update status via webhook)
        updateFileState(uri, { status: "complete", progress: 1 });
        onFileUploaded?.(file, initResponse.fileId);

        return { uri, success: true, fileId: initResponse.fileId };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        updateFileState(uri, { status: "error", error: message });
        onFileError?.(file, message);
        return { uri, success: false, error: message };
      }
    },
    [filesService, updateFileState, onFileUploaded, onFileError]
  );

  /**
   * Upload all pending files to an entry
   */
  const uploadFiles = useCallback(
    async (
      entryId: string,
      files: FileAttachment[]
    ): Promise<UploadResult[]> => {
      // Filter to only pending files (not already remote)
      const pendingFiles = files.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete"
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

        const isVideo = file.mimeType.startsWith("video/");
        const result = isVideo
          ? await uploadVideoFile(entryId, file, signal)
          : await uploadStandardFile(entryId, file, signal);

        results.push(result);
      }

      setIsUploading(false);
      abortControllerRef.current = null;

      // Invalidate queries to refresh the entry with new files
      queryClient.invalidateQueries({
        queryKey: queryKeys.files.byEntry(entryId),
      });

      // Also invalidate entry queries since files are included in entry responses
      // Use predicate to match any entry query containing this entryId
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === "entries" &&
            (key.includes(entryId) || key.includes("detail"))
          );
        },
      });

      onAllComplete?.(results);

      return results;
    },
    [
      uploadStandardFile,
      uploadVideoFile,
      updateFileState,
      queryClient,
      onAllComplete,
    ]
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
  };
}
