/**
 * useToast - Convenience hook for showing toast notifications
 *
 * Wraps react-native-toast-message with typed methods.
 */

import ToastMessage from "react-native-toast-message";

/** Duration for undo/redo toasts (ms) — long enough to tap Redo */
export const UNDO_TOAST_DURATION = 5000;

interface ToastOptions {
  /** Primary text (short, bold) */
  title?: string;
  /** Secondary text (detail) */
  message?: string;
  /** Auto-hide duration in ms (default: 4000) */
  duration?: number;
}

interface UndoToastOptions extends ToastOptions {
  /** Label for the action button (default: "Redo") */
  actionLabel?: string;
  /** Callback when the action button is pressed */
  onAction?: () => void;
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
    visibilityTime: duration ?? 8000,
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

function showUndo({
  title,
  message,
  duration,
  actionLabel,
  onAction,
}: UndoToastOptions) {
  ToastMessage.show({
    type: "undo",
    text1: title ?? "",
    text2: message,
    visibilityTime: duration ?? 4000,
    props: { actionLabel, onAction },
  });
}

export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  undo: showUndo,
};

/**
 * Hook that returns the toast API.
 * Can be used as a hook for consistency, but the toast object
 * is also exported directly for use outside of components.
 */
export function useToast() {
  return toast;
}
