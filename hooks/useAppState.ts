import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

export function useAppState() {
  return useSyncExternalStore(
    (cb) => {
      const subscription = AppState.addEventListener("change", cb);
      return () => subscription.remove();
    },
    () => AppState.currentState,
  );
}
