/**
 * Wishes Component Registry
 *
 * Maps taskKeys to their corresponding form components.
 * This allows dynamic routing to render the correct form based on the task.
 *
 * Follows same pattern as vault/registry.ts for consistency.
 */

import type { Wish, MetadataSchema, FileAttachment } from "@/api/types";
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

export interface WishFormProps {
  /** The task key for this form */
  taskKey: string;
  /** Wish ID if editing, undefined if creating new */
  wishId?: string;
  /** Initial data for the form (when editing) */
  initialData?: Wish;
  /** Callback when form is saved */
  onSave: (data: {
    title: string;
    notes?: string | null;
    metadata: Record<string, unknown>;
    metadataSchema: MetadataSchema;
  }) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
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
