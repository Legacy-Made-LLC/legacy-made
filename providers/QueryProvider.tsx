/**
 * TanStack Query Provider
 *
 * Wraps the app with QueryClientProvider and configures React Native-specific
 * behaviors for focus management and online status detection.
 */

import { QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { createQueryClient } from '@/lib/queryClient';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => createQueryClient());

  // Set up focus manager for React Native
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    }

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => subscription.remove();
  }, []);

  // Set up online manager for network status
  useEffect(() => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });

    return () => eventSubscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
