# i18n Migration Guide

This guide explains how to use the new i18n system with perspective switching.

## Overview

The app now supports two perspectives:
- **Owner** (`you/your`) - The person organizing their information
- **Family** (`they/their`) - Family members viewing their loved one's information

All text content has been moved from `constants/vault.ts` and `constants/wishes.ts` to the `locales/` directory, allowing for easy perspective switching without changing component code.

## File Structure

```
locales/
├── types.ts                    # Type definitions
├── index.ts                    # Main exports and translation loader
├── en/
│   ├── index.ts               # English exports
│   ├── owner/
│   │   ├── vault.ts           # Vault text (you/your)
│   │   ├── wishes.ts          # Wishes text (you/your)
│   │   └── common.ts          # Common UI text (you/your)
│   └── family/
│       ├── vault.ts           # Vault text (they/their)
│       ├── wishes.ts          # Wishes text (they/their)
│       └── common.ts          # Common UI text (they/their)
contexts/
└── LocaleContext.tsx          # React context and hooks
constants/
├── vault-structure.ts         # Vault structure (IDs, icons only)
├── vault.ts                   # Legacy compatibility layer
├── wishes-structure.ts        # Wishes structure (IDs, icons only)
└── wishes.ts                  # Legacy compatibility layer
```

## Using Translations in Components

### Basic Usage

```tsx
import { useTranslations } from '@/contexts/LocaleContext';

function MyComponent() {
  const t = useTranslations();

  return (
    <View>
      <Text>{t.vault.contacts.title}</Text>
      <Text>{t.vault.contacts.description}</Text>
    </View>
  );
}
```

### Accessing Task Text

```tsx
import { useTranslations } from '@/contexts/LocaleContext';

function TaskScreen({ sectionId, taskId }: { sectionId: string; taskId: string }) {
  const t = useTranslations();

  // Type-safe access to task text
  const taskText = t.vault[sectionId].tasks[taskId];

  return (
    <View>
      <Text>{taskText.title}</Text>
      <Text>{taskText.description}</Text>
      <Text>{taskText.guidance}</Text>
      {taskText.tips?.map((tip, i) => (
        <Text key={i}>• {tip}</Text>
      ))}
    </View>
  );
}
```

### Switching Perspectives

```tsx
import { usePerspective } from '@/contexts/LocaleContext';

function PerspectiveToggle() {
  const { perspective, setPerspective, isOwner, isFamily } = usePerspective();

  return (
    <View>
      <Button
        title="Owner View"
        onPress={() => setPerspective('owner')}
        disabled={isOwner}
      />
      <Button
        title="Family View"
        onPress={() => setPerspective('family')}
        disabled={isFamily}
      />
    </View>
  );
}
```

### Using Structure Data

For structural information (IDs, icons, task relationships), use the new `-structure.ts` files:

```tsx
import { vaultSections, getTask } from '@/constants/vault-structure';
import { useTranslations } from '@/contexts/LocaleContext';

function VaultList() {
  const t = useTranslations();

  return (
    <View>
      {vaultSections.map(section => {
        const text = t.vault[section.id];
        return (
          <View key={section.id}>
            <Ionicons name={section.ionIcon} />
            <Text>{text.title}</Text>
            <Text>{text.description}</Text>
          </View>
        );
      })}
    </View>
  );
}
```

## Migration Path

### Old Code (Before i18n)

```tsx
import { vaultSections, getTask } from '@/constants/vault';

function OldComponent() {
  const section = vaultSections[0]; // Has title, description, etc.

  return (
    <View>
      <Text>{section.title}</Text>
      <Text>{section.description}</Text>
    </View>
  );
}
```

### New Code (After i18n)

```tsx
import { vaultSections } from '@/constants/vault-structure';
import { useTranslations } from '@/contexts/LocaleContext';

function NewComponent() {
  const t = useTranslations();
  const section = vaultSections[0]; // Has only id, ionIcon, tasks
  const text = t.vault[section.id];

  return (
    <View>
      <Text>{text.title}</Text>
      <Text>{text.description}</Text>
    </View>
  );
}
```

## Backward Compatibility

The old `constants/vault.ts` and `constants/wishes.ts` files still work but are **deprecated**. They automatically use English owner perspective translations.

This allows gradual migration:
1. Old code continues working without changes
2. New code can use the i18n system immediately
3. Migrate components incrementally

## Common UI Strings

For buttons, empty states, and progress indicators:

```tsx
import { useTranslations } from '@/contexts/LocaleContext';

function EmptyState() {
  const t = useTranslations();

  return (
    <View>
      <Text>{t.common.emptyStates.contacts.title}</Text>
      <Text>{t.common.emptyStates.contacts.description}</Text>
      <Button title={t.common.buttons.addContact} />
    </View>
  );
}
```

## Progress Text

```tsx
import { useTranslations } from '@/contexts/LocaleContext';

function ProgressIndicator({ count }: { count: number }) {
  const t = useTranslations();

  const text = count === 0
    ? t.common.progress.notStarted
    : t.common.progress.itemsAdded(count);

  return <Text>{text}</Text>;
}
```

## Type Safety

All translation keys are fully typed. TypeScript will catch:
- Typos in section IDs
- Typos in task IDs
- Missing translation fields
- Incorrect function signatures

```tsx
// ✅ Type-safe
const text = t.vault.contacts.tasks.primary.title;

// ❌ TypeScript error - "kontacts" doesn't exist
const text = t.vault.kontacts.tasks.primary.title;

// ✅ Type-safe function call
const progress = t.common.progress.itemsAdded(5);

// ❌ TypeScript error - expects number
const progress = t.common.progress.itemsAdded("5");
```

## Adding New Translations

To add a new section or task:

1. **Update types** in `locales/types.ts`
2. **Add structure** in `constants/vault-structure.ts` or `constants/wishes-structure.ts`
3. **Add owner text** in `locales/en/owner/vault.ts` or `wishes.ts`
4. **Add family text** in `locales/en/family/vault.ts` or `wishes.ts`

TypeScript will ensure all required fields are present.

## Best Practices

1. **Always use hooks** - Don't access translations directly
2. **Separate structure from text** - Use `-structure.ts` for IDs/icons
3. **Use type inference** - Let TypeScript guide you
4. **Test both perspectives** - Toggle to verify text makes sense
5. **Keep transformations consistent** - Follow existing patterns

## Example: Complete Component Migration

### Before

```tsx
import { vaultSections } from '@/constants/vault';

function VaultDashboard() {
  return (
    <View>
      {vaultSections.map(section => (
        <Card key={section.id}>
          <Text>{section.title}</Text>
          <Text>{section.description}</Text>
        </Card>
      ))}
    </View>
  );
}
```

### After

```tsx
import { vaultSections } from '@/constants/vault-structure';
import { useTranslations } from '@/contexts/LocaleContext';

function VaultDashboard() {
  const t = useTranslations();

  return (
    <View>
      {vaultSections.map(section => {
        const text = t.vault[section.id];
        return (
          <Card key={section.id}>
            <Text>{text.title}</Text>
            <Text>{text.description}</Text>
          </Card>
        );
      })}
    </View>
  );
}
```

This component now automatically displays the correct text based on the current perspective!
