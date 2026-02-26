/**
 * usePendingInvitation - Accepts a pending invitation stored in AsyncStorage
 *
 * When a user accepts an invitation via the deep link flow, the accept API call
 * can race with auth-triggered navigation (e.g., after OTP sign-up or escape hatch
 * sign-in). To handle this, the invitation token is saved to AsyncStorage before
 * any auth state change. This hook, called from the (app) layout, picks up the
 * token after the user lands in the authenticated app and completes the accept.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";

import { useApi } from "@/api/useApi";
import { ApiClientError } from "@/api/client";
import { toast } from "@/hooks/useToast";

export const PENDING_INVITATION_TOKEN_KEY =
  "legacy_made_pending_invitation_token";

export function usePendingInvitation() {
  const { accessInvitations, isSignedIn } = useApi();
  const isAccepting = useRef(false);

  useEffect(() => {
    if (!isSignedIn || isAccepting.current) return;

    const acceptPending = async () => {
      try {
        const pendingToken = await AsyncStorage.getItem(
          PENDING_INVITATION_TOKEN_KEY,
        );
        if (!pendingToken) return;

        isAccepting.current = true;

        // Clear immediately to prevent duplicate attempts
        await AsyncStorage.removeItem(PENDING_INVITATION_TOKEN_KEY);

        try {
          await accessInvitations.accept(pendingToken);
          toast.success({ title: "Invitation accepted" });
        } catch (err) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Couldn\u2019t accept invitation. Please try the link again.";
          toast.error({ message });
        }
      } catch {
        // AsyncStorage read failed — nothing we can do
      } finally {
        isAccepting.current = false;
      }
    };

    acceptPending();
  }, [isSignedIn, accessInvitations]);
}
