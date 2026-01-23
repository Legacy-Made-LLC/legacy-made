/**
 * TanStack Form Utilities
 *
 * Re-exports Zod schemas and provides utility functions for forms.
 * For validation, use the Zod schemas from ./schemas.ts with TanStack Form:
 *
 * @example
 * import { signInSchema } from '@/components/forms';
 *
 * const form = useForm({
 *   defaultValues: { email: '' },
 *   validators: {
 *     onChange: signInSchema,
 *   },
 * });
 */

// Re-export all Zod schemas
export * from './schemas';

// Format phone number as user types (US format)
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Type helper for extracting form values from a form config
export type FormValues<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K];
};

/**
 * Extract error message from TanStack Form field errors.
 * Handles both string errors and object errors (from onDynamic validators with Zod/Standard Schema).
 */
export function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    // Handle Zod/Standard Schema error objects
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return null;
}
