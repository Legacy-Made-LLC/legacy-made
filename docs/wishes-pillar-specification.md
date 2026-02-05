# Wishes & Guidance Pillar — Specification Document

Extracted from prototype code (`LM_App_v8_refined.html`) for implementation in the Expo app.

---

## Table of Contents

1. [Overview](#overview)
2. [Information Architecture](#information-architecture)
3. [Shared Components](#shared-components)
4. [Editor Components](#editor-components)
5. [Data Types](#data-types)
6. [UI Text & Copy](#ui-text--copy)
7. [Styling Notes](#styling-notes)

---

## Overview

The Wishes & Guidance pillar helps users document their end-of-life preferences, care wishes, and guidance for their loved ones. It's organized into **3 main sections** containing **11 subsections** total.

### Design Philosophy

- **Calm, reflective experience** — not clinical or urgent
- **Values-based approach** — selections feel like personal reflection, not checkbox tasks
- **Collapsible guidance** — help is available but not intrusive
- **Pacing reminders** — "no rush" messaging throughout
- **Completion tracking** — each subsection tracks whether it's been addressed

---

## Information Architecture

### Section Hierarchy

```
Wishes & Guidance
├── Care Preferences (4 subsections)
│   ├── What Matters Most
│   ├── Quality of Life
│   ├── Comfort vs Treatment
│   └── Advance Directive
│
├── End-of-Life & After-Death (4 subsections)
│   ├── End-of-Life Setting
│   ├── After-Death Preferences
│   ├── Service or Remembrance
│   └── Organ Donation
│
└── Personal Values & Guidance (3 subsections)
    ├── What Loved Ones Should Know
    ├── Faith & Spiritual Preferences
    └── Hard Situations
```

### Navigation Flow

1. **Wishes Dashboard** → Shows 3 section cards
2. **Section View** → Shows subsection list for selected section
3. **Editor View** → Individual subsection editor

---

## Shared Components

These components are used across all Wishes sections (and potentially other pillars).

### 1. SectionGuide

**Purpose:** Collapsible guidance card that provides context and help without being intrusive.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | '💡' | Emoji icon for the trigger and header |
| `headline` | string | required | The key insight/question |
| `detail` | string | null | Additional context paragraph |
| `tips` | string[] | [] | Expandable tips (shown on "What else should I know?") |
| `quickStarts` | string[] | [] | Quick-start suggestion chips |
| `onQuickStart` | function | null | Callback when quick start is clicked |
| `triggerText` | string | "Need help getting started?" | Collapsed state trigger text |
| `pacingNote` | string | "There's no rush — come back anytime." | Bottom pacing message |

**States:**
- **Collapsed:** Shows single-line trigger button
- **Expanded:** Shows full guidance with optional expandable tips

**Behavior:**
- Collapsed by default
- Click trigger to expand
- "What else should I know?" expands tips section
- "Show less" collapses tips
- "×" button collapses entire guide

---

### 2. ReflectionChoices

**Purpose:** Values-based selection UI with tap-to-select cards.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `choices` | Choice[] | [] | Array of choice objects |
| `selected` | string[] | [] | Array of selected choice IDs |
| `onToggle` | function | required | Called with choice ID on tap |
| `columns` | 1 \| 2 | 1 | Layout columns |
| `allowCustom` | boolean | false | Show custom input field |
| `customValue` | string | '' | Current custom input value |
| `onCustomChange` | function | null | Custom input change handler |
| `customPlaceholder` | string | 'Add your own...' | Custom input placeholder |

**Choice Object:**
```typescript
interface Choice {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}
```

**Visual States:**
- **Unselected:** Dashed circle indicator + "Tap if this resonates"
- **Selected:** Filled checkmark + "This matters to me"

---

### 3. EmptyState

**Purpose:** Shown when a list has no items yet.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | '📝' | Emoji icon |
| `message` | string | required | Encouragement message |
| `actionLabel` | string | 'Get started' | Button text |
| `onAction` | function | required | Button callback |

---

### 4. PacingReminder

**Purpose:** Gentle "no rush" messaging.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | "There's no rush — save your progress and come back anytime." | The message |
| `variant` | 'subtle' \| 'card' | 'subtle' | Visual style |

**Variants:**
- **subtle:** Italic text, simple styling
- **card:** Green-tinted card with 🌿 leaf icon

---

## Editor Components

Each editor receives: `{ data, onSave, onBack }`
- `data` — existing saved data (or null/undefined)
- `onSave` — `(formData) => void`, persists data with `completed` boolean
- `onBack` — `() => void`, navigates back

---

### Section A: Care Preferences

#### A1. WhatMattersMostEditor

**Purpose:** Capture what matters most to the user when it comes to medical care.

**Guide Content:**
- **Icon:** 💜
- **Headline:** "When it comes to medical care, what matters most to you?"
- **Detail:** "There's no right answer here. This is about helping your family understand what a meaningful life looks like to you."
- **Trigger Text:** "Take your time with this"
- **Pacing Note:** "These are big questions. It's okay to come back later."
- **Tips:**
  1. "Think about what makes a day feel worth living — connection? Comfort? Being present?"
  2. "Some people prioritize length of life, others prioritize quality. Both are valid."
  3. "If you're unsure, imagine your family asking: 'What would they want?' What would you hope they'd say?"

**Reflection Prompt:**
- **Question:** "Select anything that resonates with you:"
- **Context:** "You can choose as many or as few as feel right."

**Value Choices:**
| ID | Label | Icon | Description |
|----|-------|------|-------------|
| comfort | Being comfortable and free of pain | 🌿 | Physical comfort is a top priority for me |
| alert | Being awake and aware | 💡 | I want to be present, even if it means some discomfort |
| independent | Living independently | 🏡 | If I can't care for myself, that changes things |
| connected | Being with people I love | 💜 | Connection with family and friends matters most |
| dignity | Maintaining my dignity | 🌟 | How I'm seen and treated matters deeply to me |
| fighting | Fighting for every moment | 💪 | I want every possible treatment, no matter what |
| peaceful | A peaceful, natural end | 🕊️ | When it's time, I want to go gently |
| noburden | Not being a burden | 🤝 | I don't want my care to overwhelm my family |

**Additional Fields:**
- Custom value input: "Something else that matters to you..."
- Notes textarea: "Anything else you'd want your family to understand?" / "In your own words, what does a meaningful life look like to you?"

**Data Shape:**
```typescript
{
  values: string[];      // Selected value IDs
  customValue: string;   // Custom input
  notes: string;         // Free-form notes
  completed: boolean;    // True if values.length > 0 OR notes has content
}
```

---

#### A2. QualityOfLifeEditor

**Purpose:** Identify conditions where user would not want aggressive treatment.

**Guide Content:**
- **Icon:** 🌿
- **Headline:** "Are there circumstances where you'd want to let nature take its course?"
- **Detail:** "This isn't about giving up — it's about giving your family clarity during an impossible time."
- **Tips:**
  1. "Without your guidance, families often feel guilty no matter what they decide. Your words can lift that weight."
  2. "You're not making a medical decision right now. You're sharing values that can help guide decisions later."
  3. "It's okay to be uncertain. Even partial guidance helps more than silence."

**Reflection Prompt:**
- **Question:** "I would not want aggressive treatment if I were..."
- **Context:** "Select any that feel true for you. Leave blank if you're not sure."

**Condition Choices:**
| ID | Label | Icon | Description |
|----|-------|------|-------------|
| terminal | Diagnosed with a terminal illness | 📋 | When recovery is no longer possible |
| coma | In a persistent coma or vegetative state | 💤 | No awareness of surroundings with little chance of recovery |
| noRecognize | Unable to recognize loved ones | 💔 | When connections that matter most are lost |
| noCommunicate | Unable to communicate | 🔇 | When I can't express what I'm feeling or thinking |
| fullCare | Requiring full-time care for basic needs | 🛏️ | When I can no longer feed, bathe, or care for myself |
| repeatedHospital | In and out of the hospital constantly | 🏥 | When treatment feels like it's prolonging suffering, not life |
| noImprove | With no realistic chance of improvement | 📉 | When medical consensus is that things won't get better |

**Additional Fields:**
- Notes textarea: "Anything to add or clarify?" / "Any nuances, exceptions, or additional context..."

**Data Shape:**
```typescript
{
  conditions: string[];  // Selected condition IDs
  notes: string;
  completed: boolean;    // True if conditions.length > 0 OR notes has content
}
```

---

#### A3. ComfortVsTreatmentEditor

**Purpose:** Document preferences for balancing comfort and treatment.

**Guide Content:**
- **Icon:** ⚖️
- **Headline:** "How should comfort and treatment be balanced?"
- **Detail:** "There's no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What matters is that your family knows what you'd want."
- **Tips:**
  1. "Think about what matters more to you: more time or better quality time?"
  2. "Pain medication can make you drowsy — how much does staying alert matter?"
  3. "It's okay to say 'I trust my care team to decide.' That's a valid preference."

**Form Fields:**

**Overall Preference (dropdown):**
- Prioritize comfort, even if it shortens life
- Balance between comfort and treatment
- Prioritize treatment, even if uncomfortable
- I trust my care team to decide

**Pain Management Approach (dropdown):**
- Full pain relief, even if it causes drowsiness
- Balanced — manage pain but keep me somewhat alert
- Minimal medication — I want to stay as alert as possible

**How Important is Staying Alert? (dropdown):**
- Very important — I want to be conscious and aware
- Somewhat — if possible, but comfort comes first
- Not important — comfort is all that matters

**Additional Notes (textarea):**
- "Any other preferences about your care..."

**Data Shape:**
```typescript
{
  preference: string;      // 'comfort-first' | 'balanced' | 'treatment-first' | 'trust-team'
  painManagement: string;  // 'full-relief' | 'balanced-relief' | 'minimal-meds'
  alertness: string;       // 'very' | 'somewhat' | 'not'
  notes: string;
  completed: boolean;      // True if preference OR painManagement has value
}
```

---

#### A4. AdvanceDirectiveEditor

**Purpose:** Track existing directive documents and healthcare proxy.

**Guide Content:**
- **Icon:** 📋
- **Headline:** "Legal documents give your family the authority to act."
- **Detail:** "An advance directive or healthcare proxy ensures your wishes are followed — and that someone you trust can make decisions if you can't."
- **Tips:**
  1. "A healthcare proxy names someone to make medical decisions for you."
  2. "A living will states what treatments you do or don't want."
  3. "Even if you don't have documents yet, naming your preferred decision-maker helps."

**Form Fields:**

**Do you have advance directive documents? (dropdown):**
- Yes, I have documents
- Working on it
- Not yet

**Document Types (checkboxes, shown if "yes"):**
- Living Will
- Healthcare Power of Attorney
- POLST/MOLST
- DNR Order
- Five Wishes
- Other

**Where are these stored? (text input, shown if "yes"):**
- "e.g., Filing cabinet, attorney's office, safe"

**Section Header:** "Who should make healthcare decisions for you?"

**Healthcare Proxy Fields:**
- Name (text): "Full name"
- Phone (text): "Best number"
- Relationship (text): "e.g., Spouse, Daughter"

**Additional Notes (textarea):**
- "Anything else about your directive documents..."

**Data Shape:**
```typescript
{
  hasDirective: string;        // 'yes' | 'in-progress' | 'no'
  documentTypes: string[];     // Array of selected doc types
  location: string;            // Where documents are stored
  proxyName: string;
  proxyPhone: string;
  proxyRelationship: string;
  notes: string;
  completed: boolean;          // True if hasDirective OR proxyName has value
}
```

---

### Section B: End-of-Life & After-Death

#### B1. EndOfLifeSettingEditor

**Purpose:** Document where user would prefer to receive end-of-life care.

**Guide Content:**
- **Icon:** 🏡
- **Headline:** "Where would you want to be, if you could choose?"
- **Detail:** "Home, hospice, hospital — each has trade-offs. Knowing your preference helps your family honor your wishes when decisions need to be made quickly."
- **Tips:**
  1. "Home care is possible for many situations, but requires family support."
  2. "Hospice facilities specialize in comfort care and often allow more visitors."
  3. "It's okay to say 'wherever makes sense at the time' — flexibility is valid."

**Form Fields:**

**Preferred Setting (dropdown):**
- At home
- At a family member's home
- Hospice facility
- Hospital
- Wherever makes sense at the time

**Notes About Your Preference (textarea):**
- "Why this matters to you, or any conditions..."

**Who Would You Want Around You? (textarea):**
- "Specific people, or general guidance..."

**Music, Readings, or Atmosphere? (textarea):**
- "Anything that would bring you comfort..."

**Other Wishes (textarea)**

**Data Shape:**
```typescript
{
  preferredSetting: string;  // 'home' | 'family-home' | 'hospice' | 'hospital' | 'flexible'
  settingNotes: string;
  visitors: string;
  music: string;
  notes: string;
  completed: boolean;        // True if preferredSetting OR notes has value
}
```

---

#### B2. AfterDeathPreferencesEditor

**Purpose:** Document burial, cremation, or other body disposition preferences.

**Guide Content:**
- **Icon:** 🕊️
- **Headline:** "Saying this clearly is a gift to your family."
- **Detail:** "Burial, cremation, green burial — whatever you choose, stating it removes a heavy decision during an already difficult time."
- **Tips:**
  1. "If you have strong preferences, stating them clearly removes guilt from the decision."
  2. "If you're flexible, saying so is equally valuable. 'Whatever brings comfort' is valid."
  3. "Pre-arrangements can save your family money and stress, but aren't required."

**Form Fields:**

**What Are Your Wishes for Your Body? (dropdown):**
- Traditional burial
- Cremation
- Green/natural burial
- Donate to science
- Whatever brings my family comfort
- Other

**Any Specific Wishes? (textarea, shown if not "flexible"):**
- "e.g., Ashes scattered at..., Buried next to..."

**Have You Made Pre-arrangements? (dropdown):**
- Yes, arrangements are made
- Partially — some things are set up
- No pre-arrangements

**Details (textarea, shown if "yes" or "partial"):**
- "Funeral home name, plot location, what's been paid for..."

**Additional Notes (textarea)**

**Data Shape:**
```typescript
{
  disposition: string;         // 'burial' | 'cremation' | 'green-burial' | 'donation' | 'flexible' | 'other'
  specificWishes: string;
  prearranged: string;         // 'yes' | 'partial' | 'no'
  prearrangedDetails: string;
  notes: string;
  completed: boolean;          // True if disposition OR notes has value
}
```

---

#### B3. ServicePreferencesEditor

**Purpose:** Document memorial/funeral service wishes.

**Guide Content:**
- **Icon:** 🕯️
- **Headline:** "How would you want to be remembered?"
- **Detail:** "A quiet gathering, a big celebration, or nothing at all — your family will feel more at peace knowing what you'd want."
- **Tips:**
  1. "Think about gatherings you've attended — what felt right, and what didn't?"
  2. "Some people want celebration; others prefer quiet. Both are meaningful."
  3. "If there's a song or reading that matters to you, mention it — your family may not know."
  4. "Even 'keep it simple' or 'make it a party' gives helpful direction."

**Form Fields:**

**Type of Gathering (dropdown):**
- Traditional funeral service
- Celebration of life
- Memorial service (no body present)
- Graveside service only
- Private family gathering
- No formal service
- Whatever feels right to my family

**Tone or Atmosphere (dropdown):**
- Quiet and reflective
- Warm and personal
- Upbeat celebration
- Religious/spiritual ceremony
- A mix — some reflection, some joy

**Preferred Location (text):**
- "Church, funeral home, outdoor, a favorite place..."

**Music or Songs (textarea):**
- "Specific songs, genres, or 'no music'..."

**Readings or Poems (textarea):**
- "Scripture, poems, favorite passages..."

**Who Should Speak? (textarea):**
- "Specific people, or 'anyone who wants to'..."

**Flowers or Donations (textarea):**
- "Preferences for flowers, or 'in lieu of flowers, donate to...'"

**In Lieu of Flowers, Donate to... (textarea):**
- "Charities, causes, organizations..."

**Other Wishes (textarea):**
- "Anything else about how you'd like to be remembered..."

**Data Shape:**
```typescript
{
  serviceType: string;   // 'traditional-funeral' | 'celebration-of-life' | 'memorial' | 'graveside' | 'private' | 'none' | 'flexible'
  tone: string;          // 'solemn' | 'warm' | 'celebratory' | 'religious' | 'mixed'
  location: string;
  music: string;
  readings: string;
  speakers: string;
  flowers: string;
  donations: string;
  otherWishes: string;
  completed: boolean;    // True if serviceType OR otherWishes has value
}
```

---

#### B4. OrganDonationEditor

**Purpose:** Document organ donation preferences.

**Guide Content:**
- **Icon:** ❤️
- **Headline:** "One decision could save several lives."
- **Detail:** "Organ donation happens quickly after death, so your family needs to know your wishes in advance. Stating them clearly removes doubt during an already difficult time."
- **Tips:**
  1. "You can choose to donate everything, specific organs only, or nothing at all."
  2. "Being on the registry helps, but your family still needs to know your wishes."
  3. "Religious and cultural considerations are respected — share any concerns here."

**Form Fields:**

**Your Decision (dropdown):**
- Yes, donate anything that can help others
- Yes, but only specific organs/tissues
- For research purposes only
- No, I do not wish to donate
- Undecided — let my family decide

**Which Organs/Tissues? (textarea, shown if "yes-specific"):**
- "e.g., Heart, kidneys, corneas..."

**Are You on a Donor Registry? (dropdown):**
- Yes
- No
- Not sure

**Additional Notes (textarea):**
- "Any other wishes or concerns..."

**Data Shape:**
```typescript
{
  decision: string;        // 'yes-all' | 'yes-specific' | 'research-only' | 'no' | 'undecided'
  specificOrgans: string;
  onRegistry: string;      // 'yes' | 'no' | 'unsure'
  registryState: string;   // (not used in UI but in data shape)
  notes: string;
  completed: boolean;      // True if decision has value
}
```

---

### Section C: Personal Values & Guidance

#### C1. LovedOnesKnowEditor

**Purpose:** Free-form space for gratitude, regrets, wisdom, and memories.

**Guide Content:**
- **Icon:** 💬
- **Headline:** "What would you say if you couldn't say it later?"
- **Detail:** "These words are a gift — to you for saying them, and to your family for receiving them."
- **Tips:**
  1. "Think about what you'd want someone to say to you if they couldn't say it later."
  2. "Gratitude is powerful. Naming specific moments means more than general praise."
  3. "If there are apologies or regrets, this is a chance to release them."
  4. "You don't have to fill everything. Even one honest paragraph is valuable."

**Form Fields:**

**What Are You Most Grateful For? (textarea):**
- "People, experiences, moments..."

**Any Regrets or Apologies? (textarea):**
- "Things you wish you'd done differently..."

**Wisdom You'd Like to Share (textarea):**
- "Life lessons, advice for the future..."

**Favorite Memories to Remember (textarea):**
- "Moments that mattered most..."

**Data Shape:**
```typescript
{
  gratitude: string;
  regrets: string;
  wisdom: string;
  memories: string;
  notes: string;
  completed: boolean;   // True if any field has content
}
```

---

#### C2. FaithPreferencesEditor

**Purpose:** Document faith, spiritual, or secular preferences.

**Guide Content:**
- **Icon:** 🙏
- **Headline:** "What traditions or beliefs should be honored?"
- **Detail:** "Whether deeply religious, casually spiritual, or secular — your family will want to respect what matters to you."
- **Tips:**
  1. "Include any rituals, prayers, or customs that should be observed."
  2. "If you have a religious leader or congregation, note their contact info."
  3. "Even 'no religious service' is helpful guidance."

**Form Fields:**

**Faith or Spiritual Tradition (dropdown):**
- Christian
- Catholic
- Jewish
- Muslim
- Buddhist
- Hindu
- Spiritual but not religious
- No religious affiliation
- Other

**Place of Worship or Congregation (text):**
- "Name of church, temple, mosque, etc."

**Religious Leader or Clergy (text):**
- "Name"

**Their Contact Info (text):**
- "Phone or email"

**Important Rituals or Customs (textarea):**
- "Specific prayers, customs, or traditions to observe..."

**Additional Notes (textarea):**
- "Anything else about your beliefs or preferences..."

**Data Shape:**
```typescript
{
  tradition: string;      // 'christian' | 'catholic' | 'jewish' | 'muslim' | 'buddhist' | 'hindu' | 'spiritual' | 'none' | 'other'
  congregation: string;
  leader: string;
  leaderContact: string;
  rituals: string;
  notes: string;
  completed: boolean;     // True if tradition OR rituals OR notes has value
}
```

---

#### C3. HardSituationsEditor

**Purpose:** Guidance for family conflict, decision-making, forgiveness.

**Guide Content:**
- **Icon:** 🤝
- **Headline:** "Your words can prevent conflict during an already difficult time."
- **Detail:** "Grief makes people reactive. If you name who should decide, how to handle disagreements, and what matters most — you give your family a way forward."
- **Tips:**
  1. "Name a primary decision-maker and explain why you trust them."
  2. "Acknowledge that people might disagree — and give guidance for how to resolve it."
  3. "What matters more than getting things 'right'? Family harmony? Honoring your memory?"

**Form Fields:**

**If Family Members Disagree About My Care or Wishes... (textarea):**
- "How should they resolve it? Who should have final say?"

**Who Should Be the Primary Decision-Maker? (textarea):**
- "Name and why you trust them with this role..."

**If People Are Struggling with Grief... (textarea):**
- "What would you want them to know or do?"

**Any Grace or Forgiveness to Extend? (textarea):**
- "Old hurts to let go of, relationships to mend..."

**What Matters More Than Getting Things "Right"? (textarea):**
- "Family harmony, honoring your memory, moving forward..."

**Data Shape:**
```typescript
{
  disagreements: string;
  decisionMaker: string;
  conflictGuidance: string;
  grace: string;
  priorities: string;
  completed: boolean;    // True if any field has value
}
```

---

## Data Types

### Section Data Structure

```typescript
interface WishesSection {
  id: string;
  title: string;
  description: string;
  icon: string;  // Can be mapped to Lucide icons in RN
  subsections: WishesSubsection[];
}

interface WishesSubsection {
  id: string;
  title: string;
  description: string;
  prompt: string;  // The question shown in list view
}
```

### Section Configuration

```typescript
const wishesSections: WishesSection[] = [
  {
    id: 'carePrefs',
    title: 'Care Preferences',
    description: 'What matters when health decisions are being made',
    icon: 'heart',
    subsections: [
      { id: 'whatMatters', title: 'What Matters Most', description: 'Your priorities for care', prompt: 'When it comes to medical care, what matters most to you?' },
      { id: 'qualityOfLife', title: 'Quality of Life', description: 'When to shift focus', prompt: 'Are there conditions where you would not want aggressive treatment?' },
      { id: 'comfortVsTreatment', title: 'Comfort vs Treatment', description: 'Pain, alertness, dignity', prompt: 'How should comfort, pain management, and alertness be balanced?' },
      { id: 'advanceDirective', title: 'Advance Directive', description: 'Formal documents on file', prompt: 'Do you have an advance directive? Where is it stored?' }
    ]
  },
  {
    id: 'endOfLife',
    title: 'End-of-Life & After-Death',
    description: 'What should happen when life is ending or has ended',
    icon: 'heart',
    subsections: [
      { id: 'setting', title: 'End-of-Life Setting', description: 'Home, hospital, hospice', prompt: 'If possible, where would you prefer to be cared for?' },
      { id: 'afterDeath', title: 'After-Death Preferences', description: 'Burial, cremation, other', prompt: 'Burial, cremation, or other preferences?' },
      { id: 'service', title: 'Service or Remembrance', description: 'Ceremony and memorial wishes', prompt: 'Any wishes for a service, gathering, or memorial?' },
      { id: 'organDonation', title: 'Organ Donation', description: 'Your wishes on donation', prompt: 'Do you wish to donate organs or tissue?' }
    ]
  },
  {
    id: 'values',
    title: 'Personal Values & Guidance',
    description: 'Emotional and relational guidance for your family',
    icon: 'heart',
    subsections: [
      { id: 'lovedOnesKnow', title: 'What Loved Ones Should Know', description: 'Final words and reminders', prompt: 'Is there anything you want your loved ones to remember?' },
      { id: 'faith', title: 'Faith & Spiritual Preferences', description: 'Beliefs and traditions', prompt: 'Any spiritual, cultural, or personal beliefs to honor?' },
      { id: 'hardSituations', title: 'Hard Situations', description: 'Guidance for conflict', prompt: 'If people disagree or struggle, what guidance would you give?' }
    ]
  }
];
```

### Routing Map

Maps `sectionId.subsectionId` to editor component:

```typescript
const wishesRouting = {
  // Care Preferences
  'carePrefs.whatMatters': WhatMattersMostEditor,
  'carePrefs.qualityOfLife': QualityOfLifeEditor,
  'carePrefs.comfortVsTreatment': ComfortVsTreatmentEditor,
  'carePrefs.advanceDirective': AdvanceDirectiveEditor,

  // End-of-Life & After-Death
  'endOfLife.setting': EndOfLifeSettingEditor,
  'endOfLife.afterDeath': AfterDeathPreferencesEditor,
  'endOfLife.service': ServicePreferencesEditor,
  'endOfLife.organDonation': OrganDonationEditor,

  // Personal Values & Guidance
  'values.lovedOnesKnow': LovedOnesKnowEditor,
  'values.faith': FaithPreferencesEditor,
  'values.hardSituations': HardSituationsEditor,
};
```

---

## UI Text & Copy

### Consistent Phrasing

**Trigger Text Options:**
- "Need help getting started?" (default)
- "Take your time with this" (for heavier topics like What Matters Most)

**Pacing Notes:**
- "There's no rush — come back anytime." (default)
- "These are big questions. It's okay to come back later."
- "There's no rush — save your progress and come back anytime."

**Selection Indicators:**
- Selected: "This matters to me"
- Unselected: "Tap if this resonates"

**Tips Expansion:**
- Expand: "What else should I know?"
- Collapse: "Show less"

**Custom Input Labels:**
- "Something else on your mind?"
- "Something else that matters to you..."

---

## Styling Notes

### Key Visual Elements

**Section Guide (Collapsed):**
- Full-width button with icon, text, and arrow
- Color: Sage green (#7d8a79)
- Arrow animates right on hover

**Section Guide (Expanded):**
- Gradient background: sage green to soft blue tint
- Border radius: 12px
- Centered content

**Reflection Cards:**
- White background with subtle shadow
- Border: 1.5px solid #e8e3dc
- Border radius: 12px
- Selected state: sage green border, light green tint

**Indicator Icons:**
- Selected: Filled sage circle with white checkmark
- Unselected: Dashed circle outline

### Color Values from Prototype

```css
/* Primary Accent */
--sage-green: #7d8a79;
--sage-dark: #6d7a69;
--sage-light: rgba(125, 138, 121, 0.04);

/* Text */
--text-primary: #2a2520;
--text-secondary: #4a4440;
--text-tertiary: #6b635a;
--text-muted: #a39a8f;
--text-placeholder: #c4bdb5;

/* Borders */
--border-light: #e8e3dc;
--border-input: #e0dbd4;
--border-divider: #f0ebe5;

/* Backgrounds */
--bg-surface: #fff;
--bg-input: #fdfcfb;
```

### Typography from Prototype

- Headings: `'Libre Baskerville', serif`
- Body: System font
- Guide headline: 0.9rem, 600 weight
- Guide detail: 0.8rem
- Card label: 0.85rem, 500 weight
- Card description: 0.75rem, italic

---

## Implementation Plan

This section outlines the implementation strategy, following the same patterns as the Information Vault pillar.

---

### Architecture Overview

The Wishes pillar will follow the **exact same architecture** as the Information Vault:

```
┌─────────────────────────────────────────────────────────────────┐
│                        WISHES PILLAR                            │
├─────────────────────────────────────────────────────────────────┤
│  Tab Screen         → Dashboard with 3 section cards            │
│  Section Screen     → Subsection list (or redirect if single)   │
│  Task Screen        → Entry list with guidance                  │
│  Form Screen        → Entry create/edit form                    │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer         → Stubbed API (wishes.ts), same Entry model │
│  Component Registry → WishesList/WishesForm components          │
│  Constants          → wishes.ts (sections/tasks structure)      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Color System

**Primary Color:** Soft Lavender `#B8A9C9` (already defined in theme.ts)
**Background Tint:** `#F2EDF6` (already defined as `featureWishesTint`)

Components that use `colors.primary` or `colors.featureInformation` will need Wishes-specific variants:

```typescript
// In components, use feature color based on pillar
const accentColor = colors.featureWishes; // #B8A9C9
const tintColor = colors.featureWishesTint; // #F2EDF6
```

---

### File Structure

```
app/
├── (app)/
│   ├── (tabs)/
│   │   └── wishes.tsx                    # UPDATE: Dashboard (currently "Coming Soon")
│   └── wishes/
│       ├── [sectionId]/
│       │   ├── index.tsx                 # NEW: Section view (task list or redirect)
│       │   └── [taskId]/
│       │       ├── index.tsx             # NEW: Task list screen
│       │       └── [entryId].tsx         # NEW: Entry form screen

api/
├── wishes.ts                             # NEW: Stubbed wishes API service
├── types.ts                              # UPDATE: Add WishMetadata types

constants/
├── wishes.ts                             # NEW: Wishes sections/tasks structure

components/
├── wishes/
│   ├── registry.ts                       # NEW: Component registry for wishes
│   ├── lists/
│   │   ├── listStyles.ts                 # NEW: Shared list styles (lavender)
│   │   ├── CarePreferencesList.tsx       # NEW: For care preferences entries
│   │   ├── EndOfLifeList.tsx             # NEW: For end-of-life entries
│   │   └── ValuesGuidanceList.tsx        # NEW: For values entries
│   ├── forms/
│   │   ├── WhatMattersMostForm.tsx       # NEW
│   │   ├── QualityOfLifeForm.tsx         # NEW
│   │   ├── ComfortVsTreatmentForm.tsx    # NEW
│   │   ├── AdvanceDirectiveForm.tsx      # NEW
│   │   ├── EndOfLifeSettingForm.tsx      # NEW
│   │   ├── AfterDeathPreferencesForm.tsx # NEW
│   │   ├── ServicePreferencesForm.tsx    # NEW
│   │   ├── OrganDonationForm.tsx         # NEW
│   │   ├── LovedOnesKnowForm.tsx         # NEW
│   │   ├── FaithPreferencesForm.tsx      # NEW
│   │   └── HardSituationsForm.tsx        # NEW
│   └── shared/
│       └── ReflectionChoices.tsx         # NEW: Values-based selection component

hooks/
├── queries/
│   └── useWishesQueries.ts               # NEW: TanStack Query hooks for wishes
```

---

### Phase 1: Foundation

#### 1.1 Create Stubbed API (`api/wishes.ts`)

```typescript
/**
 * Wishes API Service - Stubbed for now
 *
 * Follows same pattern as entries.ts but uses /wishes endpoint
 * Will connect to backend when API is ready
 */

import type { ApiClient } from "./client";
import type {
  CreateWishRequest,
  DeleteResponse,
  WishesListResponse,
  Wish,
  UpdateWishRequest,
} from "./types";

const wishesPath = (planId: string) => `/plans/${planId}/wishes`;

export function createWishesService(client: ApiClient) {
  return {
    list: async <T = Record<string, unknown>>(
      planId: string,
      taskKey?: string
    ): Promise<Wish<T>[]> => {
      // STUB: Return empty array until API is ready
      console.log('[STUB] wishes.list called', { planId, taskKey });
      return [];
    },

    listByTaskKey: async <T = Record<string, unknown>>(
      planId: string,
      taskKey: string
    ): Promise<Wish<T>[]> => {
      // STUB: Return empty array until API is ready
      console.log('[STUB] wishes.listByTaskKey called', { planId, taskKey });
      return [];
    },

    get: async <T = Record<string, unknown>>(
      planId: string,
      id: string
    ): Promise<Wish<T>> => {
      // STUB: Throw not found until API is ready
      throw new Error('Wish not found (API not implemented)');
    },

    create: async <T = Record<string, unknown>>(
      data: CreateWishRequest<T>
    ): Promise<Wish<T>> => {
      // STUB: Return mock data with generated ID
      console.log('[STUB] wishes.create called', data);
      return {
        id: `stub-${Date.now()}`,
        planId: data.planId,
        taskKey: data.taskKey,
        title: data.title,
        notes: data.notes,
        metadata: data.metadata as T,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Wish<T>;
    },

    update: async <T = Record<string, unknown>>(
      planId: string,
      id: string,
      data: UpdateWishRequest<T>
    ): Promise<Wish<T>> => {
      // STUB: Return updated mock data
      console.log('[STUB] wishes.update called', { planId, id, data });
      return {
        id,
        planId,
        taskKey: '',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Wish<T>;
    },

    delete: async (planId: string, id: string): Promise<DeleteResponse> => {
      // STUB: Return success
      console.log('[STUB] wishes.delete called', { planId, id });
      return { success: true };
    },
  };
}

export type WishesService = ReturnType<typeof createWishesService>;
```

#### 1.2 Add Types (`api/types.ts`)

```typescript
// ============================================================================
// Wishes Metadata Types
// ============================================================================

/** What Matters Most - Care Preferences */
export interface WhatMattersMostMetadata {
  values: string[];        // Selected value IDs
  customValue?: string;    // Custom input
}

/** Quality of Life - Care Preferences */
export interface QualityOfLifeMetadata {
  conditions: string[];    // Selected condition IDs
}

/** Comfort vs Treatment - Care Preferences */
export interface ComfortVsTreatmentMetadata {
  preference?: string;     // 'comfort-first' | 'balanced' | 'treatment-first' | 'trust-team'
  painManagement?: string; // 'full-relief' | 'balanced-relief' | 'minimal-meds'
  alertness?: string;      // 'very' | 'somewhat' | 'not'
}

/** Advance Directive - Care Preferences */
export interface AdvanceDirectiveMetadata {
  hasDirective?: string;         // 'yes' | 'in-progress' | 'no'
  documentTypes?: string[];      // Document types
  location?: string;
  proxyName?: string;
  proxyPhone?: string;
  proxyRelationship?: string;
}

/** End-of-Life Setting */
export interface EndOfLifeSettingMetadata {
  preferredSetting?: string;     // 'home' | 'family-home' | 'hospice' | 'hospital' | 'flexible'
  settingNotes?: string;
  visitors?: string;
  music?: string;
}

/** After-Death Preferences */
export interface AfterDeathMetadata {
  disposition?: string;          // 'burial' | 'cremation' | 'green-burial' | 'donation' | 'flexible' | 'other'
  specificWishes?: string;
  prearranged?: string;          // 'yes' | 'partial' | 'no'
  prearrangedDetails?: string;
}

/** Service Preferences */
export interface ServicePreferencesMetadata {
  serviceType?: string;          // 'traditional-funeral' | 'celebration-of-life' | etc.
  tone?: string;                 // 'solemn' | 'warm' | 'celebratory' | 'religious' | 'mixed'
  location?: string;
  music?: string;
  readings?: string;
  speakers?: string;
  flowers?: string;
  donations?: string;
}

/** Organ Donation */
export interface OrganDonationMetadata {
  decision?: string;             // 'yes-all' | 'yes-specific' | 'research-only' | 'no' | 'undecided'
  specificOrgans?: string;
  onRegistry?: string;           // 'yes' | 'no' | 'unsure'
}

/** What Loved Ones Should Know */
export interface LovedOnesKnowMetadata {
  gratitude?: string;
  regrets?: string;
  wisdom?: string;
  memories?: string;
}

/** Faith Preferences */
export interface FaithPreferencesMetadata {
  tradition?: string;            // 'christian' | 'catholic' | 'jewish' | etc.
  congregation?: string;
  leader?: string;
  leaderContact?: string;
  rituals?: string;
}

/** Hard Situations */
export interface HardSituationsMetadata {
  disagreements?: string;
  decisionMaker?: string;
  conflictGuidance?: string;
  grace?: string;
  priorities?: string;
}

// ============================================================================
// Wish Model (Same shape as Entry)
// ============================================================================

export interface Wish<T = Record<string, unknown>> {
  id: string;
  planId: string;
  taskKey: string;
  title: string;
  notes?: string | null;
  metadata: T;
  sortOrder: number;
  files?: ApiFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishRequest<T = Record<string, unknown>> {
  planId: string;
  taskKey: string;
  title: string;
  notes?: string | null;
  metadata: T;
}

export interface UpdateWishRequest<T = Record<string, unknown>> {
  title?: string;
  notes?: string | null;
  metadata?: Partial<T>;
}

export interface WishesListResponse<T = Record<string, unknown>> {
  data: Wish<T>[];
  meta?: {
    count: number;
    limit: number;
  };
}
```

#### 1.3 Create Constants (`constants/wishes.ts`)

```typescript
/**
 * Wishes Structure - Defines the Wishes & Guidance sections and tasks
 *
 * Follows same pattern as vault.ts for consistency.
 */

export interface WishesTask {
  id: string;
  taskKey: string;
  title: string;
  description: string;
  guidanceHeading?: string;
  guidance: string;
  triggerText?: string;
  tips?: string[];
  pacingNote?: string;
}

export interface WishesSection {
  id: string;
  title: string;
  description: string;
  ionIcon: string;
  tasks: WishesTask[];
}

export const wishesSections: WishesSection[] = [
  {
    id: 'carePrefs',
    title: 'Care Preferences',
    description: 'What matters when health decisions are being made',
    ionIcon: 'heart-outline',
    tasks: [
      {
        id: 'whatMatters',
        taskKey: 'wishes.carePrefs.whatMatters',
        title: 'What Matters Most',
        description: 'Your priorities for care',
        triggerText: 'Take your time with this',
        guidanceHeading: 'When it comes to medical care, what matters most to you?',
        guidance: "There's no right answer here. This is about helping your family understand what a meaningful life looks like to you.",
        tips: [
          "Think about what makes a day feel worth living — connection? Comfort? Being present?",
          "Some people prioritize length of life, others prioritize quality. Both are valid.",
          "If you're unsure, imagine your family asking: 'What would they want?' What would you hope they'd say?"
        ],
        pacingNote: "These are big questions. It's okay to come back later."
      },
      {
        id: 'qualityOfLife',
        taskKey: 'wishes.carePrefs.qualityOfLife',
        title: 'Quality of Life',
        description: 'When to shift focus',
        triggerText: 'Are there circumstances where you\'d want to let nature take its course?',
        guidanceHeading: 'Are there circumstances where you\'d want to let nature take its course?',
        guidance: "This isn't about giving up — it's about giving your family clarity during an impossible time.",
        tips: [
          "Without your guidance, families often feel guilty no matter what they decide. Your words can lift that weight.",
          "You're not making a medical decision right now. You're sharing values that can help guide decisions later.",
          "It's okay to be uncertain. Even partial guidance helps more than silence."
        ]
      },
      {
        id: 'comfortVsTreatment',
        taskKey: 'wishes.carePrefs.comfortVsTreatment',
        title: 'Comfort vs Treatment',
        description: 'Pain, alertness, dignity',
        triggerText: 'How should comfort and treatment be balanced?',
        guidanceHeading: 'How should comfort and treatment be balanced?',
        guidance: "There's no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What matters is that your family knows what you'd want.",
        tips: [
          "Think about what matters more to you: more time or better quality time?",
          "Pain medication can make you drowsy — how much does staying alert matter?",
          "It's okay to say 'I trust my care team to decide.' That's a valid preference."
        ]
      },
      {
        id: 'advanceDirective',
        taskKey: 'wishes.carePrefs.advanceDirective',
        title: 'Advance Directive',
        description: 'Formal documents on file',
        triggerText: 'Do you have advance directive documents?',
        guidanceHeading: 'Legal documents give your family the authority to act.',
        guidance: "An advance directive or healthcare proxy ensures your wishes are followed — and that someone you trust can make decisions if you can't.",
        tips: [
          "A healthcare proxy names someone to make medical decisions for you.",
          "A living will states what treatments you do or don't want.",
          "Even if you don't have documents yet, naming your preferred decision-maker helps."
        ]
      }
    ]
  },
  {
    id: 'endOfLife',
    title: 'End-of-Life & After-Death',
    description: 'What should happen when life is ending or has ended',
    ionIcon: 'leaf-outline',
    tasks: [
      {
        id: 'setting',
        taskKey: 'wishes.endOfLife.setting',
        title: 'End-of-Life Setting',
        description: 'Home, hospital, hospice',
        triggerText: 'Where would you want to be, if you could choose?',
        guidanceHeading: 'Where would you want to be, if you could choose?',
        guidance: "Home, hospice, hospital — each has trade-offs. Knowing your preference helps your family honor your wishes when decisions need to be made quickly.",
        tips: [
          "Home care is possible for many situations, but requires family support.",
          "Hospice facilities specialize in comfort care and often allow more visitors.",
          "It's okay to say 'wherever makes sense at the time' — flexibility is valid."
        ]
      },
      {
        id: 'afterDeath',
        taskKey: 'wishes.endOfLife.afterDeath',
        title: 'After-Death Preferences',
        description: 'Burial, cremation, other',
        triggerText: 'Saying this clearly is a gift to your family.',
        guidanceHeading: 'Saying this clearly is a gift to your family.',
        guidance: "Burial, cremation, green burial — whatever you choose, stating it removes a heavy decision during an already difficult time.",
        tips: [
          "If you have strong preferences, stating them clearly removes guilt from the decision.",
          "If you're flexible, saying so is equally valuable. 'Whatever brings comfort' is valid.",
          "Pre-arrangements can save your family money and stress, but aren't required."
        ]
      },
      {
        id: 'service',
        taskKey: 'wishes.endOfLife.service',
        title: 'Service or Remembrance',
        description: 'Ceremony and memorial wishes',
        triggerText: 'How would you want to be remembered?',
        guidanceHeading: 'How would you want to be remembered?',
        guidance: "A quiet gathering, a big celebration, or nothing at all — your family will feel more at peace knowing what you'd want.",
        tips: [
          "Think about gatherings you've attended — what felt right, and what didn't?",
          "Some people want celebration; others prefer quiet. Both are meaningful.",
          "If there's a song or reading that matters to you, mention it — your family may not know.",
          "Even 'keep it simple' or 'make it a party' gives helpful direction."
        ]
      },
      {
        id: 'organDonation',
        taskKey: 'wishes.endOfLife.organDonation',
        title: 'Organ Donation',
        description: 'Your wishes on donation',
        triggerText: 'One decision could save several lives.',
        guidanceHeading: 'One decision could save several lives.',
        guidance: "Organ donation happens quickly after death, so your family needs to know your wishes in advance. Stating them clearly removes doubt during an already difficult time.",
        tips: [
          "You can choose to donate everything, specific organs only, or nothing at all.",
          "Being on the registry helps, but your family still needs to know your wishes.",
          "Religious and cultural considerations are respected — share any concerns here."
        ]
      }
    ]
  },
  {
    id: 'values',
    title: 'Personal Values & Guidance',
    description: 'Emotional and relational guidance for your family',
    ionIcon: 'chatbubble-ellipses-outline',
    tasks: [
      {
        id: 'lovedOnesKnow',
        taskKey: 'wishes.values.lovedOnesKnow',
        title: 'What Loved Ones Should Know',
        description: 'Final words and reminders',
        triggerText: 'What would you say if you couldn\'t say it later?',
        guidanceHeading: 'What would you say if you couldn\'t say it later?',
        guidance: "These words are a gift — to you for saying them, and to your family for receiving them.",
        tips: [
          "Think about what you'd want someone to say to you if they couldn't say it later.",
          "Gratitude is powerful. Naming specific moments means more than general praise.",
          "If there are apologies or regrets, this is a chance to release them.",
          "You don't have to fill everything. Even one honest paragraph is valuable."
        ]
      },
      {
        id: 'faith',
        taskKey: 'wishes.values.faith',
        title: 'Faith & Spiritual Preferences',
        description: 'Beliefs and traditions',
        triggerText: 'What traditions or beliefs should be honored?',
        guidanceHeading: 'What traditions or beliefs should be honored?',
        guidance: "Whether deeply religious, casually spiritual, or secular — your family will want to respect what matters to you.",
        tips: [
          "Include any rituals, prayers, or customs that should be observed.",
          "If you have a religious leader or congregation, note their contact info.",
          "Even 'no religious service' is helpful guidance."
        ]
      },
      {
        id: 'hardSituations',
        taskKey: 'wishes.values.hardSituations',
        title: 'Hard Situations',
        description: 'Guidance for conflict',
        triggerText: 'Your words can prevent conflict.',
        guidanceHeading: 'Your words can prevent conflict during an already difficult time.',
        guidance: "Grief makes people reactive. If you name who should decide, how to handle disagreements, and what matters most — you give your family a way forward.",
        tips: [
          "Name a primary decision-maker and explain why you trust them.",
          "Acknowledge that people might disagree — and give guidance for how to resolve it.",
          "What matters more than getting things 'right'? Family harmony? Honoring your memory?"
        ],
        pacingNote: "This can bring up strong emotions. It's okay to take breaks."
      }
    ]
  }
];

// Helper functions (same pattern as vault.ts)
export function getWishesSection(sectionId: string): WishesSection | undefined {
  return wishesSections.find((s) => s.id === sectionId);
}

export function getWishesTask(sectionId: string, taskId: string): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

export function getWishesTaskByKey(taskKey: string): WishesTask | undefined {
  return wishesSections.flatMap((s) => s.tasks).find((t) => t.taskKey === taskKey);
}

export function getWishesSectionByTaskKey(taskKey: string): WishesSection | undefined {
  return wishesSections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

export function wishesSectionHasMultipleTasks(sectionId: string): boolean {
  const section = getWishesSection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

export function getDefaultWishesTask(sectionId: string): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks[0];
}

export function getAllWishesTaskKeys(): string[] {
  return wishesSections.flatMap((s) => s.tasks.map((t) => t.taskKey));
}
```

---

### Phase 2: Components

#### 2.1 Create Component Registry (`components/wishes/registry.ts`)

```typescript
/**
 * Wishes Component Registry
 *
 * Maps taskKeys to their corresponding list and form components.
 * Follows same pattern as vault/registry.ts
 */

import type { Wish } from "@/api/types";
import type { ComponentType } from "react";

// List Components
import { CarePreferencesList } from "./lists/CarePreferencesList";
import { EndOfLifeList } from "./lists/EndOfLifeList";
import { ValuesGuidanceList } from "./lists/ValuesGuidanceList";

// Form Components
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

// Types (same pattern as vault)
export interface WishListProps {
  taskKey: string;
  entries: Wish[];
  isLoading: boolean;
  onEntryPress: (entryId: string) => void;
  onAddPress: () => void;
}

export interface WishFormProps {
  taskKey: string;
  entryId?: string;
  initialData?: Wish;
  onSave: (data: {
    title: string;
    notes?: string | null;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export const wishesListRegistry: Record<string, ComponentType<WishListProps>> = {
  // Care Preferences - all use same list (single entry per task)
  'wishes.carePrefs.whatMatters': CarePreferencesList,
  'wishes.carePrefs.qualityOfLife': CarePreferencesList,
  'wishes.carePrefs.comfortVsTreatment': CarePreferencesList,
  'wishes.carePrefs.advanceDirective': CarePreferencesList,

  // End-of-Life - all use same list
  'wishes.endOfLife.setting': EndOfLifeList,
  'wishes.endOfLife.afterDeath': EndOfLifeList,
  'wishes.endOfLife.service': EndOfLifeList,
  'wishes.endOfLife.organDonation': EndOfLifeList,

  // Values & Guidance - all use same list
  'wishes.values.lovedOnesKnow': ValuesGuidanceList,
  'wishes.values.faith': ValuesGuidanceList,
  'wishes.values.hardSituations': ValuesGuidanceList,
};

export const wishesFormRegistry: Record<string, ComponentType<WishFormProps>> = {
  // Care Preferences - each has unique form
  'wishes.carePrefs.whatMatters': WhatMattersMostForm,
  'wishes.carePrefs.qualityOfLife': QualityOfLifeForm,
  'wishes.carePrefs.comfortVsTreatment': ComfortVsTreatmentForm,
  'wishes.carePrefs.advanceDirective': AdvanceDirectiveForm,

  // End-of-Life - each has unique form
  'wishes.endOfLife.setting': EndOfLifeSettingForm,
  'wishes.endOfLife.afterDeath': AfterDeathPreferencesForm,
  'wishes.endOfLife.service': ServicePreferencesForm,
  'wishes.endOfLife.organDonation': OrganDonationForm,

  // Values & Guidance - each has unique form
  'wishes.values.lovedOnesKnow': LovedOnesKnowForm,
  'wishes.values.faith': FaithPreferencesForm,
  'wishes.values.hardSituations': HardSituationsForm,
};

export function getWishesListComponent(taskKey: string): ComponentType<WishListProps> | undefined {
  return wishesListRegistry[taskKey];
}

export function getWishesFormComponent(taskKey: string): ComponentType<WishFormProps> | undefined {
  return wishesFormRegistry[taskKey];
}
```

#### 2.2 Create ReflectionChoices Component

This is a **new shared component** unique to Wishes (values-based selection UI):

```typescript
// components/wishes/shared/ReflectionChoices.tsx

/**
 * ReflectionChoices - Values-based selection UI
 *
 * Cards with tap-to-select behavior for expressing values/preferences.
 * Selected cards show "This matters to me" with checkmark.
 * Unselected cards show "Tap if this resonates" with dashed circle.
 */

import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

interface Choice {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface ReflectionChoicesProps {
  choices: Choice[];
  selected: string[];
  onToggle: (id: string) => void;
  columns?: 1 | 2;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  customPlaceholder?: string;
}

export function ReflectionChoices({
  choices,
  selected,
  onToggle,
  columns = 1,
  allowCustom = false,
  customValue = '',
  onCustomChange,
  customPlaceholder = 'Add your own...',
}: ReflectionChoicesProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.grid, columns === 2 && styles.twoColumns]}>
        {choices.map((choice) => (
          <ReflectionCard
            key={choice.id}
            choice={choice}
            isSelected={selected.includes(choice.id)}
            onPress={() => onToggle(choice.id)}
          />
        ))}
      </View>

      {allowCustom && (
        <View style={styles.customInput}>
          <Text style={styles.customLabel}>Something else on your mind?</Text>
          <TextInput
            value={customValue}
            onChangeText={onCustomChange}
            placeholder={customPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </View>
      )}
    </View>
  );
}

// Individual card component
function ReflectionCard({
  choice,
  isSelected,
  onPress
}: {
  choice: Choice;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          animatedStyle
        ]}
      >
        <View style={styles.cardMain}>
          {choice.icon && <Text style={styles.cardIcon}>{choice.icon}</Text>}
          <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
            {choice.label}
          </Text>
        </View>

        {choice.description && (
          <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
            {choice.description}
          </Text>
        )}

        <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
          {isSelected ? (
            <View style={styles.selectedMark}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <Text style={styles.selectedText}>This matters to me</Text>
            </View>
          ) : (
            <View style={styles.unselectedMark}>
              <View style={styles.dashedCircle} />
              <Text style={styles.unselectedText}>Tap if this resonates</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.featureWishes,
    backgroundColor: colors.featureWishesTint,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  cardLabelSelected: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semibold,
  },
  cardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
    paddingLeft: 28, // Align with label (icon width + gap)
  },
  cardDescSelected: {
    color: '#5a6b58',
    fontStyle: 'normal',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  indicatorSelected: {
    borderTopColor: 'rgba(184,169,201,0.2)', // featureWishes with opacity
  },
  selectedMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.featureWishes,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: '#5a6b58',
  },
  unselectedMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dashedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderStyle: 'dashed',
  },
  unselectedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  customInput: {
    marginTop: spacing.md,
  },
  customLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.featureWishes,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
});
```

---

### Phase 3: Screens

#### 3.1 Update Wishes Tab (`app/(app)/(tabs)/wishes.tsx`)

Transform from "Coming Soon" to functional dashboard:

```typescript
// Pattern: Same as information.tsx but with lavender colors

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockedFeatureOverlay, ViewOnlyBadge } from "@/components/entitlements";
import { PressableCard } from "@/components/ui/Card";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { wishesSections } from "@/constants/wishes";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { useWishesCountsQuery } from "@/hooks/queries/useWishesQueries";

export default function WishesScreen() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { data: counts } = useWishesCountsQuery();

  const isLocked = isLockedPillar("wishes");
  const isViewOnly = isViewOnlyPillar("wishes");

  if (isLocked) {
    return (
      <LockedFeatureOverlay
        featureName="Wishes & Guidance"
        description="Share your personal wishes, values, and guidance for your loved ones."
      />
    );
  }

  const handleSectionPress = (sectionId: string) => {
    router.push(`/wishes/${sectionId}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      {isViewOnly && (
        <View style={styles.viewOnlyHeader}>
          <ViewOnlyBadge />
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Wishes & Guidance</Text>
        <Text style={styles.subtitle}>
          Share what matters most to you, so your family never has to guess.
        </Text>
      </View>

      {wishesSections.map((section) => {
        const taskKeys = section.tasks.map((t) => t.taskKey);
        const count = taskKeys.reduce((sum, key) => sum + (counts?.[key] || 0), 0);
        const totalTasks = section.tasks.length;

        return (
          <PressableCard
            key={section.id}
            style={styles.sectionCard}
            onPress={() => handleSectionPress(section.id)}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={section.ionIcon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={colors.featureWishes}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
                <Text style={styles.cardProgress}>
                  {count === 0
                    ? 'Not started'
                    : `${count} of ${totalTasks} completed`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </PressableCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  viewOnlyHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  sectionCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.featureWishesTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardProgress: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});
```

#### 3.2 Create Section/Task/Form Screens

Follow the exact same pattern as `app/vault/[sectionId]/...` screens.

---

### Phase 4: Query Hooks

Create `hooks/queries/useWishesQueries.ts`:

```typescript
/**
 * TanStack Query hooks for Wishes data
 *
 * Follows same pattern as useEntriesQueries.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/data/ApiProvider';
import { usePlan } from '@/data/PlanProvider';
import type { Wish, CreateWishRequest, UpdateWishRequest } from '@/api/types';

// Query keys
export const wishesKeys = {
  all: ['wishes'] as const,
  lists: () => [...wishesKeys.all, 'list'] as const,
  list: (planId: string, taskKey?: string) =>
    [...wishesKeys.lists(), planId, taskKey] as const,
  details: () => [...wishesKeys.all, 'detail'] as const,
  detail: (planId: string, id: string) =>
    [...wishesKeys.details(), planId, id] as const,
  counts: (planId: string) => [...wishesKeys.all, 'counts', planId] as const,
};

/**
 * Fetch wishes for a specific task
 */
export function useWishesQuery<T = Record<string, unknown>>(taskKey: string) {
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useQuery({
    queryKey: wishesKeys.list(planId!, taskKey),
    queryFn: () => wishes.listByTaskKey<T>(planId!, taskKey),
    enabled: !!planId,
  });
}

/**
 * Fetch a single wish by ID
 */
export function useWishQuery<T = Record<string, unknown>>(wishId: string) {
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useQuery({
    queryKey: wishesKeys.detail(planId!, wishId),
    queryFn: () => wishes.get<T>(planId!, wishId),
    enabled: !!planId && !!wishId && wishId !== 'new',
  });
}

/**
 * Fetch counts for dashboard progress
 */
export function useWishesCountsQuery() {
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useQuery({
    queryKey: wishesKeys.counts(planId!),
    queryFn: async () => {
      const allWishes = await wishes.list(planId!);
      // Group by taskKey and count
      const counts: Record<string, number> = {};
      allWishes.forEach((wish) => {
        counts[wish.taskKey] = (counts[wish.taskKey] || 0) + 1;
      });
      return counts;
    },
    enabled: !!planId,
  });
}

/**
 * Create a new wish
 */
export function useCreateWish<T = Record<string, unknown>>() {
  const queryClient = useQueryClient();
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useMutation({
    mutationFn: (data: Omit<CreateWishRequest<T>, 'planId'>) =>
      wishes.create<T>({ ...data, planId: planId! }),
    onSuccess: (newWish) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: wishesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: wishesKeys.counts(planId!) });
    },
  });
}

/**
 * Update an existing wish
 */
export function useUpdateWish<T = Record<string, unknown>>() {
  const queryClient = useQueryClient();
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWishRequest<T> }) =>
      wishes.update<T>(planId!, id, data),
    onSuccess: (updatedWish) => {
      queryClient.invalidateQueries({ queryKey: wishesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: wishesKeys.detail(planId!, updatedWish.id)
      });
    },
  });
}

/**
 * Delete a wish
 */
export function useDeleteWish() {
  const queryClient = useQueryClient();
  const { wishes } = useApi();
  const { activePlan } = usePlan();
  const planId = activePlan?.id;

  return useMutation({
    mutationFn: (id: string) => wishes.delete(planId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: wishesKeys.counts(planId!) });
    },
  });
}
```

---

### Implementation Checklist

#### Phase 1: Foundation
- [ ] Create `api/wishes.ts` (stubbed service)
- [ ] Add Wish types to `api/types.ts`
- [ ] Create `constants/wishes.ts` (sections/tasks structure)
- [ ] Add wishes service to `ApiProvider`

#### Phase 2: Query Layer
- [ ] Create `hooks/queries/useWishesQueries.ts`

#### Phase 3: Components
- [ ] Create `components/wishes/registry.ts`
- [ ] Create `components/wishes/shared/ReflectionChoices.tsx`
- [ ] Create `components/wishes/lists/listStyles.ts` (lavender theme)
- [ ] Create list components (3 total, reused across tasks)
- [ ] Create form components (11 total, one per task)

#### Phase 4: Screens
- [ ] Update `app/(app)/(tabs)/wishes.tsx` (dashboard)
- [ ] Create `app/(app)/wishes/[sectionId]/index.tsx` (section view)
- [ ] Create `app/(app)/wishes/[sectionId]/[taskId]/index.tsx` (task list)
- [ ] Create `app/(app)/wishes/[sectionId]/[taskId]/[entryId].tsx` (form)

#### Phase 5: Integration
- [ ] Test navigation flow
- [ ] Test form save/edit/delete (stubbed)
- [ ] Verify lavender color usage throughout
- [ ] Test entitlements (locked/view-only states)

---

### Components to Reuse from Information Vault

These existing components can be reused directly:

| Component | Location | Usage in Wishes |
|-----------|----------|-----------------|
| `PressableCard` | `components/ui/Card.tsx` | Section cards, list items |
| `EmptyState` | `components/ui/EmptyState.tsx` | Empty task lists |
| `ExpandableGuidanceCard` | `components/ui/ExpandableGuidanceCard.tsx` | Task guidance |
| `AnimatedListItem` | `components/ui/AnimatedListItem.tsx` | List animations |
| `SkeletonList` | `components/ui/SkeletonCard.tsx` | Loading states |
| `Button` | `components/ui/Button.tsx` | Form buttons |
| `Input` | `components/ui/Input.tsx` | Form inputs |
| `TextArea` | `components/ui/TextArea.tsx` | Long-form text fields |
| `Select` | `components/ui/Select.tsx` | Dropdown selections |
| `LockedFeatureOverlay` | `components/entitlements/` | Pillar lock state |
| `ViewOnlyBadge` | `components/entitlements/` | View-only state |

---

### New Components for Wishes

| Component | Purpose |
|-----------|---------|
| `ReflectionChoices` | Values-based card selection (unique to Wishes) |
| `ReflectionPrompt` | Question + context text styling |
| `PacingReminder` | "No rush" gentle messaging |

---

### API Migration Path

When the backend API is ready:

1. Remove console.log stubs from `api/wishes.ts`
2. Replace stub implementations with actual API calls
3. Update endpoint path if different from `/plans/:planId/wishes`
4. Ensure response shape matches `Wish<T>` interface
5. Add any additional endpoints (bulk operations, etc.)

The stubbed API returns empty arrays for lists and mock data for creates, allowing full UI development and testing before the backend is complete.
