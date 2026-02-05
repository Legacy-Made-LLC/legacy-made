/**
 * Wishes Component Registry
 *
 * Maps taskKeys to their corresponding form components.
 * This allows dynamic routing to render the correct form based on the task.
 *
 * Follows same pattern as vault/registry.ts for consistency.
 */

import type { Wish, MetadataSchema, FileAttachment } from "@/api/types";
import type { AnyFormApi } from "@tanstack/form-core";
import type { ComponentType } from "react";

// ============================================================================
// Form Component Imports
// ============================================================================

import { WhatMattersMostForm } from "./forms/WhatMattersMostForm";
import { QualityOfLifeForm } from "./forms/QualityOfLifeForm";
import { ComfortVsTreatmentForm } from "./forms/ComfortVsTreatmentForm";
import { AdvanceDirectiveForm } from "./forms/AdvanceDirectiveForm";
import { EndOfLifeSettingForm } from "./forms/EndOfLifeSettingForm";
import { AfterDeathPreferencesForm } from "./forms/AfterDeathPreferencesForm";
import { ServicePreferencesForm } from "./forms/ServicePreferencesForm";
import { OrganDonationForm } from "./forms/OrganDonationForm";
import { LovedOnesKnowForm } from "./forms/LovedOnesKnowForm";
import { FaithPreferencesForm } from "./forms/FaithPreferencesForm";
import { HardSituationsForm } from "./forms/HardSituationsForm";

// ============================================================================
// Form Component Types
// ============================================================================

export interface WishFormGuidance {
  /** Icon name from Ionicons */
  icon?: string;
  /** Trigger text for collapsed state */
  triggerText: string;
  /** Heading when expanded */
  heading?: string;
  /** Detail text when expanded */
  detail: string;
  /** Tips array */
  tips?: string[];
  /** Pacing note */
  pacingNote?: string;
}

/**
 * Common form values interface for wish forms.
 * Each form may have additional specific fields, but all share these base fields.
 */
export interface WishFormValues {
  [key: string]: unknown;
}

/**
 * Data structure for saving a wish
 */
export interface WishSaveData {
  title: string;
  notes?: string | null;
  metadata: Record<string, unknown>;
  metadataSchema: MetadataSchema;
}

export interface WishFormProps {
  /** The task key for this form */
  taskKey: string;
  /** Wish ID if editing, undefined if creating new */
  wishId?: string;
  /** Initial data for the form (when editing) */
  initialData?: Wish;
  /**
   * Callback to provide form instance to parent for auto-save integration.
   * Parent subscribes to form.state.isDirty and form.state.values to trigger saves.
   */
  onFormReady?: (form: AnyFormApi) => void;
  /**
   * Callback to register the form's getSaveData function with the parent.
   * Form calls this with its own getSaveData implementation.
   */
  registerGetSaveData?: (fn: () => WishSaveData) => void;
  /** Guidance card content */
  guidance?: WishFormGuidance;
  /** File attachments (optional - only used by forms that support file uploads) */
  attachments?: FileAttachment[];
  /** Callback when attachments change */
  onAttachmentsChange?: (files: FileAttachment[]) => void;
  /** Whether a file upload is in progress */
  isUploading?: boolean;
  /** Callback when storage upgrade is needed */
  onStorageUpgradeRequired?: () => void;
}

// ============================================================================
// Form Component Registry
// ============================================================================

export const wishesFormRegistry: Record<string, ComponentType<WishFormProps>> = {
  // Care Preferences - each has unique form
  "wishes.carePrefs.whatMatters": WhatMattersMostForm,
  "wishes.carePrefs.qualityOfLife": QualityOfLifeForm,
  "wishes.carePrefs.comfortVsTreatment": ComfortVsTreatmentForm,
  "wishes.carePrefs.advanceDirective": AdvanceDirectiveForm,

  // End-of-Life & After-Death - each has unique form
  "wishes.endOfLife.setting": EndOfLifeSettingForm,
  "wishes.endOfLife.afterDeath": AfterDeathPreferencesForm,
  "wishes.endOfLife.service": ServicePreferencesForm,
  "wishes.endOfLife.organDonation": OrganDonationForm,

  // Personal Values & Guidance - each has unique form
  "wishes.values.lovedOnesKnow": LovedOnesKnowForm,
  "wishes.values.faith": FaithPreferencesForm,
  "wishes.values.hardSituations": HardSituationsForm,
};

/**
 * Get the form component for a given task key
 */
export function getWishesFormComponent(
  taskKey: string
): ComponentType<WishFormProps> | undefined {
  return wishesFormRegistry[taskKey];
}
