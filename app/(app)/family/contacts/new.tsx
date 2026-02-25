import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  TrustedContactAccessLevel,
  TrustedContactAccessTiming,
} from "@/api/types";
import { AccessLevelSelector } from "@/components/family/AccessLevelSelector";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { Button } from "@/components/ui/Button";
import { colors, spacing, typography } from "@/constants/theme";
import { useCreateTrustedContact } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";

export default function NewTrustedContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createMutation = useCreateTrustedContact();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      relationship: "",
      accessLevel: undefined as TrustedContactAccessLevel | undefined,
      accessTiming: "immediate" as TrustedContactAccessTiming,
      notes: "",
    },
    validationLogic: revalidateLogic(),
    onSubmit: async ({ value }) => {
      if (toast.isOffline()) return;

      if (!value.accessLevel) {
        toast.error({ message: "Please select an access level." });
        return;
      }

      try {
        await createMutation.mutateAsync({
          email: value.email.trim(),
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          relationship: value.relationship.trim() || undefined,
          accessLevel: value.accessLevel,
          accessTiming: value.accessTiming,
          notes: value.notes.trim() || undefined,
        });
        toast.success({
          title: "Invitation sent",
          message: `An invitation has been sent to ${value.email.trim()}.`,
        });
        router.back();
      } catch {
        toast.error({
          title: "Couldn\u2019t send invitation",
          message: "Please check the details and try again.",
        });
      }
    },
  });

  const handleAccessLevelChange = useCallback(
    (value: TrustedContactAccessLevel) => {
      form.setFieldValue("accessLevel", value);
    },
    [form],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          They&apos;ll receive an email invitation to view or help manage your
          plan.
        </Text>

        {/* Name fields */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <form.Field
              name="firstName"
              validators={{
                onBlur: ({ value }) =>
                  !value.trim() ? "First name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="FIRST NAME"
                  placeholder="First name"
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              )}
            </form.Field>
          </View>

          <View style={styles.nameField}>
            <form.Field
              name="lastName"
              validators={{
                onBlur: ({ value }) =>
                  !value.trim() ? "Last name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="LAST NAME"
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              )}
            </form.Field>
          </View>
        </View>

        <form.Field
          name="email"
          validators={{
            onBlur: ({ value }) => {
              if (!value.trim()) return "Email is required";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
                return "Enter a valid email address";
              return undefined;
            },
          }}
        >
          {(field) => (
            <FormInput
              field={field}
              label="EMAIL"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        </form.Field>

        <form.Field name="relationship">
          {(field) => (
            <FormInput
              field={field}
              label="RELATIONSHIP (OPTIONAL)"
              placeholder="e.g., Sister, Attorney, Financial Advisor"
              autoCapitalize="words"
            />
          )}
        </form.Field>

        {/* Access Level Selector */}
        <View style={styles.selectorSection}>
          <form.Field name="accessLevel">
            {(field) => (
              <AccessLevelSelector
                value={field.state.value}
                onChange={handleAccessLevelChange}
              />
            )}
          </form.Field>
        </View>

        {/* Access Timing Selector */}
        {/* TODO: Hide for MVP. Not implementing anything but immediate access for now. */}
        {/* <View style={styles.selectorSection}>
          <form.Field name="accessTiming">
            {(field) => (
              <AccessTimingSelector
                value={field.state.value}
                onChange={handleAccessTimingChange}
              />
            )}
          </form.Field>
        </View> */}

        {/* Notes */}
        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="NOTES (OPTIONAL)"
              placeholder="Any context about why you're sharing your plan with this person..."
            />
          )}
        </form.Field>

        {/* Submit Button */}
        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              title={isSubmitting ? "Sending..." : "Send Invitation"}
              onPress={form.handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          )}
        </form.Subscribe>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  intro: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  selectorSection: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: colors.featureFamily,
  },
});
