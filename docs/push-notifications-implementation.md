# Push Notifications — Implementation Reference

### Legacy Made — Internal Technical Reference

---

## Overview

Legacy Made uses the **Expo Push Notification Service** to deliver native push notifications to iOS and Android devices. Notifications alert plan owners when trusted contacts respond to invitations.

### Why Expo Push Notification Service

- **Free** — no cost per message, no monthly fee
- **Unified token** — one Expo Push Token works across iOS (APNs) and Android (FCM), simplifying backend logic
- **EAS-integrated** — credentials are managed automatically through the existing EAS Build pipeline
- **No platform lock-in** — can migrate to direct FCM/APNs later if finer-grained control is needed

> **Rate limit:** 600 notifications/second per project. Not a concern at current scale.

---

## Architecture

```
Device → registers token → POST /push-notifications/token
                                   ↓
NestJS API ← stores token in Neon (push_tokens table)
                                   ↓
NestJS sends POST to Expo Push API → Expo → APNs / FCM → Device
```

---

## Notification Scenarios

The plan owner receives push notifications for these events:

| Trigger | Message Example | Notes |
|---------|----------------|-------|
| Contact accepts invitation | "Sarah accepted your invitation" | High value — trust moment |
| Contact declines invitation | "Sarah declined your invitation" | Informational |
| Contact leaves plan | "Sarah left your plan" | Contact revoked their own access |

---

## Client Implementation (Expo)

### Dependencies

```bash
npx expo install expo-notifications expo-device
```

### Plugin Configuration (`app.config.ts`)

```ts
["expo-notifications", {
  icon: "./assets/images/notification-icon.png",
  color: "#8a9785"
}]
```

### Key Files

| File | Purpose |
|------|---------|
| `api/pushTokens.ts` | API service — `register(token, platform)` and `unregister(token)` |
| `hooks/usePushNotifications.ts` | Central hook — permission, token lifecycle, listeners |
| `contexts/NotificationPromptContext.tsx` | Controls when the permission prompt appears |
| `components/notifications/NotificationPermissionPrompt.tsx` | Bottom sheet permission prompt UI |

### `usePushNotifications` Hook

Initialized in `app/(app)/_layout.tsx` (runs only when authenticated).

Responsibilities:
1. **Module-level handler** — `setNotificationHandler` with `shouldShowBanner: true`, `shouldPlaySound: false` (calm, non-intrusive)
2. **Auto-register** — on mount, checks permission; if already `granted`, registers token with backend
3. **Foreground listener** — shows in-app toast via `toast.info()`
4. **Tap handler** — navigates to `/(app)/(tabs)/family`
5. **Token persistence** — stores token in AsyncStorage (`legacy_made_push_token`) for sign-out cleanup

### Permission Prompt Timing

**After the user creates their first trusted contact** — this is when the value of notifications becomes clear.

Flow:
1. User creates a trusted contact in `family/contacts/new.tsx`
2. On success, `triggerPrompt(firstName)` is called on `NotificationPromptContext`
3. When the user returns to the Family tab, `NotificationPermissionPrompt` bottom sheet appears
4. "Enable Notifications" → calls `requestPermission()` → OS dialog → token registered
5. "Not now" → dismisses and persists `legacy_made_push_permission_prompted` to AsyncStorage
6. The prompt only shows once per device (even across sign-in/sign-out)

### Badge Management

`family.tsx` clears the badge count on mount:
```ts
useEffect(() => { Notifications.setBadgeCountAsync(0); }, []);
```

### Sign-Out Cleanup

`Menu.tsx` → `handleSignOut`:
1. Reads cached push token from AsyncStorage
2. Calls `pushTokens.unregister(token)` (best-effort, wrapped in try/catch)
3. Removes the AsyncStorage key

---

## Backend API Endpoints

| Method | Path | Body | Auth | Description |
|--------|------|------|------|-------------|
| `POST` | `/push-notifications/token` | `{ token, platform }` | Bearer JWT | Register/upsert push token |
| `POST` | `/push-notifications/token/unregister` | `{ token }` | Bearer JWT | Remove push token |

### Database Table (Drizzle Schema)

```ts
export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform"), // 'ios' | 'android'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Push Notification Service (NestJS)

```ts
import { Expo, ExpoPushMessage } from "expo-server-sdk";

@Injectable()
export class PushNotificationService {
  private expo = new Expo();

  async sendToUser(userId: string, title: string, body: string, data?: object) {
    const tokens = await this.getTokensForUser(userId);
    const messages: ExpoPushMessage[] = tokens
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({ to: token, sound: "default", title, body, data }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk);
    }
  }
}
```

---

## EAS Credentials

EAS handles credential provisioning automatically during the first development build.

- **iOS** — EAS manages the APNs key. Answer **yes** when prompted to enable push notifications during `eas build`.
- **Android** — Requires a Firebase project. Download `google-services.json` and place it at the project root.

> **Important:** Push notifications do not work on simulators/emulators. A physical device with a development build is required.

---

## Deferred (Post-MVP)

- **Notification preferences screen** — user control over which notifications they receive
- **Rich notifications** — images, action buttons
- **Scheduled/recurring reminders** — NestJS cron job or `scheduleNotificationAsync`
- **Additional notification triggers** — section completion reminders, legacy message sharing

---

## Cost Summary

| Service | Cost |
|---------|------|
| Expo Push Notification Service | Free |
| APNs (Apple) | Free (included with Apple Developer account) |
| Firebase/FCM (Android) | Free |

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Push service | Expo Push Notification Service | Simpler backend, unified token |
| Permission timing | After first trusted contact | Value is clear at that moment |
| Sound | Off by default | Fits Legacy Made's calm, unhurried tone |
| Prompt style | Bottom sheet (not inline) | Matches existing UpgradePrompt pattern |
| Token storage | AsyncStorage (client) + Neon (server) | Client needs it for sign-out cleanup |
