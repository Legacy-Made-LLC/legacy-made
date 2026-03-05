/**
 * useAutoSave - Debounced auto-save hook for forms
 *
 * Manages automatic saving of form data with debouncing, status tracking,
 * and creation/update logic for wishes.
 *
 * State machine:
 * idle → pending (data changed) → saving → saved (1.5s) → idle
 *                                    ↓
 *                                  error (persists until dismissed)
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions<T> {
  /** Debounce delay in milliseconds (default: 600) */
  debounceMs?: number;
  /** Duration to show "saved" status before returning to idle (default: 1500) */
  savedDurationMs?: number;
  /** Callback to create a new record, returns the new ID */
  onCreate: (data: T) => Promise<string>;
  /** Callback to update an existing record */
  onUpdate: (id: string, data: T) => Promise<void>;
  /** Initial record ID (if editing existing) */
  initialId?: string;
  /** Callback when save completes successfully (with id) */
  onSaveComplete?: (id: string) => void;
}

export interface UseAutoSaveReturn<T> {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Error message if status is "error" */
  errorMessage?: string;
  /** Trigger a save with the given data (respects isDirty) */
  triggerSave: (data: T, isDirty: boolean) => void;
  /** Immediately flush any pending save. Returns the current recordId after flush. */
  flushSave: () => Promise<string | undefined>;
  /** Current record ID (undefined until first save for new records) */
  recordId: string | undefined;
  /** Dismiss error state, returning to idle */
  dismissError: () => void;
  /** Reset the hook state (e.g., when switching records) */
  reset: (newId?: string) => void;
}

export function useAutoSave<T>({
  debounceMs = 600,
  savedDurationMs = 1500,
  onCreate,
  onUpdate,
  initialId,
  onSaveComplete,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [recordId, setRecordId] = useState<string | undefined>(initialId);

  // Refs for managing debounce timer and pending data
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep recordId ref in sync for use in async callbacks
  const recordIdRef = useRef(recordId);
  recordIdRef.current = recordId;

  // Keep callbacks in refs to avoid effect dependencies
  const onCreateRef = useRef(onCreate);
  const onUpdateRef = useRef(onUpdate);
  const onSaveCompleteRef = useRef(onSaveComplete);
  onCreateRef.current = onCreate;
  onUpdateRef.current = onUpdate;
  onSaveCompleteRef.current = onSaveComplete;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (data: T): Promise<void> => {
    if (isSavingRef.current) {
      // Already saving, queue this data for next save
      pendingDataRef.current = data;
      return;
    }

    isSavingRef.current = true;
    setStatus("saving");
    setErrorMessage(undefined);

    try {
      let savedId: string;

      if (recordIdRef.current) {
        // Update existing record
        await onUpdateRef.current(recordIdRef.current, data);
        savedId = recordIdRef.current;
      } else {
        // Create new record
        savedId = await onCreateRef.current(data);
        setRecordId(savedId);
        recordIdRef.current = savedId;
      }

      // Notify completion
      onSaveCompleteRef.current?.(savedId);

      // Clear any pending data that was queued
      const nextData = pendingDataRef.current;
      pendingDataRef.current = null;
      isSavingRef.current = false;

      // If there was pending data, save it now
      if (nextData) {
        await performSave(nextData);
        return;
      }

      // Show saved status
      setStatus("saved");

      // Clear saved timer if exists
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }

      // Return to idle after duration
      savedTimerRef.current = setTimeout(() => {
        setStatus("idle");
        savedTimerRef.current = null;
      }, savedDurationMs);
    } catch (error) {
      isSavingRef.current = false;
      pendingDataRef.current = null;

      const message =
        error instanceof Error ? error.message : "Failed to save changes";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [savedDurationMs]);

  /**
   * Trigger a debounced save
   */
  const triggerSave = useCallback(
    (data: T, isDirty: boolean) => {
      // Don't save if not dirty
      if (!isDirty) {
        return;
      }

      // Store the pending data
      pendingDataRef.current = data;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Show pending status
      setStatus("pending");

      // Set debounce timer
      debounceTimerRef.current = setTimeout(() => {
        const dataToSave = pendingDataRef.current;
        debounceTimerRef.current = null;

        if (dataToSave) {
          performSave(dataToSave);
        }
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  /**
   * Immediately flush any pending save (for navigation protection)
   */
  const flushSave = useCallback(async (): Promise<string | undefined> => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // If there's pending data, save it now
    const dataToSave = pendingDataRef.current;
    if (dataToSave) {
      await performSave(dataToSave);
    }

    // Wait for any in-progress save to complete
    while (isSavingRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Return the current recordId from the ref (avoids stale React state)
    return recordIdRef.current;
  }, [performSave]);

  /**
   * Dismiss error state
   */
  const dismissError = useCallback(() => {
    if (status === "error") {
      setStatus("idle");
      setErrorMessage(undefined);
    }
  }, [status]);

  /**
   * Reset the hook state
   */
  const reset = useCallback((newId?: string) => {
    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }

    // Reset state
    pendingDataRef.current = null;
    isSavingRef.current = false;
    setStatus("idle");
    setErrorMessage(undefined);
    setRecordId(newId);
    recordIdRef.current = newId;
  }, []);

  return {
    status,
    errorMessage,
    triggerSave,
    flushSave,
    recordId,
    dismissError,
    reset,
  };
}
