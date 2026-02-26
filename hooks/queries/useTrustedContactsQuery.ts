/**
 * Trusted Contacts Query Hooks
 *
 * TanStack Query hooks for fetching trusted contact data.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type { TrustedContact } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to fetch all trusted contacts for the current plan
 *
 * Uses a short stale time and always refetches on app focus because
 * contact statuses (pending → accepted, revoked, etc.) can change
 * at any time via actions in other apps or by the plan owner.
 */
export function useTrustedContactsQuery() {
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useQuery({
    queryKey: queryKeys.trustedContacts.all(planId!),
    queryFn: () => trustedContacts.list(planId!),
    enabled: !!planId,
    staleTime: 30 * 1000, // 30 seconds — statuses change frequently
    refetchOnWindowFocus: "always",
  });
}

/**
 * Hook to fetch a single trusted contact by ID
 *
 * Uses initialData from the cached list query for instant display.
 */
export function useTrustedContactQuery(contactId: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useQuery({
    queryKey: queryKeys.trustedContacts.single(planId!, contactId!),
    queryFn: () => trustedContacts.get(planId!, contactId!),
    enabled: !!planId && !!contactId,
    initialData: () => {
      if (!planId || !contactId) return undefined;

      const listData = queryClient.getQueryData<TrustedContact[]>(
        queryKeys.trustedContacts.all(planId),
      );
      return listData?.find((c) => c.id === contactId);
    },
    initialDataUpdatedAt: () => {
      if (!planId) return undefined;
      return queryClient.getQueryState(
        queryKeys.trustedContacts.all(planId),
      )?.dataUpdatedAt;
    },
  });
}
