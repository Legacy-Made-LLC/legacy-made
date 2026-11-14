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
import { useCallback, useMemo, useState } from "react";
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

/**
 * Shown when reminders are on but notifications aren't allowed.
 *
 * - The OS can still prompt (fresh install or reinstall): the button asks.
 * - The OS won't prompt again (denied on iOS, or the Android prompt didn't
 *   appear): the button opens Settings.
 */
function PermissionBanner({
  canAsk,
  onAsk,
}: {
  canAsk: boolean;
  onAsk: () => void;
}) {
  return (
    <View style={bannerStyles.container}>
      <Ionicons
        name="notifications-off-outline"
        size={20}
        color={colors.warning}
        style={bannerStyles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View style={bannerStyles.content}>
        <Text style={bannerStyles.title}>
          {canAsk
            ? "Notifications aren't on yet"
            : "Notifications are off for Legacy Made"}
        </Text>
        <Text style={bannerStyles.body}>
          {canAsk
            ? "Allow notifications so your reminders can reach you."
            : "To get reminders, turn on notifications in Settings."}
        </Text>
        <Pressable
          onPress={canAsk ? onAsk : () => Linking.openSettings()}
          style={({ pressed }) => [
            bannerStyles.linkButton,
            pressed && bannerStyles.linkPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={canAsk ? "Allow notifications" : "Open Settings"}
          accessibilityHint={
            canAsk
              ? "Shows the notification permission prompt"
              : "Opens the Settings app"
          }
        >
          <Text style={bannerStyles.link}>
            {canAsk ? "Allow notifications →" : "Open Settings →"}
          </Text>
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
  linkButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  link: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.primaryStrong,
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
  const {
    requestPermission,
    permissionStatus,
    permissionGranted,
    canAskPermission,
  } = usePushNotifications();
  // Set when a permission request came back without a grant. On Android the
  // OS can report "can ask again" yet show no prompt, so stop offering it.
  const [askFailed, setAskFailed] = useState(false);
  const canAsk = canAskPermission && !askFailed;
  // Holds the switch at the user's choice while permission and save run
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

  const reminders = prefs?.notifications?.reminders;
  // The switch shows the saved setting, so it can always be turned off;
  // the options below are active only when reminders can actually arrive.
  const savedEnabled = reminders?.enabled === true;
  const isEnabled = permissionGranted && savedEnabled;
  // Only when reminders are on (saved setting) and notifications aren't
  // allowed; waits for the first permission read so it doesn't flash.
  const showPermissionBanner =
    permissionStatus !== undefined && !permissionGranted && savedEnabled;

  const askForPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) setAskFailed(true);
    return granted;
  }, [requestPermission]);

  const handleToggle = useCallback(
    async (newValue: boolean) => {
      setPendingToggle(newValue);
      try {
        // Turning on without permission: ask if the OS still can, otherwise
        // send the user to Settings. The saved setting is on either way, so
        // reminders start as soon as notifications are allowed.
        if (newValue && !permissionGranted) {
          if (canAsk) {
            await askForPermission();
          } else {
            await Linking.openSettings();
          }
        }

        await mutateAsync({
          notifications: { reminders: { enabled: newValue } },
        });
      } catch (err) {
        logger.error("Failed to toggle reminders", err);
      } finally {
        setPendingToggle(null);
      }
    },
    [permissionGranted, canAsk, askForPermission, mutateAsync],
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

  const handleCustomTime = useDebounceCallback((custom_time: string) => {
    mutateAsync({
      notifications: { reminders: { custom_time } },
    }).catch((err) => logger.error("Failed to update custom time", err));
  }, 500);

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
      {showPermissionBanner && (
        <PermissionBanner
          canAsk={canAsk}
          onAsk={() => {
            askForPermission();
          }}
        />
      )}

      {/* Toggle Card */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Reminders</Text>
          <Switch
            value={pendingToggle ?? savedEnabled}
            onValueChange={handleToggle}
            disabled={pendingToggle !== null}
            trackColor={{
              false: colors.controlTrackOff,
              true: colors.primaryStrong,
            }}
            ios_backgroundColor={colors.controlTrackOff}
            accessibilityLabel="Reminders"
            accessibilityHint={
              permissionGranted || savedEnabled
                ? undefined
                : canAsk
                  ? "Asks to allow notifications"
                  : "Opens Settings to allow notifications"
            }
            // Keep Android's thumb white on the dark track; iOS keeps its
            // default thumb (with shadow)
            thumbColor={Platform.OS === "android" ? colors.surface : undefined}
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
