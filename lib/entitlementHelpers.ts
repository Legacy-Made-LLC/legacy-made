/**
 * Entitlement Helper Functions
 *
 * Utilities for handling entitlement errors and parsing API responses.
 */

import { ApiClientError } from '@/api/client';
import type {
  EntitlementError,
  EntitlementErrorCode,
  StorageQuotaError,
} from '@/api/types';

/**
 * Check if an error is an entitlement-related error
 */
export function isEntitlementError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  // 403 status with entitlement error codes
  if (error.statusCode === 403) {
    const parsed = parseEntitlementError(error);
    return parsed !== null;
  }

  return false;
}

/**
 * Extended error response that may include entitlement error fields
 */
interface ExtendedApiError {
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  details?: {
    pillar?: string;
    feature?: string;
    tier?: string;
    limit?: number;
    current?: number;
    requested?: number;
    upgradeRequired?: boolean;
    suggestedTier?: string;
  };
}

/**
 * Parse an API error to extract entitlement error details
 * Returns null if the error is not an entitlement error
 */
export function parseEntitlementError(error: unknown): EntitlementError | null {
  if (!(error instanceof ApiClientError)) {
    return null;
  }

  // Check if there's an original error with expected structure
  const originalError = error.originalError as ExtendedApiError | undefined;
  if (!originalError || typeof originalError !== 'object') {
    return null;
  }

  // Check for entitlement error codes (traditional format)
  const code = originalError.code;
  const validCodes: EntitlementErrorCode[] = [
    'PILLAR_LOCKED',
    'PILLAR_VIEW_ONLY',
    'QUOTA_EXCEEDED',
  ];

  if (code && validCodes.includes(code as EntitlementErrorCode)) {
    return {
      code: code as EntitlementErrorCode,
      message: originalError.message ?? 'Access denied',
      details: originalError.details as EntitlementError['details'],
    };
  }

  // Check for storage quota error format (error: "quota_exceeded")
  if (originalError.error === 'quota_exceeded' && originalError.details?.feature === 'storage_mb') {
    return {
      code: 'QUOTA_EXCEEDED',
      message: originalError.message ?? 'Storage quota exceeded',
      details: {
        feature: 'storage_mb',
        limit: originalError.details.limit,
        current: originalError.details.current,
      },
    };
  }

  return null;
}

/**
 * Get a user-friendly message for an entitlement error
 */
export function getEntitlementErrorMessage(error: unknown): string {
  const parsed = parseEntitlementError(error);

  if (!parsed) {
    return 'Something went wrong. Please try again.';
  }

  switch (parsed.code) {
    case 'PILLAR_LOCKED':
      return 'This feature is available with an upgraded plan.';

    case 'PILLAR_VIEW_ONLY':
      return 'You can view this content, but editing requires an upgraded plan.';

    case 'QUOTA_EXCEEDED': {
      // Check if this is a storage quota error
      if (parsed.details?.feature === 'storage_mb') {
        return 'This file would exceed your storage limit. Upgrade your plan for more storage.';
      }

      const limit = parsed.details?.limit;
      if (limit !== undefined) {
        return `You have reached your limit of ${limit} items. Upgrade your plan to add more.`;
      }
      return "You have reached your limit. Upgrade your plan to add more.";
    }

    default:
      return 'Access denied. Please check your subscription.';
  }
}

/**
 * Check if a quota error was thrown
 */
export function isQuotaExceededError(error: unknown): boolean {
  const parsed = parseEntitlementError(error);
  return parsed?.code === 'QUOTA_EXCEEDED';
}

/**
 * Check if a storage quota error was thrown
 */
export function isStorageQuotaError(error: unknown): boolean {
  const parsed = parseEntitlementError(error);
  return parsed?.code === 'QUOTA_EXCEEDED' && parsed?.details?.feature === 'storage_mb';
}

/**
 * Parse storage quota error details from an API error
 * Returns null if not a storage quota error
 */
export function parseStorageQuotaError(error: unknown): StorageQuotaError['details'] | null {
  if (!(error instanceof ApiClientError)) {
    return null;
  }

  const originalError = error.originalError as ExtendedApiError | undefined;
  if (!originalError || typeof originalError !== 'object') {
    return null;
  }

  if (originalError.error !== 'quota_exceeded' || originalError.details?.feature !== 'storage_mb') {
    return null;
  }

  return originalError.details as StorageQuotaError['details'];
}

/**
 * Format bytes to human-readable MB string
 */
export function formatStorageMB(mb: number): string {
  if (mb >= 1000) {
    return `${(mb / 1000).toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}
