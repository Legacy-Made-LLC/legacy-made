/**
 * usePushNotifications — Central hook for Expo push notification lifecycle.
 *
 * Responsibilities:
 * 1. Configure the notification handler (foreground display)
 * 2. Request / check permission
 * 3. Obtain Expo push token and register with backend
 * 4. Foreground listener → show in-app toast
 * 5. Tap handler → navigate to Family tab
 * 6. Persist token in AsyncStorage for sign-out cleanup
 */

import { useAuth } from "@clerk/clerk-expo";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import Constants from "expo-constants";

import { useApi } from "@/api/useApi";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/useToast";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const { pushTokens } = useApi();
  const router = useRouter();

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
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

      // Register with backend
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await pushTokens.register(token, platform);

      logger.debug("Push token registered", { token, platform });
      return token;
    } catch (error) {
      logger.error("Failed to register push token", error);
      return null;
    }
  }, [pushTokens]);

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
      const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (token) {
        await pushTokens.unregister(token);
        await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
        logger.debug("Push token unregistered");
      }
    } catch (error) {
      logger.error("Failed to unregister push token", error);
    }
  }, [pushTokens]);

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

  // ── Foreground notification listener → show toast ────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        toast.info({ title: title ?? undefined, message: body ?? undefined });
      },
    );

    return () => subscription.remove();
  }, []);

  // ── Tap handler → navigate to Family tab ─────────────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.push("/(app)/(tabs)/family");
      },
    );

    return () => subscription.remove();
  }, [router]);

  return {
    permissionStatus,
    expoPushToken,
    requestPermission,
    unregisterToken,
  };
}
