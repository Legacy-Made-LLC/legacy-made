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
