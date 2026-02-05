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
  importance?: "critical" | "high" | "medium" | "low";
}

// ============================================================================
// File Types (Backend Response)
// ============================================================================

export type ApiFileStorageType = "r2" | "mux";
export type ApiFileUploadStatus =
  | "pending"
  | "uploading"
  | "complete"
  | "failed";

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

export type FileUploadStatus = "pending" | "uploading" | "complete" | "error";

export type FileType = "image" | "video" | "document";

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
  /** Whether this video is still processing on the server (Mux) */
  isProcessing?: boolean;
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
  const type: FileType = file.mimeType.startsWith("image/")
    ? "image"
    : file.mimeType.startsWith("video/")
      ? "video"
      : "document";

  // Videos are "processing" if they're on the server but not yet complete (Mux transcoding)
  const isProcessing = type === "video" && file.uploadStatus !== "complete";

  return {
    id: file.id,
    uri: file.downloadUrl || "",
    fileName: file.filename,
    fileSize: file.sizeBytes,
    mimeType: file.mimeType,
    type,
    thumbnailUri: file.thumbnailUrl || undefined,
    uploadStatus: file.uploadStatus === "complete" ? "complete" : "pending",
    isRemote: true,
    isProcessing,
    playbackId: file.playbackId || undefined,
    tokens: file.tokens,
  };
}

// ============================================================================
// File Upload API Types
// ============================================================================

/**
 * Request body for initializing a standard file upload (R2)
 */
export interface InitUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Request body for initializing a video upload (Mux)
 * Includes optional metadata fields that Mux supports for tracking
 */
export interface InitVideoUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /**
   * Metadata to associate with the Mux asset for easier tracking.
   * These are passed to Mux via the passthrough field and stored on the asset.
   */
  meta?: {
    /** External ID from your system (e.g., entry ID, user ID combination) */
    externalId?: string;
    /** ID of the user who uploaded the video */
    creatorId?: string;
    /** Human-readable title for the video */
    title?: string;
  };
  passthrough?: string;
}

/**
 * Response from POST /entries/:entryId/files/upload/init
 * For single uploads (files ≤100MB)
 */
export interface InitUploadResponse {
  fileId: string;
  uploadUrl: string;
  uploadMethod: "PUT";
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
// Metadata Schema Types (shared by Entry and Wish)
// ============================================================================

/**
 * Schema for a single field in the metadata display schema
 */
export interface FieldSchema {
  /** Human-readable display name */
  label: string;
  /** Display order (lower numbers first) */
  order: number;
  /** Optional: maps stored IDs to display labels (for selection fields) */
  valueLabels?: Record<string, string>;
}

/**
 * Display schema for metadata - describes how to render the data without frontend code
 * Used by both Entry and Wish models
 */
export interface MetadataSchema {
  /** Schema version for tracking changes */
  version: number;
  /** Map of field names to their display info */
  fields: Record<string, FieldSchema>;
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
  /** Display schema for rendering metadata (optional for backwards compatibility) */
  metadataSchema?: MetadataSchema;
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
  notes?: string | null;
  sortOrder?: number;
  metadata: T;
}

/**
 * Request type for updating entries
 */
export interface UpdateEntryRequest<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
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

/**
 * Quota information included in list responses
 */
export interface EntriesQuota {
  limit: number;
  current: number;
  remaining: number | null;
  unlimited: boolean;
}

/**
 * Response shape for listing entries
 */
export interface EntriesListResponse<T = Record<string, unknown>> {
  data: Entry<T>[];
  quota: EntriesQuota;
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

// ============================================================================
// Entitlement Types
// ============================================================================

/**
 * Subscription tier levels
 */
export type SubscriptionTier = "free" | "individual" | "family";

/**
 * Feature pillars in the app
 */
export type Pillar = "important_info" | "wishes" | "messages" | "family_access";

/**
 * Features that have quota limits
 */
export type QuotaFeature =
  | "entries"
  | "trusted_contacts"
  | "family_profiles"
  | "legacy_messages"
  | "storage_mb";

/**
 * Information about a quota limit
 */
export interface QuotaInfo {
  /** Identifier for the quota type */
  feature: QuotaFeature;
  /** Human-readable name (e.g., "important information items") */
  displayName: string;
  /** Maximum allowed for this feature (-1 for unlimited) */
  limit: number;
  /** Current usage count */
  current: number;
  /** Convenience flag indicating if limit === -1 */
  unlimited: boolean;
}

/**
 * User's current entitlement information
 */
export interface EntitlementInfo {
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Human-readable tier name (e.g., "Free", "Individual", "Family") */
  tierName: string;
  /** Marketing tagline for the tier */
  tierDescription: string;
  /** Pillars where the user can create and edit content */
  pillars: Pillar[];
  /** Pillars where the user can view content but cannot edit */
  viewOnlyPillars: Pillar[];
  /** Quota information for limited features */
  quotas: QuotaInfo[];
}

/**
 * Entitlement error codes from the API
 */
export type EntitlementErrorCode =
  | "PILLAR_LOCKED"
  | "PILLAR_VIEW_ONLY"
  | "QUOTA_EXCEEDED";

/**
 * Entitlement error response from API
 */
export interface EntitlementError {
  code: EntitlementErrorCode;
  message: string;
  details?: {
    pillar?: Pillar;
    feature?: QuotaFeature;
    limit?: number;
    current?: number;
  };
}

/**
 * Storage quota exceeded error from file upload endpoints
 * Returned with 403 status from /files/upload/init and /files/video/init
 */
export interface StorageQuotaError {
  statusCode: 403;
  error: "quota_exceeded";
  message: string;
  details: {
    feature: "storage_mb";
    tier: SubscriptionTier;
    /** Storage limit in MB */
    limit: number;
    /** Current storage used in MB */
    current: number;
    /** Size of requested file in MB */
    requested: number;
    /** Whether upgrading would help */
    upgradeRequired: boolean;
    /** Suggested tier to upgrade to */
    suggestedTier?: SubscriptionTier;
  };
}

// ============================================================================
// Wishes Metadata Types
// ============================================================================

/** What Matters Most - Care Preferences */
export interface WhatMattersMostMetadata {
  /** Selected value IDs from the reflection choices */
  values: string[];
}

/** Quality of Life - Care Preferences */
export interface QualityOfLifeMetadata {
  /** Selected condition IDs where user would not want aggressive treatment */
  conditions: string[];
}

/** Comfort vs Treatment - Care Preferences */
export interface ComfortVsTreatmentMetadata {
  /** Overall preference: 'comfort-first' | 'balanced' | 'treatment-first' | 'trust-team' */
  preference?: string;
  /** Pain management approach: 'full-relief' | 'balanced-relief' | 'minimal-meds' */
  painManagement?: string;
  /** Alertness importance: 'very' | 'somewhat' | 'not' */
  alertness?: string;
}

/** Advance Directive - Care Preferences */
export interface AdvanceDirectiveMetadata {
  /** Whether user has directive: 'yes' | 'in-progress' | 'no' */
  hasDirective?: string;
  /** Types of documents user has */
  documentTypes?: string[];
  /** Where documents are stored */
  location?: string;
  /** Healthcare proxy name */
  proxyName?: string;
  /** Healthcare proxy phone */
  proxyPhone?: string;
  /** Healthcare proxy relationship */
  proxyRelationship?: string;
}

/** End-of-Life Setting */
export interface EndOfLifeSettingMetadata {
  /** Preferred setting: 'home' | 'family-home' | 'hospice' | 'hospital' | 'flexible' */
  preferredSetting?: string;
  /** Notes about the preference */
  settingNotes?: string;
  /** Who should be present */
  visitors?: string;
  /** Music, readings, or atmosphere preferences */
  music?: string;
}

/** After-Death Preferences */
export interface AfterDeathMetadata {
  /** Body disposition: 'burial' | 'cremation' | 'green-burial' | 'donation' | 'flexible' | 'other' */
  disposition?: string;
  /** Specific wishes for disposition */
  specificWishes?: string;
  /** Pre-arrangement status: 'yes' | 'partial' | 'no' */
  prearranged?: string;
  /** Details of pre-arrangements */
  prearrangedDetails?: string;
}

/** Service Preferences - Memorial/Funeral */
export interface ServicePreferencesMetadata {
  /** Type of service: 'traditional-funeral' | 'celebration-of-life' | 'memorial' | 'graveside' | 'private' | 'none' | 'flexible' */
  serviceType?: string;
  /** Tone: 'solemn' | 'warm' | 'celebratory' | 'religious' | 'mixed' */
  tone?: string;
  /** Preferred location */
  location?: string;
  /** Music or song preferences */
  music?: string;
  /** Readings or poems */
  readings?: string;
  /** Who should speak */
  speakers?: string;
  /** Flower preferences */
  flowers?: string;
  /** Donation preferences in lieu of flowers */
  donations?: string;
  /** Things to avoid (open casket, certain songs, etc.) */
  avoidances?: string;
}

/** Organ Donation */
export interface OrganDonationMetadata {
  /** Decision: 'yes-all' | 'yes-specific' | 'research-only' | 'no' | 'undecided' */
  decision?: string;
  /** Specific organs if decision is 'yes-specific' */
  specificOrgans?: string;
  /** Registry status: 'yes' | 'no' | 'unsure' */
  onRegistry?: string;
}

/** What Loved Ones Should Know */
export interface LovedOnesKnowMetadata {
  /** Gratitude expressions */
  gratitude?: string;
  /** Regrets or apologies */
  regrets?: string;
  /** Wisdom to share */
  wisdom?: string;
  /** Favorite memories */
  memories?: string;
}

/** Faith & Spiritual Preferences */
export interface FaithPreferencesMetadata {
  /** Faith tradition: 'christian' | 'catholic' | 'jewish' | 'muslim' | 'buddhist' | 'hindu' | 'spiritual' | 'none' | 'other' */
  tradition?: string;
  /** Place of worship */
  congregation?: string;
  /** Religious leader name */
  leader?: string;
  /** Leader contact info */
  leaderContact?: string;
  /** Important rituals or customs */
  rituals?: string;
}

/** Hard Situations - Guidance for Conflict */
export interface HardSituationsMetadata {
  /** Guidance for disagreements */
  disagreements?: string;
  /** Primary decision-maker */
  decisionMaker?: string;
  /** Guidance for grief */
  conflictGuidance?: string;
  /** Grace or forgiveness to extend */
  grace?: string;
  /** What matters more than being "right" */
  priorities?: string;
}

// ============================================================================
// Wish Model (Same shape as Entry, but for wishes pillar)
// ============================================================================

/**
 * Wish type from API - same structure as Entry but for the Wishes pillar
 * Generic parameter T allows specifying the expected metadata type
 */
export interface Wish<T = Record<string, unknown>> {
  id: string;
  planId: string;
  /** Task key for the wishes structure (e.g., "wishes.carePrefs.whatMatters") */
  taskKey: string;
  /** Optional title */
  title: string | null;
  /** Free-form notes */
  notes: string | null;
  /** Sort order for manual ordering */
  sortOrder: number;
  /** Type-specific metadata */
  metadata: T;
  /** Display schema for rendering metadata without frontend code */
  metadataSchema: MetadataSchema;
  /** Files attached to this wish */
  files?: ApiFile[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Request type for creating wishes
 */
export interface CreateWishRequest<T = Record<string, unknown>> {
  planId: string;
  taskKey: string;
  title?: string;
  notes?: string | null;
  sortOrder?: number;
  metadata: T;
  /** Display schema for rendering metadata */
  metadataSchema: MetadataSchema;
}

/**
 * Request type for updating wishes
 */
export interface UpdateWishRequest<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  sortOrder?: number;
  metadata?: Partial<T>;
  /** Full replacement of display schema (if provided) */
  metadataSchema?: MetadataSchema;
}

/**
 * Quota information for wishes (same as entries)
 */
export interface WishesQuota {
  limit: number;
  current: number;
  remaining: number | null;
  unlimited: boolean;
}

/**
 * Response shape for listing wishes
 */
export interface WishesListResponse<T = Record<string, unknown>> {
  data: Wish<T>[];
  quota: WishesQuota;
}
