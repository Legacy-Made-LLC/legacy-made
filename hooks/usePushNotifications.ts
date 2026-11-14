/**
 * usePushNotifications — Central hook for Expo push notification lifecycle.
 *
 * Responsibilities:
 * 1. Configure the notification handler (foreground display)
 * 2. Request / check permission
 * 3. Obtain Expo push token and register with backend
 * 4. Foreground listener → show in-app toast + invalidate relevant query caches
 * 5. Tap handler → navigate based on notification type
 * 6. Persist token in AsyncStorage for sign-out cleanup
 */

import { useAuth } from "@clerk/expo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

import Constants from "expo-constants";

import { useApi } from "@/api/useApi";
import { useKeyValue } from "@/contexts/KeyValueContext";
import { toast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

// ── Notification data types ─────────────────────────────────────────────────
type InvitationAcceptedData = {
  type: "invitation_accepted";
  planId: string;
  dekShared: boolean;
};

type InvitationDeclinedData = {
  type: "invitation_declined";
  planId: string;
};

type InvitationReceivedData = {
  type: "invitation_received";
  planId: string;
};

type DekSharedData = {
  type: "dek_shared";
  planId: string;
};

type ReminderData = {
  type: "reminder";
};

type NotificationData =
  | InvitationAcceptedData
  | InvitationDeclinedData
  | InvitationReceivedData
  | DekSharedData
  | ReminderData;

const EAS_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

const PERMISSION_QUERY_KEY = ["notifications.permissionStatus"];

type PermissionState = {
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
};

// ── Storage key ──────────────────────────────────────────────────────────────
export const PUSH_TOKEN_STORAGE_KEY = "legacy_made_push_token";

// ── Module-level notification handler (runs once per JS bundle) ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

// Registration state per Clerk session, shared by every component using the
// hook. Keying by session (not user) means every sign-in starts fresh,
// whichever way the previous session ended.
// - pending: in flight; sign-out can wait for it.
// - done: the backend accepted the token.
// - ended: the session is signing out; never register for it again.
// A failed attempt clears the entry so the next foreground retries.
type Registration =
  | { status: "pending"; promise: Promise<void> }
  | { status: "done" }
  | { status: "ended" };
const registrations = new Map<string, Registration>();

// A registration that hasn't finished by then is treated as failed, so a
// stalled native or network call can't block retries or sign-out.
const REGISTRATION_TIMEOUT_MS = 20_000;
// How long sign-out waits for an in-flight registration before moving on.
const SIGN_OUT_WAIT_MS = 3_000;

// expo-notifications caches a failed native token request for the rest of
// the JS session, so retries after such a failure keep failing. Report the
// first failure to Sentry; log later ones at info level.
let registrationFailureReported = false;

/** Resolve with `promise`'s value, or reject after `ms` milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms} ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Stop token registration for a signing-out session.
 *
 * - Marks the session ended, so nothing registers for it again (a foreground
 *   refetch can still fire while sign-out is in progress).
 * - Waits up to 3 seconds for an in-flight registration, so it can't land
 *   after the caller unregisters the token.
 *
 * @param sessionId the Clerk session that is signing out; no-op when missing.
 */
export async function endPushRegistration(
  sessionId: string | null | undefined,
): Promise<void> {
  if (!sessionId) return;
  const current = registrations.get(sessionId);
  registrations.set(sessionId, { status: "ended" });
  if (current?.status === "pending") {
    await withTimeout(current.promise, SIGN_OUT_WAIT_MS).catch(() => {
      logger.info("Sign-out continued before push registration finished");
    });
  }
}

/**
 * Undo `endPushRegistration` when sign-out failed and the session is still
 * active, so the next foreground registers again.
 *
 * @param sessionId the Clerk session that stayed signed in.
 */
export function resumePushRegistration(
  sessionId: string | null | undefined,
): void {
  if (sessionId && registrations.get(sessionId)?.status === "ended") {
    registrations.delete(sessionId);
  }
}

/** True once sign-out has started for this session. */
const isEnded = (sessionId: string) =>
  registrations.get(sessionId)?.status === "ended";

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { isSignedIn, sessionId } = useAuth();
  const { userStorage } = useKeyValue();
  const { pushTokens } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: permission, refetch: refetchPermissionStatus } = useQuery({
    queryKey: PERMISSION_QUERY_KEY,
    queryFn: async (): Promise<PermissionState> => {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return { status, canAskAgain };
    },
    staleTime: 0,
    // A local OS call: run it offline too (the default pauses until online)
    networkMode: "always",
  });
  const permissionStatus = permission?.status;

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // ── Register token with backend + persist locally ────────────────────────
  // Returns the token, or null when nothing was registered. Stops before
  // storing or registering anything once the session has started signing
  // out, since the native and network calls can't be cancelled.
  const registerToken = useCallback(
    async (forSessionId: string) => {
      if (!Device.isDevice) {
        logger.debug("Push notifications require a physical device — skipping");
        return null;
      }

      try {
        const tokenData = await withTimeout(
          Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID }),
          REGISTRATION_TIMEOUT_MS,
        );

        if (isEnded(forSessionId)) return null;
        const token = tokenData.data;
        setExpoPushToken(token);

        // Persist for sign-out cleanup
        userStorage.set(PUSH_TOKEN_STORAGE_KEY, token);

        // Register with backend
        if (isEnded(forSessionId)) return null;
        const platform = Platform.OS === "ios" ? "ios" : "android";
        await withTimeout(
          pushTokens.register(token, platform),
          REGISTRATION_TIMEOUT_MS,
        );

        logger.debug("Push token registered", { token, platform });
        return token;
      } catch (error) {
        if (registrationFailureReported) {
          logger.info("Push token registration failed again", {
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          registrationFailureReported = true;
          logger.error("Failed to register push token", error);
        }
        return null;
      }
    },
    [pushTokens, userStorage],
  );

  // ── Register once per session; retried after a failure ───────────────────
  const registerIfNeeded = useCallback(() => {
    if (!isSignedIn || !sessionId || registrations.has(sessionId)) return;
    const promise = registerToken(sessionId).then((token) => {
      // Only update the entry this attempt created (sign-out may have
      // replaced it meanwhile)
      if (registrations.get(sessionId) !== entry) return;
      if (token) {
        registrations.set(sessionId, { status: "done" });
      } else {
        registrations.delete(sessionId);
      }
    });
    const entry: Registration = { status: "pending", promise };
    registrations.set(sessionId, entry);
  }, [isSignedIn, sessionId, registerToken]);

  // ── Request OS permission and (if granted) register ──────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      let current: PermissionState = await Notifications.getPermissionsAsync();
      if (current.status !== "granted") {
        current = await Notifications.requestPermissionsAsync();
      }
      // Record the answer directly; a refetch could join a read that started
      // before the grant and show the old status.
      queryClient.setQueryData<PermissionState>(PERMISSION_QUERY_KEY, {
        status: current.status,
        canAskAgain: current.canAskAgain,
      });
      const finalStatus = current.status;

      if (finalStatus === "granted") {
        registerIfNeeded();
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to request notification permission", error);
      return false;
    }
  }, [registerIfNeeded, queryClient]);

  // ── Unregister token from backend + clear local storage ──────────────────
  const unregisterToken = useCallback(async () => {
    try {
      const token = userStorage.getString(PUSH_TOKEN_STORAGE_KEY);
      if (token) {
        await pushTokens.unregister(token);
        userStorage.remove(PUSH_TOKEN_STORAGE_KEY);
        logger.debug("Push token unregistered");
      }
    } catch (error) {
      logger.error("Failed to unregister push token", error);
    }
  }, [pushTokens, userStorage]);

  // As soon as permission is granted (at launch, or after the prompt)
  useEffect(() => {
    if (permissionStatus === "granted") registerIfNeeded();
  }, [permissionStatus, registerIfNeeded]);

  // Whenever the app returns to the foreground: re-read permission, so
  // turning notifications on in iOS Settings registers without a cold start,
  // and retry a registration that failed earlier.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      // cancelRefetch: false lets every mounted copy of this hook share one
      // permission read instead of cancelling each other's.
      refetchPermissionStatus({ cancelRefetch: false }).then(({ data }) => {
        if (data?.status === "granted") registerIfNeeded();
      });
    });
    return () => subscription.remove();
  }, [refetchPermissionStatus, registerIfNeeded]);

  // ── Invalidate query caches based on notification type ──────────────────
  const invalidateCachesForNotification = useCallback(
    (data: NotificationData) => {
      logger.debug("Invalidating caches for push notification", {
        type: data.type,
      });

      switch (data.type) {
        case "invitation_accepted":
        case "invitation_declined":
          // Owner received update about a trusted contact — refresh the list
          queryClient.invalidateQueries({
            queryKey: queryKeys.trustedContacts.all(data.planId),
          });
          break;

        case "invitation_received":
          // Invitee received a new invitation — refresh shared plans so it appears
          queryClient.invalidateQueries({
            queryKey: queryKeys.sharedPlans.all(),
          });
          break;

        case "dek_shared":
          // Trusted contact now has decryption access — refresh shared plans
          // and crypto state so the UI reflects the new access
          queryClient.invalidateQueries({
            queryKey: queryKeys.sharedPlans.all(),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.crypto.all(),
          });
          break;

        case "reminder":
          // Reminders are generic nudges — no cache invalidation needed
          break;
      }
    },
    [queryClient],
  );

  // ── Foreground notification listener → show toast + invalidate caches ───
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        toast.info({ title: title ?? undefined, message: body ?? undefined });

        // Invalidate relevant caches if the notification has typed data
        if (data && typeof data === "object" && "type" in data) {
          invalidateCachesForNotification(data as NotificationData);
        }
      },
    );

    return () => subscription.remove();
  }, [invalidateCachesForNotification]);

  // ── Tap handler → navigate based on notification type + invalidate caches
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Invalidate caches on tap as well (covers background notifications
        // where the foreground listener didn't fire)
        if (data && typeof data === "object" && "type" in data) {
          invalidateCachesForNotification(data as NotificationData);
        }

        // Route based on notification type
        const notifData = data as NotificationData | undefined;
        if (notifData?.type === "reminder") {
          router.push("/(app)/(tabs)/home");
        } else {
          router.push("/(app)/(tabs)/family");
        }
      },
    );

    return () => subscription.remove();
  }, [router, invalidateCachesForNotification]);

  return {
    permissionStatus,
    permissionDenied: permissionStatus === "denied",
    permissionGranted: permissionStatus === "granted",
    // False once the OS won't show the prompt again (iOS after one answer);
    // the only way to turn notifications on is then the device's Settings.
    canAskPermission: permission?.canAskAgain ?? false,
    expoPushToken,
    requestPermission,
    unregisterToken,
  };
}
