/**
 * Legacy Component Registry
 *
 * Maps taskKeys to their corresponding form and list components.
 * This allows dynamic routing to render the correct components based on the task.
 *
 * The Legacy Messages pillar is a hybrid:
 * - Singleton tasks use WishFormProps-like interface (auto-save forms)
 * - List tasks use EntryFormProps-like interface (save/cancel forms)
 */

import type { EntryCompletionStatus, Message, MetadataSchema, FileAttachment } from "@/api/types";
import type { AnyFormApi } from "@tanstack/form-core";
import type { ComponentType } from "react";

// Form imports
import { MessageToPersonForm } from "./forms/MessageToPersonForm";
import { YourStoryForm } from "./forms/YourStoryForm";
import { FutureMomentForm } from "./forms/FutureMomentForm";

// List imports
import { MessageToPersonList } from "./lists/MessageToPersonList";
import { FutureMomentList } from "./lists/FutureMomentList";

// ============================================================================
// Guidance Types (for singleton forms)
// ============================================================================

export interface LegacyFormGuidance {
  icon?: string;
  triggerText: string;
  heading?: string;
  detail: string;
  tips?: string[];
  pacingNote?: string;
}

// ============================================================================
// Save Data (for singleton auto-save)
// ============================================================================

export interface LegacySaveData<T = Record<string, unknown>> {
  title: string;
  notes?: string | null;
  metadata: T;
  metadataSchema: MetadataSchema;
}

// ============================================================================
// Form Props - Singleton (auto-save, like wishes)
// ============================================================================

export interface LegacySingletonFormProps {
  taskKey: string;
  messageId?: string;
  initialData?: Message;
  onFormReady?: (form: AnyFormApi) => void;
  registerGetSaveData?: (fn: () => LegacySaveData) => void;
  guidance?: LegacyFormGuidance;
  attachments?: FileAttachment[];
  onAttachmentsChange?: (files: FileAttachment[]) => void;
  isUploading?: boolean;
  deletingFileIds?: Set<string>;
  onStorageUpgradeRequired?: () => void;
  readOnly?: boolean;
}

// ============================================================================
// Form Props - List Entry (save/cancel, like vault)
// ============================================================================

export interface LegacyEntryFormProps {
  taskKey: string;
  entryId?: string;
  initialData?: Message;
  onSave: (data: {
    title: string;
    notes?: string | null;
    metadata: Record<string, unknown>;
    metadataSchema: MetadataSchema;
    completionStatus?: EntryCompletionStatus;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  attachments?: FileAttachment[];
  onAttachmentsChange?: (files: FileAttachment[]) => void;
  isUploading?: boolean;
  deletingFileIds?: Set<string>;
  onStorageUpgradeRequired?: () => void;
  readOnly?: boolean;
  onFormReady?: (form: AnyFormApi) => void;
}

// ============================================================================
// List Props
// ============================================================================

export interface LegacyListProps {
  taskKey: string;
  messages: Message[];
  isLoading: boolean;
  onEntryPress: (entryId: string) => void;
  onAddPress: () => void;
  readOnly?: boolean;
}

// ============================================================================
// Registries
// ============================================================================

/** Singleton form registry (auto-save forms like wishes) */
const singletonFormRegistry: Record<string, ComponentType<LegacySingletonFormProps>> = {
  "messages.story": YourStoryForm,
};

/** List entry form registry (save/cancel forms like vault) */
const entryFormRegistry: Record<string, ComponentType<LegacyEntryFormProps>> = {
  "messages.people": MessageToPersonForm,
  "messages.future": FutureMomentForm,
};

/** List registry for list-based tasks */
const listRegistry: Record<string, ComponentType<LegacyListProps>> = {
  "messages.people": MessageToPersonList,
  "messages.future": FutureMomentList,
};

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get the singleton form component for a task (auto-save pattern)
 */
export function getLegacySingletonFormComponent(
  taskKey: string,
): ComponentType<LegacySingletonFormProps> | undefined {
  return singletonFormRegistry[taskKey];
}

/**
 * Get the form component for a task (singleton or entry)
 */
export function getLegacyFormComponent(
  taskKey: string,
): ComponentType<LegacySingletonFormProps> | ComponentType<LegacyEntryFormProps> | undefined {
  return singletonFormRegistry[taskKey] ?? entryFormRegistry[taskKey];
}

/**
 * Get the list component for a list-based task
 */
export function getLegacyListComponent(
  taskKey: string,
): ComponentType<LegacyListProps> | undefined {
  return listRegistry[taskKey];
}

/**
 * Get the entry form component for a list-based task
 */
export function getLegacyEntryFormComponent(
  taskKey: string,
): ComponentType<LegacyEntryFormProps> | undefined {
  return entryFormRegistry[taskKey];
}
