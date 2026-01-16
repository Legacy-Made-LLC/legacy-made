import { Button } from "@/components/ui/Button";
import { colors, spacing, typography } from "@/constants/theme";
import { useAppContext } from "@/data/store";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Logo() {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoCircle}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

interface OnboardingProps {
  onComplete: () => void;
}

type PersonalizationChoice =
  | "myself"
  | "family"
  | "parent"
  | "someone-i-care-for"
  | "not-sure";

export function Onboarding({ onComplete }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const { addContact } = useAppContext();
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [personalizationChoice, setPersonalizationChoice] =
    useState<PersonalizationChoice | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("");
  const [contactWhy, setContactWhy] = useState("");

  const transitionToStep = useCallback(
    (nextStep: number) => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  const handleContinue = () => {
    transitionToStep(step + 1);
  };

  const handlePersonalizationSelect = (choice: PersonalizationChoice) => {
    setPersonalizationChoice(choice);
    transitionToStep(7);
  };

  const handleSaveContact = () => {
    if (contactName.trim()) {
      addContact({
        name: contactName.trim(),
        relationship: contactRelationship.trim() || "Primary Contact",
        notes: contactWhy.trim() || undefined,
        isPrimary: true,
      });
    }
    transitionToStep(10);
  };

  const handleFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const renderStepContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.heading}>Welcome to Legacy Made.</Text>
            <Text style={styles.body}>
              End-of-life planning is overwhelming. Most of us avoid it — not
              because we don&apos;t care, but because we don&apos;t know where
              to start.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Continue" onPress={handleContinue} />
              <Pressable onPress={onComplete} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>Skip to Home (Testing)</Text>
              </Pressable>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.bodyPrimary}>
              Our information is scattered. Accounts, documents, passwords,
              wishes — all in different places, or only in our heads.
            </Text>
            <Text style={styles.bodySecondary}>
              When something happens, the people we love are left trying to
              piece it together.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Continue" onPress={handleContinue} />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.bodyPrimary}>
              Legacy Made brings everything together in one place — the
              practical details and the human context behind them.
            </Text>
            <Text style={styles.bodySecondary}>
              It&apos;s a guided space to organize information, clarify wishes,
              and leave your loved ones with confidence instead of questions.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Continue" onPress={handleContinue} />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.bodyPrimary}>
              You don&apos;t have to do everything at once.
            </Text>
            <Text style={styles.bodySecondary}>
              You can move at your own pace. You can skip anything. You can come
              back anytime.
            </Text>
            <Text style={styles.bodySecondary}>
              Starting — even in small steps — makes a difference.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Continue" onPress={handleContinue} />
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.heading}>Before we begin</Text>
            <Text style={styles.subheading}>
              Please review and accept our terms to continue.
            </Text>

            <View style={styles.expandableSection}>
              <Pressable
                style={styles.expandableHeader}
                onPress={() => setPrivacyExpanded(!privacyExpanded)}
              >
                <Text style={styles.expandableTitle}>🔒 Privacy Policy</Text>
                <Text style={styles.expandableIcon}>
                  {privacyExpanded ? "−" : "+"}
                </Text>
              </Pressable>
              {privacyExpanded && (
                <View style={styles.expandableContent}>
                  <Text style={styles.expandableText}>
                    Your privacy is important to us. We collect only the
                    information necessary to provide our services. Your data is
                    encrypted and never shared with third parties without your
                    consent.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.expandableSection}>
              <Pressable
                style={styles.expandableHeader}
                onPress={() => setTermsExpanded(!termsExpanded)}
              >
                <Text style={styles.expandableTitle}>📋 Terms of Service</Text>
                <Text style={styles.expandableIcon}>
                  {termsExpanded ? "−" : "+"}
                </Text>
              </Pressable>
              {termsExpanded && (
                <View style={styles.expandableContent}>
                  <Text style={styles.expandableText}>
                    By using Legacy Made, you agree to use the service
                    responsibly. Legacy Made is not a substitute for legal
                    advice. Please consult with appropriate professionals for
                    legal, financial, and medical decisions.
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                ]}
              >
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the{" "}
                <Text style={styles.link}>Privacy Policy</Text> and{" "}
                <Text style={styles.link}>Terms of Service</Text>
              </Text>
            </Pressable>

            <View style={styles.buttonContainer}>
              <Button
                title="I Agree"
                onPress={handleContinue}
                disabled={!termsAccepted}
              />
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.heading}>
              Who are you preparing for right now?
            </Text>

            <View style={styles.optionsContainer}>
              {[
                { key: "myself", label: "Myself" },
                { key: "family", label: "My family or children" },
                { key: "parent", label: "A parent" },
                { key: "someone-i-care-for", label: "Someone I care for" },
                { key: "not-sure", label: "I'm not sure yet" },
              ].map((option) => (
                <Pressable
                  key={option.key}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() =>
                    handlePersonalizationSelect(
                      option.key as PersonalizationChoice
                    )
                  }
                >
                  <Text style={styles.optionButtonText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.bodyPrimary}>That makes sense.</Text>
            <Text style={styles.bodySecondary}>
              Planning for yourself is a gift to the people you love. Legacy
              Made is here to help you organize what matters — without
              overwhelm.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Continue" onPress={handleContinue} />
            </View>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.bodyPrimary}>
              Let&apos;s take the first step today.
            </Text>
            <Text style={styles.bodySecondary}>
              We&apos;ll be your guide. First, let&apos;s identify your primary
              contact.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Add a contact" onPress={handleContinue} />
            </View>
          </View>
        );

      case 9:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              style={styles.formScrollView}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.formTitle}>Key Contact</Text>
              <Text style={styles.formSubtitle}>
                Who should your loved ones reach out to first?
              </Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>NAME</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textTertiary}
                  value={contactName}
                  onChangeText={setContactName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>RELATIONSHIP</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Sister, Attorney, Friend"
                  placeholderTextColor={colors.textTertiary}
                  value={contactRelationship}
                  onChangeText={setContactRelationship}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  WHY THIS PERSON? (OPTIONAL)
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="What makes them the right contact?"
                  placeholderTextColor={colors.textTertiary}
                  value={contactWhy}
                  onChangeText={setContactWhy}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Save"
                  onPress={handleSaveContact}
                  disabled={!contactName.trim()}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 10:
        return (
          <View style={styles.stepContent}>
            <Logo />
            <Text style={styles.heading}>You&apos;ve taken the first step.</Text>
            <Text style={styles.bodySecondary}>
              Each piece of information you add brings clarity for the people
              you love.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Go to dashboard" onPress={handleFinish} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (step === 9) {
      // Contact form step - no scroll view wrapper
      return (
        <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
          {renderStepContent(9)}
        </Animated.View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
          {renderStepContent(step)}
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {renderContent()}

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === step && styles.progressDotActive,
              i < step && styles.progressDotComplete,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  stepContent: {
    flex: 1,
    justifyContent: "center",
  },
  animatedContent: {
    flex: 1,
  },

  // Logo styles
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 40,
    height: 40,
  },

  heading: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  subheading: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  bodyPrimary: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 18 * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  bodySecondary: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  skipLink: {
    alignSelf: "center",
    padding: spacing.sm,
  },
  skipLinkText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textDecorationLine: "underline",
  },

  // Terms screen styles
  expandableSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  expandableTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  expandableIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  expandableContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  expandableText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline",
  },

  // Personalization options
  optionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    textAlign: "center",
  },

  // Form styles
  keyboardAvoid: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  formTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    height: 52,
  },
  formTextarea: {
    height: 100,
    paddingTop: spacing.md,
  },

  // Progress indicator
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: colors.primary,
  },
});
