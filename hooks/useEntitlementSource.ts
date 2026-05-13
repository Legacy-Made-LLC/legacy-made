/**
 * useEntitlementSource — the single read site for B2B-aware UI gating.
 *
 * Returns the user's effective entitlement source ('d2c' | 'b2b' |
 * 'lifetime' | 'none') alongside the providerName when applicable.
 * Components decide what to render off this:
 *
 *   - `source === 'b2b'`     hide paywalls + Manage Subscription;
 *                            show "Provided by {providerName}"
 *   - `source === 'lifetime'` show "Lifetime", no Manage
 *   - `source === 'd2c'`      existing RC management UI
 *   - `source === 'none'`     existing Subscribe CTA
 *
 * Defaults to `'none'` while loading or when the API response predates
 * the entitlementSource field — that keeps existing flows working
 * during a partial rollout (old API + new app, or vice versa).
 */
import { useEntitlementsQuery } from "@/hooks/queries/useEntitlementsQuery";
import type { EntitlementSource } from "@/api/types";

export interface EntitlementSourceContext {
  source: EntitlementSource;
  providerName: string | null;
  masterSubscriptionId: string | null;
  /** True while the underlying query is loading on first mount. */
  isLoading: boolean;
}

export function useEntitlementSource(): EntitlementSourceContext {
  const query = useEntitlementsQuery();

  const data = query.data;
  return {
    source: data?.entitlementSource ?? "none",
    providerName: data?.providerName ?? null,
    masterSubscriptionId: data?.masterSubscriptionId ?? null,
    isLoading: query.isPending,
  };
}

/**
 * Convenience predicate: should the app hide paywall / upgrade affordances?
 * True for B2B members (their bill is the master sub owner's problem) and
 * lifetime users (already at the top tier).
 */
export function shouldHidePaywall(source: EntitlementSource): boolean {
  return source === "b2b" || source === "lifetime";
}
