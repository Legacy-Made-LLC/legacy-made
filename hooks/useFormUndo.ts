/**
 * useFormUndo - Session-scoped undo/redo via simple snapshot stack
 *
 * Maintains a stack of JSON-serialized form value snapshots.
 * - archive() pushes current values onto the stack (if different from top)
 * - undo() pops the stack and returns the previous values, pushing popped
 *   state onto a redo stack
 * - redo() pops the redo stack and pushes it back onto the undo stack
 * - Any new archive() clears the redo stack (standard undo/redo behavior)
 * - No external dependencies — just useState + useRef
 *
 * Archive points are created after each successful auto-save,
 * giving natural "pause points" aligned with what's been persisted.
 */

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 10;

export interface UseFormUndoReturn<T> {
  /** Push the current form values as an undo checkpoint (deduped) */
  archive: (values: T) => void;
  /** Pop the stack and return the previous values, or undefined if nothing to undo */
  undo: () => T | undefined;
  /** Re-apply the last undone change, or undefined if nothing to redo */
  redo: () => T | undefined;
  /** Whether there is history to undo */
  canUndo: boolean;
  /** Whether there is history to redo */
  canRedo: boolean;
}

export function useFormUndo<T>(): UseFormUndoReturn<T> {
  // Stack of serialized snapshots (oldest first, newest last)
  const stackRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  // React state solely to trigger re-renders when canUndo/canRedo changes
  const [stackSize, setStackSize] = useState(0);
  const [redoSize, setRedoSize] = useState(0);

  const archive = useCallback((values: T) => {
    const serialized = JSON.stringify(values);
    const stack = stackRef.current;

    // Skip if identical to the most recent snapshot
    if (stack.length > 0 && stack[stack.length - 1] === serialized) {
      return;
    }

    stack.push(serialized);

    // Trim to max history
    if (stack.length > MAX_HISTORY) {
      stack.splice(0, stack.length - MAX_HISTORY);
    }

    // New edit clears the redo stack (standard undo/redo behavior)
    if (redoRef.current.length > 0) {
      redoRef.current = [];
      setRedoSize(0);
    }

    setStackSize(stack.length);
  }, []);

  const undo = useCallback((): T | undefined => {
    const stack = stackRef.current;
    if (stack.length < 2) return undefined;

    // Pop the current state (top of stack) and push onto redo stack
    const popped = stack.pop()!;
    redoRef.current.push(popped);

    // The new top is the state to revert to
    const previous = stack[stack.length - 1];

    setStackSize(stack.length);
    setRedoSize(redoRef.current.length);
    return JSON.parse(previous) as T;
  }, []);

  const redo = useCallback((): T | undefined => {
    const redoStack = redoRef.current;
    if (redoStack.length === 0) return undefined;

    // Pop the redo stack and push back onto the undo stack
    const restored = redoStack.pop()!;
    stackRef.current.push(restored);

    setStackSize(stackRef.current.length);
    setRedoSize(redoStack.length);
    return JSON.parse(restored) as T;
  }, []);

  const canUndo = stackSize >= 2;
  const canRedo = redoSize > 0;

  return { archive, undo, redo, canUndo, canRedo };
}
