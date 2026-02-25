/**
 * Access Invitations API Service
 *
 * Handles the invitation deep link flow. The GET endpoint is public
 * (no auth required), while accept requires authentication.
 */

import Constants from "expo-constants";

import type { ApiClient } from "./client";
import { ApiClientError } from "./client";
import type { InvitationDetails, TrustedContact } from "./types";

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000";
const TIMEOUT = 30000;

/**
 * Fetch invitation details (public — no auth required).
 * This is a standalone function, not part of the authenticated API client,
 * because the recipient may not have an account yet.
 */
export async function fetchInvitationDetails(
  token: string,
): Promise<InvitationDetails> {
  const url = `${API_URL}/access-invitations/${encodeURIComponent(token)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data,
      );
    }

    return data as InvitationDetails;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) throw error;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw new ApiClientError(error.message, 0);
    }

    throw new ApiClientError("Unknown error occurred", 0);
  }
}

/**
 * Create access invitations service bound to an authenticated API client.
 * Used for accept (requires auth) and decline.
 */
export function createAccessInvitationsService(client: ApiClient) {
  return {
    /**
     * Accept an invitation (requires authentication).
     * Links the current Clerk user to the trusted contact record.
     */
    accept: async (token: string): Promise<TrustedContact> => {
      return client.post<TrustedContact>(
        `/access-invitations/${encodeURIComponent(token)}/accept`,
        {},
      );
    },

    /**
     * Decline an invitation.
     */
    decline: async (token: string): Promise<void> => {
      await client.post<void>(
        `/access-invitations/${encodeURIComponent(token)}/decline`,
        {},
      );
    },
  };
}

/**
 * Type for the access invitations service
 */
export type AccessInvitationsService = ReturnType<
  typeof createAccessInvitationsService
>;
