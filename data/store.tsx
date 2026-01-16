import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Contact,
  FinancialAccount,
  InsurancePolicy,
  LegalDocument,
  HomeResponsibility,
  DigitalAccount,
} from './types';
import {
  mockContacts,
  mockFinances,
  mockInsurance,
  mockDocuments,
  mockHomeResponsibilities,
  mockDigitalAccounts,
} from './mockData';

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
  // Contacts
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  // Finances
  addFinance: (account: Omit<FinancialAccount, 'id'>) => void;
  updateFinance: (id: string, account: Partial<FinancialAccount>) => void;
  deleteFinance: (id: string) => void;
  getFinance: (id: string) => FinancialAccount | undefined;
  // Insurance
  addInsurance: (policy: Omit<InsurancePolicy, 'id'>) => void;
  updateInsurance: (id: string, policy: Partial<InsurancePolicy>) => void;
  deleteInsurance: (id: string) => void;
  getInsurance: (id: string) => InsurancePolicy | undefined;
  // Documents
  addDocument: (doc: Omit<LegalDocument, 'id'>) => void;
  updateDocument: (id: string, doc: Partial<LegalDocument>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => LegalDocument | undefined;
  // Home Responsibilities
  addHomeResponsibility: (item: Omit<HomeResponsibility, 'id'>) => void;
  updateHomeResponsibility: (id: string, item: Partial<HomeResponsibility>) => void;
  deleteHomeResponsibility: (id: string) => void;
  getHomeResponsibility: (id: string) => HomeResponsibility | undefined;
  // Digital Accounts
  addDigitalAccount: (account: Omit<DigitalAccount, 'id'>) => void;
  updateDigitalAccount: (id: string, account: Partial<DigitalAccount>) => void;
  deleteDigitalAccount: (id: string) => void;
  getDigitalAccount: (id: string) => DigitalAccount | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    contacts: mockContacts,
    finances: mockFinances,
    insurance: mockInsurance,
    documents: mockDocuments,
    homeResponsibilities: mockHomeResponsibilities,
    digitalAccounts: mockDigitalAccounts,
  });

  // Contacts CRUD
  const addContact = useCallback((contact: Omit<Contact, 'id'>) => {
    setState((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...contact, id: generateId() }],
    }));
  }, []);

  const updateContact = useCallback((id: string, contact: Partial<Contact>) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) =>
        c.id === id ? { ...c, ...contact } : c
      ),
    }));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  }, []);

  const getContact = useCallback(
    (id: string) => state.contacts.find((c) => c.id === id),
    [state.contacts]
  );

  // Finances CRUD
  const addFinance = useCallback((account: Omit<FinancialAccount, 'id'>) => {
    setState((prev) => ({
      ...prev,
      finances: [...prev.finances, { ...account, id: generateId() }],
    }));
  }, []);

  const updateFinance = useCallback(
    (id: string, account: Partial<FinancialAccount>) => {
      setState((prev) => ({
        ...prev,
        finances: prev.finances.map((f) =>
          f.id === id ? { ...f, ...account } : f
        ),
      }));
    },
    []
  );

  const deleteFinance = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      finances: prev.finances.filter((f) => f.id !== id),
    }));
  }, []);

  const getFinance = useCallback(
    (id: string) => state.finances.find((f) => f.id === id),
    [state.finances]
  );

  // Insurance CRUD
  const addInsurance = useCallback((policy: Omit<InsurancePolicy, 'id'>) => {
    setState((prev) => ({
      ...prev,
      insurance: [...prev.insurance, { ...policy, id: generateId() }],
    }));
  }, []);

  const updateInsurance = useCallback(
    (id: string, policy: Partial<InsurancePolicy>) => {
      setState((prev) => ({
        ...prev,
        insurance: prev.insurance.map((i) =>
          i.id === id ? { ...i, ...policy } : i
        ),
      }));
    },
    []
  );

  const deleteInsurance = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      insurance: prev.insurance.filter((i) => i.id !== id),
    }));
  }, []);

  const getInsurance = useCallback(
    (id: string) => state.insurance.find((i) => i.id === id),
    [state.insurance]
  );

  // Documents CRUD
  const addDocument = useCallback((doc: Omit<LegalDocument, 'id'>) => {
    setState((prev) => ({
      ...prev,
      documents: [...prev.documents, { ...doc, id: generateId() }],
    }));
  }, []);

  const updateDocument = useCallback(
    (id: string, doc: Partial<LegalDocument>) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === id ? { ...d, ...doc } : d
        ),
      }));
    },
    []
  );

  const deleteDocument = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  }, []);

  const getDocument = useCallback(
    (id: string) => state.documents.find((d) => d.id === id),
    [state.documents]
  );

  // Home Responsibilities CRUD
  const addHomeResponsibility = useCallback(
    (item: Omit<HomeResponsibility, 'id'>) => {
      setState((prev) => ({
        ...prev,
        homeResponsibilities: [
          ...prev.homeResponsibilities,
          { ...item, id: generateId() },
        ],
      }));
    },
    []
  );

  const updateHomeResponsibility = useCallback(
    (id: string, item: Partial<HomeResponsibility>) => {
      setState((prev) => ({
        ...prev,
        homeResponsibilities: prev.homeResponsibilities.map((h) =>
          h.id === id ? { ...h, ...item } : h
        ),
      }));
    },
    []
  );

  const deleteHomeResponsibility = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      homeResponsibilities: prev.homeResponsibilities.filter((h) => h.id !== id),
    }));
  }, []);

  const getHomeResponsibility = useCallback(
    (id: string) => state.homeResponsibilities.find((h) => h.id === id),
    [state.homeResponsibilities]
  );

  // Digital Accounts CRUD
  const addDigitalAccount = useCallback(
    (account: Omit<DigitalAccount, 'id'>) => {
      setState((prev) => ({
        ...prev,
        digitalAccounts: [
          ...prev.digitalAccounts,
          { ...account, id: generateId() },
        ],
      }));
    },
    []
  );

  const updateDigitalAccount = useCallback(
    (id: string, account: Partial<DigitalAccount>) => {
      setState((prev) => ({
        ...prev,
        digitalAccounts: prev.digitalAccounts.map((d) =>
          d.id === id ? { ...d, ...account } : d
        ),
      }));
    },
    []
  );

  const deleteDigitalAccount = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      digitalAccounts: prev.digitalAccounts.filter((d) => d.id !== id),
    }));
  }, []);

  const getDigitalAccount = useCallback(
    (id: string) => state.digitalAccounts.find((d) => d.id === id),
    [state.digitalAccounts]
  );

  const value: AppContextType = {
    state,
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
