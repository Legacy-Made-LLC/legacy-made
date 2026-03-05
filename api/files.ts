/**
 * Files API Service - Upload and manage file attachments
 *
 * Supports file uploads for both entries (vault) and wishes.
 * Use the appropriate target type when initializing uploads.
 */

import type { ApiClient } from "./client";
import type {
  ApiFile,
  DeleteResponse,
  DownloadUrlResponse,
  InitUploadRequest,
  InitUploadResponse,
  InitVideoUploadRequest,
  InitVideoUploadResponse,
} from "./types";

/**
 * Target for file uploads - an entry, wish, or message
 * Exactly one ID must be provided
 */
export type FileUploadTarget =
  | { entryId: string; wishId?: never; messageId?: never }
  | { wishId: string; entryId?: never; messageId?: never }
  | { messageId: string; entryId?: never; wishId?: never };

/**
 * Get the base path for file operations based on target type
 */
function getUploadBasePath(target: FileUploadTarget): string {
  if (target.entryId) {
    return `/entries/${target.entryId}/files`;
  }
  if (target.messageId) {
    return `/messages/${target.messageId}/files`;
  }
  return `/wishes/${target.wishId}/files`;
}

/**
 * Create files service bound to an API client
 */
export function createFilesService(client: ApiClient) {
  return {
    /**
     * Initialize a standard file upload (images, documents, audio)
     * Returns a presigned URL to upload the file directly to R2
     *
     * @param target - Either { entryId } or { wishId }
     * @param data - Upload request data (filename, mimeType, sizeBytes)
     */
    initUpload: async (
      target: FileUploadTarget,
      data: InitUploadRequest
    ): Promise<InitUploadResponse> => {
      const basePath = getUploadBasePath(target);
      return client.post<InitUploadResponse>(`${basePath}/upload/init`, data);
    },

    /**
     * Initialize a video upload (Mux)
     * Returns a Mux direct upload URL
     * Supports optional metadata for tracking in Mux dashboard
     *
     * @param target - Either { entryId } or { wishId }
     * @param data - Video upload request data
     */
    initVideoUpload: async (
      target: FileUploadTarget,
      data: InitVideoUploadRequest
    ): Promise<InitVideoUploadResponse> => {
      const basePath = getUploadBasePath(target);
      return client.post<InitVideoUploadResponse>(
        `${basePath}/video/init`,
        data
      );
    },

    /**
     * Complete a standard file upload
     * Called after uploading to the presigned URL
     * For multipart uploads, pass the completed parts with ETags
     */
    completeUpload: async (
      fileId: string,
      parts?: { partNumber: number; etag: string }[]
    ): Promise<ApiFile> => {
      return client.post<ApiFile>(`/files/${fileId}/complete`, {
        parts: parts || undefined,
      });
    },

    /**
     * List all files for an entry
     */
    listByEntry: async (entryId: string): Promise<ApiFile[]> => {
      return client.get<ApiFile[]>(`/entries/${entryId}/files`);
    },

    /**
     * List all files for a wish
     */
    listByWish: async (wishId: string): Promise<ApiFile[]> => {
      return client.get<ApiFile[]>(`/wishes/${wishId}/files`);
    },

    /**
     * Get a single file's metadata
     */
    get: async (fileId: string): Promise<ApiFile> => {
      return client.get<ApiFile>(`/files/${fileId}`);
    },

    /**
     * Get download/playback URL for a file
     * Returns presigned URL for R2 or playback URL for Mux videos
     */
    getDownloadUrl: async (fileId: string): Promise<DownloadUrlResponse> => {
      return client.get<DownloadUrlResponse>(`/files/${fileId}/download`);
    },

    /**
     * Delete a file
     */
    delete: async (fileId: string): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(`/files/${fileId}`);
    },
  };
}

/**
 * Type for the files service
 */
export type FilesService = ReturnType<typeof createFilesService>;
