/**
 * Metadata Schema Generators for Wishes
 *
 * These functions generate MetadataSchema objects that describe how to
 * display wish metadata without requiring frontend code knowledge.
 *
 * The schema includes:
 * - Field labels (human-readable names)
 * - Field order (display sequence)
 * - Value labels (maps stored IDs to display text for selection fields)
 */

import type { MetadataSchema } from "@/api/types";
import {
  whatMattersMostValues,
  qualityOfLifeConditions,
  faithTraditions,
} from "@/constants/wishes";

// Schema version - increment when making structural changes
const SCHEMA_VERSION = 1;

// ============================================================================
// Care Preferences Schemas
// ============================================================================

/**
 * Generate schema for "What Matters Most" wish
 */
export function generateWhatMattersMostSchema(): MetadataSchema {
  const valueLabels: Record<string, string> = {};
  whatMattersMostValues.forEach((v) => {
    valueLabels[v.id] = v.label;
  });

  return {
    version: SCHEMA_VERSION,
    fields: {
      values: {
        label: "What Matters Most",
        order: 1,
        valueLabels,
      },
    },
  };
}

/**
 * Generate schema for "Quality of Life" wish
 */
export function generateQualityOfLifeSchema(): MetadataSchema {
  const valueLabels: Record<string, string> = {};
  qualityOfLifeConditions.forEach((c) => {
    valueLabels[c.id] = c.label;
  });

  return {
    version: SCHEMA_VERSION,
    fields: {
      conditions: {
        label: "Conditions Where I Would Not Want Aggressive Treatment",
        order: 1,
        valueLabels,
      },
    },
  };
}

/**
 * Generate schema for "Comfort vs Treatment" wish
 */
export function generateComfortVsTreatmentSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      preference: {
        label: "Overall Preference",
        order: 1,
        valueLabels: {
          "comfort-first": "Prioritize comfort, even if it shortens life",
          "balanced": "Balance between comfort and treatment",
          "treatment-first": "Prioritize treatment, even if uncomfortable",
          "trust-team": "I trust my care team to decide",
        },
      },
      painManagement: {
        label: "Pain Management Approach",
        order: 2,
        valueLabels: {
          "full-relief": "Full pain relief, even if it causes drowsiness",
          "balanced-relief": "Balanced — manage pain but keep me somewhat alert",
          "minimal-meds": "Minimal medication — I want to stay as alert as possible",
        },
      },
      alertness: {
        label: "Alertness Importance",
        order: 3,
        valueLabels: {
          "very": "Very important — I want to be conscious and aware",
          "somewhat": "Somewhat — if possible, but comfort comes first",
          "not": "Not important — comfort is all that matters",
        },
      },
    },
  };
}

/**
 * Generate schema for "Advance Directive" wish
 */
export function generateAdvanceDirectiveSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      hasDirective: {
        label: "Do You Have Advance Directive Documents?",
        order: 1,
        valueLabels: {
          "yes": "Yes, I have documents",
          "in-progress": "Working on it",
          "no": "Not yet",
        },
      },
      documentTypes: {
        label: "Document Types",
        order: 2,
        valueLabels: {
          "Living Will": "Living Will",
          "Healthcare Power of Attorney": "Healthcare Power of Attorney",
          "POLST/MOLST": "POLST/MOLST",
          "DNR Order": "DNR Order",
          "Five Wishes": "Five Wishes",
          "Other": "Other",
        },
      },
      location: {
        label: "Where Documents Are Stored",
        order: 3,
      },
      proxyName: {
        label: "Healthcare Proxy Name",
        order: 4,
      },
      proxyPhone: {
        label: "Proxy Phone",
        order: 5,
      },
      proxyRelationship: {
        label: "Proxy Relationship",
        order: 6,
      },
    },
  };
}

// ============================================================================
// End-of-Life Schemas
// ============================================================================

/**
 * Generate schema for "End-of-Life Setting" wish
 */
export function generateEndOfLifeSettingSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      preferredSetting: {
        label: "Preferred Setting",
        order: 1,
        valueLabels: {
          "home": "At home",
          "family-home": "At a family member's home",
          "hospice": "In a hospice facility",
          "hospital": "In a hospital",
          "flexible": "Wherever makes sense at the time",
        },
      },
      settingNotes: {
        label: "Why This Choice",
        order: 2,
      },
      visitors: {
        label: "Who Should Be Present",
        order: 3,
      },
      music: {
        label: "Music, Readings, or Atmosphere",
        order: 4,
      },
    },
  };
}

/**
 * Generate schema for "After-Death Preferences" wish
 */
export function generateAfterDeathSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      disposition: {
        label: "Body Disposition",
        order: 1,
        valueLabels: {
          "burial": "Traditional burial",
          "cremation": "Cremation",
          "green-burial": "Green/natural burial",
          "donation": "Whole body donation to science",
          "flexible": "Whatever my family prefers",
          "other": "Other",
        },
      },
      specificWishes: {
        label: "Specific Wishes",
        order: 2,
      },
      prearranged: {
        label: "Pre-Arrangement Status",
        order: 3,
        valueLabels: {
          "yes": "Yes, it's all arranged",
          "partial": "Partially arranged",
          "no": "Not yet",
        },
      },
      prearrangedDetails: {
        label: "Pre-Arrangement Details",
        order: 4,
      },
    },
  };
}

/**
 * Generate schema for "Service Preferences" wish
 */
export function generateServicePreferencesSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      serviceType: {
        label: "Service Type",
        order: 1,
        valueLabels: {
          "traditional-funeral": "Traditional funeral service",
          "celebration-of-life": "Celebration of life",
          "memorial": "Memorial service (no body present)",
          "graveside": "Graveside service only",
          "private": "Private family gathering",
          "none": "No service",
          "flexible": "Whatever my family wants",
        },
      },
      tone: {
        label: "Service Tone",
        order: 2,
        valueLabels: {
          "solemn": "Solemn and traditional",
          "warm": "Warm and personal",
          "celebratory": "Celebratory — a real party",
          "religious": "Religious/spiritual focus",
          "mixed": "Mix of mourning and celebration",
        },
      },
      location: {
        label: "Preferred Location",
        order: 3,
      },
      music: {
        label: "Music or Songs",
        order: 4,
      },
      readings: {
        label: "Readings or Poems",
        order: 5,
      },
      speakers: {
        label: "Who Should Speak",
        order: 6,
      },
      avoidances: {
        label: "Things to Avoid",
        order: 7,
      },
    },
  };
}

/**
 * Generate schema for "Organ Donation" wish
 */
export function generateOrganDonationSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      decision: {
        label: "Organ Donation Decision",
        order: 1,
        valueLabels: {
          "yes-all": "Yes, donate anything that can help",
          "yes-specific": "Yes, but only specific organs",
          "research-only": "For medical research only",
          "no": "No, I don't want to donate",
          "undecided": "I haven't decided",
        },
      },
      specificOrgans: {
        label: "Specific Organs or Tissues",
        order: 2,
      },
      onRegistry: {
        label: "Registry Status",
        order: 3,
        valueLabels: {
          "yes": "Yes, I'm registered",
          "no": "No, not yet",
          "unsure": "I'm not sure",
        },
      },
    },
  };
}

// ============================================================================
// Personal Values Schemas
// ============================================================================

/**
 * Generate schema for "What Loved Ones Should Know" wish
 */
export function generateLovedOnesKnowSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      gratitude: {
        label: "Gratitude",
        order: 1,
      },
      regrets: {
        label: "Regrets or Apologies",
        order: 2,
      },
      wisdom: {
        label: "Wisdom to Share",
        order: 3,
      },
      memories: {
        label: "Favorite Memories",
        order: 4,
      },
    },
  };
}

/**
 * Generate schema for "Faith Preferences" wish
 */
export function generateFaithPreferencesSchema(): MetadataSchema {
  const valueLabels: Record<string, string> = {};
  faithTraditions.forEach((t) => {
    valueLabels[t.value] = t.label;
  });

  return {
    version: SCHEMA_VERSION,
    fields: {
      tradition: {
        label: "Faith or Spiritual Tradition",
        order: 1,
        valueLabels,
      },
      congregation: {
        label: "Place of Worship",
        order: 2,
      },
      leader: {
        label: "Religious Leader",
        order: 3,
      },
      leaderContact: {
        label: "Leader Contact Info",
        order: 4,
      },
      rituals: {
        label: "Rituals or Customs to Observe",
        order: 5,
      },
    },
  };
}

/**
 * Generate schema for "Hard Situations" wish
 */
export function generateHardSituationsSchema(): MetadataSchema {
  return {
    version: SCHEMA_VERSION,
    fields: {
      decisionMaker: {
        label: "Primary Decision-Maker",
        order: 1,
      },
      disagreements: {
        label: "Why This Person",
        order: 2,
      },
      conflictGuidance: {
        label: "How to Handle Disagreements",
        order: 3,
      },
      grace: {
        label: "Grace to Extend",
        order: 4,
      },
    },
  };
}
