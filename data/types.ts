export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface FinancialAccount {
  id: string;
  accountName: string;
  institution: string;
  accountTypes: Array<
    'Checking' | 'Savings' | 'Retirement' | 'Investment' | 'Credit' | 'Loan' | 'Other'
  >;
  accountNumberLast4?: string;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  policyName: string;
  provider: string;
  policyNumber?: string;
  coverageAmount?: string;
  beneficiary?: string;
  notes?: string;
}

export interface LegalDocument {
  id: string;
  documentName: string;
  location: string;
  dateCreated?: string;
  notes?: string;
}

export interface HomeResponsibility {
  id: string;
  itemName: string;
  itemType: 'Property' | 'Vehicle' | 'Responsibility' | 'Other';
  details?: string;
  notes?: string;
}

export interface DigitalAccount {
  id: string;
  accountName: string;
  platform: string;
  username?: string;
  accessNotes?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Other';
  breed?: string;
  age?: string;
  veterinarian?: string;
  vetPhone?: string;
  careInstructions?: string;
  designatedCaretaker?: string;
  notes?: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  guidance: string;
  ionIcon: string;
  route: string;
  /** Data key used to look up item count from app state */
  stateKey?: 'contacts' | 'finances' | 'insurance' | 'documents' | 'homeResponsibilities' | 'digitalAccounts' | 'pets';
  /** Filter function name for subset counting (e.g., primary contacts vs all contacts) */
  filterType?: 'primary' | 'secondary';
}
