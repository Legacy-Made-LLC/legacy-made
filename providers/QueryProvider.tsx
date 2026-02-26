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
import * as Network from "expo-network";
import { useEffect, useState, type ReactNode } from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Platform } from "react-native";

import { createQueryClient } from "@/lib/queryClient";

// Configure online manager using the recommended setEventListener pattern.
// This runs once at module load, before any component renders, so queries
// have accurate online status from the start.
onlineManager.setEventListener((setOnline) => {
  let initialised = false;

  const eventSubscription = Network.addNetworkStateListener((state) => {
    initialised = true;
    setOnline(!!state.isConnected);
  });

  // Check initial network state (the listener only fires on changes)
  Network.getNetworkStateAsync()
    .then((state) => {
      if (!initialised) {
        setOnline(!!state.isConnected);
      }
    })
    .catch(() => {
      // getNetworkStateAsync can reject on some platforms/SDK versions
    });

  return eventSubscription.remove;
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
