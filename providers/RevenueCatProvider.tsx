/**
 * RevenueCat Provider
 *
 * Wraps the RC SDK lifecycle (configure → fetch CustomerInfo → listen for
 * updates) and exposes the prebuilt RC UI surfaces (Paywall, Customer
 * Center) via callable methods.
 *
 * IMPORTANT: react-native-purchases is a native module. After installing or
 * upgrading the package, run `expo prebuild --clean && expo run:ios` (or
 * run:android) so the native code is linked into the dev client. Importing
 * this file before that rebuild crashes the app at startup.
 *
 * Source-of-truth for entitlements is the backend (driven by RC webhooks).
 * The customerInfo exposed here is a defense-in-depth signal, useful for:
 *   - Optimistic UI right after a purchase (before our webhook lands)
 *   - Restore-purchases flows
 *   - Triggering a backend refresh after CustomerInfo changes
 */

import { useUser } from "@clerk/expo";
import Constants from "expo-constants";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
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
import RevenueCatUI from "react-native-purchases-ui";

import { logger } from "@/lib/logger";
import { hasActiveEntitlement } from "@/lib/revenuecat";

interface RevenueCatContextValue {
  // True once Purchases.configure has resolved and the first CustomerInfo
  // payload has been received (or once we've decided RC is disabled).
  isReady: boolean;
  // Latest CustomerInfo from RC. Null while loading or when RC is disabled.
  customerInfo: CustomerInfo | null;
  // True if no RC API key is configured for the current platform. The
  // provider still mounts cleanly so consumers don't need to special-case
  // its presence — they just won't get entitlement signals.
  isDisabled: boolean;

  /**
   * True if the user currently has the entitlement active in RC. Falls back
   * to false when RC is disabled or hasn't loaded yet — backend tier
   * remains authoritative for actual access decisions.
   */
  hasEntitlement: (entitlementId: string) => boolean;

  /**
   * Navigate to our custom paywall screen at /paywall. The optional
   * `placement` identifier is passed through to RC Targeting so the
   * right offering (and therefore the right variant) is fetched.
   * No-op if RC is disabled.
   */
  presentPaywall: (placement?: string) => void;

  /**
   * Present the RC Customer Center (manage subscription, refund requests,
   * promo offers, exit surveys). This is the in-app counterpart to the
   * native App Store / Play Store deep link.
   */
  presentCustomerCenter: () => Promise<void>;

  /** Re-fetch entitlements from the store. Use for a "Restore Purchases" button. */
  restorePurchases: () => Promise<CustomerInfo | null>;
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
  const isConfiguredRef = useRef(false);

  const apiKey = getApiKey();
  const isDisabled = !apiKey;

  useEffect(() => {
    if (!isLoaded) return;
    if (isDisabled) {
      // Platform has no API key configured. Mark ready so consumers don't
      // hang waiting; treat the user as unentitled.
      setIsReady(true);
      return;
    }

    const userId = user?.id ?? null;

    // Skip if we've already aligned RC with the current Clerk user.
    if (isConfiguredRef.current && userId === configuredUserIdRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // First mount: configure once. SDK requires configure before any
        // logIn/logOut calls. Pass appUserID upfront when known so the
        // initial CustomerInfo is already bound to the Clerk user.
        if (!isConfiguredRef.current) {
          await Purchases.configure({
            apiKey: apiKey!,
            appUserID: userId ?? undefined,
          });
          isConfiguredRef.current = true;
          configuredUserIdRef.current = userId;
        } else if (userId !== configuredUserIdRef.current) {
          // Subsequent user switches: prefer logIn/logOut over reconfigure
          // so RC can alias previous anonymous purchases and so we don't
          // leave the prior user's appUserID attached on sign-out.
          if (userId) {
            await Purchases.logIn(userId);
          } else {
            await Purchases.logOut();
          }
          configuredUserIdRef.current = userId;
        }

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setCustomerInfo(info);
          setIsReady(true);
        }
      } catch (err) {
        // Don't take the app down — RC is not load-bearing for core flows.
        // Backend entitlement state still drives access.
        logger.error("RevenueCat configure/login failed", { err });
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

  const hasEntitlement = useCallback(
    (entitlementId: string) => hasActiveEntitlement(customerInfo, entitlementId),
    [customerInfo],
  );

  const presentPaywall = useCallback(
    (placement?: string) => {
      if (isDisabled) return;
      if (placement) {
        router.push({ pathname: "/paywall", params: { placement } });
      } else {
        router.push("/paywall");
      }
    },
    [isDisabled],
  );

  const presentCustomerCenter = useCallback(async () => {
    if (isDisabled) return;
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (err) {
      logger.error("RevenueCat presentCustomerCenter failed", { err });
    }
  }, [isDisabled]);

  const restorePurchases = useCallback(async () => {
    if (isDisabled) return null;
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } catch (err) {
      logger.error("RevenueCat restorePurchases failed", { err });
      return null;
    }
  }, [isDisabled]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      isReady,
      customerInfo,
      isDisabled,
      hasEntitlement,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
    }),
    [
      isReady,
      customerInfo,
      isDisabled,
      hasEntitlement,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
    ],
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
 * The configured RC entitlement identifier for our paid (Individual) tier.
 * Sourced from `EXPO_PUBLIC_RC_ENTITLEMENT_INDIVIDUAL` (defaulted to
 * `individual` in app.config.ts). Must match the identifier configured in
 * the RC dashboard — case-sensitive.
 */
export const RC_ENTITLEMENT_INDIVIDUAL: string =
  (Constants.expoConfig?.extra?.rcEntitlementIndividual as string | undefined) ??
  "individual";

/**
 * Deep link to the platform's native subscription management screen.
 *
 * iOS → the Apple ID subscriptions page (in-app purchases including ours).
 * Android → the Play Store subscriptions page, filtered to our package.
 *
 * Prefer `presentCustomerCenter()` for in-app management; this is a
 * fallback for cases where Customer Center isn't available or appropriate.
 */
export function getManageSubscriptionUrl(packageName?: string): string {
  if (Platform.OS === "ios") {
    return "https://apps.apple.com/account/subscriptions";
  }
  const base = "https://play.google.com/store/account/subscriptions";
  return packageName ? `${base}?package=${packageName}` : base;
}
