import type {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

import type { PaywallVariant } from "@/components/paywall";

export const PAYWALL_VARIANTS: readonly PaywallVariant[] = [
  "editorial",
  "comparison",
  "pillars",
] as const;

export const DEFAULT_PAYWALL_VARIANT: PaywallVariant = "editorial";

const VARIANT_SET = new Set<string>(PAYWALL_VARIANTS);

/**
 * Coerce an RC `offering.metadata.variant` value into a known variant.
 * Falls back to the default for unknown strings, non-strings, or
 * inherited-property names like `toString`.
 */
export function parseVariant(raw: unknown): PaywallVariant {
  if (typeof raw !== "string") return DEFAULT_PAYWALL_VARIANT;
  return VARIANT_SET.has(raw)
    ? (raw as PaywallVariant)
    : DEFAULT_PAYWALL_VARIANT;
}

export type BillingPeriod = "year" | "month";

export interface SubscriptionChoice {
  pkg: PurchasesPackage;
  period: BillingPeriod;
}

/**
 * Pick the Individual package the paywall sells from an RC offering.
 *
 * - Annual is the plan for new buyers, so it wins when the offering has one.
 * - Monthly is a fallback, so the paywall keeps working while an offering
 *   (or a placement-targeted one) still carries only the monthly package.
 *
 * @param offering the RC offering resolved for this placement, or null
 * @returns the package and its billing period, or null when neither exists
 */
export function pickSubscriptionPackage(
  offering: PurchasesOffering | null | undefined,
): SubscriptionChoice | null {
  if (offering?.annual) return { pkg: offering.annual, period: "year" };
  if (offering?.monthly) return { pkg: offering.monthly, period: "month" };
  return null;
}
