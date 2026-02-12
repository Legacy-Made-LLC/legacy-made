/**
 * useSortedEntries - Sorts entries alphabetically or by most recent
 * Persists the user's sort preference per list via AsyncStorage.
 */

import type { Entry } from "@/api/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type SortMode = "alphabetical" | "recent";

const SORT_KEY_PREFIX = "sort_mode_";

export function useSortedEntries<T = Record<string, unknown>>(
  entries: Entry<T>[],
  getDisplayTitle: (entry: Entry<T>) => string,
  storageKey?: string,
) {
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical");

  // Load persisted sort preference on mount
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(`${SORT_KEY_PREFIX}${storageKey}`).then((value) => {
      if (value === "alphabetical" || value === "recent") {
        setSortMode(value);
      }
    });
  }, [storageKey]);

  const sortedEntries = useMemo(() => {
    const copy = [...entries];
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
  }, [entries, sortMode, getDisplayTitle]);

  const handleSetSortMode = useCallback(
    (mode: SortMode) => {
      setSortMode(mode);
      if (storageKey) {
        AsyncStorage.setItem(`${SORT_KEY_PREFIX}${storageKey}`, mode);
      }
    },
    [storageKey],
  );

  return { sortedEntries, sortMode, setSortMode: handleSetSortMode };
}
