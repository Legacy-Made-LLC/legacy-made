/**
 * usePendingMasterSubInvitation - Picks up a master subscription invite
 * token after sign-in completes.
 *
 * Mirrors `usePendingInvitation` for the B2B flow. When an unauthenticated
 * user lands on the team-invitation modal and taps Accept, the modal
 * persists the token in KV and routes to /(auth). After sign-in/sign-up,
 * the (app) layout mounts and this hook runs the accept against the now-
 * authenticated session.
 *
 * Stored under a key separate from the trusted-contacts pending key so
 * both flows can coexist if a user happens to follow both kinds of
 * invite links back-to-back.
 */

import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";

import { ApiClientError } from "@/api/client";
import { useApi } from "@/api/useApi";
import { toast } from "@/hooks/useToast";
import { globalStorage } from "@/lib/kv";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

export const PENDING_MASTER_SUB_INVITATION_TOKEN_KEY =
  "legacy_made_pending_master_sub_invitation_token";

let acceptLock: Promise<void> | null = null;

async function processToken(
  acceptFn: (token: string) => Promise<void>,
) {
  if (acceptLock) await acceptLock;
  const run = async () => {
    const pending = globalStorage.getString(
      PENDING_MASTER_SUB_INVITATION_TOKEN_KEY,
    );
    if (!pending) return;
    globalStorage.remove(PENDING_MASTER_SUB_INVITATION_TOKEN_KEY);
    await acceptFn(pending);
  };
  acceptLock = run();
  try {
    await acceptLock;
  } finally {
    acceptLock = null;
  }
}

export function usePendingMasterSubInvitation() {
  const { masterSubInvitations, isSignedIn } = useApi();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignedIn) return;
    processToken(async (token) => {
      try {
        await masterSubInvitations.accept(token);
        // Refresh all entitlement queries so pillar locks + quotas
        // reflect the new B2B membership immediately on landing.
        await queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
        // Route back to the team-invitation screen with a justAccepted
        // flag so the user sees a persistent celebration state rather
        // than a 3s toast during the noisy auth → home transition.
        router.replace({
          pathname: "/team-invitation",
          params: { token, justAccepted: "1" },
        });
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Couldn't accept the invitation. Please try the link again.";
        toast.error({ message });
        logger.error("Failed to accept pending master sub invitation", err);
      }
    }).catch((err) => {
      logger.error(
        "Failed to read pending master sub invitation token",
        err,
      );
    });
  }, [isSignedIn, masterSubInvitations, queryClient]);
}
