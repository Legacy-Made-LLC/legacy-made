/**
 * API Module - Main exports
 */

// Types
export type {
  EntryCategory,
  EntryPriority,
  Entry,
  ContactMetadata,
  FinancialMetadata,
  InsuranceMetadata,
  LegalDocumentMetadata,
  HomeMetadata,
  DigitalAccessMetadata,
  EntryMetadata,
  ContactEntry,
  FinancialEntry,
  InsuranceEntry,
  LegalDocumentEntry,
  HomeEntry,
  DigitalAccessEntry,
  CreateEntryRequest,
  UpdateEntryRequest,
  ListEntriesParams,
  ApiError,
  DeleteResponse,
  Plan,
} from './types';

// Client
export { createApiClient, ApiClientError } from './client';
export type { ApiClient, GetTokenFn } from './client';

// Services
export { createEntriesService } from './entries';
export type { EntriesService } from './entries';

export { createPlansService } from './plans';
export type { PlansService } from './plans';

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
