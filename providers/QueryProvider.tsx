/**
 * TanStack Query Provider
 *
 * Wraps the app with QueryClientProvider and configures React Native-specific
 * behaviors for focus management and online status detection.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/react-native
 */

import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState, type ReactNode } from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Platform } from "react-native";

import { createQueryClient } from "@/lib/queryClient";

// Configure online manager with NetInfo.
// NetInfo fires immediately on subscribe (handles initial state) and returns
// its own unsubscribe function — no race-condition workaround needed.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true); // Default to online if unknown
  });
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => createQueryClient());

  // Set up focus manager for React Native — refetches stale queries when
  // the app returns to the foreground.
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    }

    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
