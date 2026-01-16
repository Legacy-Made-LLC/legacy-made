# Legacy Made — Expo Demo App

## Project Overview

Build a **demo iOS app** for Legacy Made using **Expo** (with Expo Router). This app helps people organize critical end-of-life information for their loved ones. The demo should validate the concept and showcase high-quality mobile development.

**Primary Goal:** Prove development capabilities to the founder. This may evolve into the production app.

**Target Platform:** iOS only for now (but structure code for future Android/web expansion).

---

## What Legacy Made Is

Legacy Made is a **guided digital platform** that helps people organize critical end-of-life information and provide clear direction to their loved ones — in a way that feels **calm, human, and manageable**.

It removes uncertainty and burden by answering questions families ask when someone is gone:

- _Who needs to be contacted?_
- _Where is everything?_
- _What should happen next — and why?_

**What Legacy Made is NOT:**

- A legal service or estate-planning replacement
- A will, trust, or document generator
- A memorial or grief platform
- A fear-based or urgency-driven product

---

## Demo Scope

### Feature Focus: "Important Information" Pillar Only

The demo focuses on the **primary entry point** — helping users organize critical details their loved ones would need.

**Six sections to include:**

1. **Key Contacts** — Who to contact first (and why)
2. **Financial Accounts** — Bank accounts, investments, debts
3. **Insurance** — Life, health, home, auto policies
4. **Legal Documents** — Will, trust, POA locations
5. **Home & Responsibilities** — Property, vehicles, ongoing obligations
6. **Digital Access** — Email, subscriptions, important accounts (guidance only, no password storage)

### What to Skip for Now

- Authentication (start in "logged in" state)
- Backend/persistence (in-memory data only)
- Other feature pillars (Wishes & Guidance, Family Access, Legacy Messages)
- Dark mode

---

## Technical Requirements

### Stack

- **Expo SDK 54** (latest)
- **Expo Router** for file-based navigation
- **TypeScript**
- **React Native** core components

### Project Structure

```
app/
├── _layout.tsx          # Root layout with Stack navigator
├── index.tsx            # Dashboard (main screen)
├── contacts/
│   ├── index.tsx        # Contacts list
│   └── [id].tsx         # Contact detail/edit
├── finances/
│   ├── index.tsx        # Financial accounts list
│   └── [id].tsx         # Account detail/edit
├── insurance/
│   ├── index.tsx        # Insurance policies list
│   └── [id].tsx         # Policy detail/edit
├── documents/
│   ├── index.tsx        # Legal documents list
│   └── [id].tsx         # Document detail/edit
├── home-responsibilities/
│   ├── index.tsx        # Home & responsibilities list
│   └── [id].tsx         # Item detail/edit
├── digital/
│   ├── index.tsx        # Digital access list
│   └── [id].tsx         # Account detail/edit
components/
├── ui/                  # Reusable UI components
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── TextArea.tsx
│   └── SectionHeader.tsx
├── dashboard/
│   └── CategoryCard.tsx # Dashboard section cards
data/
├── mockData.ts          # Realistic mock data
├── types.ts             # TypeScript interfaces
└── store.ts             # Simple in-memory state management
constants/
├── theme.ts             # Colors, typography, spacing
└── categories.ts        # Category metadata (icons, labels)
```

---

## Design System

### Design Philosophy

**"Calm, human, respectful, clear, unhurried"**

Inspired by Apple and Headspace aesthetics:

- Minimal, breathing layouts with generous whitespace
- Soft, approachable colors
- Typography that feels warm, not clinical
- Interactions that feel gentle, not urgent

### Color Palette

```typescript
export const colors = {
  // Backgrounds
  background: "#FAF9F7", // Warm off-white
  surface: "#FFFFFF", // Pure white for cards
  surfaceSecondary: "#F5F4F2", // Subtle gray for secondary surfaces

  // Text
  textPrimary: "#1A1A1A", // Near-black for headings
  textSecondary: "#6B6B6B", // Warm gray for body text
  textTertiary: "#9B9B9B", // Light gray for placeholders/hints

  // Accents
  primary: "#1C2541", // Deep navy for primary actions
  primaryPressed: "#0F1629", // Darker navy for pressed state

  // Semantic
  success: "#4A7C59", // Muted green
  warning: "#C17817", // Warm amber
  error: "#A63D40", // Muted red

  // Borders & Dividers
  border: "#E8E6E3", // Soft warm gray
  divider: "#F0EEEB", // Very light divider
};
```

### Typography

```typescript
export const typography = {
  // Use system fonts that feel warm
  fontFamily: {
    serif: "Georgia", // For main headings (warm, human)
    sans: "System", // San Francisco on iOS
  },

  sizes: {
    displayLarge: 32, // Screen titles
    displayMedium: 24, // Section headers
    titleLarge: 20, // Card titles
    titleMedium: 17, // List item titles
    body: 16, // Body text
    bodySmall: 14, // Secondary text
    caption: 12, // Labels, hints
    label: 11, // Uppercase labels
  },

  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};
```

### Spacing Scale

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Component Styles

**Buttons:**

- Primary: Deep navy (#1C2541), white text, pill-shaped (borderRadius: 25), height: 52px
- Secondary: White background, navy border, navy text
- Subtle: Transparent background, navy text
- Disabled: Gray background (#E8E6E3), gray text

**Cards:**

- White background
- Subtle shadow (shadowOpacity: 0.04, shadowRadius: 8)
- Border radius: 16px
- Padding: 20px

**Inputs:**

- Height: 52px
- Border: 1px solid #E8E6E3
- Border radius: 12px
- Focus border: #1C2541
- Placeholder color: #9B9B9B
- Label: Uppercase, 11px, #6B6B6B, letter-spacing: 1px

**TextAreas:**

- Min height: 100px
- Same styling as inputs

---

## Screen Specifications

### 1. Dashboard (index.tsx)

The main hub — a single scrollable view with category cards.

**Layout:**

```
┌─────────────────────────────────┐
│  [Safe Area Top Padding]        │
│                                 │
│  Legacy Made              [?]   │  ← Serif heading, help icon
│                                 │
│  "Organize what matters most    │  ← Subheading
│   so your family is never       │
│   left guessing."               │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👤 Key Contacts         │    │  ← Category card
│  │ 3 contacts added        │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💰 Financial Accounts   │    │
│  │ 5 accounts added        │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🛡️ Insurance            │    │
│  │ Not started             │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  [... more cards ...]           │
│                                 │
│  [Safe Area Bottom Padding]     │
└─────────────────────────────────┘
```

**Category Card Component:**

- Icon (emoji or simple icon)
- Category title (17px, semibold)
- Progress indicator ("3 contacts added" or "Not started")
- Chevron right
- Subtle animation on press (scale: 0.98, opacity: 0.9)
- Cards should feel tappable but not urgent

**Progress States:**

- "Not started" — gray text, empty state
- "X items added" — shows count
- Consider subtle progress indication (not a progress bar — too clinical)

### 2. Category List Screens (e.g., contacts/index.tsx)

Shows all items in a category with ability to add new ones.

**Layout:**

```
┌─────────────────────────────────┐
│  ← Back       Key Contacts      │  ← Header with back button
│                                 │
│  "The people who should be      │  ← Warm explanatory text
│   contacted first."             │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Margaret Chen           │    │  ← List item
│  │ Sister · Primary contact│    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ David Park, Esq.        │    │
│  │ Attorney                │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ + Add Contact           │    │  ← Add button (styled as card)
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Empty State:**
When no items exist, show:

- Soft illustration or icon
- "No contacts added yet"
- "Add the first person your loved ones should reach out to."
- Primary "Add Contact" button

### 3. Detail/Edit Screens (e.g., contacts/[id].tsx)

View and edit a single item. Use same screen for add (id = "new") and edit.

**Layout:**

```
┌─────────────────────────────────┐
│  ← Back       Add Contact       │  ← or "Edit Contact"
│                                 │
│  NAME                           │  ← Uppercase label
│  ┌─────────────────────────┐    │
│  │ Enter full name         │    │  ← Input with placeholder
│  └─────────────────────────┘    │
│                                 │
│  RELATIONSHIP                   │
│  ┌─────────────────────────┐    │
│  │ e.g., Sister, Attorney  │    │
│  └─────────────────────────┘    │
│                                 │
│  PHONE                          │
│  ┌─────────────────────────┐    │
│  │ (555) 123-4567          │    │
│  └─────────────────────────┘    │
│                                 │
│  EMAIL                          │
│  ┌─────────────────────────┐    │
│  │ email@example.com       │    │
│  └─────────────────────────┘    │
│                                 │
│  WHY THIS PERSON? (OPTIONAL)    │
│  ┌─────────────────────────┐    │
│  │ What makes them the     │    │  ← TextArea
│  │ right contact?          │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │        Save             │    │  ← Primary button
│  └─────────────────────────┘    │
│                                 │
│  [Delete Contact - if editing]  │  ← Destructive action, subtle
│                                 │
└─────────────────────────────────┘
```

---

## Mock Data

Generate **realistic mock data** that feels like a real person's information:

```typescript
// data/mockData.ts

export const mockContacts = [
  {
    id: "1",
    name: "Margaret Chen",
    relationship: "Sister",
    phone: "(415) 555-0142",
    email: "margaret.chen@email.com",
    notes:
      "She has a copy of my house keys and knows where important documents are kept. Contact her first for anything related to the house.",
    isPrimary: true,
  },
  {
    id: "2",
    name: "David Park, Esq.",
    relationship: "Attorney",
    phone: "(415) 555-0198",
    email: "dpark@parklegalgroup.com",
    notes:
      "Handles my estate planning. Office is at 450 Sutter St, Suite 1200.",
  },
  {
    id: "3",
    name: "Rachel Thompson",
    relationship: "Financial Advisor",
    phone: "(650) 555-0167",
    email: "rthompson@wealthpartners.com",
    notes:
      "Has been managing my investments since 2018. Knows my full financial picture.",
  },
];

export const mockFinances = [
  {
    id: "1",
    accountName: "Primary Checking",
    institution: "Chase Bank",
    accountType: "Checking",
    accountNumberLast4: "4521",
    notes:
      "Main account for bills and daily expenses. Auto-pay is set up for utilities.",
  },
  {
    id: "2",
    accountName: "Emergency Savings",
    institution: "Ally Bank",
    accountType: "Savings",
    accountNumberLast4: "8834",
    notes: "Six months of expenses. Only touch for true emergencies.",
  },
  {
    id: "3",
    accountName: "Retirement 401(k)",
    institution: "Fidelity",
    accountType: "Retirement",
    accountNumberLast4: "2290",
    notes: "Through employer. Margaret is listed as beneficiary.",
  },
  {
    id: "4",
    accountName: "Brokerage Account",
    institution: "Vanguard",
    accountType: "Investment",
    accountNumberLast4: "6612",
    notes:
      "Index funds and some individual stocks. Login info in password manager.",
  },
  {
    id: "5",
    accountName: "Credit Card",
    institution: "American Express",
    accountType: "Credit",
    accountNumberLast4: "3001",
    notes: "Primary card for most purchases. Pay in full each month.",
  },
];

export const mockInsurance = [
  {
    id: "1",
    policyName: "Life Insurance",
    provider: "Northwestern Mutual",
    policyNumber: "LF-2847592",
    coverageAmount: "$500,000",
    beneficiary: "Margaret Chen",
    notes: "Term policy, expires 2035. Premium is auto-drafted monthly.",
  },
  {
    id: "2",
    policyName: "Health Insurance",
    provider: "Blue Cross Blue Shield",
    policyNumber: "BCB-449281",
    notes: "Through employer. Coverage details in benefits portal.",
  },
  {
    id: "3",
    policyName: "Homeowners Insurance",
    provider: "State Farm",
    policyNumber: "HO-8847123",
    notes: "Agent: Mike Reynolds, (415) 555-0134. Policy renews each March.",
  },
];

export const mockDocuments = [
  {
    id: "1",
    documentName: "Last Will and Testament",
    location: "Safe deposit box at Chase Bank, downtown branch",
    dateCreated: "2022-03-15",
    notes:
      "David Park has a copy. Margaret knows the safe deposit box location.",
  },
  {
    id: "2",
    documentName: "Revocable Living Trust",
    location: "Safe deposit box at Chase Bank",
    dateCreated: "2022-03-15",
    notes: "Created at same time as will. David Park is the trustee.",
  },
  {
    id: "3",
    documentName: "Healthcare Power of Attorney",
    location: "Filing cabinet, home office, top drawer",
    dateCreated: "2022-03-15",
    notes: "Margaret Chen is designated. Copy also with Dr. Williams.",
  },
  {
    id: "4",
    documentName: "Financial Power of Attorney",
    location: "Filing cabinet, home office, top drawer",
    dateCreated: "2022-03-15",
    notes: "Margaret Chen is designated.",
  },
];

export const mockHomeResponsibilities = [
  {
    id: "1",
    itemName: "Primary Residence",
    itemType: "Property",
    details: "742 Evergreen Terrace, San Francisco, CA",
    notes:
      "Mortgage with Wells Fargo, payment auto-drafted on the 1st. Spare key with neighbor at 744 (Susan Miller).",
  },
  {
    id: "2",
    itemName: "Honda CR-V (2021)",
    itemType: "Vehicle",
    details: "License plate: 8ABC123",
    notes:
      "Loan paid off. Title in filing cabinet. Regular maintenance at Honda of San Francisco.",
  },
  {
    id: "3",
    itemName: "Storage Unit",
    itemType: "Property",
    details: "CubeSmart, Unit #247, 1800 Market St",
    notes:
      "Contains old furniture, holiday decorations, photo albums. Payment auto-drafted.",
  },
  {
    id: "4",
    itemName: "Pet Care - Luna (cat)",
    itemType: "Responsibility",
    details: "Indoor cat, 6 years old",
    notes:
      "Vet: Bay Area Pet Hospital, Dr. Sarah Kim. Margaret has agreed to take her.",
  },
];

export const mockDigitalAccounts = [
  {
    id: "1",
    accountName: "Primary Email",
    platform: "Gmail",
    username: "firstname.lastname@gmail.com",
    accessNotes: "Password in 1Password. Recovery email is work address.",
    importance: "critical",
  },
  {
    id: "2",
    accountName: "Password Manager",
    platform: "1Password",
    username: "firstname.lastname@gmail.com",
    accessNotes:
      "Master password written down in home safe. Emergency kit shared with Margaret.",
    importance: "critical",
  },
  {
    id: "3",
    accountName: "Apple ID",
    platform: "Apple",
    username: "firstname.lastname@icloud.com",
    accessNotes:
      "Controls iPhone, MacBook, and iCloud photos. Set up Legacy Contact for Margaret.",
    importance: "high",
  },
  {
    id: "4",
    accountName: "Social Media",
    platform: "Facebook",
    username: "firstname.lastname",
    accessNotes:
      "Memorialization settings configured. Margaret designated as legacy contact.",
    importance: "low",
  },
];
```

---

## Data Types

```typescript
// data/types.ts

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface FinancialAccount {
  id: string;
  accountName: string;
  institution: string;
  accountType:
    | "Checking"
    | "Savings"
    | "Retirement"
    | "Investment"
    | "Credit"
    | "Loan"
    | "Other";
  accountNumberLast4?: string;
  notes?: string;
}

export interface InsurancePolicy {
  id: string;
  policyName: string;
  provider: string;
  policyNumber?: string;
  coverageAmount?: string;
  beneficiary?: string;
  notes?: string;
}

export interface LegalDocument {
  id: string;
  documentName: string;
  location: string;
  dateCreated?: string;
  notes?: string;
}

export interface HomeResponsibility {
  id: string;
  itemName: string;
  itemType: "Property" | "Vehicle" | "Responsibility" | "Other";
  details?: string;
  notes?: string;
}

export interface DigitalAccount {
  id: string;
  accountName: string;
  platform: string;
  username?: string;
  accessNotes?: string;
  importance: "critical" | "high" | "medium" | "low";
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
```

---

## State Management

Use a simple React Context for in-memory state:

```typescript
// data/store.ts
import { createContext, useContext, useState, ReactNode } from "react";
// ... import types and mock data

interface AppState {
  contacts: Contact[];
  finances: FinancialAccount[];
  insurance: InsurancePolicy[];
  documents: LegalDocument[];
  homeResponsibilities: HomeResponsibility[];
  digitalAccounts: DigitalAccount[];
}

interface AppContextType {
  state: AppState;
  addContact: (contact: Omit<Contact, "id">) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  // ... similar methods for other categories
}

// Initialize with mock data
// Provide CRUD operations for each category
```

---

## Animations & Interactions

Keep animations **subtle and calming**:

1. **Screen transitions:** Use Expo Router's default stack animations (slide from right)

2. **Card press feedback:**

   - Scale to 0.98 on press
   - Slight opacity reduction (0.9)
   - Duration: 100ms

3. **List items:** Consider subtle fade-in on mount (staggered, 50ms delay between items)

4. **Button press:**

   - Background color darkens slightly
   - Scale to 0.98
   - Duration: 100ms

5. **Form focus:**
   - Border color transitions smoothly to primary color
   - Duration: 200ms

**Avoid:**

- Bouncy or playful animations
- Rapid or jarring transitions
- Anything that feels urgent or gamified

---

## Accessibility

- All interactive elements must have minimum 44x44pt touch targets
- Use semantic text hierarchy (headings, body, labels)
- Ensure sufficient color contrast (4.5:1 for body text)
- Support Dynamic Type where possible
- Add meaningful accessibility labels

---

## Key Implementation Notes

1. **Keep it simple:** This is a demo. Don't over-engineer. Focus on polish over features.

2. **Prioritize feel over function:** The emotional experience matters more than complete functionality.

3. **Real data, fake persistence:** Use realistic mock data but don't worry about saving between sessions.

4. **Consistent spacing:** Use the spacing scale religiously. Generous whitespace is key to the calm feel.

5. **Typography hierarchy:** Use the serif font (Georgia) for main headings to add warmth. Sans-serif for everything else.

6. **Test on device:** The iPhone simulator is fine, but test on a real device if possible. Touch feedback matters.

---

## Definition of Done

The demo is complete when:

- [ ] Dashboard displays all 6 category cards with accurate counts
- [ ] Each category has a list view with mock items
- [ ] Each category has add/edit functionality (in-memory)
- [ ] Delete functionality works
- [ ] Empty states are implemented
- [ ] Navigation feels smooth and intuitive
- [ ] Design matches the calm, human aesthetic
- [ ] No TypeScript errors
- [ ] Works on iOS simulator

---

## Commands to Start

```bash
# Create new Expo project with TypeScript
npx create-expo-app@latest legacy-made-demo --template blank-typescript

# Navigate to project
cd legacy-made-demo

# Install Expo Router
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Update package.json main entry
# "main": "expo-router/entry"

# Start development
npx expo start
```

---

## Reference Documents

Refer to these principles throughout development:

**Core Value Proposition:**

> Legacy Made provides a clear, guided place to organize the information your loved ones would otherwise have to piece together — while giving you space to add context, intention, and meaning along the way.

**Tone (Non-Negotiable):**

- Calm
- Human
- Respectful
- Clear
- Unhurried

**What to Avoid:**

- Fear-based urgency
- "Do it now" framing
- Overwhelming feature lists
- Clinical or legal language

**Success Criteria:**

- People saying "This makes it easier"
- People understanding the value without explanation
