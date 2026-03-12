/**
 * Mappers - Convert between API Entry format and app's existing types
 *
 * This allows the existing UI to continue working with the current types
 * while fetching data from the API.
 */

import type {
  Entry,
  CreateEntryRequest,
  MetadataSchema,
  ContactMetadata,
  FinancialMetadata,
  InsuranceMetadata,
  LegalDocumentMetadata,
  HomeMetadata,
  DigitalAccessMetadata,
} from './types';

// ============================================================================
// Metadata Schemas for Mappers
// ============================================================================

const CONTACT_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    firstName: { label: "First Name", order: 1 },
    lastName: { label: "Last Name", order: 2 },
    relationship: { label: "Relationship", order: 3 },
    phone: { label: "Phone", order: 4 },
    email: { label: "Email", order: 5 },
    reason: { label: "Why This Person?", order: 6 },
    isPrimary: { label: "Contact First", order: 7, valueLabels: { true: "Yes", false: "No" } },
  },
};

const FINANCIAL_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    institution: { label: "Institution", order: 1 },
    accountType: { label: "Account Type", order: 2 },
    accountNumber: { label: "Account Number (last 4)", order: 3 },
    notes: { label: "Notes", order: 4 },
  },
};

const INSURANCE_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    provider: { label: "Provider", order: 1 },
    policyType: { label: "Policy Type", order: 2 },
    policyNumber: { label: "Policy Number", order: 3 },
    coverageDetails: { label: "Coverage Details", order: 4 },
  },
};

const DOCUMENT_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    documentType: { label: "Document Type", order: 1 },
    location: { label: "Location", order: 2 },
    notes: { label: "Notes", order: 3 },
  },
};

const HOME_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    responsibilityType: { label: "Type", order: 1 },
    accountInfo: { label: "Details", order: 2 },
    notes: { label: "Notes", order: 3 },
  },
};

const DIGITAL_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    service: { label: "Service", order: 1 },
    username: { label: "Username", order: 2 },
    importance: { label: "Importance", order: 3, valueLabels: { critical: "Critical", high: "High", medium: "Medium", low: "Low" } },
    notes: { label: "Notes", order: 4 },
  },
};

import type {
  Contact,
  FinancialAccount,
  InsurancePolicy,
  LegalDocument,
  HomeResponsibility,
  DigitalAccount,
} from '@/data/types';

// ============================================================================
// Contact Mappers
// ============================================================================

/**
 * Convert API Entry to app Contact type
 */
export function entryToContact(entry: Entry<ContactMetadata>): Contact {
  const { metadata } = entry;
  return {
    id: entry.id,
    name: `${metadata.firstName} ${metadata.lastName}`.trim(),
    relationship: metadata.relationship,
    phone: metadata.phone,
    email: metadata.email,
    notes: metadata.reason || entry.notes || undefined,
    isPrimary: metadata.isPrimary ?? false,
  };
}

/**
 * Convert app Contact to API CreateEntryRequest
 */
export function contactToCreateRequest(
  contact: Omit<Contact, 'id'>,
  planId: string
): CreateEntryRequest<ContactMetadata> {
  // Split name into first and last
  const nameParts = contact.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    planId,
    taskKey: contact.isPrimary ? 'contacts.primary' : 'contacts.backup',
    title: contact.name,
    notes: contact.notes,
    metadata: {
      firstName,
      lastName,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      reason: contact.notes,
      isPrimary: contact.isPrimary,
    },
    metadataSchema: CONTACT_SCHEMA,
  };
}

// ============================================================================
// Financial Account Mappers
// ============================================================================

/**
 * Convert API Entry to app FinancialAccount type
 */
export function entryToFinancialAccount(entry: Entry<FinancialMetadata>): FinancialAccount {
  const { metadata } = entry;
  return {
    id: entry.id,
    accountName: entry.title || '',
    institution: metadata.institution,
    accountType: mapAccountType(metadata.accountType),
    accountNumberLast4: metadata.accountNumber,
    notes: metadata.notes || entry.notes || undefined,
  };
}

/**
 * Map API account type string to app's union type
 */
function mapAccountType(
  type: string
): FinancialAccount['accountType'] {
  const validTypes = ['Checking', 'Savings', 'Retirement', 'Investment', 'Credit', 'Loan', 'Other'];
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return validTypes.includes(normalized)
    ? (normalized as FinancialAccount['accountType'])
    : 'Other';
}

/**
 * Convert app FinancialAccount to API CreateEntryRequest
 */
export function financialAccountToCreateRequest(
  account: Omit<FinancialAccount, 'id'>,
  planId: string
): CreateEntryRequest<FinancialMetadata> {
  return {
    planId,
    taskKey: 'financial',
    title: account.accountName,
    notes: account.notes,
    metadata: {
      institution: account.institution,
      accountType: account.accountType,
      accountNumber: account.accountNumberLast4,
      notes: account.notes,
    },
    metadataSchema: FINANCIAL_SCHEMA,
  };
}

// ============================================================================
// Insurance Policy Mappers
// ============================================================================

/**
 * Convert API Entry to app InsurancePolicy type
 */
export function entryToInsurancePolicy(entry: Entry<InsuranceMetadata>): InsurancePolicy {
  const { metadata } = entry;
  return {
    id: entry.id,
    policyName: entry.title || '',
    provider: metadata.provider,
    policyNumber: metadata.policyNumber,
    coverageAmount: metadata.coverageDetails,
    beneficiary: undefined, // Not stored in API metadata currently
    notes: entry.notes || undefined,
  };
}

/**
 * Convert app InsurancePolicy to API CreateEntryRequest
 */
export function insurancePolicyToCreateRequest(
  policy: Omit<InsurancePolicy, 'id'>,
  planId: string
): CreateEntryRequest<InsuranceMetadata> {
  return {
    planId,
    taskKey: 'insurance',
    title: policy.policyName,
    notes: policy.notes,
    metadata: {
      provider: policy.provider,
      policyType: policy.policyName, // Use policy name as type
      policyNumber: policy.policyNumber,
      coverageDetails: policy.coverageAmount,
    },
    metadataSchema: INSURANCE_SCHEMA,
  };
}

// ============================================================================
// Legal Document Mappers
// ============================================================================

/**
 * Convert API Entry to app LegalDocument type
 */
export function entryToLegalDocument(entry: Entry<LegalDocumentMetadata>): LegalDocument {
  const { metadata } = entry;
  return {
    id: entry.id,
    documentName: entry.title || '',
    location: metadata.location,
    dateCreated: entry.createdAt ? entry.createdAt.split('T')[0] : undefined,
    notes: metadata.notes || entry.notes || undefined,
  };
}

/**
 * Convert app LegalDocument to API CreateEntryRequest
 */
export function legalDocumentToCreateRequest(
  doc: Omit<LegalDocument, 'id'>,
  planId: string
): CreateEntryRequest<LegalDocumentMetadata> {
  return {
    planId,
    taskKey: 'documents',
    title: doc.documentName,
    notes: doc.notes,
    metadata: {
      documentType: doc.documentName,
      location: doc.location,
      notes: doc.notes,
    },
    metadataSchema: DOCUMENT_SCHEMA,
  };
}

// ============================================================================
// Home Responsibility Mappers
// ============================================================================

/**
 * Convert API Entry to app HomeResponsibility type
 */
export function entryToHomeResponsibility(entry: Entry<HomeMetadata>): HomeResponsibility {
  const { metadata } = entry;
  return {
    id: entry.id,
    itemName: entry.title || '',
    itemType: mapItemType(metadata.responsibilityType),
    details: metadata.accountInfo || metadata.provider,
    notes: metadata.notes || entry.notes || undefined,
  };
}

/**
 * Map API responsibility type to app's union type
 */
function mapItemType(type: string): HomeResponsibility['itemType'] {
  const typeMap: Record<string, HomeResponsibility['itemType']> = {
    property: 'Property',
    vehicle: 'Vehicle',
    responsibility: 'Responsibility',
    other: 'Other',
  };
  return typeMap[type.toLowerCase()] || 'Other';
}

/**
 * Convert app HomeResponsibility to API CreateEntryRequest
 */
export function homeResponsibilityToCreateRequest(
  item: Omit<HomeResponsibility, 'id'>,
  planId: string
): CreateEntryRequest<HomeMetadata> {
  return {
    planId,
    taskKey: 'property',
    title: item.itemName,
    notes: item.notes,
    metadata: {
      responsibilityType: item.itemType.toLowerCase(),
      accountInfo: item.details,
      notes: item.notes,
    },
    metadataSchema: HOME_SCHEMA,
  };
}

// ============================================================================
// Digital Account Mappers
// ============================================================================

/**
 * Convert API Entry to app DigitalAccount type
 */
export function entryToDigitalAccount(entry: Entry<DigitalAccessMetadata>): DigitalAccount {
  const { metadata } = entry;
  return {
    id: entry.id,
    accountName: entry.title || '',
    platform: metadata.service,
    username: metadata.username,
    accessNotes: metadata.notes || entry.notes || undefined,
    importance: metadata.importance ?? 'low',
  };
}

/**
 * Convert app DigitalAccount to API CreateEntryRequest
 */
export function digitalAccountToCreateRequest(
  account: Omit<DigitalAccount, 'id'>,
  planId: string
): CreateEntryRequest<DigitalAccessMetadata> {
  return {
    planId,
    taskKey: 'digital',
    title: account.accountName,
    notes: account.accessNotes,
    metadata: {
      service: account.platform,
      username: account.username,
      notes: account.accessNotes,
      importance: account.importance,
    },
    metadataSchema: DIGITAL_SCHEMA,
  };
}

// ============================================================================
// Batch Mappers (for converting lists)
// ============================================================================

export function entriesToContacts(entries: Entry<ContactMetadata>[]): Contact[] {
  return entries.map(entryToContact);
}

export function entriesToFinancialAccounts(entries: Entry<FinancialMetadata>[]): FinancialAccount[] {
  return entries.map(entryToFinancialAccount);
}

export function entriesToInsurancePolicies(entries: Entry<InsuranceMetadata>[]): InsurancePolicy[] {
  return entries.map(entryToInsurancePolicy);
}

export function entriesToLegalDocuments(entries: Entry<LegalDocumentMetadata>[]): LegalDocument[] {
  return entries.map(entryToLegalDocument);
}

export function entriesToHomeResponsibilities(entries: Entry<HomeMetadata>[]): HomeResponsibility[] {
  return entries.map(entryToHomeResponsibility);
}

export function entriesToDigitalAccounts(entries: Entry<DigitalAccessMetadata>[]): DigitalAccount[] {
  return entries.map(entryToDigitalAccount);
}
