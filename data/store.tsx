import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  Contact,
  FinancialAccount,
  InsurancePolicy,
  LegalDocument,
  HomeResponsibility,
  DigitalAccount,
} from './types';
import { usePlan } from './PlanProvider';
import {
  useApi,
  entriesToContacts,
  entriesToFinancialAccounts,
  entriesToInsurancePolicies,
  entriesToLegalDocuments,
  entriesToHomeResponsibilities,
  entriesToDigitalAccounts,
  contactToCreateRequest,
  financialAccountToCreateRequest,
  insurancePolicyToCreateRequest,
  legalDocumentToCreateRequest,
  homeResponsibilityToCreateRequest,
  digitalAccountToCreateRequest,
  entryToContact,
  entryToFinancialAccount,
  entryToInsurancePolicy,
  entryToLegalDocument,
  entryToHomeResponsibility,
  entryToDigitalAccount,
  type ContactMetadata,
  type FinancialMetadata,
  type InsuranceMetadata,
  type LegalDocumentMetadata,
  type HomeMetadata,
  type DigitalAccessMetadata,
} from '@/api';

interface AppState {
  contacts: Contact[];
  finances: FinancialAccount[];
  insurance: InsurancePolicy[];
  documents: LegalDocument[];
  homeResponsibilities: HomeResponsibility[];
  digitalAccounts: DigitalAccount[];
}

interface AppContextType {
  state: AppState;
  /** Whether data is being loaded from the API */
  isLoading: boolean;
  /** Error message if data fetch failed */
  error: string | null;
  /** Refresh all data from the API */
  refresh: () => Promise<void>;
  // Contacts
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContact: (id: string) => Contact | undefined;
  // Finances
  addFinance: (account: Omit<FinancialAccount, 'id'>) => Promise<void>;
  updateFinance: (id: string, account: Partial<FinancialAccount>) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
  getFinance: (id: string) => FinancialAccount | undefined;
  // Insurance
  addInsurance: (policy: Omit<InsurancePolicy, 'id'>) => Promise<void>;
  updateInsurance: (id: string, policy: Partial<InsurancePolicy>) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  getInsurance: (id: string) => InsurancePolicy | undefined;
  // Documents
  addDocument: (doc: Omit<LegalDocument, 'id'>) => Promise<void>;
  updateDocument: (id: string, doc: Partial<LegalDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => LegalDocument | undefined;
  // Home Responsibilities
  addHomeResponsibility: (item: Omit<HomeResponsibility, 'id'>) => Promise<void>;
  updateHomeResponsibility: (id: string, item: Partial<HomeResponsibility>) => Promise<void>;
  deleteHomeResponsibility: (id: string) => Promise<void>;
  getHomeResponsibility: (id: string) => HomeResponsibility | undefined;
  // Digital Accounts
  addDigitalAccount: (account: Omit<DigitalAccount, 'id'>) => Promise<void>;
  updateDigitalAccount: (id: string, account: Partial<DigitalAccount>) => Promise<void>;
  deleteDigitalAccount: (id: string) => Promise<void>;
  getDigitalAccount: (id: string) => DigitalAccount | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const emptyState: AppState = {
  contacts: [],
  finances: [],
  insurance: [],
  documents: [],
  homeResponsibilities: [],
  digitalAccounts: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { planId } = usePlan();
  const { entries } = useApi();

  const [state, setState] = useState<AppState>(emptyState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from the API
  const fetchAllData = useCallback(async () => {
    if (!planId) {
      setState(emptyState);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all categories in parallel
      const [
        contactEntries,
        financialEntries,
        insuranceEntries,
        documentEntries,
        homeEntries,
        digitalEntries,
      ] = await Promise.all([
        entries.listContacts(planId),
        entries.listFinancial(planId),
        entries.listInsurance(planId),
        entries.listLegalDocuments(planId),
        entries.listHome(planId),
        entries.listDigitalAccess(planId),
      ]);

      setState({
        contacts: entriesToContacts(contactEntries),
        finances: entriesToFinancialAccounts(financialEntries),
        insurance: entriesToInsurancePolicies(insuranceEntries),
        documents: entriesToLegalDocuments(documentEntries),
        homeResponsibilities: entriesToHomeResponsibilities(homeEntries),
        digitalAccounts: entriesToDigitalAccounts(digitalEntries),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [planId, entries]);

  // Fetch data when planId changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ============================================================================
  // Contacts CRUD
  // ============================================================================

  const addContact = useCallback(
    async (contact: Omit<Contact, 'id'>) => {
      if (!planId) return;

      const request = contactToCreateRequest(contact, planId);
      const entry = await entries.create<ContactMetadata>(request);
      const newContact = entryToContact(entry);

      setState((prev) => ({
        ...prev,
        contacts: [...prev.contacts, newContact],
      }));
    },
    [planId, entries]
  );

  const updateContact = useCallback(
    async (id: string, contact: Partial<Contact>) => {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...contact } : c)),
      }));

      try {
        await entries.update(id, {
          title: contact.name,
          notes: contact.notes,
          priority: contact.isPrimary ? 'primary' : undefined,
          metadata: {
            ...(contact.name && {
              firstName: contact.name.split(' ')[0] || '',
              lastName: contact.name.split(' ').slice(1).join(' ') || '',
            }),
            ...(contact.relationship && { relationship: contact.relationship }),
            ...(contact.phone && { phone: contact.phone }),
            ...(contact.email && { email: contact.email }),
            ...(contact.notes && { reason: contact.notes }),
          },
        });
      } catch {
        // Revert on error - refetch data
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((c) => c.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        // Revert on error - refetch data
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getContact = useCallback(
    (id: string) => state.contacts.find((c) => c.id === id),
    [state.contacts]
  );

  // ============================================================================
  // Finances CRUD
  // ============================================================================

  const addFinance = useCallback(
    async (account: Omit<FinancialAccount, 'id'>) => {
      if (!planId) return;

      const request = financialAccountToCreateRequest(account, planId);
      const entry = await entries.create<FinancialMetadata>(request);
      const newAccount = entryToFinancialAccount(entry);

      setState((prev) => ({
        ...prev,
        finances: [...prev.finances, newAccount],
      }));
    },
    [planId, entries]
  );

  const updateFinance = useCallback(
    async (id: string, account: Partial<FinancialAccount>) => {
      setState((prev) => ({
        ...prev,
        finances: prev.finances.map((f) => (f.id === id ? { ...f, ...account } : f)),
      }));

      try {
        await entries.update(id, {
          title: account.accountName,
          notes: account.notes,
          metadata: {
            ...(account.institution && { institution: account.institution }),
            ...(account.accountType && { accountType: account.accountType }),
            ...(account.accountNumberLast4 && { accountNumber: account.accountNumberLast4 }),
            ...(account.notes && { notes: account.notes }),
          },
        });
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteFinance = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        finances: prev.finances.filter((f) => f.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getFinance = useCallback(
    (id: string) => state.finances.find((f) => f.id === id),
    [state.finances]
  );

  // ============================================================================
  // Insurance CRUD
  // ============================================================================

  const addInsurance = useCallback(
    async (policy: Omit<InsurancePolicy, 'id'>) => {
      if (!planId) return;

      const request = insurancePolicyToCreateRequest(policy, planId);
      const entry = await entries.create<InsuranceMetadata>(request);
      const newPolicy = entryToInsurancePolicy(entry);

      setState((prev) => ({
        ...prev,
        insurance: [...prev.insurance, newPolicy],
      }));
    },
    [planId, entries]
  );

  const updateInsurance = useCallback(
    async (id: string, policy: Partial<InsurancePolicy>) => {
      setState((prev) => ({
        ...prev,
        insurance: prev.insurance.map((i) => (i.id === id ? { ...i, ...policy } : i)),
      }));

      try {
        await entries.update(id, {
          title: policy.policyName,
          notes: policy.notes,
          metadata: {
            ...(policy.provider && { provider: policy.provider }),
            ...(policy.policyName && { policyType: policy.policyName }),
            ...(policy.policyNumber && { policyNumber: policy.policyNumber }),
            ...(policy.coverageAmount && { coverageDetails: policy.coverageAmount }),
          },
        });
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteInsurance = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        insurance: prev.insurance.filter((i) => i.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getInsurance = useCallback(
    (id: string) => state.insurance.find((i) => i.id === id),
    [state.insurance]
  );

  // ============================================================================
  // Documents CRUD
  // ============================================================================

  const addDocument = useCallback(
    async (doc: Omit<LegalDocument, 'id'>) => {
      if (!planId) return;

      const request = legalDocumentToCreateRequest(doc, planId);
      const entry = await entries.create<LegalDocumentMetadata>(request);
      const newDoc = entryToLegalDocument(entry);

      setState((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));
    },
    [planId, entries]
  );

  const updateDocument = useCallback(
    async (id: string, doc: Partial<LegalDocument>) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) => (d.id === id ? { ...d, ...doc } : d)),
      }));

      try {
        await entries.update(id, {
          title: doc.documentName,
          notes: doc.notes,
          metadata: {
            ...(doc.documentName && { documentType: doc.documentName }),
            ...(doc.location && { location: doc.location }),
            ...(doc.notes && { notes: doc.notes }),
          },
        });
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getDocument = useCallback(
    (id: string) => state.documents.find((d) => d.id === id),
    [state.documents]
  );

  // ============================================================================
  // Home Responsibilities CRUD
  // ============================================================================

  const addHomeResponsibility = useCallback(
    async (item: Omit<HomeResponsibility, 'id'>) => {
      if (!planId) return;

      const request = homeResponsibilityToCreateRequest(item, planId);
      const entry = await entries.create<HomeMetadata>(request);
      const newItem = entryToHomeResponsibility(entry);

      setState((prev) => ({
        ...prev,
        homeResponsibilities: [...prev.homeResponsibilities, newItem],
      }));
    },
    [planId, entries]
  );

  const updateHomeResponsibility = useCallback(
    async (id: string, item: Partial<HomeResponsibility>) => {
      setState((prev) => ({
        ...prev,
        homeResponsibilities: prev.homeResponsibilities.map((h) =>
          h.id === id ? { ...h, ...item } : h
        ),
      }));

      try {
        await entries.update(id, {
          title: item.itemName,
          notes: item.notes,
          metadata: {
            ...(item.itemType && { responsibilityType: item.itemType.toLowerCase() }),
            ...(item.details && { accountInfo: item.details }),
            ...(item.notes && { notes: item.notes }),
          },
        });
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteHomeResponsibility = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        homeResponsibilities: prev.homeResponsibilities.filter((h) => h.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getHomeResponsibility = useCallback(
    (id: string) => state.homeResponsibilities.find((h) => h.id === id),
    [state.homeResponsibilities]
  );

  // ============================================================================
  // Digital Accounts CRUD
  // ============================================================================

  const addDigitalAccount = useCallback(
    async (account: Omit<DigitalAccount, 'id'>) => {
      if (!planId) return;

      const request = digitalAccountToCreateRequest(account, planId);
      const entry = await entries.create<DigitalAccessMetadata>(request);
      const newAccount = entryToDigitalAccount(entry);

      setState((prev) => ({
        ...prev,
        digitalAccounts: [...prev.digitalAccounts, newAccount],
      }));
    },
    [planId, entries]
  );

  const updateDigitalAccount = useCallback(
    async (id: string, account: Partial<DigitalAccount>) => {
      setState((prev) => ({
        ...prev,
        digitalAccounts: prev.digitalAccounts.map((d) =>
          d.id === id ? { ...d, ...account } : d
        ),
      }));

      try {
        const priorityMap: Record<string, 'primary' | 'secondary' | 'backup' | undefined> = {
          critical: 'primary',
          high: 'secondary',
          medium: 'backup',
          low: undefined,
        };

        await entries.update(id, {
          title: account.accountName,
          notes: account.accessNotes,
          priority: account.importance ? priorityMap[account.importance] : undefined,
          metadata: {
            ...(account.platform && { service: account.platform }),
            ...(account.username && { username: account.username }),
            ...(account.accessNotes && { notes: account.accessNotes }),
          },
        });
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const deleteDigitalAccount = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        digitalAccounts: prev.digitalAccounts.filter((d) => d.id !== id),
      }));

      try {
        await entries.delete(id);
      } catch {
        fetchAllData();
      }
    },
    [entries, fetchAllData]
  );

  const getDigitalAccount = useCallback(
    (id: string) => state.digitalAccounts.find((d) => d.id === id),
    [state.digitalAccounts]
  );

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AppContextType = {
    state,
    isLoading,
    error,
    refresh: fetchAllData,
    addContact,
    updateContact,
    deleteContact,
    getContact,
    addFinance,
    updateFinance,
    deleteFinance,
    getFinance,
    addInsurance,
    updateInsurance,
    deleteInsurance,
    getInsurance,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    addHomeResponsibility,
    updateHomeResponsibility,
    deleteHomeResponsibility,
    getHomeResponsibility,
    addDigitalAccount,
    updateDigitalAccount,
    deleteDigitalAccount,
    getDigitalAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
