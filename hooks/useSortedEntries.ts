/**
 * useSortedEntries - Sorts and optionally filters entries
 * Persists the user's sort preference per list via MMKV Storage.
 */

import type { Entry } from "@/api/types";
import { useKeyValue, useUserStorageValue } from "@/contexts/KeyValueContext";
import { useCallback, useMemo, useState } from "react";

export type SortMode = "alphabetical" | "recent";

const SORT_KEY_PREFIX = "sort_mode_";

export function useSortedEntries<T = Record<string, unknown>>(
  entries: Entry<T>[],
  getDisplayTitle: (entry: Entry<T>) => string,
  storageKey?: string,
): {
  sortedEntries: Entry<T>[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: SortMode;
  setSortMode: (sortMode: SortMode) => void;
} {
  const { userStorage } = useKeyValue();
  const [searchQuery, setSearchQuery] = useState("");

  const resolvedStorageSortKey = `${SORT_KEY_PREFIX}${storageKey}`;
  const sortMode = useUserStorageValue({
    key: resolvedStorageSortKey,
    get: (s) =>
      (s.getString(resolvedStorageSortKey) as SortMode | undefined) ??
      "alphabetical",
  });
  const setSortMode = useCallback(
    (sortMode: SortMode) => {
      userStorage.set(resolvedStorageSortKey, sortMode);
    },
    [resolvedStorageSortKey, userStorage],
  );

  const sortedEntries = useMemo(() => {
    let copy = [...entries];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      copy = copy.filter((entry) =>
        getDisplayTitle(entry).toLowerCase().includes(query),
      );
    }

    if (sortMode === "alphabetical") {
      copy.sort((a, b) => {
        const titleA = getDisplayTitle(a).toLowerCase();
        const titleB = getDisplayTitle(b).toLowerCase();
        return titleA.localeCompare(titleB);
      });
    } else {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return copy;
  }, [entries, sortMode, searchQuery, getDisplayTitle]);

  return {
    sortedEntries,
    sortMode,
    setSortMode,
    searchQuery,
    setSearchQuery,
  };
}
