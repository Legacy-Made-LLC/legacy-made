/**
 * API Types - Match the backend's Entry model and metadata schemas
 */

// ============================================================================
// Metadata Types
// ============================================================================

export interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
  address?: string;
  reason?: string;
  /** Whether this is a primary contact */
  isPrimary?: boolean;
}

export interface FinancialMetadata {
  institution: string;
  accountType: string;
  accountNumber?: string;
  contactInfo?: string;
  notes?: string;
}

export interface InsuranceMetadata {
  provider: string;
  policyType: string;
  policyNumber?: string;
  contactInfo?: string;
  coverageDetails?: string;
}

export interface LegalDocumentMetadata {
  documentType: string;
  location: string;
  holder?: string;
  notes?: string;
}

export interface HomeMetadata {
  responsibilityType: string;
  provider?: string;
  accountInfo?: string;
  frequency?: string;
  notes?: string;
}

export interface DigitalAccessMetadata {
  service: string;
  username?: string;
  recoveryEmail?: string;
  notes?: string;
  /** Importance level: critical, high, medium, low */
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// File Types (Backend Response)
// ============================================================================

export type ApiFileStorageType = 'r2' | 'mux';
export type ApiFileUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

/**
 * File record from backend API response
 * Returned as part of entry.files[] array
 */
export interface ApiFile {
  id: string;
  entryId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageType: ApiFileStorageType;
  uploadStatus: ApiFileUploadStatus;
  /** Presigned download URL for R2 files (expires in ~1hr) */
  downloadUrl: string | null;
  /** Thumbnail URL for images/videos */
  thumbnailUrl: string | null;
  /** Mux playback ID for videos */
  playbackId: string | null;
  /** Mux tokens for video playback (videos only) */
  tokens?: {
    playbackToken: string;
    thumbnailToken: string;
    storyboardToken: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// File Attachment Types (Client-side)
// ============================================================================

export type FileUploadStatus = 'pending' | 'uploading' | 'complete' | 'error';

export type FileType = 'image' | 'video' | 'document';

/**
 * Client-side file attachment representation
 * Used for displaying files in forms (both local and remote)
 */
export interface FileAttachment {
  /** Unique ID from backend after successful upload */
  id?: string;
  /** Local URI (before upload) or remote URL (after upload) */
  uri: string;
  /** Original filename */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type (e.g., 'image/jpeg', 'video/mp4', 'application/pdf') */
  mimeType: string;
  /** Type category for UI purposes */
  type: FileType;
  /** Thumbnail URI for videos (generated locally or from backend) */
  thumbnailUri?: string;
  /** Duration in seconds for videos */
  duration?: number;
  /** Width in pixels for images/videos */
  width?: number;
  /** Height in pixels for images/videos */
  height?: number;
  /** Upload status for tracking progress */
  uploadStatus?: FileUploadStatus;
  /** Upload progress (0-1) when status is 'uploading' */
  uploadProgress?: number;
  /** Error message if upload failed */
  errorMessage?: string;
  /** Whether this file exists on the server (vs local-only) */
  isRemote?: boolean;
  /** Mux playback ID for videos */
  playbackId?: string;
  /** Mux tokens for video playback */
  tokens?: {
    playbackToken: string;
    thumbnailToken: string;
    storyboardToken: string;
  };
}

/**
 * Converts an API file response to a client-side FileAttachment
 */
export function apiFileToAttachment(file: ApiFile): FileAttachment {
  const type: FileType = file.mimeType.startsWith('image/')
    ? 'image'
    : file.mimeType.startsWith('video/')
      ? 'video'
      : 'document';

  return {
    id: file.id,
    uri: file.downloadUrl || '',
    fileName: file.filename,
    fileSize: file.sizeBytes,
    mimeType: file.mimeType,
    type,
    thumbnailUri: file.thumbnailUrl || undefined,
    uploadStatus: file.uploadStatus === 'complete' ? 'complete' : 'pending',
    isRemote: true,
    playbackId: file.playbackId || undefined,
    tokens: file.tokens,
  };
}

// ============================================================================
// File Upload API Types
// ============================================================================

/**
 * Request body for initializing a file upload (R2 or Mux)
 */
export interface InitUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Response from POST /entries/:entryId/files/upload/init
 * For single uploads (files ≤100MB)
 */
export interface InitUploadResponse {
  fileId: string;
  uploadUrl: string;
  uploadMethod: 'PUT';
  expiresAt: string;
  /** For multipart uploads (>100MB) - not implemented in MVP */
  uploadId?: string;
  parts?: { partNumber: number; uploadUrl: string }[];
}

/**
 * Response from POST /entries/:entryId/files/video/init
 */
export interface InitVideoUploadResponse {
  fileId: string;
  uploadUrl: string;
}

/**
 * Response from GET /files/:id/download
 * Returns either R2 download URL or Mux playback info
 */
export interface DownloadUrlResponse {
  /** Presigned download URL for R2 files */
  downloadUrl?: string;
  /** Seconds until URL expires */
  expiresIn?: number;
  /** Mux playback URL for videos */
  playbackUrl?: string;
  /** Mux playback ID */
  playbackId?: string;
  /** Mux authentication tokens */
  tokens?: {
    playbackToken: string;
    thumbnailToken: string;
    storyboardToken: string;
  };
}

// ============================================================================
// Entry Types
// ============================================================================

/**
 * Base Entry type from API
 * Generic parameter T allows specifying the expected metadata type
 */
export interface Entry<T = Record<string, unknown>> {
  id: string;
  planId: string;
  /** Task key for the vault structure (e.g., "contacts.primary", "financial") */
  taskKey: string;
  /** Optional title - may be null since each entry type presents data differently */
  title: string | null;
  notes: string | null;
  sortOrder: number;
  metadata: T;
  /** Files attached to this entry (returned by backend) */
  files?: ApiFile[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request type for creating entries
 */
export interface CreateEntryRequest<T = Record<string, unknown>> {
  planId: string;
  taskKey: string;
  /** Optional title - may be omitted since each entry type presents data differently */
  title?: string;
  notes?: string;
  sortOrder?: number;
  metadata: T;
}

/**
 * Request type for updating entries
 */
export interface UpdateEntryRequest<T = Record<string, unknown>> {
  title?: string;
  notes?: string;
  sortOrder?: number;
  metadata?: Partial<T>;
}

/**
 * Query parameters for listing entries
 */
export interface ListEntriesParams {
  planId: string;
  taskKey?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface DeleteResponse {
  deleted: boolean;
}

// ============================================================================
// Plan Type
// ============================================================================

export interface Plan {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
