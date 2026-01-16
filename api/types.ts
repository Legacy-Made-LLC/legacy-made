/**
 * API Types - Match the backend's Entry model and metadata schemas
 */

// Entry categories as defined in the API
export type EntryCategory =
  | 'contact'
  | 'financial'
  | 'insurance'
  | 'legal_document'
  | 'home'
  | 'digital_access';

// Priority levels for entries
export type EntryPriority = 'primary' | 'secondary' | 'backup';

// Category-specific metadata types

export interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
  address?: string;
  reason?: string;
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
}

// Union type for all metadata
export type EntryMetadata =
  | ContactMetadata
  | FinancialMetadata
  | InsuranceMetadata
  | LegalDocumentMetadata
  | HomeMetadata
  | DigitalAccessMetadata;

// Base Entry type from API
export interface Entry<T extends EntryMetadata = EntryMetadata> {
  id: string;
  planId: string;
  category: EntryCategory;
  title: string;
  notes: string | null;
  priority: EntryPriority | null;
  sortOrder: number;
  metadata: T;
  createdAt: string;
  updatedAt: string;
}

// Typed entries for each category
export type ContactEntry = Entry<ContactMetadata> & { category: 'contact' };
export type FinancialEntry = Entry<FinancialMetadata> & { category: 'financial' };
export type InsuranceEntry = Entry<InsuranceMetadata> & { category: 'insurance' };
export type LegalDocumentEntry = Entry<LegalDocumentMetadata> & { category: 'legal_document' };
export type HomeEntry = Entry<HomeMetadata> & { category: 'home' };
export type DigitalAccessEntry = Entry<DigitalAccessMetadata> & { category: 'digital_access' };

// Request types for creating entries
export interface CreateEntryRequest<T extends EntryMetadata = EntryMetadata> {
  planId: string;
  category: EntryCategory;
  title: string;
  notes?: string;
  priority?: EntryPriority;
  sortOrder?: number;
  metadata: T;
}

// Request types for updating entries
export interface UpdateEntryRequest<T extends EntryMetadata = EntryMetadata> {
  title?: string;
  notes?: string;
  priority?: EntryPriority | null;
  sortOrder?: number;
  metadata?: Partial<T>;
}

// Query parameters for listing entries
export interface ListEntriesParams {
  planId: string;
  category?: EntryCategory;
}

// API response types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface DeleteResponse {
  deleted: boolean;
}

// Plan type (for future use)
export interface Plan {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
