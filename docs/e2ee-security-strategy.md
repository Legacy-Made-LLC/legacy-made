# Legacy Made — Security & Encryption Strategy

_Internal Reference Document · v2.1 · Confidential_

---

> **Purpose:** This document defines Legacy Made's approach to data security and end-to-end encryption. Part One is written for product stakeholders and future team members. Part Two provides the technical detail of the implementation as built. Part Three documents design decisions and divergences from the original specification.

---

# PART ONE — Strategic Overview

---

## 1. Why Security Is Central to Legacy Made

Legacy Made asks people to share the most sensitive information of their lives — financial accounts, legal documents, digital access details, and personal messages intended for people they love. This is not productivity data or social content. It is irreplaceable, deeply personal, and consequential in ways that extend beyond the user's own lifetime.

As an early-stage startup with a small team and no established reputation, Legacy Made cannot rely on brand trust or institutional credibility to reassure users. The security architecture itself must carry that weight. Users need to know — not just believe — that their data is truly theirs.

The decision to implement end-to-end encryption from the outset, rather than retrofitting it later, reflects both a product conviction and a practical reality: it is far simpler to build correctly now than to migrate thousands of users' data to an encrypted architecture later.

---

## 2. Core Security Principles

| Principle                        | Description                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Data belongs to the user**     | Legacy Made's servers store encrypted ciphertext. Without the user's key, the data is meaningless — including to Legacy Made.    |
| **Encryption covers everything** | All personal data — text fields, images, documents, and video — is encrypted before it leaves the user's device.                 |
| **Transparency over trust**      | Where Legacy Made does hold keys (account recovery), users are given a clear, plain-language explanation before opting in.       |
| **No passwords stored**          | Users are guided to record where and how to find passwords, not the passwords themselves. Legacy Made is not a password manager. |
| **Architecture over promises**   | Security guarantees are built into the system design, not asserted in marketing copy.                                            |

---

## 3. What Is Encrypted

All personal user data is end-to-end encrypted. This includes:

- **Text fields** — names, account details, personal notes, wishes, and messages
- **Documents** — PDFs, scans, and any uploaded files
- **Images** — photographs and other image uploads
- **Video** — personal legacy messages and recordings

Encryption happens on the user's device before data is transmitted. Legacy Made's servers and storage infrastructure (Cloudflare R2, Neon) receive and store only encrypted bytes. No plaintext personal data ever resides on Legacy Made's servers.

**What remains unencrypted (by design):**

- Structural metadata: entry IDs, plan IDs, task keys, sort order, completion status, timestamps
- Metadata display schemas (field labels and ordering — no user content)
- User public keys

---

## 4. Media Storage

All media — images, documents, and video — is stored in Cloudflare R2, Legacy Made's object storage provider. Video is stored as standard MP4 files and played back natively on device. No third-party video platform (such as Mux) is used.

This decision was deliberate. Managed video platforms require server-side transcoding, which means decrypting video before processing — fundamentally incompatible with end-to-end encryption. Storing MP4 files directly in R2 preserves the encryption guarantee, eliminates a vendor dependency, and reduces ongoing cost.

**Encrypted file format on R2:**

```
[12-byte IV][ciphertext + GCM authentication tag]
```

Each file is a single binary blob. The IV is prepended as a header, not stored separately. This ensures the IV is always available for decryption and cannot be separated from the ciphertext.

---

## 5. Account Recovery

End-to-end encryption presents an inherent tension: if only the user holds the key, a lost key means permanently lost data. For a product whose purpose is ensuring critical information survives difficult circumstances, this would be an unacceptable failure mode.

Legacy Made addresses this through an optional, transparent account recovery program. Users who opt in allow Legacy Made to hold a securely stored recovery key that can be used to restore access to their plan if their device is lost and no other backup exists.

> **Important:** Opting into account recovery necessarily gives Legacy Made the technical ability to decrypt a user's data. This is explained clearly at the point of opt-in. Users who do not opt in retain complete zero-knowledge encryption — Legacy Made cannot access their data under any circumstances.

Users who do not opt into Legacy Made recovery have an alternative backup option:

- **Recovery document** — a 12-word BIP-39 mnemonic rendered as a branded PDF (with QR code), generated entirely on-device. The mnemonic derives a wrapping key that encrypts the DEK; the encrypted blob is stored on the server, but the mnemonic itself never leaves the device. Recovery requires both the mnemonic and Clerk authentication — the document alone cannot access data.

### Recovery Detection

When a returning user signs in on a device that has no local encryption keys, the app checks whether E2EE is already enabled for their plan via `GET /encryption/plans/{planId}/status`. If E2EE is enabled, the app presents a recovery prompt instead of silently generating new keys (which would orphan all previously encrypted data). The user can choose from any available recovery method — escrow, recovery document, or device linking — or start fresh with new keys (with a clear warning that previous data will be unrecoverable).

This detection is handled in `CryptoProvider.initializeKeys()` and exposed as `needsRecovery` on the crypto context. The app layout intercepts this state and redirects to a full-screen recovery prompt before rendering any app content.

---

## 6. Multi-Device Access

Users may access Legacy Made across multiple devices. Each device generates its own unique key pair — private keys never leave the device they were created on. The shared DEK is wrapped separately for each device's public key.

Adding a new device works as follows:

- **If account recovery (escrow) is enabled** — the new device authenticates via Clerk, the server decrypts the DEK via KMS and returns it over TLS. The new device generates its own key pair, stores the DEK locally, and registers its public key. Seamless, no user action beyond authentication.
- **If account recovery is not enabled** — the user initiates a device-linking session. The new device generates a key pair, registers its public key, and displays a session code. The user enters this code on their existing device, which wraps the DEK with the new device's public key and stores it on the server. The new device polls for the wrapped DEK and unwraps it locally. No private key material ever passes through the server.
- **From recovery context** — if the app detects a returning user without local keys (see Section 5, Recovery Detection), device linking is offered as one of the recovery options. Navigation passes `?mode=receive` to default the device-linking screen to receive mode. On successful DEK transfer, recovery state is automatically cleared.

---

## 7. Trusted Contact Sharing

Legacy Made allows users to share their plan with trusted contacts — family members or designated individuals who should have access to the user's information.

Sharing requires that the trusted contact has an active Legacy Made account. This is a deliberate design decision: sharing encrypted data requires an exchange of cryptographic keys, and that exchange requires both parties to be registered.

**How sharing works:**

1. The plan owner accepts a trusted contact
2. The owner's device fetches all of the contact's public keys (one per device)
3. The plan's DEK is wrapped with each of the contact's public keys
4. Wrapped DEK copies are stored on the server
5. The contact can decrypt on any of their devices using the matching private key

The content itself never changes — the same ciphertext is read by different parties, each using their own DEK copy.

If a trusted contact's access is revoked, all of their server-side DEK copies are deleted immediately. They can no longer access any new or updated data. Data already accessed and cached on their device before revocation is outside Legacy Made's technical control — an inherent limitation of any sharing system.

---

## 8. Access Upon Passing _(Future Feature)_

The ability to deliver a user's plan to designated contacts after the user has passed is a planned future capability. It is not included in the current release.

When this feature is introduced, it will require Legacy Made to hold an escrow key for delivery — similar to the account recovery mechanism. Users will be informed of this clearly before setting it up. The cryptographic architecture already supports this; it is a product and policy decision to be made when the feature is prioritized.

---

## 9. What Legacy Made Does Not Do

- Store passwords — users are guided to record locations and retrieval instructions instead
- Read user data — all content is encrypted before it reaches Legacy Made's infrastructure
- Use managed video platforms that require server-side decryption
- Offer SOC 2 certification at this stage — this is a future milestone tied to enterprise expansion

---

---

# PART TWO — Technical Implementation (As Built)

---

## T1. Stack Context

| Component          | Detail                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Database**       | Neon (PostgreSQL) with Drizzle ORM and Row Level Security                                         |
| **API**            | NestJS — all encryption/decryption logic invoked on-device; server handles key storage and escrow |
| **Auth**           | Clerk — OTP-based, passwordless. No stable secret for key derivation.                             |
| **Storage**        | Cloudflare R2 — images, documents, video (MP4). Presigned URLs for access control.                |
| **Mobile**         | Expo (React Native) with `react-native-quick-crypto` for crypto primitives                        |
| **Secure Storage** | `expo-secure-store` — iOS Keychain (`AFTER_FIRST_UNLOCK`) / Android Keystore                      |
| **Key Management** | AWS KMS — holds Legacy Made's recovery key for escrow                                             |
| **Video**          | No managed platform. MP4 stored encrypted in R2, decrypted and played natively on device.         |
| **BIP-39**         | `@scure/bip39` — audited library for mnemonic generation/validation (recovery document)           |
| **PDF Generation** | `expo-print` — client-side HTML-to-PDF rendering for recovery documents                           |
| **QR Code**        | `qrcode` npm package — SVG generation for embedding in PDF templates                              |

---

## T2. Encryption Primitives

### Symmetric Encryption — Content & Files

All content (text fields, files, video) is encrypted with **AES-256-GCM** using a per-plan Data Encryption Key (DEK).

- **Key size:** 256 bits (32 bytes)
- **IV size:** 12 bytes (96 bits), randomly generated per encryption operation
- **Authentication:** GCM provides built-in integrity — tampered ciphertext fails to decrypt

### Asymmetric Encryption — DEK Wrapping

Each device has an **RSA-OAEP-2048** key pair with SHA-256 hash.

- **Key generation:** `react-native-quick-crypto` (QuickCrypto)
- **Private key format:** PKCS8 DER (~1218 bytes, stored as base64 in SecureStore)
- **Public key format:** SPKI DER (stored as base64, registered on server)
- **DEK wrapping output:** ~344 characters base64 (256-byte RSA ciphertext)

### Envelope Encryption — The Core Pattern

1. **Generate DEK** — random 256-bit AES key, created client-side on first use
2. **Encrypt content** — all user data encrypted with DEK using AES-256-GCM
3. **Wrap the DEK** — DEK encrypted with RSA-OAEP using recipient's public key. Multiple wrapped copies may exist (one per device, per trusted contact, plus optional escrow).
4. **Store** — encrypted content in R2/Neon; wrapped DEK copies in Neon. Nothing plaintext.
5. **Decrypt** — device fetches its wrapped DEK copy, unwraps with local private key, decrypts content with DEK.

---

## T3. Key Generation & On-Device Storage

Because Clerk uses OTP-based passwordless authentication, there is no stable user secret from which a key can be derived. Keys must be generated and stored.

### First Launch (Automatic, Silent)

When a user first authenticates, `CryptoProvider` automatically:

1. Generates an RSA-OAEP-2048 key pair via `generateKeyPair()`
2. Generates a 256-bit AES-GCM DEK via `generateDEK()`
3. Stores both in `expo-secure-store`:
   - `e2ee_private_key` — private key (PKCS8 DER, base64)
   - `e2ee_public_key` — public key (SPKI DER, base64)
   - `e2ee_dek` — raw DEK (32 bytes, base64)
   - `e2ee_key_version` — server-assigned version number
4. Calls `POST /encryption/setup` to:
   - Register the public key on the server
   - Store a wrapped DEK copy (owner type) on the server
   - Enable E2EE for the user's plan
5. The server assigns a `keyVersion` for this device's key pair

### SecureStore Key Names

| Key                | Contents                                          |
| ------------------ | ------------------------------------------------- |
| `e2ee_private_key` | RSA-OAEP-2048 private key (PKCS8 DER, base64)     |
| `e2ee_public_key`  | RSA-OAEP-2048 public key (SPKI DER, base64)       |
| `e2ee_dek`         | AES-256-GCM DEK (32 bytes raw, base64, ~44 chars) |
| `e2ee_key_version` | Server-assigned version string                    |
| `e2ee_key_id`      | Optional key ID                                   |

### Memory Management

- DEK is imported as a `CryptoKey` object and held in memory for fast encryption/decryption
- **On app background:** DEK is cleared from memory (`AppState` listener in `CryptoProvider`)
- **On app foreground:** DEK is reloaded from SecureStore and re-imported
- Private key is only read from SecureStore when needed (DEK unwrapping)

---

## T4. Text Encryption

### What Gets Encrypted

For entries, wishes, and messages, only sensitive fields are encrypted:

| Encrypted                            | Not Encrypted (structural)             |
| ------------------------------------ | -------------------------------------- |
| `title`                              | `id`, `planId`                         |
| `notes`                              | `taskKey`, `sortOrder`                 |
| `metadata` (all user-entered values) | `completionStatus`                     |
|                                      | `createdAt`, `updatedAt`               |
|                                      | `metadataSchema` (display labels only) |

### Encrypted Payload Format

```typescript
interface EncryptedPayload {
  ct: string; // Base64-encoded ciphertext (includes GCM auth tag)
  iv: string; // Base64-encoded 12-byte IV
  v: 1; // Version identifier for future algorithm changes
}
```

### Encryption Process

1. Collect sensitive fields into a plaintext JSON object: `{ title, notes, metadata }`
2. Serialize to JSON string, encode as UTF-8
3. Generate random 12-byte IV
4. Encrypt with AES-256-GCM using the DEK
5. Return `EncryptedPayload` with base64-encoded ciphertext and IV

### Server-Side Storage

The server stores encrypted metadata as:

```typescript
{
  encrypted: EncryptedPayload,
  isEncrypted: true
}
```

The `isEncrypted` flag allows the client to distinguish between pre-E2EE plaintext entries and encrypted entries, enabling graceful migration.

**Code locations:**

- `lib/crypto/aes.ts` — low-level AES-256-GCM encrypt/decrypt
- `lib/crypto/entryEncryption.ts` — entry/wish-specific encryption helpers (`encryptForCreate`, `encryptForUpdate`, `decryptSensitiveFields`)

---

## T5. File Encryption

### File Format on R2

```
[12-byte IV header][AES-256-GCM ciphertext + auth tag]
```

The IV is binary-prepended to the file (not stored in metadata). This keeps the encrypted file self-contained.

### Upload Flow (`hooks/useFileUpload.ts`)

1. Read file from device as `Blob` → `ArrayBuffer`
2. If crypto is ready: encrypt with `encryptFileForUpload(data, dekCryptoKey)`
3. Call `filesService.initUpload()` — returns presigned R2 URL and file ID
4. Upload encrypted bytes to presigned URL via `XMLHttpRequest` (with progress tracking)
5. Call `filesService.completeUpload()` to finalize
6. File metadata includes `isEncrypted: true`

**Video thumbnails** are encrypted and uploaded separately, linked to the parent video via `parentFileId` and `role: "thumbnail"`.

### Download & Decryption Flow (`hooks/useEncryptedFileView.ts`)

1. Fetch encrypted file from R2 via presigned URL
2. If presigned URL has expired, fetch a fresh one via the API
3. Decrypt with `decryptDownloadedFile(data, dekCryptoKey)`:
   - Extract first 12 bytes as IV
   - Decrypt remainder with AES-256-GCM
4. If decryption fails, fall back to raw data (handles pre-migration unencrypted files)
5. Write decrypted data to cache directory as a local `file://` URI
6. Clean up cached file on component unmount or app background

### Sharing Encrypted Files

When sharing files via the iOS share sheet, encrypted files are downloaded, decrypted in memory, written to a cache file, and shared from the local cache. The share sheet receives decrypted data.

**Code locations:**

- `lib/crypto/fileEncryption.ts` — `encryptFileForUpload`, `decryptDownloadedFile`
- `hooks/useFileUpload.ts` — upload orchestration with encryption
- `hooks/useEncryptedFileView.ts` — download/decrypt/cache for viewing

---

## T6. Key Backup & Account Recovery

### Option A — Legacy Made Escrow (Optional Opt-In)

**Implementation:** The user's plaintext DEK is sent over TLS to the backend, where it is encrypted with AWS KMS and stored in Neon. On recovery, the backend decrypts the DEK via KMS and returns it over TLS to the new device.

**Recovery flow (`CryptoProvider.recoverFromEscrow()`):**

1. Generate a new RSA-OAEP key pair on the new device
2. Call `POST /encryption/recovery` with the new public key
3. Server decrypts DEK via KMS, returns plaintext DEK over TLS
4. Import DEK as CryptoKey
5. Store new private key, public key, and DEK in SecureStore
6. Register new public key on server
7. Store wrapped DEK copy (device type) for new key

> **Bug fix (v2.1):** The original `recoverFromEscrow()` stored the private key but not the public key in SecureStore. This was fixed by adding `await storePublicKey(keyPair.publicKey)` after the private key store. Without this fix, subsequent operations that needed the public key from SecureStore would fail.

**Recovery UI:** `app/settings/recover-escrow.tsx` — a simple screen that calls `recoverFromEscrow()` then `completeRecovery()` on success, with error handling for cases where escrow was never enabled.

**Disclosure shown to user at opt-in:**

> _"Enabling Legacy Made account recovery allows us to decrypt and retrieve your plan data if you lose access to all your devices. Your data is protected by industry-standard security practices and our recovery key is stored in a dedicated hardware security system. This is optional — you can use a personal backup instead."_

**UI:** `app/settings/key-backup-escrow.tsx`

### Option B — Recovery Document (BIP-39 Mnemonic + PDF)

> **Design rationale:** See `docs/e2ee-recovery-document-plan.md` for the full design spec, threat model, and UX decisions.

**Implementation:** A 12-word BIP-39 mnemonic is generated on-device and rendered as a branded PDF with an embedded QR code. The mnemonic derives a wrapping key that encrypts the DEK; the encrypted DEK blob is stored on the server. The mnemonic itself never leaves the device.

**Library:** `@scure/bip39` (audited, lightweight, no native dependencies). This replaced an earlier custom 24-word implementation (`lib/crypto/bip39.ts`, now removed) which was fundamentally broken — it SHA-256 hashed the private key to derive entropy, making the words a one-way transformation that could not recover the key.

**Backup flow (`app/settings/key-backup-phrase.tsx`):**

1. Generate 16 bytes of cryptographic random entropy (`crypto.getRandomValues`)
2. Convert to 12-word mnemonic via `entropyToMnemonic(entropy, wordlist)`
3. Derive wrapping key: PBKDF2(entropy, fixed salt `"legacy-made-recovery-document-v1"`, 100,000 iterations, SHA-256) → 256-bit AES key
4. Export current DEK as raw bytes
5. Encrypt DEK with derived wrapping key (AES-256-GCM, random 12-byte IV)
6. Store encrypted blob on server via `keys.storeDek()` with `dekType: "recovery"` and the device's current `keyVersion`
7. Generate branded PDF via `expo-print`:
   - HTML template with Legacy Made branding
   - QR code (SVG, ECC-H) encoding the 12 words (generated via `qrcode` npm package)
   - 3×4 numbered word grid
   - Recovery instructions and generated date
8. Share/save via `expo-sharing`

**Recovery flow (`app/settings/recover-document.tsx`):**

1. User provides 12 words via QR scan (`expo-camera` CameraView) or manual entry (12 text inputs in 3×4 grid, with paste support for all words at once)
2. Validate mnemonic via `validateMnemonic()` from `@scure/bip39`
3. Convert words back to entropy via `mnemonicToEntropy()`
4. Derive same wrapping key from entropy (identical PBKDF2 parameters)
5. Fetch DEK records from server, find the mnemonic backup (identified by `dekType === "recovery"`)
6. Decrypt DEK blob with wrapping key
7. Generate fresh device key pair, register public key on server
8. Store wrapped DEK copy for new key version
9. Clear recovery state

**Why no PIN on the document:** Recovery requires both the mnemonic and Clerk authentication (email OTP). The document alone cannot access data. Adding a PIN would introduce a new failure mode (forgotten PIN) without meaningful security improvement — the Clerk account is already the authentication gate. See `docs/e2ee-recovery-document-plan.md` for the full threat model.

**Server-side convention:** Mnemonic backup DEK records use `dekType: "recovery"` to distinguish them from device-specific wrapped DEK copies. The `keyVersion` field identifies which device created the backup. Four `dekType` values exist: `"device"` (per-device wrapped DEK), `"contact"` (shared with trusted contacts), `"recovery"` (mnemonic-wrapped DEK), and `"escrow"` (KMS-managed backup).

### Backup Status Tracking

Backup status is tracked per-method using `AsyncStorage` flags and server-side DEK record checks:

| Method                | Tracking Mechanism                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Escrow**            | Server-side: checks DEK records for `dekType: "escrow"` via `keys.listDeks(planId)`                                                                |
| **Recovery document** | Server-side: checks DEK records for `dekType: "recovery"` via `keys.listDeks(planId)`, with `AsyncStorage` flag `e2ee_backup_document` as fallback |

The backup hub screen (`app/settings/key-backup.tsx`) displays the status of each backup method. Status is loaded on crypto initialization and refreshed when the backup screens are visited.

---

## T7. Multi-Device Linking

Each device has its own unique RSA key pair. The DEK is the same across all devices — it is wrapped separately for each device's public key.

### Path A — Escrow Enabled

If the user has opted into Legacy Made recovery, the new device authenticates via Clerk, and the DEK is recovered via the KMS escrow mechanism (see T6, Option A). No user action required beyond standard authentication.

### Path B — Session Code Transfer (No Escrow)

**New device (receiver):**

1. Verify no existing local keys
2. Generate a new RSA-OAEP key pair
3. Store private key in SecureStore
4. Register public key on server → receive `keyVersion`
5. Create device-link session → receive `sessionCode`
6. Deposit identity (`userId` + `keyVersion`) into session
7. Display `sessionCode` to user
8. Poll `GET /encryption/deks/mine/{userId}` every 3 seconds

**Existing device (sender):**

1. User enters `sessionCode`
2. Claim session → receive new device's `userId` + `keyVersion`
3. Fetch new device's public key matching `keyVersion`
4. Wrap DEK with new device's public key via `wrapDEK()`
5. Store wrapped DEK on server with `dekType: "device"`

**New device (completion):**

1. Polling detects the new wrapped DEK
2. Unwrap DEK with local private key
3. Store DEK in SecureStore
4. E2EE is now active on the new device

**Session lifetime:** ~10 minutes (server-configurable). No key material passes through the server — only wrapped (encrypted) DEK copies.

**Recovery context integration:** When navigated from the recovery prompt screen with `?mode=receive`, the device-linking screen defaults to receive mode, hiding the send option. On successful DEK transfer, `completeRecovery()` is called automatically to clear the recovery state and transition the user into the app.

**API endpoints:**

- `POST /encryption/device-link/session` — create session
- `POST /encryption/device-link/deposit` — deposit identity
- `POST /encryption/device-link/claim` — claim session

**UI:** `app/settings/device-linking.tsx`

---

## T8. Trusted Contact DEK Sharing

### Sharing Flow (`hooks/useShareDEK.ts`)

When a plan owner accepts a trusted contact:

1. Fetch **all** of the recipient's public keys (one per device) via `GET /encryption/keys/{userId}`
2. For each public key: wrap the plan DEK with `wrapDEK(rawDEK, publicKey)`
3. Store each wrapped copy on server via `POST /encryption/deks` with `dekType: "contact"`

The contact's device(s) retrieve their wrapped DEK copy, unwrap with their local private key, and can then decrypt all plan content.

### DEK Retrieval for Shared Plans

`CryptoProvider.getSharedPlanDEK(planId, ownerId)`:

1. Fetch all DEK copies where current user is recipient
2. Find the copy matching the local `keyVersion`
3. Fall back to first available DEK if no version match
4. Unwrap with local private key
5. Cache the resulting `CryptoKey` per `planId` (in-memory, cleared on background)

### Access Revocation

`useRevokeDEK()` calls `DELETE /encryption/deks/{recipientId}?planId=X`. The server deletes all wrapped DEK copies for that recipient. DEK rotation on revocation is intentionally deferred as disproportionate to the risk.

---

## T9. Data Migration (Pre-E2EE to E2EE)

For users who existed before E2EE was enabled, a client-side migration encrypts their existing plaintext data.

**Process (`hooks/useMigration.ts`):**

1. Fetch all entries and wishes for the plan
2. Filter to unencrypted items (`isEncrypted !== true`)
3. For each unencrypted item:
   - Extract plaintext title, notes, metadata
   - Encrypt with `encryptForUpdate()`
   - PATCH entry/wish with encrypted metadata + `isEncrypted: true`
4. Track progress (total, migrated, failed counts)
5. Crash-resilient: already-encrypted items are skipped on restart

**Graceful degradation:** Throughout the app, decryption code handles both encrypted and plaintext data. If decryption fails, raw data is used as a fallback (logged as a warning).

---

## T10. Access Control — Layered Approach

Security is enforced at multiple independent layers. Bypassing one does not compromise the others.

| Layer                     | Description                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layer 1 — Clerk Auth**  | All API requests require a valid Clerk JWT. No unauthenticated access to any endpoint.                                                                       |
| **Layer 2 — RLS in Neon** | PostgreSQL Row Level Security restricts database reads to rows the authenticated user owns or has been granted access to.                                    |
| **Layer 3 — Signed URLs** | R2 media is never publicly accessible. All reads require a time-limited presigned URL generated by the NestJS API after auth checks pass.                    |
| **Layer 4 — E2EE**        | Even if all prior layers were bypassed, all content is encrypted. Without the DEK, ciphertext is useless.                                                    |
| **Layer 5 — KMS**         | The recovery private key is held in AWS KMS hardware. It cannot be extracted — only used via authenticated API calls, all of which are logged to CloudTrail. |

---

## T11. API Endpoints

### Key Management

| Method   | Endpoint                        | Description                                                         |
| -------- | ------------------------------- | ------------------------------------------------------------------- |
| `POST`   | `/encryption/setup`             | First-time setup: register key + store owner DEK + enable plan E2EE |
| `POST`   | `/encryption/keys`              | Register additional device key                                      |
| `GET`    | `/encryption/keys/me`           | List current user's keys                                            |
| `GET`    | `/encryption/keys/{userId}`     | Get another user's public keys (for sharing)                        |
| `DELETE` | `/encryption/keys/{keyVersion}` | Delete a key                                                        |

### DEK Management

| Method   | Endpoint                                   | Description                           |
| -------- | ------------------------------------------ | ------------------------------------- |
| `POST`   | `/encryption/deks`                         | Store a wrapped DEK copy              |
| `GET`    | `/encryption/deks/mine/{ownerId}?planId=X` | Get DEK copies for current user       |
| `DELETE` | `/encryption/deks/{recipientId}?planId=X`  | Revoke access (delete wrapped copies) |

### Device Linking

| Method | Endpoint                          | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| `POST` | `/encryption/device-link/session` | Create a time-limited session      |
| `POST` | `/encryption/device-link/deposit` | Deposit identity into session      |
| `POST` | `/encryption/device-link/claim`   | Claim session from existing device |

### Escrow & Recovery

| Method | Endpoint               | Description                 |
| ------ | ---------------------- | --------------------------- |
| `POST` | `/encryption/escrow`   | Enable KMS escrow for DEK   |
| `POST` | `/encryption/recovery` | Recover DEK from KMS escrow |

### Plan E2EE Status

| Method | Endpoint                            | Description            |
| ------ | ----------------------------------- | ---------------------- |
| `POST` | `/encryption/plans/{planId}/enable` | Enable E2EE for a plan |
| `GET`  | `/encryption/plans/{planId}/status` | Check E2EE status      |

---

## T12. AWS KMS Configuration

| Setting            | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **Key type**       | Symmetric AES-256 CMK                                                 |
| **Region**         | Co-located with primary infrastructure                                |
| **Access control** | IAM role scoped to the NestJS API only — principle of least privilege |
| **Key rotation**   | Automatic annual rotation enabled                                     |
| **Audit logging**  | All KMS operations logged to AWS CloudTrail                           |
| **Cost**           | ~$1/month per key + $0.03 per 10,000 API calls                        |

Required IAM permissions for the NestJS API role:

```json
{
  "Effect": "Allow",
  "Action": ["kms:Encrypt", "kms:Decrypt", "kms:DescribeKey"],
  "Resource": "arn:aws:kms:REGION:ACCOUNT_ID:key/RECOVERY_KEY_ID"
}
```

The recovery key never exists in application code, environment variables, or the Neon database. All encrypt/decrypt operations are API calls to KMS — the key material stays in AWS hardware.

---

## T13. Key Source Files

### Core Crypto Library

| File                            | Role                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `lib/crypto/CryptoProvider.tsx` | Central orchestration: initialization, recovery detection, memory management, encrypt/decrypt, backup status |
| `lib/crypto/aes.ts`             | Low-level AES-256-GCM encrypt/decrypt, IV generation, base64 utilities                                       |
| `lib/crypto/keys.ts`            | RSA key pair generation, DEK generation, key wrapping/unwrapping, key import/export, SecureStore operations  |
| `lib/crypto/entryEncryption.ts` | Entry/wish-specific encryption: `encryptForCreate`, `encryptForUpdate`, `decryptSensitiveFields`             |
| `lib/crypto/fileEncryption.ts`  | File encryption with IV header: `encryptFileForUpload`, `decryptDownloadedFile`                              |

### Hooks

| File                            | Role                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `hooks/useFileUpload.ts`        | File upload orchestration with encryption                |
| `hooks/useEncryptedFileView.ts` | File download, decryption, and local caching for viewing |
| `hooks/useShareDEK.ts`          | DEK sharing for trusted contacts                         |
| `hooks/useMigration.ts`         | Client-side migration of pre-E2EE plaintext data         |

### API Layer

| File          | Role                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `api/keys.ts` | API client for all encryption endpoints (key management, DEK storage, escrow, device linking, plan status) |

### Backup & Recovery UI

| File                                 | Role                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `app/settings/key-backup.tsx`        | Backup hub — shows all backup options with status indicators             |
| `app/settings/key-backup-escrow.tsx` | Escrow opt-in UI (sets `AsyncStorage` flag on success)                   |
| `app/settings/key-backup-phrase.tsx` | Recovery document generation — 12-word mnemonic, PDF with QR code        |
| `app/settings/recovery.tsx`          | Recovery prompt — full-screen interception when `needsRecovery` is true  |
| `app/settings/recover-escrow.tsx`    | Escrow recovery UI — calls `recoverFromEscrow()` + `completeRecovery()`  |
| `app/settings/recover-document.tsx`  | Recovery document restore — QR scan + manual 12-word entry               |
| `app/settings/device-linking.tsx`    | Multi-device linking UI (supports `?mode=receive` from recovery context) |

### Removed Files

| File                  | Reason                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `lib/crypto/bip39.ts` | Replaced by `@scure/bip39`. The custom implementation SHA-256 hashed the private key to derive entropy, making recovery impossible. |

---

---

# PART THREE — Design Decisions & Divergences

---

## D1. Divergences from Original Strategy (v1.0)

The original strategy document (v1.0) was written as a pre-implementation plan. The following decisions were made during implementation:

### RSA-OAEP-2048 chosen over P-256 ECDH

The original spec recommended P-256 ECDH for mobile performance. The implementation uses **RSA-OAEP-2048** for DEK wrapping. RSA-OAEP provides direct encryption of the DEK without requiring a shared-secret derivation step (ECDH → HKDF → AES-KW). This simplifies the key exchange flow: wrap the DEK directly with the recipient's public key.

### Device-linking uses session codes, not QR codes

The original spec described QR code scanning for device-to-device key transfer with a 60-second window. The implementation uses a **typed session code** approach with server-side sessions (~10-minute lifetime). The new device generates its own key pair and registers it; the existing device wraps the DEK for the new device's public key. This avoids the complexity of QR code rendering/scanning and the need to transfer private keys between devices — private keys never leave the device they were created on.

### No private key transfer between devices

The original spec described transferring the private key from an existing device to a new one. The implementation takes a fundamentally different approach: **each device generates its own unique key pair.** The shared DEK is wrapped separately for each device. This is more secure (private keys never transit) and more aligned with the principle that key material should not leave secure storage.

### Recovery document replaces broken BIP-39 implementation

The original BIP-39 implementation (`lib/crypto/bip39.ts`) used a 24-word mnemonic generated by SHA-256 hashing the private key to derive entropy. This was a **fundamental design flaw**: SHA-256 is a one-way function, so the mnemonic could not be used to recover the private key. The words were effectively a readable fingerprint of the key, not a backup.

The replacement uses `@scure/bip39` (audited library) with a fundamentally different approach:

- **12 words** (not 24) — 128 bits of fresh random entropy, sufficient for the wrapping key use case
- Entropy is generated independently (not derived from the private key)
- Entropy derives a **wrapping key** via PBKDF2, which encrypts the DEK
- The encrypted DEK blob is stored server-side (with `dekType: "recovery"`)
- Recovery reconstructs the wrapping key from the mnemonic and decrypts the DEK from the server
- No PIN required — Clerk authentication is the access gate (see `docs/e2ee-recovery-document-plan.md` for threat model)

The recovery document is generated as a branded PDF with an embedded QR code, entirely on-device via `expo-print`. The mnemonic never leaves the device.

### Escrow sends plaintext DEK over TLS (not double-encrypted)

The original spec described encrypting the DEK with a KMS public key client-side. The implementation sends the **plaintext DEK over TLS** to the backend, which encrypts it via KMS. This was a pragmatic simplification — the TLS channel provides transport encryption, and the KMS encryption at rest protects the stored copy. The tradeoff is that the DEK is briefly visible to the server process during the escrow operation.

---

## D2. Deliberately Deferred

| Item                                       | Status         | Notes                                                                                                                                                                       |
| ------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SOC 2 Certification**                    | Deferred       | Until product matures and enterprise/B2B expansion is prioritized.                                                                                                          |
| **Password Storage**                       | Not supported  | Users guided to store location/hint only.                                                                                                                                   |
| **Access Upon Passing**                    | Future feature | Architecture supports it via escrow. Requires product and policy decisions.                                                                                                 |
| **DEK Rotation on Revoke**                 | Deferred       | Server-side revocation is sufficient. Rotation would add significant complexity for marginal security gain.                                                                 |
| **Video DRM**                              | Not applicable | MP4 in R2 with E2EE is the storage model.                                                                                                                                   |
| **Recovery Document Regeneration Warning** | Partial        | Regeneration creates a new encrypted blob but does not invalidate old server-side blobs. Multiple mnemonic backups can coexist (all with `dekType: "recovery"`).            |
| **Onboarding Recovery Prompt**             | Deferred       | Post-E2EE-init prompt to generate a recovery document is specified in `docs/e2ee-recovery-document-plan.md` but not yet implemented. Users access backup via Settings menu. |
| **PIN/Passphrase on Recovery Document**    | Not planned    | Deliberately excluded. See threat model in `docs/e2ee-recovery-document-plan.md`. Clerk auth is the access gate.                                                            |

---

## D3. Completed Items (Previously Deferred)

| Item                             | Completed In | Notes                                                                                                                      |
| -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Recovery Document UI**         | v2.1         | Full generation (PDF + QR) and recovery (QR scan + manual entry) flows. Replaced broken custom BIP-39 implementation.      |
| **Recovery Detection**           | v2.1         | `CryptoProvider` checks `getPlanE2EEStatus()` before generating new keys. Full-screen recovery prompt for returning users. |
| **Escrow Recovery UI**           | v2.1         | Dedicated recovery screen for restoring from Legacy Made account backup.                                                   |
| **Menu Security Section**        | v2.1         | "Key Backup" and "Link Device" accessible from side menu under SECURITY section.                                           |
| **Backup Status Tracking**       | v2.1         | Per-method status tracking via AsyncStorage flags + server-side DEK record checks.                                         |
| **Device Linking from Recovery** | v2.1         | Device linking supports `?mode=receive` from recovery prompt, auto-clears recovery state on success.                       |

---

_Legacy Made Security & Encryption Strategy · Internal Reference · v2.1 · Confidential_
