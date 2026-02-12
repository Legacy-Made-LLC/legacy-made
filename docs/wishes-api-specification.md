# Wishes API Specification

Backend API requirements for the Wishes & Guidance pillar.

---

## Overview

The Wishes API provides CRUD operations for user wishes and guidance preferences. It follows the same patterns as the existing Entries API but uses the `wishes` pillar and `/wishes` endpoint.

**Base URL Pattern:** `/plans/:planId/wishes`

**Authentication:** Same as existing API (Bearer token)

**Entitlements:** Governed by the `wishes` pillar entitlement

---

## Data Model

### Wish Entity

The `Wish` model mirrors the `Entry` model structure:

```typescript
interface Wish {
  id: string;                    // UUID
  planId: string;                // UUID - foreign key to plans table
  taskKey: string;               // Flexible string identifier (e.g., "wishes.carePrefs.whatMatters")
  title: string | null;          // Optional title
  notes: string | null;          // Free-form notes field
  sortOrder: number;             // For manual ordering (default: 0)
  metadata: Record<string, any>; // JSONB - task-specific data
  metadataSchema: MetadataSchema; // JSONB - display schema for metadata (see below)
  files?: ApiFile[];             // Optional file attachments
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

interface MetadataSchema {
  version: number;               // Schema version for tracking changes
  fields: Record<string, FieldSchema>;
}

interface FieldSchema {
  label: string;                 // Human-readable display name
  order: number;                 // Display sequence (1, 2, 3...)
  valueLabels?: Record<string, string>; // Optional: maps stored IDs to display text
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  task_key VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  metadata_schema JSONB NOT NULL,           -- Display schema for rendering metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_wishes_plan_id ON wishes(plan_id);
CREATE INDEX idx_wishes_task_key ON wishes(task_key);
CREATE INDEX idx_wishes_plan_task ON wishes(plan_id, task_key);
```

---

## Task Keys

The `taskKey` field is a **flexible string identifier** controlled by the frontend. The API should **not validate** task keys—it should accept any string value provided.

This allows the frontend to dynamically define and change task keys without requiring backend changes.

**Current frontend task keys** (for reference only):

| Section | Task Keys |
|---------|-----------|
| Care Preferences | `wishes.carePrefs.whatMatters`, `wishes.carePrefs.qualityOfLife`, `wishes.carePrefs.comfortVsTreatment`, `wishes.carePrefs.advanceDirective` |
| End-of-Life | `wishes.endOfLife.setting`, `wishes.endOfLife.afterDeath`, `wishes.endOfLife.service`, `wishes.endOfLife.organDonation` |
| Personal Values | `wishes.values.lovedOnesKnow`, `wishes.values.faith`, `wishes.values.hardSituations` |

---

## Metadata Schema Format

Each wish includes a `metadataSchema` field that describes how to display the metadata without needing frontend code. This is a **display schema**, not a validation schema.

### Structure

```typescript
interface MetadataSchema {
  version: number;                          // Schema version for tracking changes
  fields: Record<string, FieldSchema>;      // Map of field names to their display info
}

interface FieldSchema {
  label: string;                            // Human-readable display name
  order: number;                            // Display sequence (1, 2, 3...)
  valueLabels?: Record<string, string>;     // Optional: maps stored IDs to display text
}
```

### Example

For a wish with this metadata:
```json
{
  "values": ["comfort", "connected"],
  "customValue": "Being at peace"
}
```

The schema would be:
```json
{
  "version": 1,
  "fields": {
    "values": {
      "label": "What Matters Most",
      "order": 1,
      "valueLabels": {
        "comfort": "Being comfortable and free of pain",
        "alert": "Being awake and aware",
        "independent": "Living independently",
        "connected": "Being with people I love",
        "dignity": "Maintaining my dignity",
        "fighting": "Fighting for every moment",
        "peaceful": "A peaceful, natural end",
        "noburden": "Not being a burden"
      }
    },
    "customValue": {
      "label": "Additional Thoughts",
      "order": 2
    }
  }
}
```

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Human-readable name for the field |
| `order` | number | Yes | Display order (lower numbers first) |
| `valueLabels` | object | No | Maps stored values to display labels (for selection fields) |

### Notes

- The `valueLabels` map should include all possible values for the field, not just the ones currently selected
- The `version` should be incremented when the schema structure changes
- The API stores the schema as-is; no validation is performed on the schema contents

---

## Metadata Schemas (Reference Only)

Each task key has a specific metadata structure defined by the frontend. **The API does not need to validate these schemas**—it should store any valid JSON object in the `metadata` field.

These schemas are provided for reference to understand what data the frontend will be storing:

### Care Preferences

#### `wishes.carePrefs.whatMatters`
```typescript
interface WhatMattersMostMetadata {
  /** Selected value IDs from predefined choices */
  values: string[];  // Valid: "comfort", "alert", "independent", "connected", "dignity", "fighting", "peaceful", "noburden"
  /** Custom value entered by user */
  customValue?: string;
}
```

#### `wishes.carePrefs.qualityOfLife`
```typescript
interface QualityOfLifeMetadata {
  /** Selected condition IDs */
  conditions: string[];  // Valid: "terminal", "coma", "noRecognize", "noCommunicate", "fullCare", "repeatedHospital", "noImprove"
}
```

#### `wishes.carePrefs.comfortVsTreatment`
```typescript
interface ComfortVsTreatmentMetadata {
  /** Overall preference */
  preference?: "comfort-first" | "balanced" | "treatment-first" | "trust-team";
  /** Pain management approach */
  painManagement?: "full-relief" | "balanced-relief" | "minimal-meds";
  /** Alertness importance */
  alertness?: "very" | "somewhat" | "not";
}
```

#### `wishes.carePrefs.advanceDirective`
```typescript
interface AdvanceDirectiveMetadata {
  /** Whether user has directive */
  hasDirective?: "yes" | "in-progress" | "no";
  /** Document types (array of strings) */
  documentTypes?: string[];  // Valid: "living-will", "healthcare-poa", "polst-molst", "dnr", "five-wishes", "other"
  /** Storage location */
  location?: string;
  /** Healthcare proxy info */
  proxyName?: string;
  proxyPhone?: string;
  proxyRelationship?: string;
}
```

### End-of-Life

#### `wishes.endOfLife.setting`
```typescript
interface EndOfLifeSettingMetadata {
  /** Preferred care setting */
  preferredSetting?: "home" | "family-home" | "hospice" | "hospital" | "flexible";
  /** Notes about preference */
  settingNotes?: string;
  /** Who should be present */
  visitors?: string;
  /** Music/atmosphere preferences */
  music?: string;
}
```

#### `wishes.endOfLife.afterDeath`
```typescript
interface AfterDeathMetadata {
  /** Body disposition choice */
  disposition?: "burial" | "cremation" | "green-burial" | "donation" | "flexible" | "other";
  /** Specific wishes */
  specificWishes?: string;
  /** Pre-arrangement status */
  prearranged?: "yes" | "partial" | "no";
  /** Pre-arrangement details */
  prearrangedDetails?: string;
}
```

#### `wishes.endOfLife.service`
```typescript
interface ServicePreferencesMetadata {
  /** Service type */
  serviceType?: "traditional-funeral" | "celebration-of-life" | "memorial" | "graveside" | "private" | "none" | "flexible";
  /** Tone/atmosphere */
  tone?: "solemn" | "warm" | "celebratory" | "religious" | "mixed";
  /** Location preference */
  location?: string;
  /** Music preferences */
  music?: string;
  /** Readings/poems */
  readings?: string;
  /** Who should speak */
  speakers?: string;
  /** Flower preferences */
  flowers?: string;
  /** Donation preferences */
  donations?: string;
}
```

#### `wishes.endOfLife.organDonation`
```typescript
interface OrganDonationMetadata {
  /** Donation decision */
  decision?: "yes-all" | "yes-specific" | "research-only" | "no" | "undecided";
  /** Specific organs (if yes-specific) */
  specificOrgans?: string;
  /** Registry status */
  onRegistry?: "yes" | "no" | "unsure";
}
```

### Personal Values

#### `wishes.values.lovedOnesKnow`
```typescript
interface LovedOnesKnowMetadata {
  /** Gratitude expressions */
  gratitude?: string;
  /** Regrets or apologies */
  regrets?: string;
  /** Wisdom to share */
  wisdom?: string;
  /** Favorite memories */
  memories?: string;
}
```

#### `wishes.values.faith`
```typescript
interface FaithPreferencesMetadata {
  /** Faith tradition */
  tradition?: "christian" | "catholic" | "jewish" | "muslim" | "buddhist" | "hindu" | "spiritual" | "none" | "other";
  /** Place of worship */
  congregation?: string;
  /** Religious leader */
  leader?: string;
  /** Leader contact */
  leaderContact?: string;
  /** Important rituals */
  rituals?: string;
}
```

#### `wishes.values.hardSituations`
```typescript
interface HardSituationsMetadata {
  /** How to handle disagreements */
  disagreements?: string;
  /** Primary decision-maker */
  decisionMaker?: string;
  /** Guidance for grief */
  conflictGuidance?: string;
  /** Grace/forgiveness to extend */
  grace?: string;
  /** What matters most */
  priorities?: string;
}
```

---

## API Endpoints

### List Wishes

```
GET /plans/:planId/wishes
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskKey` | string | No | Filter by task key |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "planId": "uuid",
      "taskKey": "wishes.carePrefs.whatMatters",
      "title": null,
      "notes": "Some additional notes",
      "sortOrder": 0,
      "metadata": {
        "values": ["comfort", "connected"],
        "customValue": "Being at peace"
      },
      "metadataSchema": {
        "version": 1,
        "fields": {
          "values": {
            "label": "What Matters Most",
            "order": 1,
            "valueLabels": {
              "comfort": "Being comfortable and free of pain",
              "connected": "Being with people I love"
            }
          },
          "customValue": {
            "label": "Additional Thoughts",
            "order": 2
          }
        }
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "quota": {
    "limit": -1,
    "current": 5,
    "remaining": null,
    "unlimited": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Plan belongs to another user or pillar locked
- `404 Not Found` - Plan not found

---

### Get Single Wish

```
GET /plans/:planId/wishes/:wishId
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "planId": "uuid",
  "taskKey": "wishes.carePrefs.whatMatters",
  "title": null,
  "notes": "Some additional notes",
  "sortOrder": 0,
  "metadata": {
    "values": ["comfort", "connected"],
    "customValue": "Being at peace"
  },
  "metadataSchema": {
    "version": 1,
    "fields": {
      "values": {
        "label": "What Matters Most",
        "order": 1,
        "valueLabels": {
          "comfort": "Being comfortable and free of pain",
          "connected": "Being with people I love"
        }
      },
      "customValue": {
        "label": "Additional Thoughts",
        "order": 2
      }
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Plan belongs to another user or pillar locked
- `404 Not Found` - Wish or plan not found

---

### Create Wish

```
POST /plans/:planId/wishes
```

**Request Body:**
```json
{
  "taskKey": "wishes.carePrefs.whatMatters",
  "title": null,
  "notes": "Some additional context",
  "sortOrder": 0,
  "metadata": {
    "values": ["comfort", "connected"],
    "customValue": "Being at peace"
  },
  "metadataSchema": {
    "version": 1,
    "fields": {
      "values": {
        "label": "What Matters Most",
        "order": 1,
        "valueLabels": {
          "comfort": "Being comfortable and free of pain",
          "alert": "Being awake and aware",
          "independent": "Living independently",
          "connected": "Being with people I love",
          "dignity": "Maintaining my dignity",
          "fighting": "Fighting for every moment",
          "peaceful": "A peaceful, natural end",
          "noburden": "Not being a burden"
        }
      },
      "customValue": {
        "label": "Additional Thoughts",
        "order": 2
      }
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskKey` | string | Yes | Identifier for the wish type (not validated by API) |
| `title` | string \| null | No | Optional title |
| `notes` | string \| null | No | Free-form notes |
| `sortOrder` | number | No | Sort order (default: 0) |
| `metadata` | object | Yes | Task-specific metadata |
| `metadataSchema` | object | Yes | Display schema for rendering metadata (see below) |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "planId": "uuid",
  "taskKey": "wishes.carePrefs.whatMatters",
  "title": null,
  "notes": "Some additional context",
  "sortOrder": 0,
  "metadata": {
    "values": ["comfort", "connected"],
    "customValue": "Being at peace"
  },
  "metadataSchema": {
    "version": 1,
    "fields": {
      "values": {
        "label": "What Matters Most",
        "order": 1,
        "valueLabels": {
          "comfort": "Being comfortable and free of pain",
          "connected": "Being with people I love"
        }
      },
      "customValue": {
        "label": "Additional Thoughts",
        "order": 2
      }
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields (taskKey, metadata, metadataSchema)
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Plan belongs to another user, pillar locked, or view-only
- `404 Not Found` - Plan not found
- `422 Unprocessable Entity` - Validation errors

**Validation Rules:**
1. `taskKey` is required (any non-empty string)
2. `metadata` is required (any valid JSON object)
3. `metadataSchema` is required (must have `version` and `fields`)
4. `planId` in path must match authenticated user's plan

---

### Update Wish

```
PATCH /plans/:planId/wishes/:wishId
```

**Request Body:**
```json
{
  "title": "Updated title",
  "notes": "Updated notes",
  "sortOrder": 1,
  "metadata": {
    "values": ["comfort", "connected", "dignity"]
  },
  "metadataSchema": {
    "version": 2,
    "fields": {
      "values": {
        "label": "What Matters Most",
        "order": 1,
        "valueLabels": {
          "comfort": "Being comfortable and free of pain",
          "connected": "Being with people I love",
          "dignity": "Maintaining my dignity"
        }
      },
      "customValue": {
        "label": "Additional Thoughts",
        "order": 2
      }
    }
  }
}
```

All fields are optional. The `metadata` field performs a shallow merge with existing metadata. The `metadataSchema` field replaces the entire schema if provided.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string \| null | No | Update title (send null to clear) |
| `notes` | string \| null | No | Update notes (send null to clear) |
| `sortOrder` | number | No | Update sort order |
| `metadata` | object | No | Partial metadata to merge |
| `metadataSchema` | object | No | Full replacement of display schema |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "planId": "uuid",
  "taskKey": "wishes.carePrefs.whatMatters",
  "title": "Updated title",
  "notes": "Updated notes",
  "sortOrder": 1,
  "metadata": {
    "values": ["comfort", "connected", "dignity"],
    "customValue": "Being at peace"
  },
  "metadataSchema": {
    "version": 2,
    "fields": {
      "values": {
        "label": "What Matters Most",
        "order": 1,
        "valueLabels": {
          "comfort": "Being comfortable and free of pain",
          "connected": "Being with people I love",
          "dignity": "Maintaining my dignity"
        }
      },
      "customValue": {
        "label": "Additional Thoughts",
        "order": 2
      }
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Plan belongs to another user, pillar locked, or view-only
- `404 Not Found` - Wish or plan not found
- `422 Unprocessable Entity` - Validation errors

---

### Delete Wish

```
DELETE /plans/:planId/wishes/:wishId
```

**Response:** `200 OK`
```json
{
  "deleted": true
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Plan belongs to another user, pillar locked, or view-only
- `404 Not Found` - Wish or plan not found

---

## Entitlements Integration

The wishes API must integrate with the entitlements system:

### Pillar Access

1. **Check `wishes` pillar access** before any operation
2. If pillar is in `pillars[]` - full access (create, read, update, delete)
3. If pillar is in `viewOnlyPillars[]` - read-only access (list, get only)
4. If pillar is in neither - return `403` with `PILLAR_LOCKED` error

### Error Response for Locked/View-Only

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Wishes pillar requires an upgrade",
  "code": "PILLAR_LOCKED",
  "details": {
    "pillar": "wishes"
  }
}
```

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Wishes pillar is view-only on your current plan",
  "code": "PILLAR_VIEW_ONLY",
  "details": {
    "pillar": "wishes"
  }
}
```

### Quota (Future)

If wishes have a separate quota limit:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Wishes limit reached",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "feature": "wishes",
    "limit": 11,
    "current": 11
  }
}
```

---

## File Attachments

Some wish types support file attachments. Use the same patterns as the entries file upload API:

```
POST /wishes/:wishId/files/upload/init
POST /wishes/:wishId/files/video/init
DELETE /wishes/:wishId/files/:fileId
```

Follow the same request/response patterns as documented in the entries file upload API.

---

## Implementation Notes

### Differences from Entries API

1. **Endpoint path:** `/plans/:planId/wishes` instead of `/plans/:planId/entries`
2. **Pillar check:** Uses `wishes` pillar instead of `important_info`
3. **Task key prefix:** All task keys start with `wishes.` instead of section-specific keys
4. **Metadata schemas:** Different metadata structures per task key

### Similarities to Entries API

1. Same response shapes (`data` + `quota`)
2. Same error handling patterns
3. Same authentication/authorization flow
4. Same CRUD operation patterns

### Suggested Implementation Approach

1. **Copy entries controller/service** as starting point
2. **Update table name** to `wishes`
3. **Update pillar check** to `wishes`
4. **Accept any taskKey string** (no validation needed)
5. **Accept any metadata object** (no schema validation needed)
6. **Update quota feature name** if tracking separately

---

## Testing Checklist

- [ ] List wishes returns empty array for new plan
- [ ] List wishes with `taskKey` filter works
- [ ] Create wish with any taskKey string succeeds
- [ ] Create wish without taskKey returns 400
- [ ] Get wish by ID returns correct data
- [ ] Update wish merges metadata correctly
- [ ] Update wish with `null` title/notes clears fields
- [ ] Delete wish returns `{ deleted: true }`
- [ ] Pillar locked returns 403 with PILLAR_LOCKED
- [ ] View-only pillar blocks create/update/delete
- [ ] Quota information returned in list responses
- [ ] Invalid planId returns 404
- [ ] Wrong user's plan returns 403
