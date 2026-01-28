/**
 * Files API Service - Upload and manage file attachments
 */

import type { ApiClient } from "./client";
import type {
  ApiFile,
  DeleteResponse,
  DownloadUrlResponse,
  InitUploadRequest,
  InitUploadResponse,
  InitVideoUploadResponse,
} from "./types";

/**
 * Create files service bound to an API client
 */
export function createFilesService(client: ApiClient) {
  return {
    /**
     * Initialize a standard file upload (images, documents, audio)
     * Returns a presigned URL to upload the file directly to R2
     */
    initUpload: async (
      entryId: string,
      data: InitUploadRequest
    ): Promise<InitUploadResponse> => {
      return client.post<InitUploadResponse>(
        `/entries/${entryId}/files/upload/init`,
        data
      );
    },

    /**
     * Initialize a video upload (Mux)
     * Returns a Mux direct upload URL
     */
    initVideoUpload: async (
      entryId: string,
      data: InitUploadRequest
    ): Promise<InitVideoUploadResponse> => {
      return client.post<InitVideoUploadResponse>(
        `/entries/${entryId}/files/video/init`,
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
    list: async (entryId: string): Promise<ApiFile[]> => {
      return client.get<ApiFile[]>(`/entries/${entryId}/files`);
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
