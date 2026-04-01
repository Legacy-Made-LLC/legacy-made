/**
 * Reminders Settings Screen
 *
 * Allows users to configure reminder notification preferences:
 * - Toggle reminders on/off
 * - Set frequency (weekly, biweekly, monthly)
 * - Set time of day (morning, afternoon, evening, custom)
 * - Custom time input when "custom" is selected
 *
 * Shows a banner when OS notification permission is not granted.
 */

import type { ReminderFrequency, TimeOfDay } from "@/api/preferences";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import {
  usePreferences,
  useUpdatePreferences,
} from "@/hooks/queries/usePreferencesQuery";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { logger } from "@/lib/logger";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Constants ───────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "custom", label: "Custom" },
];

const TIME_PRESETS: Record<string, string> = {
  morning: "8:00 AM",
  afternoon: "12:00 PM",
  evening: "6:00 PM",
};

// ── OptionPill Component ────────────────────────────────────────────────────

function OptionPill<T extends string>({
  value,
  label,
  selected,
  disabled,
  onPress,
}: {
  value: T;
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: (value: T) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      disabled={disabled}
      style={({ pressed }) => [
        pillStyles.pill,
        selected && pillStyles.pillSelected,
        !selected && !disabled && pillStyles.pillUnselected,
        disabled && !selected && pillStyles.pillDisabled,
        pressed && !disabled && pillStyles.pillPressed,
      ]}
    >
      <Text
        style={[
          pillStyles.pillText,
          selected && pillStyles.pillTextSelected,
          disabled && !selected && pillStyles.pillTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.titleSmall,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.surface,
  },
  pillTextDisabled: {
    color: colors.textTertiary,
  },
});

// ── Permission Banner ───────────────────────────────────────────────────────

function PermissionBanner() {
  return (
    <View style={bannerStyles.container}>
      <Ionicons
        name="notifications-off-outline"
        size={20}
        color={colors.warning}
        style={bannerStyles.icon}
      />
      <View style={bannerStyles.content}>
        <Text style={bannerStyles.title}>Notifications are turned off</Text>
        <Text style={bannerStyles.body}>
          Enable notifications in your device settings to receive reminders.
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={({ pressed }) => [pressed && bannerStyles.linkPressed]}
          hitSlop={10}
        >
          <Text style={bannerStyles.link}>Open Settings →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFF8F0",
    borderRadius: borderRadius.md,
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F0E6D8",
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.trigger,
    color: colors.textSecondary,
    lineHeight: typography.sizes.trigger * typography.lineHeights.relaxed,
  },
  link: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
    marginTop: 4,
  },
  linkPressed: {
    opacity: 0.7,
  },
});

// ── Native Time Picker ──────────────────────────────────────────────────────

/**
 * Converts an "HH:MM" string to a Date object (today at that time).
 */
function timeStringToDate(time: string | null): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(18, 0, 0, 0);
  }
  return d;
}

/**
 * Converts a Date object to an "HH:MM" string.
 */
function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Native time picker using @react-native-community/datetimepicker.
 * Renders an inline spinner (iOS) or clock dial (Android).
 * Supports 30-minute increments via minuteInterval.
 */
function NativeTimePicker({
  value,
  onTimeChange,
}: {
  value: string | null;
  onTimeChange: (time: string) => void;
}) {
  const dateValue = useMemo(() => timeStringToDate(value), [value]);

  return (
    <DateTimePicker
      value={dateValue}
      mode="time"
      display={Platform.OS === "ios" ? "compact" : "clock"}
      minuteInterval={30}
      themeVariant="light"
      onChange={(_event, date) => {
        if (date) {
          onTimeChange(dateToTimeString(date));
        }
      }}
    />
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function RemindersScreen() {
  const { data: prefs, isLoading } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const mutateAsync = updateMutation.mutateAsync;
  const { requestPermission, permissionGranted, permissionDenied } =
    usePushNotifications();

  const reminders = prefs?.notifications?.reminders;
  const isEnabled = permissionGranted && (reminders?.enabled ?? false);

  const handleToggle = useCallback(
    async (newValue: boolean) => {
      // If enabling, request OS permission first
      if (newValue && !permissionGranted) {
        await requestPermission();
      }

      try {
        await mutateAsync({
          notifications: { reminders: { enabled: newValue } },
        });
      } catch (err) {
        logger.error("Failed to toggle reminders", err);
      }
    },
    [permissionGranted, requestPermission, mutateAsync],
  );

  const handleFrequency = useCallback(
    (frequency: ReminderFrequency) => {
      mutateAsync({
        notifications: { reminders: { frequency } },
      }).catch((err) => logger.error("Failed to update frequency", err));
    },
    [mutateAsync],
  );

  const handleTimeOfDay = useCallback(
    (time_of_day: TimeOfDay) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (time_of_day === "custom") {
        // Default to 18:00 if no custom_time exists
        const custom_time = reminders?.custom_time ?? "18:00";
        mutateAsync({
          notifications: { reminders: { time_of_day, custom_time } },
        }).catch((err) => logger.error("Failed to update time of day", err));
      } else {
        // Clear custom_time when switching away from custom
        mutateAsync({
          notifications: { reminders: { time_of_day, custom_time: null } },
        }).catch((err) => logger.error("Failed to update time of day", err));
      }
    },
    [mutateAsync, reminders?.custom_time],
  );

  const handleCustomTime = useDebounceCallback(
    (custom_time: string) => {
      mutateAsync({
        notifications: { reminders: { custom_time } },
      }).catch((err) => logger.error("Failed to update custom time", err));
    },
    500,
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Permission Banner */}
      {permissionDenied && <PermissionBanner />}

      {/* Toggle Card */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Reminders</Text>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
            thumbColor={colors.surface}
          />
        </View>
        <Text style={styles.toggleDescription}>
          Get gentle nudges to continue building your plan.
        </Text>
      </View>

      {/* Frequency Section */}
      <View style={[styles.section, !isEnabled && styles.sectionDisabled]}>
        <Text style={styles.sectionLabel}>HOW OFTEN</Text>
        <View style={styles.card}>
          <View style={styles.pillRow}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <OptionPill
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={reminders?.frequency === opt.value}
                disabled={!isEnabled}
                onPress={handleFrequency}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Time of Day Section */}
      <View style={[styles.section, !isEnabled && styles.sectionDisabled]}>
        <Text style={styles.sectionLabel}>WHAT TIME</Text>
        <View style={styles.card}>
          <View style={styles.pillRow}>
            {TIME_OPTIONS.map((opt) => (
              <OptionPill
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={reminders?.time_of_day === opt.value}
                disabled={!isEnabled}
                onPress={handleTimeOfDay}
              />
            ))}
          </View>

          {/* Native Time Picker — inline within the card */}
          {isEnabled && reminders?.time_of_day === "custom" && (
            <>
              <View style={styles.divider} />
              <Text style={styles.pickerLabel}>CHOOSE A TIME</Text>
              <NativeTimePicker
                value={reminders.custom_time}
                onTimeChange={handleCustomTime}
              />
            </>
          )}

          {/* Preset times hint — inline within the card */}
          {isEnabled && reminders?.time_of_day !== "custom" && (
            <Text style={styles.presetHint}>
              {Object.entries(TIME_PRESETS)
                .map(
                  ([key, time]) =>
                    `${key.charAt(0).toUpperCase() + key.slice(1)}: ${time}`,
                )
                .join(" · ")}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  section: {
    gap: spacing.sm,
  },
  sectionDisabled: {
    opacity: 0.4,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    paddingLeft: spacing.xs,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pickerLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  presetHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.trigger,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
