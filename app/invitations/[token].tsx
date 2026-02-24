/**
 * Invitation Deep Link Screen
 *
 * Handles: https://app.legacymade.com/invitations/{token}
 *          legacymade://invitations/{token}
 *
 * This screen lives outside the (app) group because the recipient
 * may not have an account or be signed in yet.
 *
 * Flow:
 * 1. Fetch invitation details (public endpoint, no auth)
 * 2. Show who invited them and what access they'd get
 * 3. Accept — if signed in, accept directly. If not:
 *    a. Inline sign-up form (first name, last name, email)
 *    b. OTP email verification
 *    c. Auto-accept after verification
 *    d. "Already have an account?" escape hatch → sign-in → return
 */

import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchInvitationDetails } from "@/api/accessInvitations";
import { ApiClientError } from "@/api/client";
import type { InvitationDetails } from "@/api/types";
import { useApi } from "@/api/useApi";
import { FormInput, signUpSchema } from "@/components/forms";
import Loader from "@/components/ui/Loader";
import {
  borderRadius,
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import { toast } from "@/hooks/useToast";

const PENDING_INVITATION_TOKEN_KEY = "legacy_made_pending_invitation_token";

const ACCESS_LEVEL_INFO: Record<
  string,
  { label: string; description: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  full_edit: {
    label: "Full Edit Access",
    description:
      "You\u2019ll be able to view and edit their plan, including entries, wishes, and messages.",
    icon: "create-outline",
  },
  full_view: {
    label: "Full View Access",
    description:
      "You\u2019ll be able to view everything in their plan, but won\u2019t be able to make changes.",
    icon: "eye-outline",
  },
  limited_view: {
    label: "Limited View Access",
    description:
      "You\u2019ll be able to view their wishes and messages, but not detailed account information.",
    icon: "eye-off-outline",
  },
  view_only: {
    label: "View Only Access",
    description: "You\u2019ll receive view-only access when the time comes.",
    icon: "eye-outline",
  },
};

type ScreenState =
  | { kind: "loading" }
  | { kind: "loaded"; invitation: InvitationDetails }
  | { kind: "signup"; invitation: InvitationDetails }
  | { kind: "verify"; invitation: InvitationDetails; email: string }
  | { kind: "error"; message: string }
  | { kind: "expired" }
  | { kind: "done"; outcome: "accepted" | "declined" };

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, isLoaded: isSignUpLoaded, setActive } = useSignUp();
  const { accessInvitations } = useApi();
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [isActing, setIsActing] = useState(false);

  // Signup state
  const [signupError, setSignupError] = useState("");
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // Sign-up form (must be called unconditionally per React hook rules)
  const signupForm = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isSignUpLoaded || !signUp) return;
      if (state.kind !== "signup") return;

      setIsSignupLoading(true);
      setSignupError("");

      try {
        await signUp.create({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          emailAddress: value.email.trim(),
        });

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setState({
          kind: "verify",
          invitation: state.invitation,
          email: value.email.trim(),
        });
      } catch (err: unknown) {
        const clerkError = err as { errors?: { message: string }[] };
        if (clerkError.errors && clerkError.errors.length > 0) {
          setSignupError(clerkError.errors[0].message);
        } else {
          setSignupError("An error occurred. Please try again.");
        }
      } finally {
        setIsSignupLoading(false);
      }
    },
  });

  // Fetch invitation details on mount
  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Invalid invitation link." });
      return;
    }

    fetchInvitationDetails(token)
      .then((invitation) => {
        if (invitation.accessStatus !== "pending") {
          setState({
            kind: "done",
            outcome:
              invitation.accessStatus === "accepted" ? "accepted" : "declined",
          });
        } else {
          setState({ kind: "loaded", invitation });
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          if (err.statusCode === 404) {
            setState({ kind: "expired" });
          } else if (err.statusCode === 401) {
            setState({ kind: "expired" });
          } else {
            setState({ kind: "error", message: err.message });
          }
        } else {
          setState({
            kind: "error",
            message: "Something went wrong. Please try again.",
          });
        }
      });
  }, [token]);

  // Check for pending invitation token (escape hatch return)
  useEffect(() => {
    const checkPendingToken = async () => {
      try {
        const pendingToken = await AsyncStorage.getItem(
          PENDING_INVITATION_TOKEN_KEY,
        );
        if (pendingToken && isSignedIn) {
          await AsyncStorage.removeItem(PENDING_INVITATION_TOKEN_KEY);
          setIsActing(true);
          try {
            await accessInvitations.accept(pendingToken);
            setState({ kind: "done", outcome: "accepted" });
            toast.success({ title: "Invitation accepted" });
          } catch (err) {
            const message =
              err instanceof ApiClientError
                ? err.message
                : "Couldn\u2019t accept invitation.";
            toast.error({ message });
          } finally {
            setIsActing(false);
          }
        }
      } catch {
        // Ignore AsyncStorage errors
      }
    };

    checkPendingToken();
  }, [isSignedIn, accessInvitations]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!token) return;

    if (!isSignedIn) {
      // Transition to inline sign-up
      if (state.kind === "loaded") {
        const inv = state.invitation;
        // Pre-fill form from invitation data
        if (inv.contactFirstName)
          signupForm.setFieldValue("firstName", inv.contactFirstName);
        if (inv.contactLastName)
          signupForm.setFieldValue("lastName", inv.contactLastName);
        if (inv.contactEmail)
          signupForm.setFieldValue("email", inv.contactEmail);
        setState({ kind: "signup", invitation: inv });
      }
      return;
    }

    // User is signed in — accept directly
    setIsActing(true);
    try {
      await accessInvitations.accept(token);
      setState({ kind: "done", outcome: "accepted" });
      toast.success({ title: "Invitation accepted" });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Couldn\u2019t accept invitation.";
      toast.error({ message });
    } finally {
      setIsActing(false);
    }
  };

  const handleDecline = () => {
    if (!token) return;

    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation? The plan owner will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setIsActing(true);
            try {
              await accessInvitations.decline(token);
              setState({ kind: "done", outcome: "declined" });
            } catch (err) {
              const message =
                err instanceof ApiClientError
                  ? err.message
                  : "Couldn\u2019t decline invitation.";
              toast.error({ message });
            } finally {
              setIsActing(false);
            }
          },
        },
      ],
    );
  };

  const handleVerifyOtp = async () => {
    if (!isSignUpLoaded || !signUp || !token) return;
    if (state.kind !== "verify") return;

    setIsOtpLoading(true);
    setOtpError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: otpCode,
      });

      if (result.status === "complete") {
        // Activate the session
        await setActive({ session: result.createdSessionId });

        // Brief delay for session propagation to Clerk hooks
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Auto-accept the invitation
        try {
          await accessInvitations.accept(token);
          setState({ kind: "done", outcome: "accepted" });
          toast.success({ title: "Account created & invitation accepted" });
        } catch (acceptErr) {
          const message =
            acceptErr instanceof ApiClientError
              ? acceptErr.message
              : "Account created but couldn\u2019t accept invitation.";
          toast.error({ message });
          setState({ kind: "done", outcome: "accepted" });
        }
      } else {
        setOtpError("Verification could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setOtpError(clerkError.errors[0].message);
      } else {
        setOtpError("Invalid code. Please try again.");
      }
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isSignUpLoaded || !signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setOtpCode("");
      setOtpError("");
      toast.success({ title: "Code resent" });
    } catch {
      setOtpError("Could not resend code. Please try again.");
    }
  };

  const handleSignInEscapeHatch = async () => {
    if (!token) return;

    try {
      await AsyncStorage.setItem(PENDING_INVITATION_TOKEN_KEY, token);
    } catch {
      // If storage fails, the user will need to use the link again
    }

    router.push("/(auth)/sign-in");
  };

  const handleBackToLoaded = () => {
    if (state.kind === "signup") {
      setState({ kind: "loaded", invitation: state.invitation });
    } else if (state.kind === "verify") {
      setState({ kind: "signup", invitation: state.invitation });
    }
  };

  const handleGoHome = () => {
    if (isSignedIn) {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.replace("/(auth)");
    }
  };

  // ── Render states ─────────────────────────────────────────────────────

  // Loading
  if (state.kind === "loading") {
    return <Loader branded />;
  }

  // Expired / Not found
  if (state.kind === "expired") {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.expiredIcon}>
            <Ionicons
              name="time-outline"
              size={40}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.expiredTitle}>
            Invitation expired or not found
          </Text>
          <Text style={styles.expiredDescription}>
            This invitation link is no longer valid. It may have expired or
            already been used. Ask the plan owner to send a new invitation.
          </Text>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Go to Legacy Made</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Error
  if (state.kind === "error") {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.error}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={styles.expiredTitle}>Something went wrong</Text>
          <Text style={styles.expiredDescription}>{state.message}</Text>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Go to Legacy Made</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Done (accepted or declined)
  if (state.kind === "done") {
    const isAccepted = state.outcome === "accepted";
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <View
            style={[
              styles.doneIcon,
              {
                backgroundColor: isAccepted
                  ? colors.featureInformationTint
                  : colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name={isAccepted ? "checkmark-circle" : "close-circle"}
              size={40}
              color={isAccepted ? colors.success : colors.textTertiary}
            />
          </View>
          <Text style={styles.doneTitle}>
            {isAccepted ? "Invitation accepted" : "Invitation declined"}
          </Text>
          <Text style={styles.expiredDescription}>
            {isAccepted
              ? "You now have access to this plan. You can view it in the Family Access section."
              : "The plan owner has been notified."}
          </Text>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isAccepted ? "Go to My Plans" : "Go to Legacy Made"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Signup — inline account creation
  if (state.kind === "signup") {
    return (
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>

        {/* Back */}
        <Pressable
          onPress={handleBackToLoaded}
          style={({ pressed }) => [
            styles.backLink,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={12}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.backLinkText}>Back to invitation</Text>
        </Pressable>

        {/* Header */}
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          To accept{" "}
          <Text style={styles.ownerName}>
            {state.invitation.ownerName}&apos;s
          </Text>{" "}
          invitation, tell us a little about yourself.
        </Text>

        {/* Error */}
        {signupError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{signupError}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <signupForm.Field name="firstName">
              {(field) => (
                <FormInput
                  field={field}
                  label="First Name"
                  placeholder="First"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="givenName"
                />
              )}
            </signupForm.Field>
          </View>
          <View style={styles.nameField}>
            <signupForm.Field name="lastName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Last Name"
                  placeholder="Last"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="familyName"
                />
              )}
            </signupForm.Field>
          </View>
        </View>

        <signupForm.Field name="email">
          {(field) => (
            <FormInput
              field={field}
              label="Email"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
          )}
        </signupForm.Field>

        {/* Submit */}
        <View style={styles.signupButtonContainer}>
          <Text style={styles.verificationHint}>
            We&apos;ll send a code to your email to verify it&apos;s you.
          </Text>
          <signupForm.Subscribe
            selector={(formState) => [
              formState.canSubmit,
              formState.isSubmitting,
            ]}
          >
            {([canSubmit, isSubmitting]) => (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  (!canSubmit || isSignupLoading || isSubmitting) &&
                    styles.buttonDisabled,
                ]}
                onPress={() => signupForm.handleSubmit()}
                disabled={!canSubmit || isSignupLoading || isSubmitting}
              >
                {isSignupLoading || isSubmitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </Pressable>
            )}
          </signupForm.Subscribe>
        </View>

        {/* Sign-in escape hatch */}
        <View style={styles.signInSection}>
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text style={styles.signInLink} onPress={handleSignInEscapeHatch}>
              Sign In
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // Verify — OTP email verification
  if (state.kind === "verify") {
    return (
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>

        {/* Back */}
        <Pressable
          onPress={handleBackToLoaded}
          style={({ pressed }) => [
            styles.backLink,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={12}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.backLinkText}>Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{" "}
          <Text style={styles.ownerName}>{state.email}</Text>
        </Text>

        {/* Error */}
        {otpError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <View style={styles.otpField}>
          <Text style={styles.otpLabel}>VERIFICATION CODE</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor={colors.textTertiary}
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
          />
        </View>

        {/* Verify button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            (otpCode.length < 6 || isOtpLoading) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={otpCode.length < 6 || isOtpLoading}
        >
          {isOtpLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Verify & Accept</Text>
          )}
        </Pressable>

        {/* Resend */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn&apos;t receive a code?</Text>
          <Pressable onPress={handleResendCode} disabled={isOtpLoading}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // Main invitation view (loaded)
  const { invitation } = state;
  const accessInfo =
    ACCESS_LEVEL_INFO[invitation.accessLevel] ?? ACCESS_LEVEL_INFO.full_view;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand */}
      <View style={styles.brand}>
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Legacy Made</Text>
      </View>

      {/* Invitation Header */}
      <Text style={styles.title}>You&apos;ve been invited</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.ownerName}>{invitation.ownerName}</Text> has invited
        you to access their Legacy Made plan.
      </Text>

      {/* Access Level Card */}
      <View style={styles.accessCard}>
        <View style={styles.accessIconContainer}>
          <Ionicons name={accessInfo.icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.accessLabel}>{accessInfo.label}</Text>
        <Text style={styles.accessDescription}>{accessInfo.description}</Text>
        {invitation.accessTiming === "upon_passing" && (
          <View style={styles.timingBadge}>
            <Ionicons name="time-outline" size={14} color={colors.warning} />
            <Text style={styles.timingBadgeText}>
              Access will be granted at the appropriate time
            </Text>
          </View>
        )}
      </View>

      {/* What is Legacy Made */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What is Legacy Made?</Text>
        <Text style={styles.infoText}>
          Legacy Made helps people organize critical information for their loved
          ones — accounts, documents, wishes, and messages — so their family is
          never left guessing.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleAccept}
          disabled={isActing}
          style={({ pressed }) => [
            styles.primaryButton,
            isActing && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isActing ? "Please wait..." : "Accept Invitation"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDecline}
          disabled={isActing}
          style={({ pressed }) => [
            styles.declineButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  // Brand (top-pinned for centered states)
  brandTop: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Brand (inline for scrollable states)
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  // Body content centered in remaining space
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: spacing.sm,
  },
  brandName: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  // Header
  title: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  ownerName: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  // Access Card
  accessCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.featureInformationTint,
  },
  accessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.featureInformationTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  accessLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  accessDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  timingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: "#FFF8F0",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  timingBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.warning,
  },
  // Info
  infoSection: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  // Actions
  actions: {
    width: "100%",
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  declineButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  declineButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Back link
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  backLinkText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  // Signup form
  nameRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  signupButtonContainer: {
    marginTop: spacing.lg,
  },
  verificationHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.error + "10",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },
  signInSection: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  signInText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  signInLink: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  // OTP verification
  otpField: {
    marginBottom: spacing.lg,
    width: "100%",
  },
  otpLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  otpInput: {
    height: componentStyles.input.height,
    borderWidth: componentStyles.input.borderWidth,
    borderRadius: componentStyles.input.borderRadius,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  resendSection: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  resendText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resendLink: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.primary,
    paddingVertical: spacing.sm,
  },
  // Expired / Error
  expiredIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  expiredTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  expiredDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  // Done
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  doneTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
