/**
 * useToast - Convenience hook for showing toast notifications
 *
 * Wraps react-native-toast-message with typed methods and an offline check.
 */

import { onlineManager } from "@tanstack/react-query";
import ToastMessage from "react-native-toast-message";

interface ToastOptions {
  /** Primary text (short, bold) */
  title?: string;
  /** Secondary text (detail) */
  message?: string;
  /** Auto-hide duration in ms (default: 4000) */
  duration?: number;
}

function showSuccess({ title, message, duration }: ToastOptions) {
  ToastMessage.show({
    type: "success",
    text1: title ?? "Saved",
    text2: message,
    visibilityTime: duration ?? 4000,
  });
}

function showError({ title, message, duration }: ToastOptions) {
  ToastMessage.show({
    type: "error",
    text1: title ?? "Something went wrong",
    text2: message,
    visibilityTime: duration ?? 4000,
  });
}

function showInfo({ title, message, duration }: ToastOptions) {
  ToastMessage.show({
    type: "info",
    text1: title ?? "",
    text2: message,
    visibilityTime: duration ?? 4000,
  });
}

/**
 * Check if the device is offline and show a toast if so.
 * Returns true if offline (caller should abort the operation).
 */
function showOfflineErrorIfNeeded(): boolean {
  if (!onlineManager.isOnline()) {
    ToastMessage.show({
      type: "error",
      text1: "You're offline",
      text2: "Connect to the internet to save your changes.",
      visibilityTime: 4000,
    });
    return true;
  }
  return false;
}

export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  /** Returns true if offline (and shows toast). Caller should abort. */
  isOffline: showOfflineErrorIfNeeded,
};

/**
 * Hook that returns the toast API.
 * Can be used as a hook for consistency, but the toast object
 * is also exported directly for use outside of components.
 */
export function useToast() {
  return toast;
}
