# E2EE Self-Recovery: Recovery Document Build Plan

**Legacy Made — Internal Technical Reference**
**Feature:** BIP39 Mnemonic Recovery Document
**Status:** Planning / Ready for Implementation

---

## Overview

This document specifies the design, UX, and implementation plan for the **self-recovery option** within Legacy Made's end-to-end encryption system. It covers client-side mnemonic generation, PDF recovery document creation, onboarding messaging, and the recovery flow.

---

## Background & Design Decisions

### Why This Exists

Legacy Made uses envelope encryption with per-user DEKs and device-generated key pairs. Because the architecture is genuinely E2EE, Legacy Made cannot recover a user's data on their behalf. If a user loses all their devices and has not shared access with a trusted contact, their data would be unrecoverable without this feature.

The recovery document gives users a self-sovereign fallback they physically control.

### Threat Model

Recovery using this document requires **both**:

1. The recovery document (mnemonic words or QR code)
2. Access to the user's Clerk account (email OTP)

The document alone is insufficient to access anyone's data. An attacker who finds the document still cannot decrypt anything without also compromising the user's email account. This means **no PIN or passphrase is required on the document** — adding one would be security theater that introduces a new failure mode (forgotten PIN) without meaningfully improving security.

### Why No PIN

- Clerk authentication is already the gate
- Users cannot store passwords or highly sensitive credentials in Legacy Made by design
- Simplicity is a feature — this is not a Swiss bank vault
- The document's purpose is to reinforce genuine data ownership, not to add complexity
- A forgotten PIN could make the recovery document useless, which defeats its entire purpose

### Privacy Posture

This feature is as much about **trust** as it is about security. When a user generates this document, the message is:

> *"We can't read your data. We can't recover it for you. You genuinely own this."*

This is a meaningful differentiator. The recovery document setup is a trust signal that should be treated as an intentional product moment, not a technical footnote.

---

## Technical Approach

### Mnemonic Generation

- Standard: **BIP39** (12-word mnemonic)
- Library: **`@scure/bip39`**
  - Lightweight, audited, no native dependencies
  - Compatible with Expo / React Native
- The mnemonic is generated entirely on-device
- The mnemonic is never transmitted to Legacy Made servers in any form
- The mnemonic encodes (or derives) the user's DEK backup

### PDF Generation

- Rendered entirely **client-side** using **`expo-print`**
- Source template: HTML/CSS rendered to PDF on-device
- The mnemonic never leaves the device during this process
- Output: a PDF the user can save to their device, cloud storage, or print

### QR Code

- The 12-word mnemonic string is encoded into a QR code embedded in the PDF
- Error correction level: **ECC-H** (High) — up to 30% of the QR can be damaged and it still scans
- Library: generate the QR as an SVG or base64 image client-side before injecting into the HTML template
- Recommended library: **`react-native-qrcode-svg`** (or inline QR generation for the HTML template)

### Word Layout

- Display words in a **3×4 grid** (not a vertical list)
  - Harder to accidentally skip a word
  - Scans faster visually
- Font: clear, unambiguous — avoid serifs that make `l`, `1`, `I` indistinguishable
  - **Inter** or similar sans-serif recommended
- Words are numbered 1–12

---

## Recovery Document Design

The PDF should feel calm, intentional, and on-brand — not like a raw technical artifact. It is a document worth keeping.

### Layout Spec

```
┌─────────────────────────────────────────────────┐
│  [Legacy Made logo]                             │
│                                                 │
│  Recovery Document                              │
│  Generated: [Date]                              │
│                                                 │
│  ┌──────────────┐    1. word      7. word       │
│  │              │    2. word      8. word       │
│  │  [QR CODE]   │    3. word      9. word       │
│  │              │    4. word     10. word       │
│  └──────────────┘    5. word     11. word       │
│                      6. word     12. word       │
│                                                 │
│  To recover your plan:                          │
│  Visit legacymade.com/recover and scan this     │
│  QR code, or enter your 12 words manually.      │
│                                                 │
│  You will also need to sign in to your          │
│  Legacy Made account.                           │
│                                                 │
│  Store this document somewhere safe —           │
│  with your important papers, in a safe,         │
│  or with a trusted person.                      │
└─────────────────────────────────────────────────┘
```

### Design Principles

- Clean, minimal — no clutter
- Calm tone — no alarming language
- No technical jargon visible to the user
- Recovery URL printed clearly so someone else could find it and know what to do
- Feels like a document that belongs alongside a will or insurance policy

---

## Onboarding & UX Messaging

### Setup Moment Copy

Displayed when E2EE is first initialized (during onboarding or first meaningful data entry):

> **Your information is yours.**
>
> Because your data is fully encrypted and only you can access it, we generate a recovery document you can save or print. If you ever lose access to your devices, this is how you get back in.
>
> We can't recover your data for you — and that's intentional.

CTA: **Generate My Recovery Document**
Secondary: **I'll do this later** *(with a persistent reminder)*

### Persistent Reminder

If the user dismisses the setup prompt, surface a non-intrusive banner or settings indicator:

> "Your recovery document hasn't been generated yet. [Set up now]"

Do not nag aggressively — one visible indicator in settings is sufficient.

### Settings Entry Point

Under **Account → Security** (or equivalent):

- Show status: **Recovery document generated** ✓ / **Not yet set up**
- Option to **regenerate** the document (with a warning that the old document will no longer work)
- Brief explainer: *"This document lets you restore access to your encrypted data if you lose your devices."*

### Regeneration Warning Copy

> **Generating a new recovery document will invalidate your previous one.**
>
> If you've already saved or printed your recovery document, it will no longer work after this. Make sure to replace it with the new one.

---

## Recovery Flow

1. User navigates to **legacymade.com/recover** (or equivalent in-app route)
2. User signs in via Clerk (email OTP — same as normal login)
3. User is prompted to restore their encryption key:
   - **Option A:** Scan the QR code from the recovery document
   - **Option B:** Enter the 12 words manually
4. The app reconstructs the DEK from the mnemonic
5. Data is decrypted and accessible as normal
6. User is prompted to generate a new recovery document if they are on a new device

---

## Scope

### In Scope (This Feature)

- [ ] On-device BIP39 mnemonic generation via `@scure/bip39`
- [ ] Client-side PDF generation via `expo-print` with branded HTML template
- [ ] QR code embedded in PDF (ECC-H, encodes mnemonic string)
- [ ] 3×4 word grid layout in PDF
- [ ] Onboarding prompt with messaging as specified above
- [ ] Persistent reminder if setup is skipped
- [ ] Settings entry point with status indicator
- [ ] Regeneration flow with invalidation warning
- [ ] Recovery route (post-Clerk login): QR scan + manual word entry

### Out of Scope (For Now)

- PIN or passphrase protection on the document
- Shamir's Secret Sharing / key splitting
- Server-side PDF generation
- Automated recovery document rotation

---

## Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| `@scure/bip39` | Mnemonic generation | Audited, no native deps, Expo-compatible |
| `expo-print` | Client-side PDF rendering | Renders HTML template to PDF on-device |
| `react-native-qrcode-svg` | QR code generation | SVG output, embeddable in HTML template |
| Clerk | Account gate for recovery flow | Already integrated |

---

## Key Principles (Non-Negotiable)

1. **The mnemonic never leaves the device unencrypted** — no server involvement in generation or PDF rendering
2. **No PIN required** — Clerk auth is the gate; the document alone cannot access data
3. **Calm, human tone** in all messaging — no fear, no urgency, no jargon
4. **The document feels intentional** — it belongs alongside important papers, not buried in app settings
5. **Simplicity over completeness** — scope reduction is always preferred over timeline extension
