/**
 * API Module - Main exports
 */

// Types
export type {
  EncryptedEntryMetadata,
  EncryptedPayload,
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
  PlanEncryptionStatus,
  // Metadata schema types (shared by Entry and Wish)
  FieldSchema,
  MetadataSchema,
  // File types
  ApiFile,
  ApiFileStorageType,
  ApiFileUploadStatus,
  FileRole,
  FileAttachment,
  FileType,
  FileUploadStatus,
  InitUploadRequest,
  InitUploadResponse,
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
  // Messages types
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessagesListResponse,
  MessagesQuota,
  MessageToPersonMetadata,
  YourStoryMetadata,
  FutureMomentMetadata,
  // Progress types
  ProgressRecord,
  TaskProgressData,
  // Shared plan types
  SharedPlan,
  PlanResource,
  ResourcePermission,
  PlanPermissions,
  // Invitation types
  InvitationDetails,
  // Trusted contact types
  TrustedContact,
  TrustedContactAccessLevel,
  TrustedContactAccessTiming,
  TrustedContactStatus,
  CreateTrustedContactRequest,
  UpdateTrustedContactRequest,
} from './types';

// File utilities
export { apiFileToAttachment, apiFilesToAttachments } from './types';

// Access Invitations (public + authenticated)
export { fetchInvitationDetails, createAccessInvitationsService } from './accessInvitations';
export type { AccessInvitationsService } from './accessInvitations';

// Client
export { createApiClient, ApiClientError } from './client';
export type { ApiClient, GetTokenFn } from './client';

// Services
export { createEntriesService } from './entries';
export type { EntriesService } from './entries';

export { createPlansService } from './plans';
export type { PlansService } from './plans';

export { createSharedPlansService } from './sharedPlans';
export type { SharedPlansService } from './sharedPlans';

export { createFilesService } from './files';
export type { FilesService } from './files';

export { createEntitlementsService } from './entitlements';
export type { EntitlementsService } from './entitlements';

export { createWishesService } from './wishes';
export type { WishesService } from './wishes';

export { createMessagesService } from './messages';
export type { MessagesService } from './messages';

export { createProgressService } from './progress';
export type { ProgressService } from './progress';

export { createTrustedContactsService } from './trustedContacts';
export type { TrustedContactsService } from './trustedContacts';

export { createKeysService } from './keys';
export type {
  KeysService,
  SetupRequest,
  SetupResponse,
  UserKeyRecord,
  PublicKeyRecord,
  StoreDekRequest,
  RotateDekRequest,
  ManagedDekType,
  DekRecord,
  DekStatusResponse,
  DeviceLinkSessionResponse,
  DeviceLinkDepositRequest,
  DeviceLinkClaimResponse,
  EnableEscrowRequest,
  EnableEscrowResponse,
  RecoverRequest,
  RecoverResponse,
  PlanE2EEStatus,
} from './keys';

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
