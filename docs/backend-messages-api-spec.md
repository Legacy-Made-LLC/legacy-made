# Backend API Spec: Legacy Messages

The Legacy Messages pillar introduces a new `messages` resource. It follows the same patterns as `entries` (vault) and `wishes` — nested under `/plans/:planId`, with CRUD operations, file attachments, and quota tracking.

---

## New Resource: Messages

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/plans/:planId/messages` | List all messages (optionally filtered by `?taskKey=`) |
| `POST` | `/plans/:planId/messages` | Create a message |
| `GET` | `/plans/:planId/messages/:id` | Get a single message |
| `PATCH` | `/plans/:planId/messages/:id` | Update a message (partial) |
| `DELETE` | `/plans/:planId/messages/:id` | Delete a message |

These follow the exact same pattern as `/plans/:planId/entries` and `/plans/:planId/wishes`.

### Task Keys

Messages use the `messages.*` namespace:

| taskKey | Section | Behavior |
|---------|---------|----------|
| `messages.people` | Messages to People | Multi-entry (like vault entries) |
| `messages.story` | Your Story | Singleton (like wishes — one per task) |
| `messages.future` | Future Moments | Multi-entry (like vault entries) |

### Message Shape

Same structure as `Entry` and `Wish`:

```typescript
{
  id: string;
  planId: string;
  taskKey: string;
  title: string | null;
  notes: string | null;
  sortOrder: number;
  metadata: Record<string, unknown>;   // taskKey-specific, see below
  metadataSchema: MetadataSchema;      // frontend-provided display schema
  files?: ApiFile[];                   // attached photos/videos
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}
```

### List Response Shape

```typescript
{
  data: Message[];
  quota: {
    limit: number;
    current: number;
    remaining: number | null;
    unlimited: boolean;
  }
}
```

### Create Request

```typescript
{
  planId: string;
  taskKey: string;
  title?: string;
  notes?: string | null;
  sortOrder?: number;
  metadata: T;                         // required
  metadataSchema: MetadataSchema;      // required
}
```

### Update Request

All fields optional (PATCH semantics):

```typescript
{
  title?: string;
  notes?: string | null;
  sortOrder?: number;
  metadata?: Partial<T>;
  metadataSchema?: MetadataSchema;
}
```

---

## Metadata Shapes by Task Key

### `messages.people` — MessageToPersonMetadata

```typescript
{
  recipientName: string;
  recipientRelationship?: string;       // e.g., "Daughter", "Friend"
  messageType: "video" | "written";
  writtenMessage?: string;
  shortDescription?: string;            // brief note about the message
  deliveryTiming?: string;              // e.g., "after_passing", "specific_date"
}
```

### `messages.story` — YourStoryMetadata

```typescript
{
  messageType: "video" | "written";
  writtenStory?: string;
}
```

### `messages.future` — FutureMomentMetadata

```typescript
{
  occasion: string;                     // e.g., "Graduation", "Wedding"
  recipientName?: string;
  messageType: "video" | "written" | "both";
  writtenMessage?: string;
  deliveryNote?: string;                // when/how to deliver the message
}
```

The backend should store metadata as JSON. It does **not** need to validate metadata fields — the frontend handles validation. Just persist whatever metadata object is sent.

---

## File Attachments

The file upload system already supports messages. The frontend is wired to use:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/messages/:messageId/files/upload/init` | Init standard file upload (photos) |
| `POST` | `/messages/:messageId/files/video/init` | Init video upload (Mux) |
| `GET` | `/messages/:messageId/files` | List files for a message |

These follow the same pattern as `/entries/:entryId/files/*` and `/wishes/:wishId/files/*`. The `files` table just needs a `messageId` foreign key column alongside the existing `entryId` and `wishId` columns.

The existing file endpoints (`/files/:id/complete`, `/files/:id/download`, `/files/:id` DELETE) are shared and don't need changes — they work by file ID regardless of parent resource.

---

## Progress Tracking

No changes needed. The existing `/plans/:planId/progress` endpoints already support arbitrary task keys. The frontend will write progress entries with `messages.people`, `messages.story`, and `messages.future` task keys using the same progress API.

---

## Summary of Backend Work

1. **Create `messages` table** — same columns as `entries`/`wishes` (id, planId, taskKey, title, notes, sortOrder, metadata, metadataSchema, createdAt, updatedAt)
2. **CRUD routes** for `/plans/:planId/messages` — copy the entries or wishes controller pattern
3. **Add `messageId` FK** to the `files` table (nullable, alongside entryId/wishId)
4. **File upload routes** under `/messages/:messageId/files/*` — same handlers as entries/wishes, just scoped to message ownership
5. **Quota support** — return quota info in list responses (same shape as entries/wishes)

Everything else (auth, plan ownership checks, Mux integration, R2 uploads) is already in place and shared.
