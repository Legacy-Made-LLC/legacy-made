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

// Registration state per user ID for this JS session, shared by every
// component using the hook. A pending entry holds the in-flight promise so
// sign-out can wait for it; "done" means the backend accepted the token. A
// failed attempt clears the entry so the next foreground retries.
type Registration =
  { status: "pending"; promise: Promise<void> } | { status: "done" };
const registrations = new Map<string, Registration>();

// expo-notifications caches a failed native token request for the rest of
// the JS session, so retries after such a failure keep failing. Report the
// first failure to Sentry; log later ones at info level.
let registrationFailureReported = false;

/**
 * Finish any in-flight token registration for this user, then forget their
 * registration state so the next sign-in on this device registers again.
 *
 * Call on sign-out before unregistering the token, so a registration that
 * lands after the unregister can't leave the device linked to the user.
 *
 * @param userId the signed-in user's Clerk ID; no-op when missing.
 */
export async function endPushRegistration(
  userId: string | null | undefined,
): Promise<void> {
  if (!userId) return;
  const current = registrations.get(userId);
  if (current?.status === "pending") await current.promise;
  registrations.delete(userId);
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { isSignedIn, userId } = useAuth();
  const { userStorage } = useKeyValue();
  const { pushTokens } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: permission, refetch: refetchPermissionStatus } = useQuery({
    queryKey: ["notifications.permissionStatus"],
    queryFn: async () => {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return { status, canAskAgain };
    },
    staleTime: 0,
  });
  const permissionStatus = permission?.status;

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // ── Register token with backend + persist locally ────────────────────────
  // Returns the token, or null when nothing was registered.
  const registerToken = useCallback(async () => {
    if (!Device.isDevice) {
      logger.debug("Push notifications require a physical device — skipping");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Persist for sign-out cleanup
      userStorage.set(PUSH_TOKEN_STORAGE_KEY, token);

      // Register with backend
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await pushTokens.register(token, platform);

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
  }, [pushTokens, userStorage]);

  // ── Register once per user per session; retried after a failure ──────────
  const registerIfNeeded = useCallback(() => {
    if (!isSignedIn || !userId || registrations.has(userId)) return;
    const promise = registerToken().then((token) => {
      if (token) {
        registrations.set(userId, { status: "done" });
      } else {
        registrations.delete(userId);
      }
    });
    registrations.set(userId, { status: "pending", promise });
  }, [isSignedIn, userId, registerToken]);

  // ── Request OS permission and (if granted) register ──────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        await refetchPermissionStatus({ cancelRefetch: false });
      }

      if (finalStatus === "granted") {
        registerIfNeeded();
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to request notification permission", error);
      return false;
    }
  }, [registerIfNeeded, refetchPermissionStatus]);

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

  // Any sign-out path (not only the menu's) forgets registration state, so
  // the next sign-in on this device registers again.
  useEffect(() => {
    if (isSignedIn === false) registrations.clear();
  }, [isSignedIn]);

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
