/**
 * Trusted Contacts Mutation Hooks
 *
 * TanStack Query hooks for creating, updating, and deleting trusted contacts.
 * Includes optimistic updates for a responsive UI.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type {
  CreateTrustedContactRequest,
  EntitlementInfo,
  TrustedContact,
  UpdateTrustedContactRequest,
} from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook for creating a new trusted contact (sends invitation)
 */
export function useCreateTrustedContact() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useMutation({
    mutationFn: (data: CreateTrustedContactRequest) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      return trustedContacts.create(planId, data);
    },
    onMutate: async (data) => {
      if (!planId) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });

      const previousContacts = queryClient.getQueryData<TrustedContact[]>(
        queryKeys.trustedContacts.all(planId),
      );

      // Create optimistic contact
      const optimisticContact: TrustedContact = {
        id: `temp-${Date.now()}`,
        planId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        relationship: data.relationship,
        accessLevel: data.accessLevel,
        accessTiming: data.accessTiming,
        accessStatus: "pending",
        notes: data.notes,
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<TrustedContact[]>(
        queryKeys.trustedContacts.all(planId),
        [...(previousContacts ?? []), optimisticContact],
      );

      return { previousContacts };
    },
    onError: (_err, _data, context) => {
      if (!planId || !context?.previousContacts) return;
      queryClient.setQueryData(
        queryKeys.trustedContacts.all(planId),
        context.previousContacts,
      );
    },
    onSettled: () => {
      if (!planId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.current(),
      });
    },
  });
}

/**
 * Hook for updating a trusted contact
 */
export function useUpdateTrustedContact() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: UpdateTrustedContactRequest;
    }) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      return trustedContacts.update(planId, contactId, data);
    },
    onMutate: async ({ contactId, data }) => {
      if (!planId) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });

      const previousContacts = queryClient.getQueryData<TrustedContact[]>(
        queryKeys.trustedContacts.all(planId),
      );

      if (previousContacts) {
        queryClient.setQueryData<TrustedContact[]>(
          queryKeys.trustedContacts.all(planId),
          previousContacts.map((contact) =>
            contact.id === contactId
              ? { ...contact, ...data, updatedAt: new Date().toISOString() }
              : contact,
          ),
        );
      }

      return { previousContacts };
    },
    onError: (_err, _variables, context) => {
      if (!planId || !context?.previousContacts) return;
      queryClient.setQueryData(
        queryKeys.trustedContacts.all(planId),
        context.previousContacts,
      );
    },
    onSettled: (_data, _error, variables) => {
      if (!planId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trustedContacts.single(
          planId,
          variables.contactId,
        ),
      });
    },
  });
}

/**
 * Hook for revoking/deleting a trusted contact
 */
export function useDeleteTrustedContact() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useMutation({
    mutationFn: (contactId: string) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      return trustedContacts.delete(planId, contactId);
    },
    onMutate: async (contactId) => {
      if (!planId) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });

      const previousContacts = queryClient.getQueryData<TrustedContact[]>(
        queryKeys.trustedContacts.all(planId),
      );

      if (previousContacts) {
        queryClient.setQueryData<TrustedContact[]>(
          queryKeys.trustedContacts.all(planId),
          previousContacts.filter((c) => c.id !== contactId),
        );
      }

      return { previousContacts };
    },
    onError: (_err, _contactId, context) => {
      if (!planId || !context?.previousContacts) return;
      queryClient.setQueryData(
        queryKeys.trustedContacts.all(planId),
        context.previousContacts,
      );
    },
    onSettled: () => {
      if (!planId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.trustedContacts.all(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.current(),
      });
    },
  });
}

/**
 * Hook for resending an invitation email
 */
export function useResendInvitation() {
  const { planId } = usePlan();
  const { trustedContacts } = useApi();

  return useMutation({
    mutationFn: (contactId: string) => {
      if (!planId) {
        throw new Error("Plan ID is required");
      }
      return trustedContacts.resendInvitation(planId, contactId);
    },
  });
}
