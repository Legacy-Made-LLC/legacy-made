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
