/**
 * usePublicKeyLookup - Look up a user's public keys by email
 *
 * Imperative hook (not TanStack Query) for one-shot lookups
 * triggered on email field blur. Deduplicates via lastLookedUpEmail.
 *
 * Returns all active device keys for the recipient (multi-device support).
 */

import { useCallback, useRef, useState } from "react";

import { useApi } from "@/api";
import type { PublicKeyByEmailResponse } from "@/api/keys";
import { logger } from "@/lib/logger";

interface UsePublicKeyLookupResult {
  isLoading: boolean;
  /** The recipient's info and all their active device keys (null if not found) */
  recipientKeys: PublicKeyByEmailResponse | null;
  lastLookedUpEmail: string | null;
  lookup: (email: string) => void;
  reset: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usePublicKeyLookup(): UsePublicKeyLookupResult {
  const { keys } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [recipientKeys, setRecipientKeys] =
    useState<PublicKeyByEmailResponse | null>(null);
  const [lastLookedUpEmail, setLastLookedUpEmail] = useState<string | null>(
    null,
  );
  const lastEmailRef = useRef<string | null>(null);

  const lookup = useCallback(
    (email: string) => {
      const trimmed = email.trim().toLowerCase();

      // Skip invalid or duplicate lookups
      if (!EMAIL_REGEX.test(trimmed) || trimmed === lastEmailRef.current) {
        return;
      }

      lastEmailRef.current = trimmed;
      setIsLoading(true);
      setRecipientKeys(null);
      setLastLookedUpEmail(trimmed);

      keys
        .getPublicKeyByEmail(trimmed)
        .then((result) => {
          // Only update if this is still the latest lookup
          if (lastEmailRef.current !== trimmed) return;

          if (result.found) {
            setRecipientKeys(result);
          } else {
            setRecipientKeys(null);
          }
        })
        .catch((error) => {
          if (lastEmailRef.current !== trimmed) return;
          logger.warn("Public key lookup failed", error);
          setRecipientKeys(null);
        })
        .finally(() => {
          if (lastEmailRef.current !== trimmed) return;
          setIsLoading(false);
        });
    },
    [keys],
  );

  const reset = useCallback(() => {
    lastEmailRef.current = null;
    setIsLoading(false);
    setRecipientKeys(null);
    setLastLookedUpEmail(null);
  }, []);

  return { isLoading, recipientKeys, lastLookedUpEmail, lookup, reset };
}
