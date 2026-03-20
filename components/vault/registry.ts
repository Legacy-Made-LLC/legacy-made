/**
 * Vault Component Registry
 *
 * Maps taskKeys to their corresponding list and form components.
 * This allows dynamic routing to render the correct components based on the task.
 */

import type { Entry, EntryCompletionStatus, FileAttachment, MetadataSchema } from "@/api/types";
import type { AnyFormApi } from "@tanstack/form-core";
import type { ComponentType } from "react";

// ============================================================================
// List Component Registry
// ============================================================================

import { ContactList } from "./lists/ContactList";
import { DigitalList } from "./lists/DigitalList";
import { DocumentList } from "./lists/DocumentList";
import { FinancialList } from "./lists/FinancialList";
import { InsuranceList } from "./lists/InsuranceList";
import { PetList } from "./lists/PetList";
import { PropertyList } from "./lists/PropertyList";

// ============================================================================
// Form Component Registry
// ============================================================================

import { ContactForm } from "./forms/ContactForm";
import { DigitalForm } from "./forms/DigitalForm";
import { DocumentForm } from "./forms/DocumentForm";
import { FinancialForm } from "./forms/FinancialForm";
import { InsuranceForm } from "./forms/InsuranceForm";
import { PetForm } from "./forms/PetForm";
import { PropertyForm } from "./forms/PropertyForm";

// ============================================================================
// List Component Types
// ============================================================================

export interface EntryListProps {
  /** The task key for this list */
  taskKey: string;
  /** Entries to display */
  entries: Entry[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback when an entry is pressed */
  onEntryPress: (entryId: string) => void;
  /** Callback when add button is pressed */
  onAddPress: () => void;
  /** Whether the plan is read-only (viewing a shared plan) */
  readOnly?: boolean;
  /** Optional secondary action label for empty state (e.g. "Doesn't apply to me") */
  emptySecondaryLabel?: string;
  /** Callback for secondary action in empty state */
  onEmptySecondaryAction?: () => void;
}

// ============================================================================
// Form Component Types
// ============================================================================

/** Data shape returned by form's getSaveData function */
export interface EntrySaveData {
  title: string;
  notes?: string | null;
  metadata: Record<string, unknown>;
  metadataSchema: MetadataSchema;
}

export interface EntryFormProps {
  /** The task key for this form */
  taskKey: string;
  /** Entry ID if editing, undefined if creating new */
  entryId?: string;
  /** Initial data for the form (when editing) */
  initialData?: Entry;
  /** Register a function the orchestrator calls to get current form values for auto-save */
  registerGetSaveData?: (fn: () => EntrySaveData | null) => void;
  /** Current completion status (from orchestrator) */
  completionStatus?: EntryCompletionStatus;
  /** Callback when entry is deleted (only for editing) */
  onDelete?: () => Promise<void>;
  /** Current file attachments (including pending uploads) */
  attachments?: FileAttachment[];
  /** Callback when attachments change (for forms that support file uploads) */
  onAttachmentsChange?: (files: FileAttachment[]) => void;
  /** Whether file uploads are in progress */
  isUploading?: boolean;
  /** Set of file IDs currently being deleted */
  deletingFileIds?: Set<string>;
  /** Callback when user needs to upgrade for storage */
  onStorageUpgradeRequired?: () => void;
  /** Whether the plan is read-only (viewing a shared plan) */
  readOnly?: boolean;
  /** Callback to expose the form instance to the parent (for unsaved-changes guard) */
  onFormReady?: (form: AnyFormApi) => void;
  /** Called when a discrete field changes (toggle, select, pill) — triggers immediate save */
  onDiscreteChange?: () => void;
}

export const listRegistry: Record<string, ComponentType<EntryListProps>> = {
  "contacts.primary": ContactList,
  "contacts.backup": ContactList,
  people: ContactList, // Reuses contact list (same data shape)
  financial: FinancialList,
  insurance: InsuranceList,
  "documents.legal": DocumentList,
  "documents.other": DocumentList,
  property: PropertyList,
  pets: PetList,
  "digital.email": DigitalList,
  "digital.passwords": DigitalList,
  "digital.devices": DigitalList,
  "digital.social": DigitalList,
};

/**
 * Get the list component for a given task key
 */
export function getListComponent(
  taskKey: string,
): ComponentType<EntryListProps> | undefined {
  return listRegistry[taskKey];
}

export const formRegistry: Record<string, ComponentType<EntryFormProps>> = {
  "contacts.primary": ContactForm,
  "contacts.backup": ContactForm,
  people: ContactForm, // Reuses contact form (same data shape)
  financial: FinancialForm,
  insurance: InsuranceForm,
  "documents.legal": DocumentForm,
  "documents.other": DocumentForm,
  property: PropertyForm,
  pets: PetForm,
  "digital.email": DigitalForm,
  "digital.passwords": DigitalForm,
  "digital.devices": DigitalForm,
  "digital.social": DigitalForm,
};

/**
 * Get the form component for a given task key
 */
export function getFormComponent(
  taskKey: string,
): ComponentType<EntryFormProps> | undefined {
  return formRegistry[taskKey];
}
