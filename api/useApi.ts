/**
 * useApi Hook - Easy access to API services in React components
 */

import { useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from './client';
import { createEntriesService } from './entries';
import { createPlansService } from './plans';

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

  return {
    /** The base API client for custom requests */
    client,
    /** Entries service with CRUD operations */
    entries,
    /** Plans service */
    plans,
    /** Whether the user is signed in */
    isSignedIn,
    /** Whether Clerk has finished loading */
    isLoaded,
  };
}
