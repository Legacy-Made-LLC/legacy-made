import type { CustomerInfo } from "react-native-purchases";

/**
 * Pure check for an active RC entitlement. Returns false when CustomerInfo
 * is null (RC disabled or not yet loaded) — backend tier remains the
 * authoritative source for actual access decisions.
 */
export function hasActiveEntitlement(
  customerInfo: CustomerInfo | null,
  entitlementId: string,
): boolean {
  if (!customerInfo) return false;
  return customerInfo.entitlements.active[entitlementId]?.isActive === true;
}
