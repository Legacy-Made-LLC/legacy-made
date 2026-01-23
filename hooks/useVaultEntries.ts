/**
 * Vault Entries Hooks
 *
 * Provides hooks for fetching and mutating vault entries by taskKey.
 * These hooks abstract the API calls and provide a clean interface for
 * the vault components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/api';
import { usePlan } from '@/data/PlanProvider';
import type { VaultEntry } from '@/components/vault/registry';

/**
 * Hook to fetch entries for a specific task
 */
export function useVaultEntries(taskKey: string | undefined) {
  const { planId } = usePlan();
  const { entries: entriesApi } = useApi();

  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!planId || !taskKey) {
      setEntries([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch entries filtered by taskKey
      const result = await entriesApi.listByTaskKey(planId, taskKey);
      // Map API entries to VaultEntry format
      const vaultEntries: VaultEntry[] = result.map((entry) => ({
        ...entry,
        taskKey: (entry as unknown as VaultEntry).taskKey || taskKey,
        metadata: entry.metadata as unknown as Record<string, unknown>,
      }));
      setEntries(vaultEntries);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch entries';
      setError(message);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [planId, taskKey, entriesApi]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    isLoading,
    error,
    refresh: fetchEntries,
  };
}

/**
 * Hook to fetch a single entry by ID
 */
export function useVaultEntry(entryId: string | undefined) {
  const { entries: entriesApi } = useApi();

  const [entry, setEntry] = useState<VaultEntry | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!entryId) {
      setEntry(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await entriesApi.get(entryId);
      // Map API entry to VaultEntry format
      const vaultEntry: VaultEntry = {
        ...result,
        taskKey: (result as unknown as VaultEntry).taskKey,
        metadata: result.metadata as unknown as Record<string, unknown>,
      };
      setEntry(vaultEntry);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch entry';
      setError(message);
      setEntry(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [entryId, entriesApi]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return {
    entry,
    isLoading,
    error,
    refresh: fetchEntry,
  };
}

/**
 * Hook for entry mutations (create, update, delete)
 */
export function useVaultEntriesMutations(taskKey: string | undefined) {
  const { planId } = usePlan();
  const { entries: entriesApi } = useApi();

  const createEntry = useCallback(
    async (data: { title: string; notes?: string; metadata: Record<string, unknown> }) => {
      if (!planId || !taskKey) {
        throw new Error('Plan ID and task key are required');
      }

      return entriesApi.createWithTaskKey(planId, taskKey, data);
    },
    [planId, taskKey, entriesApi]
  );

  const updateEntry = useCallback(
    async (
      entryId: string,
      data: { title?: string; notes?: string; metadata?: Record<string, unknown> }
    ) => {
      return entriesApi.update(entryId, data);
    },
    [entriesApi]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      return entriesApi.delete(entryId);
    },
    [entriesApi]
  );

  return {
    createEntry,
    updateEntry,
    deleteEntry,
  };
}

/**
 * Hook to get entry counts for all sections (for dashboard display)
 */
export function useVaultEntryCounts() {
  const { planId } = usePlan();
  const { entries: entriesApi } = useApi();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!planId) {
      setCounts({});
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all entries and count by taskKey
      const allEntries = await entriesApi.listAll(planId);
      const countMap: Record<string, number> = {};

      for (const entry of allEntries) {
        // Support both taskKey (new) and category (old) during transition
        const entryAny = entry as { taskKey?: string; category?: string };
        const key = entryAny.taskKey || entryAny.category;
        if (key) {
          countMap[key] = (countMap[key] || 0) + 1;
        }
      }

      setCounts(countMap);
    } catch {
      setCounts({});
    } finally {
      setIsLoading(false);
    }
  }, [planId, entriesApi]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    isLoading,
    refresh: fetchCounts,
  };
}
