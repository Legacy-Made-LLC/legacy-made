/**
 * API Module - Main exports
 */

// Types
export type {
  Entry,
  ContactMetadata,
  FinancialMetadata,
  InsuranceMetadata,
  LegalDocumentMetadata,
  HomeMetadata,
  DigitalAccessMetadata,
  CreateEntryRequest,
  UpdateEntryRequest,
  ListEntriesParams,
  ApiError,
  DeleteResponse,
  Plan,
  // Metadata schema types (shared by Entry and Wish)
  FieldSchema,
  MetadataSchema,
  // File types
  ApiFile,
  ApiFileStorageType,
  ApiFileUploadStatus,
  FileAttachment,
  FileType,
  FileUploadStatus,
  InitUploadRequest,
  InitUploadResponse,
  InitVideoUploadRequest,
  InitVideoUploadResponse,
  DownloadUrlResponse,
  // Entitlement types
  SubscriptionTier,
  Pillar,
  QuotaFeature,
  QuotaInfo,
  EntitlementInfo,
  EntitlementErrorCode,
  EntitlementError,
  // Wishes types
  Wish,
  CreateWishRequest,
  UpdateWishRequest,
  WishesListResponse,
  WishesQuota,
  WhatMattersMostMetadata,
  QualityOfLifeMetadata,
  ComfortVsTreatmentMetadata,
  AdvanceDirectiveMetadata,
  EndOfLifeSettingMetadata,
  AfterDeathMetadata,
  ServicePreferencesMetadata,
  OrganDonationMetadata,
  LovedOnesKnowMetadata,
  FaithPreferencesMetadata,
  HardSituationsMetadata,
} from './types';

// File utilities
export { apiFileToAttachment } from './types';

// Client
export { createApiClient, ApiClientError } from './client';
export type { ApiClient, GetTokenFn } from './client';

// Services
export { createEntriesService } from './entries';
export type { EntriesService } from './entries';

export { createPlansService } from './plans';
export type { PlansService } from './plans';

export { createFilesService } from './files';
export type { FilesService } from './files';

export { createEntitlementsService } from './entitlements';
export type { EntitlementsService } from './entitlements';

export { createWishesService } from './wishes';
export type { WishesService } from './wishes';

// Mappers
export {
  // Individual mappers
  entryToContact,
  contactToCreateRequest,
  entryToFinancialAccount,
  financialAccountToCreateRequest,
  entryToInsurancePolicy,
  insurancePolicyToCreateRequest,
  entryToLegalDocument,
  legalDocumentToCreateRequest,
  entryToHomeResponsibility,
  homeResponsibilityToCreateRequest,
  entryToDigitalAccount,
  digitalAccountToCreateRequest,
  // Batch mappers
  entriesToContacts,
  entriesToFinancialAccounts,
  entriesToInsurancePolicies,
  entriesToLegalDocuments,
  entriesToHomeResponsibilities,
  entriesToDigitalAccounts,
} from './mappers';

// Re-export useApi hook
export { useApi } from './useApi';
