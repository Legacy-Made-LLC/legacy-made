/**
 * useApi Hook - Easy access to API services in React components
 */

import { useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createAccessInvitationsService } from './accessInvitations';
import { createApiClient } from './client';
import { createEntriesService } from './entries';
import { createEntitlementsService } from './entitlements';
import { createFilesService } from './files';
import { createPlansService } from './plans';
import { createProgressService } from './progress';
import { createTrustedContactsService } from './trustedContacts';
import { createWishesService } from './wishes';

/**
 * Hook that provides access to API services with authentication
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { entries, plans, isSignedIn } = useApi();
 *
 *   useEffect(() => {
 *     if (isSignedIn) {
 *       plans.getMyPlan().then(plan => {
 *         entries.listContacts(plan.id).then(setContacts);
 *       });
 *     }
 *   }, [isSignedIn]);
 * }
 * ```
 */
export function useApi() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  // Use a ref to store getToken so the client doesn't get recreated on every render.
  // getToken from useAuth() changes identity on every render, which would cause
  // an infinite loop in components that depend on the entries/plans services.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const client = useMemo(() => {
    return createApiClient(() => getTokenRef.current());
  }, []);

  const entries = useMemo(() => {
    return createEntriesService(client);
  }, [client]);

  const plans = useMemo(() => {
    return createPlansService(client);
  }, [client]);

  const files = useMemo(() => {
    return createFilesService(client);
  }, [client]);

  const entitlements = useMemo(() => {
    return createEntitlementsService(client);
  }, [client]);

  const wishes = useMemo(() => {
    return createWishesService(client);
  }, [client]);

  const progress = useMemo(() => {
    return createProgressService(client);
  }, [client]);

  const trustedContacts = useMemo(() => {
    return createTrustedContactsService(client);
  }, [client]);

  const accessInvitations = useMemo(() => {
    return createAccessInvitationsService(client);
  }, [client]);

  return {
    /** The base API client for custom requests */
    client,
    /** Entries service with CRUD operations */
    entries,
    /** Files service for upload and management */
    files,
    /** Plans service */
    plans,
    /** Entitlements service */
    entitlements,
    /** Wishes service with CRUD operations (Wishes pillar) */
    wishes,
    /** Progress service for task completion tracking */
    progress,
    /** Trusted contacts service for family access management */
    trustedContacts,
    /** Access invitations service for accepting/declining invitations */
    accessInvitations,
    /** Whether the user is signed in */
    isSignedIn,
    /** Whether Clerk has finished loading */
    isLoaded,
  };
}
