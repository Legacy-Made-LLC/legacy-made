/**
 * Vault Component Registry
 *
 * Maps taskKeys to their corresponding list and form components.
 * This allows dynamic routing to render the correct components based on the task.
 */

import type { ComponentType } from 'react';
import type { Entry } from '@/api/types';

// ============================================================================
// List Component Registry
// ============================================================================

import { ContactList } from './lists/ContactList';
import { FinancialList } from './lists/FinancialList';
import { InsuranceList } from './lists/InsuranceList';
import { DocumentList } from './lists/DocumentList';
import { PropertyList } from './lists/PropertyList';
import { PetList } from './lists/PetList';
import { DigitalList } from './lists/DigitalList';

// ============================================================================
// Form Component Registry
// ============================================================================

import { ContactForm } from './forms/ContactForm';
import { FinancialForm } from './forms/FinancialForm';
import { InsuranceForm } from './forms/InsuranceForm';
import { DocumentForm } from './forms/DocumentForm';
import { PropertyForm } from './forms/PropertyForm';
import { PetForm } from './forms/PetForm';
import { DigitalForm } from './forms/DigitalForm';

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
}

// ============================================================================
// Form Component Types
// ============================================================================

export interface EntryFormProps {
  /** The task key for this form */
  taskKey: string;
  /** Entry ID if editing, undefined if creating new */
  entryId?: string;
  /** Initial data for the form (when editing) */
  initialData?: Entry;
  /** Callback when form is saved */
  onSave: (data: { title: string; notes?: string; metadata: Record<string, unknown> }) => Promise<void>;
  /** Callback when entry is deleted (only for editing) */
  onDelete?: () => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

export const listRegistry: Record<string, ComponentType<EntryListProps>> = {
  'contacts.primary': ContactList,
  'contacts.backup': ContactList,
  'people': ContactList, // Reuses contact list (same data shape)
  'financial': FinancialList,
  'insurance': InsuranceList,
  'documents': DocumentList,
  'property': PropertyList,
  'pets': PetList,
  'digital': DigitalList,
};

/**
 * Get the list component for a given task key
 */
export function getListComponent(taskKey: string): ComponentType<EntryListProps> | undefined {
  return listRegistry[taskKey];
}

export const formRegistry: Record<string, ComponentType<EntryFormProps>> = {
  'contacts.primary': ContactForm,
  'contacts.backup': ContactForm,
  'people': ContactForm, // Reuses contact form (same data shape)
  'financial': FinancialForm,
  'insurance': InsuranceForm,
  'documents': DocumentForm,
  'property': PropertyForm,
  'pets': PetForm,
  'digital': DigitalForm,
};

/**
 * Get the form component for a given task key
 */
export function getFormComponent(taskKey: string): ComponentType<EntryFormProps> | undefined {
  return formRegistry[taskKey];
}
