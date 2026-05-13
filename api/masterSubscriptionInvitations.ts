/**
 * Master Subscription Invitations API
 *
 * Wraps the public preview + authed accept endpoints from
 * `legacy-made-api/src/master-subscriptions/master-subscription-invitations.controller.ts`.
 *
 * Note: `preview()` is a standalone fetch — it cannot go through the
 * authenticated `ApiClient`, because the recipient may not have an
 * account yet (or may not be signed in). The authed client rejects all
 * requests when Clerk's getToken() returns null, which would mask the
 * actual public-endpoint response. Mirrors the pattern in
 * `api/accessInvitations.ts:fetchInvitationDetails`.
 */
import Constants from "expo-constants";

import type { ApiClient } from "./client";
import { ApiClientError } from "./errors";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000";
const TIMEOUT = 30000;

export type MasterSubInvitationStatus =
  | "pending_invite"
  | "active"
  | "removed";

export interface MasterSubInvitationPreview {
  providerName: string;
  ownerName: string | null;
  invitedEmail: string;
  status: MasterSubInvitationStatus;
  masterSubscriptionStatus: string;
}

export interface AcceptMasterSubInvitationResult {
  member: {
    id: string;
    status: MasterSubInvitationStatus;
    userId: string | null;
  };
  masterSubscription: {
    id: string;
    displayName: string;
    status: string;
  };
}

/**
 * Public preview — used by the team-invitation modal before the user
 * authenticates. Does not consume the invite. Standalone fetch (does not
 * use the authed ApiClient) so unauthenticated callers reach the
 * `@Public()` endpoint instead of being rejected client-side.
 */
export async function previewMasterSubInvitation(
  token: string,
): Promise<MasterSubInvitationPreview> {
  const url = `${API_URL}/master-subscription-invitations/${encodeURIComponent(token)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await response.json().catch(() => null)) as
      | MasterSubInvitationPreview
      | { message?: string; error?: string }
      | null;

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && "message" in data && data.message) ||
        `Request failed with status ${response.status}`;
      throw new ApiClientError(String(message), response.status);
    }

    return data as MasterSubInvitationPreview;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiClientError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiClientError("Request timed out", 0);
    }
    throw new ApiClientError(
      err instanceof Error ? err.message : "Network error",
      0,
    );
  }
}

export function createMasterSubInvitationsService(client: ApiClient) {
  return {
    /**
     * Public preview — exposes the standalone fetch through the service
     * surface so callers don't need to know which path is authed vs not.
     */
    preview: previewMasterSubInvitation,

    /**
     * Authed accept. Requires the caller's email to match the token's
     * `email` claim (server enforces, case-insensitive).
     */
    accept: async (
      token: string,
    ): Promise<AcceptMasterSubInvitationResult> => {
      return client.post<AcceptMasterSubInvitationResult>(
        `/master-subscription-invitations/${encodeURIComponent(token)}/accept`,
        {},
      );
    },
  };
}

export type MasterSubInvitationsService = ReturnType<
  typeof createMasterSubInvitationsService
>;
