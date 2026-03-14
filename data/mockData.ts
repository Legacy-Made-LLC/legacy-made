import type {
  Contact,
  FinancialAccount,
  InsurancePolicy,
  LegalDocument,
  HomeResponsibility,
  DigitalAccount,
} from './types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Margaret Chen',
    relationship: 'Sister',
    phone: '(415) 555-0142',
    email: 'margaret.chen@email.com',
    notes:
      'She has a copy of my house keys and knows where important documents are kept. Contact her first for anything related to the house.',
    isPrimary: true,
  },
  {
    id: '2',
    name: 'David Park, Esq.',
    relationship: 'Attorney',
    phone: '(415) 555-0198',
    email: 'dpark@parklegalgroup.com',
    notes:
      'Handles my estate planning. Office is at 450 Sutter St, Suite 1200.',
  },
  {
    id: '3',
    name: 'Rachel Thompson',
    relationship: 'Financial Advisor',
    phone: '(650) 555-0167',
    email: 'rthompson@wealthpartners.com',
    notes:
      'Has been managing my investments since 2018. Knows my full financial picture.',
  },
];

export const mockFinances: FinancialAccount[] = [
  {
    id: '1',
    accountName: 'Primary Checking',
    institution: 'Chase Bank',
    accountTypes: ['Checking'],
    accountNumberLast4: '4521',
    notes:
      'Main account for bills and daily expenses. Auto-pay is set up for utilities.',
  },
  {
    id: '2',
    accountName: 'Emergency Savings',
    institution: 'Ally Bank',
    accountTypes: ['Savings'],
    accountNumberLast4: '8834',
    notes: 'Six months of expenses. Only touch for true emergencies.',
  },
  {
    id: '3',
    accountName: 'Retirement 401(k)',
    institution: 'Fidelity',
    accountTypes: ['Retirement'],
    accountNumberLast4: '2290',
    notes: 'Through employer. Margaret is listed as beneficiary.',
  },
  {
    id: '4',
    accountName: 'Brokerage Account',
    institution: 'Vanguard',
    accountTypes: ['Investment'],
    accountNumberLast4: '6612',
    notes:
      'Index funds and some individual stocks. Login info in password manager.',
  },
  {
    id: '5',
    accountName: 'Credit Card',
    institution: 'American Express',
    accountTypes: ['Credit'],
    accountNumberLast4: '3001',
    notes: 'Primary card for most purchases. Pay in full each month.',
  },
];

export const mockInsurance: InsurancePolicy[] = [
  {
    id: '1',
    policyName: 'Life Insurance',
    provider: 'Northwestern Mutual',
    policyNumber: 'LF-2847592',
    coverageAmount: '$500,000',
    beneficiary: 'Margaret Chen',
    notes: 'Term policy, expires 2035. Premium is auto-drafted monthly.',
  },
  {
    id: '2',
    policyName: 'Health Insurance',
    provider: 'Blue Cross Blue Shield',
    policyNumber: 'BCB-449281',
    notes: 'Through employer. Coverage details in benefits portal.',
  },
  {
    id: '3',
    policyName: 'Homeowners Insurance',
    provider: 'State Farm',
    policyNumber: 'HO-8847123',
    notes: 'Agent: Mike Reynolds, (415) 555-0134. Policy renews each March.',
  },
];

export const mockDocuments: LegalDocument[] = [
  {
    id: '1',
    documentName: 'Last Will and Testament',
    location: 'Safe deposit box at Chase Bank, downtown branch',
    dateCreated: '2022-03-15',
    notes:
      'David Park has a copy. Margaret knows the safe deposit box location.',
  },
  {
    id: '2',
    documentName: 'Revocable Living Trust',
    location: 'Safe deposit box at Chase Bank',
    dateCreated: '2022-03-15',
    notes: 'Created at same time as will. David Park is the trustee.',
  },
  {
    id: '3',
    documentName: 'Healthcare Power of Attorney',
    location: 'Filing cabinet, home office, top drawer',
    dateCreated: '2022-03-15',
    notes: 'Margaret Chen is designated. Copy also with Dr. Williams.',
  },
  {
    id: '4',
    documentName: 'Financial Power of Attorney',
    location: 'Filing cabinet, home office, top drawer',
    dateCreated: '2022-03-15',
    notes: 'Margaret Chen is designated.',
  },
];

export const mockHomeResponsibilities: HomeResponsibility[] = [
  {
    id: '1',
    itemName: 'Primary Residence',
    itemType: 'Property',
    details: '742 Evergreen Terrace, San Francisco, CA',
    notes:
      'Mortgage with Wells Fargo, payment auto-drafted on the 1st. Spare key with neighbor at 744 (Susan Miller).',
  },
  {
    id: '2',
    itemName: 'Honda CR-V (2021)',
    itemType: 'Vehicle',
    details: 'License plate: 8ABC123',
    notes:
      'Loan paid off. Title in filing cabinet. Regular maintenance at Honda of San Francisco.',
  },
  {
    id: '3',
    itemName: 'Storage Unit',
    itemType: 'Property',
    details: 'CubeSmart, Unit #247, 1800 Market St',
    notes:
      'Contains old furniture, holiday decorations, photo albums. Payment auto-drafted.',
  },
  {
    id: '4',
    itemName: 'Pet Care - Luna (cat)',
    itemType: 'Responsibility',
    details: 'Indoor cat, 6 years old',
    notes:
      'Vet: Bay Area Pet Hospital, Dr. Sarah Kim. Margaret has agreed to take her.',
  },
];

export const mockDigitalAccounts: DigitalAccount[] = [
  {
    id: '1',
    accountName: 'Primary Email',
    platform: 'Gmail',
    username: 'firstname.lastname@gmail.com',
    accessNotes: 'Password in 1Password. Recovery email is work address.',
    importance: 'critical',
  },
  {
    id: '2',
    accountName: 'Password Manager',
    platform: '1Password',
    username: 'firstname.lastname@gmail.com',
    accessNotes:
      'Master password written down in home safe. Emergency kit shared with Margaret.',
    importance: 'critical',
  },
  {
    id: '3',
    accountName: 'Apple ID',
    platform: 'Apple',
    username: 'firstname.lastname@icloud.com',
    accessNotes:
      'Controls iPhone, MacBook, and iCloud photos. Set up Legacy Contact for Margaret.',
    importance: 'high',
  },
  {
    id: '4',
    accountName: 'Social Media',
    platform: 'Facebook',
    username: 'firstname.lastname',
    accessNotes:
      'Memorialization settings configured. Margaret designated as legacy contact.',
    importance: 'low',
  },
];
