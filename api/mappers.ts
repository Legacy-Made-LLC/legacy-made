/**
 * Mappers - Convert between API Entry format and app's existing types
 *
 * This allows the existing UI to continue working with the current types
 * while fetching data from the API.
 */

import type {
  Entry,
  ContactMetadata,
  FinancialMetadata,
  InsuranceMetadata,
  LegalDocumentMetadata,
  HomeMetadata,
  DigitalAccessMetadata,
  CreateEntryRequest,
} from './types';

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
    isPrimary: entry.priority === 'primary',
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
    category: 'contact',
    title: contact.name,
    notes: contact.notes,
    priority: contact.isPrimary ? 'primary' : undefined,
    metadata: {
      firstName,
      lastName,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      reason: contact.notes,
    },
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
    accountName: entry.title,
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
    category: 'financial',
    title: account.accountName,
    notes: account.notes,
    metadata: {
      institution: account.institution,
      accountType: account.accountType,
      accountNumber: account.accountNumberLast4,
      notes: account.notes,
    },
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
    policyName: entry.title,
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
    category: 'insurance',
    title: policy.policyName,
    notes: policy.notes,
    metadata: {
      provider: policy.provider,
      policyType: policy.policyName, // Use policy name as type
      policyNumber: policy.policyNumber,
      coverageDetails: policy.coverageAmount,
    },
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
    documentName: entry.title,
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
    category: 'legal_document',
    title: doc.documentName,
    notes: doc.notes,
    metadata: {
      documentType: doc.documentName,
      location: doc.location,
      notes: doc.notes,
    },
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
    itemName: entry.title,
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
    category: 'home',
    title: item.itemName,
    notes: item.notes,
    metadata: {
      responsibilityType: item.itemType.toLowerCase(),
      accountInfo: item.details,
      notes: item.notes,
    },
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
    accountName: entry.title,
    platform: metadata.service,
    username: metadata.username,
    accessNotes: metadata.notes || entry.notes || undefined,
    importance: mapImportance(entry.priority),
  };
}

/**
 * Map API priority to app's importance level
 */
function mapImportance(priority: string | null): DigitalAccount['importance'] {
  switch (priority) {
    case 'primary':
      return 'critical';
    case 'secondary':
      return 'high';
    case 'backup':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Map app importance to API priority
 */
function importanceToPriority(importance: DigitalAccount['importance']): 'primary' | 'secondary' | 'backup' | undefined {
  switch (importance) {
    case 'critical':
      return 'primary';
    case 'high':
      return 'secondary';
    case 'medium':
      return 'backup';
    default:
      return undefined;
  }
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
    category: 'digital_access',
    title: account.accountName,
    notes: account.accessNotes,
    priority: importanceToPriority(account.importance),
    metadata: {
      service: account.platform,
      username: account.username,
      notes: account.accessNotes,
    },
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
