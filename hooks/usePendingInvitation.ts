/**
 * usePendingInvitation - Accepts a pending invitation stored in AsyncStorage
 *
 * When a user accepts an invitation via the deep link flow, the invitation
 * token is saved to AsyncStorage before redirecting to auth. This hook,
 * called from the (app) layout, picks up the token after the user lands
 * in the authenticated app and completes the accept.
 */

import { useEffect } from "react";

import { ApiClientError } from "@/api/client";
import { useApi } from "@/api/useApi";
import { toast } from "@/hooks/useToast";
import { globalStorage } from "@/lib/kv";
import { logger } from "@/lib/logger";

export const PENDING_INVITATION_TOKEN_KEY =
  "legacy_made_pending_invitation_token";

// Module-level lock: holds the in-flight accept promise. If a second consumer
// calls while the first is still running, it waits for the first to finish
// (which clears the token) and then finds nothing to process. Once the lock
// releases, future invitations can still be accepted.
let acceptLock: Promise<void> | null = null;

async function processInvitationToken(
  acceptFn: (token: string) => Promise<void>,
) {
  // If another call is already in flight, wait for it to finish, then
  // fall through to check if a new token was written in the meantime.
  if (acceptLock) {
    await acceptLock;
  }

  const run = async () => {
    // Use globalStorage outside of React context. This globalStorage object is
    // identical to the one conveniently provided by useKeyValue.
    const pendingToken = globalStorage.getString(PENDING_INVITATION_TOKEN_KEY);
    if (!pendingToken) return;

    // Remove immediately — first caller to reach this point wins.
    globalStorage.remove(PENDING_INVITATION_TOKEN_KEY);

    await acceptFn(pendingToken);
  };

  acceptLock = run();
  try {
    await acceptLock;
  } finally {
    acceptLock = null;
  }
}

export function usePendingInvitation() {
  const { accessInvitations, isSignedIn } = useApi();

  useEffect(() => {
    if (!isSignedIn) return;

    processInvitationToken(async (token) => {
      try {
        await accessInvitations.accept(token);
        toast.success({ title: "Invitation accepted" });
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Couldn\u2019t accept invitation. Please try the link again.";
        toast.error({ message });
        logger.error("Failed to accept pending invitation", err);
      }
    }).catch((err) => {
      logger.error("Failed to read pending invitation token", err);
    });
  }, [isSignedIn, accessInvitations]);
}
