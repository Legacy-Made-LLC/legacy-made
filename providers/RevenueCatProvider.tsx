/**
 * RevenueCat Provider — DEFERRED ACTIVATION
 *
 * This module imports `react-native-purchases`, which is a native module.
 * It requires a dev-client rebuild (`expo prebuild --clean && expo run:ios`
 * or `expo run:android`) after the package is installed before this file
 * can be imported anywhere in the app tree.
 *
 * Activation steps (after the RC dashboard is configured):
 *   1. Set EXPO_PUBLIC_RC_IOS_API_KEY and EXPO_PUBLIC_RC_ANDROID_API_KEY
 *      in your .env (values from the RC dashboard → Project settings → API keys).
 *   2. Rebuild the dev client so the native module is linked.
 *   3. Import { RevenueCatProvider } in app/_layout.tsx and wrap the tree
 *      somewhere inside ClerkProvider (Clerk user ID is the RC app_user_id).
 *   4. Consume via useRevenueCat() in components that need customerInfo or
 *      to trigger a purchase.
 *
 * Until wired in, this file is dead code; the import of react-native-purchases
 * will not be evaluated and cannot crash the app.
 */

import { useUser } from "@clerk/expo";
import Constants from "expo-constants";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
} from "react-native-purchases";

import { logger } from "@/lib/logger";

interface RevenueCatContextValue {
  // True once Purchases.configure has resolved and the first CustomerInfo
  // payload has been received. Consumers can block tier-dependent UI on this.
  isReady: boolean;
  customerInfo: CustomerInfo | null;
  // True if no RC API key is configured for the current platform. The
  // provider still mounts cleanly; consumers should treat the user as
  // unentitled (free tier) and defer purchase UI.
  isDisabled: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

function getApiKey(): string | undefined {
  const extra = Constants.expoConfig?.extra;
  if (Platform.OS === "ios") {
    return extra?.rcIosApiKey as string | undefined;
  }
  if (Platform.OS === "android") {
    return extra?.rcAndroidApiKey as string | undefined;
  }
  return undefined;
}

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user, isLoaded } = useUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const configuredUserIdRef = useRef<string | null>(null);

  const apiKey = getApiKey();
  const isDisabled = !apiKey;

  useEffect(() => {
    if (!isLoaded) return;
    if (isDisabled) {
      // Platform has no API key configured. Mark ready with no customer info
      // so the app can proceed as if the user is on the free tier.
      setIsReady(true);
      return;
    }

    const userId = user?.id ?? null;

    // Re-configure whenever the signed-in user changes. RC handles the
    // anonymous → signed-in transition internally; passing appUserID on
    // configure or calling logIn is the way to associate a purchase with
    // our Clerk user.
    if (userId === configuredUserIdRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        await Purchases.configure({
          apiKey: apiKey!,
          appUserID: userId ?? undefined,
        });

        configuredUserIdRef.current = userId;

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setCustomerInfo(info);
          setIsReady(true);
        }
      } catch (err) {
        // Don't take the app down — RC is not load-bearing for core flows.
        // Entitlement decisions still fall back to our backend.
        logger.error("RevenueCat configure failed", { err });
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, isDisabled, apiKey]);

  useEffect(() => {
    if (isDisabled) return;
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isDisabled]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({ isReady, customerInfo, isDisabled }),
    [isReady, customerInfo, isDisabled],
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextValue {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error("useRevenueCat must be used inside RevenueCatProvider");
  }
  return ctx;
}

/**
 * Deep link to the platform's native subscription management screen.
 *
 * iOS → the Apple ID subscriptions page (in-app purchases including ours).
 * Android → the Play Store subscriptions page, filtered to our package.
 *
 * This is what we show for "Manage Subscription" in place of a Stripe
 * Customer Portal. Apple requires external IAP management to go through
 * the App Store, not a custom in-app flow.
 */
export function getManageSubscriptionUrl(packageName?: string): string {
  if (Platform.OS === "ios") {
    return "https://apps.apple.com/account/subscriptions";
  }
  // Play Store deep link. Package name can be supplied to filter to a
  // specific app's subscriptions; fall back to the generic subscriptions list.
  const base = "https://play.google.com/store/account/subscriptions";
  return packageName ? `${base}?package=${packageName}` : base;
}
