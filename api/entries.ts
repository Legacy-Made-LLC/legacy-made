/**
 * Entries API Service - CRUD operations for entries
 */

import type { ApiClient } from "./client";
import type {
  ContactMetadata,
  CreateEntryRequest,
  DeleteResponse,
  DigitalAccessMetadata,
  Entry,
  EntryCategory,
  EntryMetadata,
  FinancialMetadata,
  HomeMetadata,
  InsuranceMetadata,
  LegalDocumentMetadata,
  UpdateEntryRequest,
} from "./types";

const ENTRIES_PATH = "/entries";

/**
 * Create entries service bound to an API client
 */
export function createEntriesService(client: ApiClient) {
  return {
    /**
     * List all entries for a plan, optionally filtered by category
     */
    list: async (
      planId: string,
      category?: EntryCategory
    ): Promise<Entry[]> => {
      return client.get<Entry[]>(ENTRIES_PATH, {
        planId,
        category,
      });
    },

    /**
     * Get a single entry by ID
     */
    get: async (id: string): Promise<Entry> => {
      return client.get<Entry>(`${ENTRIES_PATH}/${id}`);
    },

    /**
     * Create a new entry
     */
    create: async <T extends EntryMetadata>(
      data: CreateEntryRequest<T>
    ): Promise<Entry<T>> => {
      return client.post<Entry<T>>(ENTRIES_PATH, data);
    },

    /**
     * Update an existing entry
     */
    update: async <T extends EntryMetadata>(
      id: string,
      data: UpdateEntryRequest<T>
    ): Promise<Entry<T>> => {
      return client.patch<Entry<T>>(`${ENTRIES_PATH}/${id}`, data);
    },

    /**
     * Delete an entry
     */
    delete: async (id: string): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(`${ENTRIES_PATH}/${id}`);
    },

    // Category-specific helper methods for better type safety

    /**
     * List contacts
     */
    listContacts: async (planId: string): Promise<Entry<ContactMetadata>[]> => {
      return client.get<Entry<ContactMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "contact",
      });
    },

    /**
     * Create a contact entry
     */
    createContact: async (
      planId: string,
      title: string,
      metadata: ContactMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<ContactMetadata>> => {
      return client.post<Entry<ContactMetadata>>(ENTRIES_PATH, {
        planId,
        category: "contact",
        title,
        metadata,
        ...options,
      });
    },

    /**
     * List financial accounts
     */
    listFinancial: async (
      planId: string
    ): Promise<Entry<FinancialMetadata>[]> => {
      return client.get<Entry<FinancialMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "financial",
      });
    },

    /**
     * Create a financial entry
     */
    createFinancial: async (
      planId: string,
      title: string,
      metadata: FinancialMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<FinancialMetadata>> => {
      return client.post<Entry<FinancialMetadata>>(ENTRIES_PATH, {
        planId,
        category: "financial",
        title,
        metadata,
        ...options,
      });
    },

    /**
     * List insurance policies
     */
    listInsurance: async (
      planId: string
    ): Promise<Entry<InsuranceMetadata>[]> => {
      return client.get<Entry<InsuranceMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "insurance",
      });
    },

    /**
     * Create an insurance entry
     */
    createInsurance: async (
      planId: string,
      title: string,
      metadata: InsuranceMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<InsuranceMetadata>> => {
      return client.post<Entry<InsuranceMetadata>>(ENTRIES_PATH, {
        planId,
        category: "insurance",
        title,
        metadata,
        ...options,
      });
    },

    /**
     * List legal documents
     */
    listLegalDocuments: async (
      planId: string
    ): Promise<Entry<LegalDocumentMetadata>[]> => {
      return client.get<Entry<LegalDocumentMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "legal_document",
      });
    },

    /**
     * Create a legal document entry
     */
    createLegalDocument: async (
      planId: string,
      title: string,
      metadata: LegalDocumentMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<LegalDocumentMetadata>> => {
      return client.post<Entry<LegalDocumentMetadata>>(ENTRIES_PATH, {
        planId,
        category: "legal_document",
        title,
        metadata,
        ...options,
      });
    },

    /**
     * List home responsibilities
     */
    listHome: async (planId: string): Promise<Entry<HomeMetadata>[]> => {
      return client.get<Entry<HomeMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "home",
      });
    },

    /**
     * Create a home responsibility entry
     */
    createHome: async (
      planId: string,
      title: string,
      metadata: HomeMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<HomeMetadata>> => {
      return client.post<Entry<HomeMetadata>>(ENTRIES_PATH, {
        planId,
        category: "home",
        title,
        metadata,
        ...options,
      });
    },

    /**
     * List digital access entries
     */
    listDigitalAccess: async (
      planId: string
    ): Promise<Entry<DigitalAccessMetadata>[]> => {
      return client.get<Entry<DigitalAccessMetadata>[]>(ENTRIES_PATH, {
        planId,
        category: "digital_access",
      });
    },

    /**
     * Create a digital access entry
     */
    createDigitalAccess: async (
      planId: string,
      title: string,
      metadata: DigitalAccessMetadata,
      options?: {
        notes?: string;
        priority?: "primary" | "secondary" | "backup";
      }
    ): Promise<Entry<DigitalAccessMetadata>> => {
      return client.post<Entry<DigitalAccessMetadata>>(ENTRIES_PATH, {
        planId,
        category: "digital_access",
        title,
        metadata,
        ...options,
      });
    },
  };
}

/**
 * Type for the entries service
 */
export type EntriesService = ReturnType<typeof createEntriesService>;
