/**
 * Trusted Contacts API Service - CRUD operations for trusted contacts
 */

import type { ApiClient } from "./client";
import type {
  CreateTrustedContactRequest,
  DeleteResponse,
  TrustedContact,
  UpdateTrustedContactRequest,
} from "./types";

/**
 * Helper to build trusted contacts path for a plan
 */
const contactsPath = (planId: string) =>
  `/plans/${planId}/trusted-contacts`;

/**
 * Create trusted contacts service bound to an API client
 */
export function createTrustedContactsService(client: ApiClient) {
  return {
    /**
     * List all trusted contacts for a plan
     */
    list: async (planId: string): Promise<TrustedContact[]> => {
      return client.get<TrustedContact[]>(contactsPath(planId));
    },

    /**
     * Get a single trusted contact by ID
     */
    get: async (planId: string, id: string): Promise<TrustedContact> => {
      return client.get<TrustedContact>(`${contactsPath(planId)}/${id}`);
    },

    /**
     * Create a new trusted contact and send invitation email
     */
    create: async (
      planId: string,
      data: CreateTrustedContactRequest,
    ): Promise<TrustedContact> => {
      return client.post<TrustedContact>(contactsPath(planId), data);
    },

    /**
     * Update a trusted contact (access level, notes, etc.)
     */
    update: async (
      planId: string,
      id: string,
      data: UpdateTrustedContactRequest,
    ): Promise<TrustedContact> => {
      return client.patch<TrustedContact>(
        `${contactsPath(planId)}/${id}`,
        data,
      );
    },

    /**
     * Revoke access (owner removes contact)
     */
    delete: async (
      planId: string,
      id: string,
    ): Promise<DeleteResponse> => {
      return client.delete<DeleteResponse>(
        `${contactsPath(planId)}/${id}`,
      );
    },

    /**
     * Resend invitation email to a pending contact
     */
    resendInvitation: async (
      planId: string,
      id: string,
    ): Promise<{ sent: boolean }> => {
      return client.post<{ sent: boolean }>(
        `${contactsPath(planId)}/${id}/resend-invitation`,
        {},
      );
    },
  };
}

/**
 * Type for the trusted contacts service
 */
export type TrustedContactsService = ReturnType<
  typeof createTrustedContactsService
>;
