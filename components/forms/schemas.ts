/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for all forms in the app.
 * TanStack Form v1+ supports Zod schemas natively via Standard Schema.
 * Pass these schemas directly to useForm({ validators: { onChange: schema } })
 */

import { z } from "zod";

// ============================================================================
// Field-Level Schemas (Reusable)
// ============================================================================

/** Required non-empty string with custom field name in error message */
export const requiredString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`);

/** Optional string that allows empty - just validates without requiring */
export const optionalString = z.string().trim();

/** Email validation - optional but must be valid if provided */
export const emailOptional = z
  .string()
  .trim()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Please enter a valid email address",
  });

/** Email validation - required and must be valid */
export const emailRequired = z
  .email("Please enter a valid email address")
  .trim()
  .min(1, "Email is required");

/** Phone validation - optional but must have 10+ digits if provided */
export const phoneOptional = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (!v || v.length === 0) return true;
      const digitsOnly = v.replace(/\D/g, "");
      return digitsOnly.length >= 10;
    },
    { message: "Please enter a valid phone number" },
  );

/** Phone validation - required and must have 10+ digits */
export const phoneRequired = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .refine(
    (v) => {
      const digitsOnly = v.replace(/\D/g, "");
      return digitsOnly.length >= 10;
    },
    { message: "Please enter a valid phone number" },
  );

// ============================================================================
// Auth Form Schemas
// ============================================================================

/** Sign-in form: email only */
export const signInSchema = z.object({
  email: emailRequired,
});
export type SignInFormValues = z.infer<typeof signInSchema>;

/** Sign-up form: first name, last name, email */
export const signUpSchema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  email: emailRequired,
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

// ============================================================================
// Contact Form Schemas
// ============================================================================

/** Contact form - base schema with phone optional */
export const contactSchema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  relationship: requiredString("Relationship"),
  phone: phoneOptional,
  email: emailOptional,
  reason: optionalString,
});
export type ContactFormValues = z.infer<typeof contactSchema>;

/** Contact form with required phone */
export const contactSchemaWithRequiredPhone = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  relationship: requiredString("Relationship"),
  phone: phoneRequired,
  email: emailOptional,
  reason: optionalString,
  isPrimary: z.boolean(),
});
export type ContactFormValuesWithRequiredPhone = z.infer<
  typeof contactSchemaWithRequiredPhone
>;

/** Onboarding contact form - only name and relationship required */
export const onboardingContactSchema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  relationship: requiredString("Relationship"),
});
export type OnboardingContactFormValues = z.infer<typeof onboardingContactSchema>;

// ============================================================================
// Vault Form Schemas
// ============================================================================

/** Financial account form */
export const financialSchema = z.object({
  accountName: optionalString,
  institution: requiredString("Institution"),
  accountTypes: z.array(z.string()),
  accountOwners: optionalString,
  accountNumber: optionalString,
  notes: optionalString,
});
export type FinancialFormValues = z.infer<typeof financialSchema>;

/** Insurance policy form */
export const insuranceSchema = z.object({
  provider: requiredString("Insurance provider"),
  policyType: requiredString("Policy type"),
  policyNumber: optionalString,
  coverageDetails: optionalString,
  beneficiaries: optionalString,
  agentName: optionalString,
  agentPhone: optionalString,
  notes: optionalString,
});
export type InsuranceFormValues = z.infer<typeof insuranceSchema>;

/** Legal document form */
export const documentSchema = z.object({
  documentType: requiredString("Document type"),
  location: requiredString("Location"),
  holder: optionalString,
  preparer: optionalString,
  preparerPhone: phoneOptional,
  notes: optionalString,
});
export type DocumentFormValues = z.infer<typeof documentSchema>;

/** Property/home responsibility form */
export const propertySchema = z
  .object({
    propertyType: requiredString("Type"),
    ownership: optionalString,
    addressDescription: optionalString,
    lienHolder: optionalString,
    documentsLocation: optionalString,
    keyLocation: optionalString,
    notes: optionalString,
  })
  .refine(
    (data) => {
      // When type is Vehicle, addressDescription serves as the vehicle description
      // and is required (it becomes the entry title)
      if (data.propertyType === "Vehicle") {
        return data.addressDescription.trim().length > 0;
      }
      return true;
    },
    {
      message: "Vehicle description is required",
      path: ["addressDescription"],
    },
  );
export type PropertyFormValues = z.infer<typeof propertySchema>;

/** Digital account form */
export const digitalSchema = z.object({
  accountName: requiredString("Account name"),
  service: requiredString("Service/Platform"),
  username: optionalString,
  importance: optionalString,
  accessNotes: optionalString,
});
export type DigitalFormValues = z.infer<typeof digitalSchema>;

/** Digital social account form — no separate name field (service IS the name) */
export const digitalSocialSchema = z.object({
  accountName: optionalString,
  service: requiredString("Service/Platform"),
  username: optionalString,
  importance: optionalString,
  accessNotes: optionalString,
});
export type DigitalSocialFormValues = z.infer<typeof digitalSocialSchema>;

/** Pet form */
export const petSchema = z.object({
  name: requiredString("Pet name"),
  species: optionalString,
  breed: optionalString,
  veterinarian: optionalString,
  vetPhone: phoneOptional,
  designatedCaretaker: optionalString,
  careInstructions: optionalString,
});
export type PetFormValues = z.infer<typeof petSchema>;
