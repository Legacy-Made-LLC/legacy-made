/**
 * Device Label Utility
 *
 * Generates human-friendly labels for encryption key registration.
 * Uses expo-device to get the device model and (when available) user name.
 *
 * iOS 16+ restricts Device.deviceName to generic values like "iPhone" unless
 * the app has the com.apple.developer.device-information.user-assigned-device-name
 * entitlement. We detect this and prefer modelName (e.g. "iPhone 15 Pro") over
 * the generic deviceName.
 *
 * Examples:
 *   "Jared's iPhone 15 Pro"       (deviceName is a real custom name)
 *   "iPhone 15 Pro"               (deviceName is generic, fall back to modelName)
 *   "iPhone 15 Pro (recovered)"   (with context)
 *   "Unknown device"              (nothing available — e.g., web)
 */

import * as Device from "expo-device";

/**
 * Generic device names returned by iOS 16+ when the app doesn't have
 * the user-assigned device name entitlement. These are useless as labels
 * because every iPhone shows "iPhone", every iPad shows "iPad", etc.
 */
const GENERIC_DEVICE_NAMES = new Set([
  "iphone",
  "ipad",
  "ipod touch",
  "apple watch",
  "mac",
]);

/**
 * Returns true if the deviceName is a real user-assigned name
 * (e.g. "Jared's iPhone 15 Pro") vs a generic iOS restriction
 * (e.g. "iPhone").
 */
function isUsefulDeviceName(name: string | null): name is string {
  if (!name) return false;
  return !GENERIC_DEVICE_NAMES.has(name.toLowerCase());
}

/**
 * Get a human-friendly device label for key registration.
 *
 * Priority:
 * 1. User-assigned deviceName (if it's not a generic iOS placeholder)
 * 2. Hardware modelName (e.g. "iPhone 15 Pro", "Pixel 8")
 * 3. Generic deviceName as last resort (still better than nothing)
 * 4. "Unknown device"
 *
 * @param context - How the key was registered: "linked", "recovered", etc.
 *                  Appended in parentheses if provided.
 */
export function getDeviceLabel(context?: string): string {
  let name: string;

  if (isUsefulDeviceName(Device.deviceName)) {
    // Real custom name like "Jared's iPhone 15 Pro"
    name = Device.deviceName;
  } else if (Device.modelName) {
    // Hardware model like "iPhone 15 Pro" or "Pixel 8"
    name = Device.modelName;
  } else if (Device.deviceName) {
    // Generic but non-null: "iPhone" — better than nothing
    name = Device.deviceName;
  } else {
    name = "Unknown device";
  }

  if (context) {
    return `${name} (${context})`;
  }
  return name;
}
