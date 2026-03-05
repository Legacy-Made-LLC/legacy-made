# Legacy Messages Pillar — Design Decisions

## Hybrid Architecture

The Legacy Messages pillar is unique among the four pillars — it uses a **hybrid approach** combining patterns from both the Information Vault (list-based entries) and Wishes & Guidance (singleton auto-save forms).

### Task Types

| Section | Task Key | Pattern | Description |
|---------|----------|---------|-------------|
| Messages to People | `messages.people` | List (vault-like) | Multiple entries, each for a specific person |
| Your Story | `messages.story` | Singleton (wishes-like) | One entry per plan, auto-saves |
| Future Moments | `messages.future` | List (vault-like) | Multiple entries, each for a future event |

The `isLegacyTaskSingleton()` function in `constants/legacy-structure.ts` determines which pattern to use at runtime.

## Dedicated Messages API

Messages use a **dedicated API** at `/plans/:planId/messages` rather than reusing the entries or wishes endpoints. This allows:

- Independent quota management (`legacy_messages` feature)
- Message-specific metadata schemas
- Separate query cache invalidation
- Future backend flexibility

The API service (`api/messages.ts`) follows the exact same pattern as `api/wishes.ts` for consistency.

### Backend Endpoints (Stubbed)

The API service makes real HTTP calls to these endpoints. They will work once the backend implements them:

```
GET    /plans/:planId/messages                    — List all messages
GET    /plans/:planId/messages?taskKey=...        — List by task key
GET    /plans/:planId/messages?taskKey=...&quota=true — With quota info
GET    /plans/:planId/messages/:messageId         — Get single message
POST   /plans/:planId/messages                    — Create message
PATCH  /plans/:planId/messages/:messageId         — Update message
DELETE /plans/:planId/messages/:messageId         — Delete message
```

## Metadata Types

Each section has its own metadata shape:

```typescript
// Messages to People
interface MessageToPersonMetadata {
  recipientName: string;
  recipientRelationship?: string;
  messageType: "video" | "written";
  writtenMessage?: string;
}

// Your Story
interface YourStoryMetadata {
  messageType: "video" | "written";
  writtenStory?: string;
}

// Future Moments
interface FutureMomentMetadata {
  occasion: string;
  recipientName?: string;
  messageType: "video" | "written" | "both";
  writtenMessage?: string;
}
```

## File Attachments

Messages support file attachments using the same infrastructure as vault entries and wishes:

- `FileUploadTarget` extended to include `{ messageId: string }`
- Files are uploaded to `/messages/:messageId/files/` endpoints
- Uses existing Mux integration for video uploads
- `useFileAttachments` and `useFileUpload` hooks handle state management

## Video Recording

The pillar includes an in-app video recording screen (`record.tsx`) using `expo-camera`:

- Presented as a full-screen modal
- Front/back camera toggle
- Timer display with auto-stop at 3 minutes
- Preview mode with retake/use controls
- Camera + microphone permissions configured in `app.config.ts`

## Component Registry

The `components/legacy/registry.ts` file maps task keys to their components:

- **Singleton form registry**: `messages.story` → `YourStoryForm`
- **Entry form registry**: `messages.people` → `MessageToPersonForm`, `messages.future` → `FutureMomentForm`
- **List registry**: `messages.people` → `MessageToPersonList`, `messages.future` → `FutureMomentList`

Three lookup functions provide type-safe access:
- `getLegacySingletonFormComponent()` — returns `ComponentType<LegacySingletonFormProps>`
- `getLegacyEntryFormComponent()` — returns `ComponentType<LegacyEntryFormProps>`
- `getLegacyListComponent()` — returns `ComponentType<LegacyListProps>`

## Route Structure

```
app/(app)/legacy/
  [sectionId]/
    index.tsx          — Section screen (auto-redirect for single-task)
    [taskId]/
      index.tsx        — Hybrid task screen (list OR singleton form)
      [entryId].tsx    — Entry create/edit (list-based tasks only)
      record.tsx       — Video recording modal
```

## Color Theme

The Legacy Messages pillar uses a soft blue color scheme:

| Token | Hex | Usage |
|-------|-----|-------|
| `featureLegacy` | `#A3C4D8` | Primary accent |
| `featureLegacyTint` | `#ECF2F6` | Card backgrounds, guidance cards |
| `featureLegacyDark` | `#3A4F5C` | Heading text in expanded cards |
| `featureLegacyProgress` | `#D0DEEA` | Progress bar fill |

## Translation Structure

Translations are organized per section with owner/family/family-past perspectives:

```typescript
interface LegacyTranslations {
  people: {
    title: string;
    description: string;
    tasks: {
      people: {
        title: string;
        description: string;
        triggerText: string;
        guidanceHeading: string;
        guidance: string;
        tips: string[];
        pacingNote: string;
      };
    };
  };
  story: { /* same shape */ };
  future: { /* same shape */ };
}
```
