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
import { useQueryClient } from "@tanstack/react-query";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

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

type NotificationData =
  | InvitationAcceptedData
  | InvitationDeclinedData
  | InvitationReceivedData
  | DekSharedData;

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

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const { userStorage } = useKeyValue();
  const { pushTokens } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Track whether we've already registered this session to avoid duplicates
  const hasRegistered = useRef(false);

  // ── Register token with backend + persist locally ────────────────────────
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
      logger.error("Failed to register push token", error);
      return null;
    }
  }, [pushTokens, userStorage]);

  // ── Request OS permission and (if granted) register ──────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus === "granted") {
        await registerToken();
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to request notification permission", error);
      return false;
    }
  }, [registerToken]);

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

  // ── On mount: check permission, auto-register if already granted ─────────
  useEffect(() => {
    if (!isSignedIn || hasRegistered.current) return;

    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        hasRegistered.current = true;
        await registerToken();
      }
    })();
  }, [isSignedIn, registerToken]);

  // ── Invalidate query caches based on notification type ──────────────────
  const invalidateCachesForNotification = useCallback(
    (data: NotificationData) => {
      logger.debug("Invalidating caches for push notification", {
        type: data.type,
        planId: data.planId,
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

        // All current notification types relate to the Family tab
        router.push("/(app)/(tabs)/family");
      },
    );

    return () => subscription.remove();
  }, [router, invalidateCachesForNotification]);

  return {
    permissionStatus,
    expoPushToken,
    requestPermission,
    unregisterToken,
  };
}
